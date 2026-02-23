# Research: brain-and-hooks

**Conducted:** 2026-02-17
**Researcher:** feature-researcher agent

---

## Summary

Research into config-driven workflow orchestration patterns, hook systems, state persistence, and mode-based execution for building the brain orchestrator. The brain is a markdown workflow system — not code — so patterns from traditional orchestrators apply conceptually but the implementation medium is Claude reading and following `.md` files.

---

## Implementation Patterns

### Pipeline Config Patterns

**How similar systems structure their pipeline configs — relevant patterns for pipeline.json design**

#### GitHub Actions Pattern

GitHub Actions uses YAML (equivalent: JSON) with jobs as top-level named steps, each with dependency declaration via `needs`. The key structural insight is the separation between:

1. **Pipeline definition** (static config): what steps exist, their names, dependencies
2. **Step implementation** (dynamic dispatch): what actually runs in each step

Relevant to specdacular: the `"name"` + `"workflow"` + `"enabled"` per-step pattern mirrors Actions' job-id + uses/steps pattern. The `needs` concept is implicit in specdacular's sequential pipeline order.

**Key pattern:** Named steps with optional enabled/disabled flag and a pointer to the implementation (workflow file). This is exactly what the proposed pipeline.json uses.

```json
// Actions conceptual equivalent
{
  "jobs": {
    "discuss": { "steps": [...], "needs": [] },
    "research": { "steps": [...], "needs": ["discuss"] }
  }
}

// pipeline.json equivalent
{
  "pipelines": {
    "main": [
      { "name": "discuss", "enabled": true, "workflow": "discuss.md" },
      { "name": "research", "enabled": true, "workflow": "research.md" }
    ]
  }
}
```

#### Argo Workflows Pattern

Argo uses nested templates — a DAG or steps template can reference other templates by name. This is the direct analog to specdacular's nested pipeline reference (`"pipeline": "phase-execution"`).

```yaml
# Argo nested template pattern
templates:
  - name: main
    steps:
      - - name: discuss
          template: discuss-template
      - - name: phase-execution-loop
          template: phase-execution  # references another template by name
  - name: phase-execution
    steps:
      - - name: execute
          template: execute-template
```

**Key pattern for specdacular:** A step with `"pipeline": "name"` delegates to another named pipeline, exactly like Argo's template references. The brain resolves the name from the `pipelines` object.

#### Jenkins Declarative Pipeline Pattern

Jenkins uses `post` sections with conditions (always, success, failure) at both pipeline-level and stage-level. This maps to specdacular's global `hooks.pre-step` / `hooks.post-step` (pipeline-level) and per-step `hooks.pre` / `hooks.post` (stage-level).

```groovy
// Jenkins post sections
pipeline {
  post { always { ... } }  // global post
  stages {
    stage('discuss') {
      post { always { ... } }  // stage-level post
    }
  }
}
```

**Key pattern:** Two-level hook hierarchy — global hooks that run around every step, plus per-step hooks. This is exactly what the proposed pipeline.json models with `hooks.pre-step`/`hooks.post-step` (global) and per-step `hooks.pre`/`hooks.post`.

#### Buildkite Agent Hooks Pattern

Buildkite's hook execution order is strictly defined:

```
environment → pre-checkout → checkout → post-checkout →
pre-command → command → post-command → pre-exit
```

Each hook type can exist at multiple levels (agent, repo, plugin) and all hooks of that type run in order. This validates two things for specdacular:

1. **Execution order matters**: pre hooks must complete before the step, post hooks run after
2. **Optional vs required hooks**: Buildkite has no built-in optional hook concept at the config level — hooks fail or succeed. Specdacular's `"optional": true` flag is a useful addition that Buildkite lacks.

**Key finding:** Non-zero exit codes in pre-command hooks prevent the command from running. This maps to specdacular's required hook behavior (`"optional": false`) — a non-optional pre hook failure should stop the step from running.

#### Codefresh Pipeline Hooks Pattern

Codefresh supports `on_success`, `on_fail`, `on_finish` hooks at the step level, configurable in YAML. They found that `on_finish` (always runs) is the most useful pattern for cleanup/notification.

**Key pattern for specdacular:** The post hook should be split conceptually:
- `post` hook in pipeline.json runs `on_finish` semantics (always, regardless of step success/failure)
- This is simpler than having separate `post_success` / `post_failure` variants

