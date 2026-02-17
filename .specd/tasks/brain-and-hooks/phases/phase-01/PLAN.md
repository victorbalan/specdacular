---
task: brain-and-hooks
phase: 1
depends_on: []
creates:
  - specdacular/pipeline.json
  - specdacular/workflows/brain.md
  - specdacular/references/resolve-pipeline.md
  - specdacular/references/brain-routing.md
modifies: []
---

# Phase 1: Pipeline Config + Brain Foundation

## Objective

Create the default `pipeline.json` config and the brain orchestrator's core loop — state reading, pipeline resolution, routing logic, step dispatch, and mode handling. This is the foundation all other phases build on.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Workflow structure pattern, template file pattern
- `@.specd/codebase/STRUCTURE.md` — Where workflow files go
- `@specdacular/workflows/continue.md` — The routing logic to absorb (8 decision points, 3 modes)

**Relevant Decisions:**
- DEC-001: Brain owns all flow control and state transitions
- DEC-003: Full replace semantics for pipeline.json
- DEC-004: Default at `specdacular/pipeline.json`, override at `.specd/pipeline.json`
- DEC-008: Nested pipelines — main + phase-execution
- DEC-010: Brain replicates continue.md modes exactly

**From Research:**
- Brain is a generalized `continue.md` — same state machine loop, configurable step registry
- Existing config.json state fields map cleanly to pipeline positions (see routing table in RESEARCH.md)
- State must be saved before step dispatch, not after
- Extract sub-behaviors into reference files to avoid god-workflow (Pitfall #5)
- Add `schema_version` to pipeline.json (Pitfall #6)
- Add `pause_in_semi_auto` flag to step configs (Pitfall #8)

---

## Tasks

### Task 1: Create default pipeline.json

**Files:** `specdacular/pipeline.json`

**Action:**
Create the default pipeline configuration with:
- `schema_version: "1.0"`
- `mode: "interactive"` (default)
- `pipelines.main`: discuss → research → plan → phase-execution reference
- `pipelines.phase-execution`: execute → review → revise
- Each step has: `name`, `enabled: true`, `workflow` (filename only, not path), `hooks: { pre: null, post: null }`, `pause_in_semi_auto` flag
- `phase-execution` step in main pipeline has `"pipeline": "phase-execution"` instead of `workflow`
- Global `hooks: { pre-step: null, post-step: null }`
- Semi-auto pause flags: `true` for execute, review, revise; `false` for discuss, research, plan

**Verify:**
```bash
cat specdacular/pipeline.json | python3 -m json.tool > /dev/null 2>&1 && echo "valid JSON"
```

**Done when:**
- [ ] Valid JSON file at `specdacular/pipeline.json`
- [ ] Contains both `main` and `phase-execution` pipelines
- [ ] All steps have name, enabled, workflow/pipeline, hooks, pause_in_semi_auto
- [ ] schema_version present

---

### Task 2: Create resolve-pipeline reference

**Files:** `specdacular/references/resolve-pipeline.md`

**Action:**
Create a shared reference for pipeline resolution logic. The brain calls this to determine which pipeline.json to use.

Resolution order:
1. Check `.specd/pipeline.json` (user override)
2. Fall back to installed `specdacular/pipeline.json` (using the path prefix pattern from install)
3. If neither found, error with actionable message

Also validate the loaded pipeline:
- Check `schema_version` exists
- Check all named pipeline references (e.g., `"pipeline": "phase-execution"`) resolve to entries in `pipelines`
- Check all `workflow` values are non-empty strings for enabled steps
- Warn (not error) if standard steps are missing (discuss, plan, execute, review)

**Verify:**
```bash
[ -f "specdacular/references/resolve-pipeline.md" ] && echo "exists"
```

**Done when:**
- [ ] Reference file created with resolution logic
- [ ] Includes validation checks
- [ ] Follows existing reference file patterns (see `references/validate-task.md`)

---

### Task 3: Create brain-routing reference

**Files:** `specdacular/references/brain-routing.md`

**Action:**
Create a shared reference that maps current state to pipeline position. This extracts the routing table from the brain to keep brain.md focused.

The routing logic (from continue.md's determine_action, adapted for pipeline):
1. Read `config.json` stage + phases status
2. Read `CONTEXT.md` gray areas count
3. Map state to the next step name in the pipeline
4. Handle edge cases: interrupted execution (resume), completed phases (advance or complete)

Include the state-to-pipeline-position mapping table from RESEARCH.md.

For custom pipelines: the routing should work with step names, not hardcoded positions. Find the step by name in the pipeline array.

**Verify:**
```bash
[ -f "specdacular/references/brain-routing.md" ] && echo "exists"
```

**Done when:**
- [ ] Reference file maps all 8 state combinations to pipeline step names
- [ ] Works with custom pipeline step names (not positional)
- [ ] Handles phase-execution sub-pipeline routing

---

### Task 4: Create brain.md core orchestrator

**Files:** `specdacular/workflows/brain.md`

**Action:**
Create the central orchestrator workflow. Structure:

```
<purpose> — Config-driven orchestrator that replaces continue.md's flow control
<philosophy> — One orchestrator, pluggable steps, hooks as workflow steps
<process>
  <step name="parse_args"> — Extract task name and mode from $ARGUMENTS
  <step name="validate"> — @validate-task.md
  <step name="resolve_pipeline"> — @resolve-pipeline.md
  <step name="load_state"> — Read config.json, STATE.md, CONTEXT.md
  <step name="main_loop"> — @brain-routing.md to determine next step
  <step name="prompt_or_proceed"> — Mode-based: interactive prompts, semi-auto checks pause_in_semi_auto, auto proceeds
  <step name="dispatch_step"> — Execute the step's workflow file
  <step name="update_state"> — Update config.json stage/phases based on step completion
  <step name="phase_loop"> — For phase-execution pipeline: check if more phases, loop or advance
  <step name="complete"> — All phases done, task complete
</process>
```

The brain does NOT handle hooks yet (Phase 2). Focus on:
- Pipeline resolution and validation
- State-based routing using the routing reference
- Mode handling (interactive/semi-auto/auto) — interactive prompts with AskUserQuestion, semi-auto uses pause_in_semi_auto flag, auto just proceeds
- Step dispatch via `@` reference to workflow files
- State updates after step completion
- Phase-execution loop logic (advance phase, check for more, handle decimal phases)
- Stop/resume capability (save state, user resumes with /specd:continue)

**Verify:**
```bash
[ -f "specdacular/workflows/brain.md" ] && grep -c "<step" specdacular/workflows/brain.md
```

**Done when:**
- [ ] brain.md created with all core steps
- [ ] Follows workflow structure pattern (<purpose>, <philosophy>, <process>, <step>)
- [ ] References resolve-pipeline.md and brain-routing.md
- [ ] Handles all 3 modes
- [ ] Handles phase-execution loop with decimal phase awareness
- [ ] Placeholder comments for hook execution (Phase 2)

---

## Verification

After all tasks complete:

```bash
[ -f "specdacular/pipeline.json" ] && [ -f "specdacular/workflows/brain.md" ] && [ -f "specdacular/references/resolve-pipeline.md" ] && [ -f "specdacular/references/brain-routing.md" ] && echo "Phase 1 complete"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] pipeline.json is valid JSON with both pipelines
- [ ] brain.md has core loop without hooks (hooks are Phase 2)

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/brain-and-hooks/CHANGELOG.md`.