#### datapackage-pipelines Minimal Schema

```json
{
  "pipeline": [
    { "run": "module.processor", "parameters": {} }
  ]
}
```

The simplest possible pipeline schema — a list of steps, each with a "what to run" pointer and optional params. Specdacular's schema is this plus enabled flag, hooks, and nesting. The minimum viable schema validates the specdacular design is not over-engineered.

---

### Orchestrator Patterns

**How to structure the brain workflow — state machine, event loop, etc.**

#### State Machine Pattern (LangGraph / Microsoft Agent Framework)

The consensus across modern AI agent orchestration is a **state machine** approach:

- State is explicit and persisted at each transition
- The orchestrator owns transitions; steps own execution
- The LLM (brain) reads current state → determines valid next step → dispatches → updates state → repeats

From LangGraph's architecture: "State includes what the agent knows and what's allowed next." This maps directly to how the brain should work:

```
read STATE.md + config.json → determine position → check mode → dispatch step → update state → loop
```

**Key finding:** The existing `continue.md` is already structured as a state machine (parse → load_state → determine_action → dispatch → loop back). The brain needs to preserve this exact loop but make the step registry (pipeline) configurable.

#### Centralized vs Decentralized Orchestration

Anthropic's own guidance (Building Effective Agents) recommends centralized orchestration when you need auditability, repeatability, and predictable workflow. Decentralized is better for exploration. The brain is clearly centralized: one orchestrator, deterministic step order, explicit state.

**Key finding:** DEC-001 (brain owns all flow control) is validated by industry consensus. Centralized orchestration is the right pattern for this use case.

#### Event Loop Pattern

The brain should be structured as an event loop, not a linear script:

```
LOOP:
  1. Read current state (STATE.md + config.json)
  2. Determine next pipeline step (from pipeline.json position)
  3. Check mode (interactive/semi-auto/auto) → prompt or auto-proceed
  4. Run pre-hooks
  5. Dispatch step workflow
  6. Run post-hooks
  7. Update state
  8. If sub-pipeline step: enter inner loop
  9. If done: exit or move to next step
GOTO LOOP
```

**Key finding:** The loop-back-to-state-check pattern in `continue.md` is correct. The brain generalizes this by reading its current pipeline position from state rather than having position hardcoded.

#### Orchestrator-Workers Pattern

From Anthropic's orchestrator-workers pattern: "A central LLM dynamically breaks down tasks, delegates them to worker LLMs, and synthesizes their results."

In specdacular terms:
- Brain = orchestrator (reads config, decides what to dispatch, manages state)
- Step workflows (discuss.md, execute.md, etc.) = workers (pure execution, return results)
- Hooks = lightweight workers (run before/after, no coordination overhead)

**Key design implication:** Step workflows should return cleanly (end workflow) without trying to drive the next action. The brain calls them and then determines what happens next. This is exactly DEC-001 — steps don't orchestrate, only the brain does.

#### Position Tracking in the Pipeline

The brain needs to know "where am I in the pipeline.json?" This requires:

1. **Stage mapping to pipeline position**: The existing `stage` field in `config.json` (discussion, research, planning, execution) maps to pipeline step names
2. **Phase tracking for the sub-pipeline**: The existing `phases.current` / `phases.current_status` tracks position within the phase-execution loop

**Key finding:** No new state fields are needed. The existing `config.json` fields map naturally to pipeline positions:

| config.json state | Pipeline position |
|---|---|
| `stage: "discussion"` | main[0] = discuss |
| `stage: "research"` | main[1] = research |
| `stage: "planning"` | main[2] = plan |
| `stage: "execution"`, `phases.current_status: "pending"` | phase-execution[0] = execute |
| `stage: "execution"`, `phases.current_status: "executing"` | phase-execution[0] = execute (resume) |
| `stage: "execution"`, `phases.current_status: "executed"` | phase-execution[1] = review |
| `stage: "execution"`, `phases.current_status: "completed"` → more phases | phase-execution loop (next phase) |
| `stage: "execution"`, `phases.current_status: "completed"` → no more phases | complete |

This mapping is the brain's routing table. When reading pipeline.json, the brain resolves current position by reading these state fields and finding the corresponding step in the pipeline.

---

### Hook System Patterns

**How hook systems work in similar tools — execution order, error handling, context passing**

#### Hook Execution Order (Universal Pattern)

All major systems (Jenkins, Buildkite, GitHub Actions, Tekton) agree on:

```
pre-hook(s) → main step → post-hook(s)
```

With global hooks wrapping step-level hooks:

```
global pre-step hook → step pre-hook → STEP → step post-hook → global post-step hook
```

**Recommended execution order for brain.md:**

```
1. global hooks.pre-step (if configured)
2. step.hooks.pre (if configured)
3. dispatch step workflow
4. step.hooks.post (if configured)
5. global hooks.post-step (if configured)
```

#### Error Handling: Required vs Optional

**Buildkite finding:** Pre-command hook failure blocks the command from running. Post-command hook failure fails the job even though the command succeeded. This is the correct semantic for required hooks.

**For specdacular, the error handling matrix:**

| Hook type | `optional: false` | `optional: true` |
|---|---|---|
| pre hook fails | Stop pipeline, save state | Log warning, continue to step |
| step fails | Always stop pipeline, save state | N/A (steps are always required) |
| post hook fails | Stop pipeline, save state | Log warning, continue |

**Key finding:** The `optional` flag on hooks should be checked before running the hook. If the hook fails (workflow reports error or Claude cannot complete it), the brain checks optional flag to decide: stop or continue.

**Logging optional hook failures:** The brain should append a note to CHANGELOG.md when an optional hook is skipped due to failure. This provides an audit trail without blocking progress. This validates DEC-007.

#### Context Passing (No Special Contract Pattern)

All surveyed systems pass context through shared state — not explicit return values:

- **Buildkite**: hooks export environment variables, picked up by subsequent hooks/steps
- **Jenkins**: post steps read workspace files written by the step
- **LangGraph**: state object is the universal context carrier

DEC-005 (hooks are regular workflow steps with no special output contract) is validated by every system surveyed. The shared state (task files: CONTEXT.md, FEATURE.md, DECISIONS.md, etc.) is the context-passing mechanism.

**Key finding:** Pre-hooks that need to communicate with the step they precede should write to task files (e.g., append notes to CONTEXT.md or DECISIONS.md). The step then reads those files normally. No special output mechanism needed.

#### Inline vs Subagent Execution

From Anthropic's agent patterns: "Make the orchestrator responsible for global planning, delegation, and state, keeping its tool permissions narrow—mostly 'read and route.'"

The inline vs subagent distinction in DEC-006 maps to:

- **Inline**: hook runs in the brain's own context window, sharing full task context. Lower overhead, limited to brain's remaining context budget.
- **Subagent** (`Task()`): hook spawns with fresh context, reads task files explicitly. Higher overhead, better for hooks that need to analyze large codebases or do heavy research.

**Practical guidance for which to use:**

| Hook complexity | Recommended mode |
|---|---|
| Read a file, append a note | inline |
| Verify recent changes | inline |
| Analyze entire test suite | subagent |
| Run research agents | subagent |
| Format/lint check | inline (or subagent if large codebase) |

**Key finding:** Inline is the right default (DEC-006 confirmed). Users who need heavy hooks can opt into subagent.

#### Hook File Discovery: Explicit Paths vs Convention

The remaining gray area from CONTEXT.md: does the brain discover hook files by convention or only from explicit paths in pipeline.json?

**Evidence from similar systems:**
- **Buildkite**: Both — explicit hooks at `~/.buildkite/hooks/` (convention) AND per-pipeline explicit configuration
- **Jenkins**: Post sections are inline in the Jenkinsfile (fully explicit, no convention discovery)
- **GitHub Actions**: Explicit — hooks are referenced by action name, no auto-discovery

**Recommendation:** Convention-plus-explicit hybrid:
1. pipeline.json paths are explicit and always take priority
2. If a hook path in pipeline.json is `null` but a file exists at `.specd/hooks/pre-{step}.md`, the brain uses it (convention discovery)
3. The convention pattern is `{hook-dir}/pre-{step-name}.md` and `{hook-dir}/post-{step-name}.md`

This makes the system work "out of the box" for simple hooks (just drop a file) while supporting full explicit configuration when needed.

**Resolution for the deferred gray area:** Use convention-based discovery as a fallback when pipeline.json hook is null. Priority order: explicit pipeline.json path → `.specd/hooks/pre-{step}.md` convention → no hook.

---

### State & Resumption

**Patterns for saving/restoring pipeline state for resume capability**

#### Checkpoint Pattern (LangGraph / Microsoft Agent Framework)

From LangGraph: "Every step of the graph reads from and writes to a checkpoint of that graph state. This makes it possible to pause execution halfway through and then resume after some time because the checkpoint is there."

From Microsoft Agent Framework: "A checkpoint is a complete snapshot of your workflow's state at a specific point in time — what has been done, what's in progress, current data state, and where to resume."

**Specdacular already does this.** `config.json` + `STATE.md` are the checkpoint. The brain's state persistence is already implemented in existing workflows — it just needs to be the brain's responsibility now (DEC-001).

#### What State to Save and When

**From LangGraph (critical finding):** "When a graph resumes from an interrupt(), the entire node re-executes from the beginning. Ensure that any logic placed before the interrupt() call is idempotent."

**For specdacular:** The brain must save state **before** dispatching a step, not after. This ensures that if Claude stops mid-step (e.g., context window limit, user terminates session), the state reflects "this step was started" and resumption picks up correctly.

**Proposed state-save points:**

1. **Before running pre-hooks**: Save that we're about to run this step's pre-hook
2. **Before dispatching the step**: Save that the step is being executed (this is what `phases.current_status: "executing"` already does for the execute step)
3. **After step completes**: Save that the step succeeded
4. **After running post-hooks**: Log completion

**Key finding:** The existing pattern of setting `phases.current_status: "executing"` in `record_start` then `"executed"` in `phase_complete` is exactly right. The brain needs to generalize this pattern to all pipeline steps, not just execute.

#### State Schema for Pipeline Position

The current `config.json` tracks stage as a string. The brain needs to map this to a pipeline position. No new fields are needed — the existing fields are sufficient (see routing table in Orchestrator Patterns section).

However, one addition may be useful: tracking which hooks have run for the current step, to support resumption mid-hook-sequence. This is a low-priority concern — if a hook is interrupted, re-running it from the start is typically safe (idempotency).

**Recommendation:** Do not add hook-level state tracking initially. If a step was interrupted mid-pre-hook, resumption re-runs the pre-hook from the start. This is safe for most hook use cases and keeps the state model simple.

#### Resume Entry Point

The existing `/specd.continue {task-name}` command is the resume entry point. With the brain:

1. `continue.md` becomes a thin entry point that dispatches to `brain.md`
2. `brain.md` reads state (same as current `continue.md`), finds pipeline position, continues
3. User experience is identical

**Key finding:** No UX changes needed for resumption. The state files (`config.json` + `STATE.md`) are already the complete checkpoint. The brain just reads them.

---

### Mode Handling

**Patterns for interactive vs automated execution modes**

#### The Three-Mode Pattern

The three modes (interactive, semi-auto, auto) map well to standard patterns in CI/CD and AI agent systems:

| Specdacular mode | CI/CD equivalent | AI agent equivalent |
|---|---|---|
| interactive | Manual approval gate at every step | Human-in-the-loop with `interrupt()` at every node |
| semi-auto | Auto-run dev stages, manual gate before deploy | Human approval at "dangerous" steps (execution) |
| auto | Fully automated CI run | Autonomous agent, stop only on errors |

#### Interactive Mode: Human-in-the-Loop Pattern

From LangGraph's interrupt pattern: "The interrupt function pauses graph execution and returns a value to the caller. When ready to continue, you resume execution by re-invoking the graph."

**For specdacular's interactive mode:**
- Before each step, present: what's about to happen + alternatives (skip, go back, stop)
- Wait for user choice (AskUserQuestion)
- On "stop": save state and exit (identical to LangGraph's interrupt + checkpoint)
- On "go back": update state to previous step and re-loop
- On "continue": dispatch the step

**Key pattern (from current `continue.md`):** The interactive prompt should include:
1. Current state summary
2. What the next step will do
3. Options: proceed / skip / alternative route / stop

This is identical to the current `continue.md` approach and should be preserved exactly (DEC-010).

#### Semi-Auto Mode: Selective Gates Pattern

Semi-auto auto-advances through early pipeline steps (discuss, research, plan) but pauses at execution and review. This maps to the CI/CD pattern of "auto-run in dev, manual gate before production."

**Implementation in the brain:**

```
For each step:
  If mode = semi-auto:
    If step.name in ["execute", "review", "revise"]:
      → prompt user (same as interactive)
    Else:
      → auto-proceed (no prompt)
```

**Key finding:** The semi-auto gate is step-name-based. The brain needs to know which steps require gates in semi-auto mode. This could be hardcoded (discuss/research/plan are auto; execute/review/revise require gates) or configurable per step in pipeline.json.

**Recommendation:** Keep it simple — semi-auto gates are based on which pipeline the step belongs to. Steps in the `"main"` pipeline before the `"phase-execution"` reference are auto; steps in `"phase-execution"` require gates.

#### Auto Mode: Errors-Only Stop Pattern

Auto mode runs everything, stopping only on:
1. Step failure (required hook or step cannot complete)
2. Review issues (review.md finds problems that need human decision)
3. Task completion

**From Anthropic's guidance on autonomous agents:** "Define subagents with clear inputs/outputs and a single goal." In auto mode, each step workflow should complete with a clear success/failure signal that the brain can act on.

**Key finding:** In auto mode, the brain needs a way to know if a step "found issues" vs "completed cleanly." For review.md specifically, the step communicates via state files: if `phases.current_status` stays at "executed" after review (meaning user said "stop for now"), the brain interprets that as a stop signal.

**Simpler approach:** After each step in auto mode, the brain re-reads state. If state didn't advance as expected, the brain surfaces a status message and stops. This is the existing `continue.md` pattern — no new mechanism needed.

#### Mode Override: CLI Flags vs Config

DEC-010 specifies mode is set in `pipeline.json` and/or via CLI flags (`--semi-auto`, `--auto`).

**Pattern from existing system:** `continue.md` parses `$ARGUMENTS` for mode flags. The brain should do the same, with CLI flags overriding the `"mode"` field in `pipeline.json`.

**Priority order:** CLI flag → pipeline.json "mode" field → default "interactive"

---

## Key Findings for Implementation

### Critical

1. **Existing state model is sufficient.** No new fields needed in `config.json` or `STATE.md`. The routing table maps existing fields to pipeline positions.

2. **The brain is a generalized `continue.md`.** Same loop structure (read state → determine action → prompt/auto → dispatch → update state → loop). The generalization is: step registry comes from `pipeline.json` instead of hardcoded logic.

3. **Hook execution order is standard.** Global pre-step → step pre → STEP → step post → global post-step. Universal consensus across all surveyed systems.

4. **Inline hooks are the right default.** Simple hooks don't need the overhead of subagent spawning. Subagent mode is for heavyweight hooks only.

5. **State must be saved before step dispatch.** If the session is interrupted mid-step, resumption should re-run the step from the start, not skip it.

### Validated Decisions

- DEC-001 (brain owns flow control): Validated by centralized orchestrator pattern
- DEC-002 (hooks as markdown only): Validated by shared-state context-passing pattern
- DEC-003 (full replace semantics): Validated by simplicity and Jenkins/Argo models
- DEC-005 (no special hook output contract): Validated by every system surveyed
- DEC-006 (inline default, subagent optional): Validated by overhead analysis
- DEC-007 (optional flag): Validated by Buildkite's non-optional hook failure behavior
- DEC-008 (nested pipelines): Validated by Argo template references
- DEC-010 (preserve modes): Validated by LangGraph interrupt pattern

### Resolved Gray Area

**Hook file discovery:** Use convention-based fallback. If pipeline.json hook is `null`, the brain checks `.specd/hooks/pre-{step-name}.md` and `.specd/hooks/post-{step-name}.md` by convention. Explicit paths in pipeline.json always win.

### Notable Pitfalls from Research

1. **Node re-execution on resume (LangGraph warning):** When resuming a step, the brain re-dispatches the step workflow from the beginning. Step workflows must be safe to re-run (idempotent). Most specdacular step workflows are already idempotent (they read state first and skip completed work).

2. **Context window budget for inline hooks:** Inline hooks run in the brain's context. Heavy hooks could exhaust the context budget before the step runs. The brain should warn if hooks are getting large, or users should use subagent mode for heavy hooks.

3. **Hook failure masking:** Optional hooks that fail silently can mask problems. The brain must log all optional hook failures to CHANGELOG.md, even if it continues. Don't skip logging "because it's optional."

4. **Global hooks running on disabled steps:** If a step is disabled (`"enabled": false`), global `pre-step`/`post-step` hooks should NOT run for that step. Hooks should only run around active steps.

5. **Nested pipeline loop termination:** The phase-execution sub-pipeline loops per phase. The brain must have clear termination condition: loop exits when all phases are completed (no more phases in ROADMAP.md with status "pending").

---

## Codebase Integration

### Current Flow Control in continue.md

**State fields it reads:** `config.json` stage, `phases.current_status`, `phases.current`; `STATE.md` progress checkboxes; `CONTEXT.md` gray areas count.

**Routing logic (8 decision points):**
1. Stage = discussion + gray areas → dispatch discuss
2. Stage = discussion + no gray areas → prompt: research or plan?
3. Stage = research + RESEARCH.md missing → dispatch research
4. Stage = planning + no phases → dispatch plan
5. Stage = planning/execution + phases.current_status = "pending" → dispatch execute
6. Stage = execution + phases.current_status = "executing" → resume execute
7. Stage = execution + phases.current_status = "executed" → dispatch review
8. Stage = execution + phases.current_status = "completed" → check more phases, advance or complete

**Mode handling:** Interactive uses AskUserQuestion at each transition; semi-auto auto-runs discuss→research→plan, pauses after each phase execute+review; auto runs everything, stops on review issues.

### Flow Control in Step Workflows to Strip

- **discuss.md** — No flow control to strip. Already ends with "End workflow (caller handles continuation)."
- **research.md** — No flow control to strip. Same clean ending.
- **plan.md** — Has one orchestrator mode check to remove. Otherwise clean.
- **execute.md** — **Main problem.** Auto-triggers review at end (`@review.md`). Phase status transitions need to move to brain. Brain must own `phases.current_status` → "executing"/"executed" transitions.
- **review.md** — Two blocks to extract: (1) collect_feedback + create_fix_plan → moves to revise.md. (2) approve_phase (state transitions) → moves to brain.

### Shared References the Brain Should Use

| Reference | Purpose | When |
|-----------|---------|------|
| `validate-task.md` | Check task dir + required files | Brain entry |
| `load-context.md` | Read all task files | After validate |
| `commit-docs.md` | Auto-commit .specd/ files | After state transitions |

### Install Integration

No changes needed to `bin/install.js`. The existing `copyWithPathReplacement` recursively copies `specdacular/` which will include `pipeline.json`. Path replacement in `.md` files also works. JSON files are copied as-is (no path replacement needed since pipeline.json uses relative workflow names, not absolute paths).

---

## Pitfalls

### Critical (causes failures/rewrites)

**1. Revise extraction breaks the review→fix→re-review loop.**
Currently review.md does a tight loop: gather_feedback → create_fix_plan → execute → re-review. When split into separate pipeline steps, the brain must route back to execute after revise creates a fix plan. If the brain treats execute→review→revise as linear and advances to next phase, fix plans never get executed. **Prevention:** Revise signals outcome via STATE.md (e.g., `fix_plan_created: true`). Brain reads this flag and routes to execute rather than advancing. **Detection:** Test with a phase that produces review findings; verify brain re-enters execute on current phase. **Confidence:** HIGH.

**2. Full-replace pipeline.json means users silently lose default steps.**
A user who customizes one step must copy the entire default. If they use a stale copy after upgrade, they get missing steps with no error. **Prevention:** Brain validates pipeline at startup — check named pipeline references exist, workflow paths resolve, warn on missing standard steps. Add version comment to default pipeline.json. **Detection:** Test with truncated pipeline.json. **Confidence:** HIGH.

**3. State desync when workflow fails mid-execution.**
Brain records "currently executing step X" but interruption leaves config half-updated. Resume may re-execute completed tasks. **Prevention:** Save state before and after each step. Step workflows must be idempotent. STATE.md should have clear `current_step` field. **Detection:** Kill mid-execute, verify no double-execution on resume. **Confidence:** HIGH.

**4. Inline hooks modifying shared files cause conflicts.**
Two hooks (global + step-specific) both writing to CONTEXT.md — last writer wins, first writer's changes lost. **Prevention:** Establish convention: hooks append to designated sections only. Document execution order: global pre-step → step pre → STEP → step post → global post-step. **Confidence:** HIGH.

### Moderate (causes bugs/debt)

**5. Brain becomes a god workflow.**
Brain handles modes, routing, phase loops, hooks, failure handling — all in one file. Risk of 600+ line file as hard to maintain as what it replaces. **Prevention:** Extract complex sub-behaviors into reference files (`references/resolve-hook.md`, `references/phase-loop.md`). Brain.md stays a coordinator, not an implementor. **Confidence:** MEDIUM.

**6. Pipeline schema evolves but user overrides break on upgrade.**
Users with `.specd/pipeline.json` miss new fields in future versions. Brain encounters missing fields. **Prevention:** Add `"schema_version": "1.0"` from day one. Brain checks version on load, warns if outdated. New fields must have safe defaults. **Confidence:** HIGH.

**7. Subagent hooks don't share brain's in-memory context.**
Subagent reads from disk, brain may have cached values not yet flushed. **Prevention:** Brain flushes all pending state writes before spawning subagent hooks. **Confidence:** MEDIUM.

**8. Semi-auto mode boundary undefined in custom pipelines.**
Semi-auto gates are tied to step names. Custom pipelines may rename steps. **Prevention:** Add `"pause_in_semi_auto": true` flag to step configs. Default pipeline sets this on execute/review/revise. **Confidence:** MEDIUM.

**9. Decimal phase routing after revise.**
Brain's phase loop reads ROADMAP.md but may miss newly created decimal phases (phase-01.1, etc.) if it only looks at integer phases. **Prevention:** After revise, brain re-reads config.json and ROADMAP.md. Phase advancement checks for decimal phases. **Confidence:** HIGH.

### Minor (causes friction)

**10. Hook file path resolution ambiguity.**
Relative to what? Project root, task dir, hooks dir? **Prevention:** Define single resolution: relative to project root. Validate path existence during pipeline load. **Confidence:** HIGH.

**11. Dual argument parsing.**
Continue.md and brain.md both parse args. **Prevention:** Argument parsing exclusively in brain.md. Continue.md passes $ARGUMENTS verbatim. **Confidence:** MEDIUM.

**12. Inline hooks consuming context window.**
Heavy inline hooks degrade brain reasoning quality in later steps. **Prevention:** Recommend subagent mode for heavy hooks. Brain re-reads pipeline.json at each step dispatch. **Confidence:** MEDIUM.

**13. Optional hook failures invisible.**
Silent failures erode trust without visibility. **Prevention:** Brain prints inline warning at failure point. Writes hook failures to CHANGELOG.md. **Confidence:** HIGH.

---

## Sources Consulted

- Anthropic: [Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents)
- Anthropic: [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- LangGraph: [How to wait for user input using interrupt](https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/wait-user-input/)
- LangGraph: [Durable execution](https://docs.langchain.com/oss/python/langgraph/durable-execution)
- Microsoft Learn: [Checkpointing and Resuming Workflows](https://learn.microsoft.com/en-us/agent-framework/tutorials/workflows/checkpointing-and-resuming)
- Microsoft Learn: [AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- Buildkite: [Agent hooks v3](https://buildkite.com/docs/agent/v3/hooks)
- Jenkins: [Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- Argo Workflows: [Workflow Templates](https://argo-workflows.readthedocs.io/en/latest/workflow-templates/)
- GitHub Actions: [Workflow syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)
- Hatchworks: [Orchestrating AI Agents in Production](https://hatchworks.com/blog/ai-agents/orchestrating-ai-agents/)
- Specdacular codebase: `specdacular/workflows/continue.md`, `execute.md`, `review.md`, `discuss.md`
- Specdacular task: `.specd/tasks/brain-and-hooks/FEATURE.md`, `DECISIONS.md`, `CONTEXT.md`
- Airbyte: [ETL Pipeline Pitfalls to Avoid](https://airbyte.com/data-engineering-resources/etl-pipeline-pitfalls-to-avoid)
- Daniel Beach: [Config Driven Pipelines](https://dataengineeringcentral.substack.com/p/config-driven-pipelines)
- Temporal: [Good Practices for Writing Workflows](https://raphaelbeamonte.com/posts/good-practices-for-writing-temporal-workflows-and-activities/)
- LangGraph: [State Management for Multi-Agent Workflows](https://medium.com/@bharatraj1918/langgraph-state-management-part-1-how-langgraph-manages-state-for-multi-agent-workflows-da64d352c43b)
- Augment Code: [Why Multi-Agent LLM Systems Fail](https://www.augmentcode.com/blog/why-multi-agent-llm-systems-fail-and-how-to-fix-them)
