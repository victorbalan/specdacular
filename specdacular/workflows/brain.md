<purpose>
Config-driven orchestrator that replaces continue.md's hardcoded flow control. Reads pipeline.json, determines the next step based on task state, handles modes (default/interactive/auto), dispatches step workflows, executes hooks, and manages state transitions.

The brain is the single source of truth for workflow orchestration. Step workflows just do their job and return — the brain decides what comes next.

**Modes:**
- **Default:** Auto-runs steps, pauses where `pause: true`. Smart about skipping unnecessary steps.
- **Interactive (`--interactive`):** Prompts at each stage transition with skip/jump options
- **Auto (`--auto`):** Runs everything, only stops on errors or task completion
</purpose>

<philosophy>

## One Orchestrator

All flow control lives here. Step workflows are pure execution — they do their work and return. They never dispatch the next step.

## Config-Driven

The pipeline comes from pipeline.json, not hardcoded logic. Users can swap steps, add hooks, or replace the entire pipeline.

## State Machine

The brain reads state → determines position → dispatches → updates state → loops. Every state transition is explicit and persisted before dispatch.

## Hooks Are Workflow Steps

Hooks are markdown files executed like any other workflow step. They can read and modify task files. No special output contract.

</philosophy>

<process>

<step name="parse_args">
Parse arguments to extract task name and mode.

**Parse $ARGUMENTS:**
- Extract task name (first argument, or only argument without --)
- Check for `--interactive` flag
- Check for `--auto` flag
- If `--interactive` → interactive mode
- If `--auto` → auto mode
- Otherwise → default mode

```
Mode: {default | interactive | auto}
Task: {task-name}
```

Continue to validate.
</step>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use basic validation with $TASK_NAME.

Continue to resolve_pipeline.
</step>

<step name="resolve_pipeline">
@~/.claude/specdacular/references/resolve-pipeline.md

Load and validate the pipeline configuration.

After loading, apply mode:
- If `--interactive` flag was set, use interactive mode
- If `--auto` flag was set, use auto mode
- Otherwise use default mode (auto-run, pause at `pause: true` steps)

**Check for orchestrator mode:**
Read `.specd/config.json` (project-level, not task-level). If it has `"type": "orchestrator"`:
- Set `$ORCHESTRATOR_MODE = true`
- Log: `Orchestrator mode: multi-project task management active.`

**How orchestrator mode works with the brain:**

The brain runs the same pipeline for orchestrator tasks. The difference is that step workflows detect orchestrator mode internally and hand off to specialized orchestrator workflows:
- `new.md` → detects orchestrator → delegates to `orchestrator/new.md` (multi-project task creation)
- `plan.md` → detects orchestrator → delegates to `orchestrator/plan.md` (cross-project phasing)
- `discuss.md`, `research.md` → work at orchestrator level (system-wide discussion/research)
- `execute.md` → for orchestrator tasks, reads DEPENDENCIES.md to determine cross-project phase order. Executes phases per-project respecting dependency graph.
- `review.md`, `revise.md` → work per-project within the orchestrator's coordination

The brain does NOT need different routing for orchestrator mode. The pipeline is the same — orchestrator awareness lives in the step workflows that need it. The brain's job is to drive the pipeline; the steps handle multi-project specifics.

**Important:** When in orchestrator mode, the phase-execution loop may need to coordinate across projects. The brain reads the orchestrator task's DEPENDENCIES.md to understand cross-project phase ordering, and dispatches execute/review/revise per project in dependency order.

Continue to main_loop.
</step>

<step name="main_loop">
The core orchestration loop. Repeats until task is complete or user stops.

**On each iteration:**

1. **Load current state:**
   Read config.json, STATE.md, CONTEXT.md from task directory.

2. **Determine next step:**
   @~/.claude/specdacular/references/brain-routing.md

   This sets: `$NEXT_STEP`, `$NEXT_PIPELINE`, and optionally `$TASK_COMPLETE` or `$RESUME`.

3. **If task complete:**
   Continue to complete.

4. **Find step config in pipeline:**
   Look up `$NEXT_STEP` in `$PIPELINE.pipelines.$NEXT_PIPELINE`.

5. **Prompt or proceed:**
   Continue to prompt_or_proceed.

6. **After step dispatch returns:**
   Continue to update_state.

7. **After state update:**
   Loop back to step 1 (re-read state, determine next step).

Continue to prompt_or_proceed.
</step>

<step name="prompt_or_proceed">
Mode-based dispatch decision.

**Default mode:**
Check the step's `pause` field:
- If `false` or absent: auto-proceed (no prompt). But first, evaluate if the step adds value — if not, skip it (see smart skipping below).
- If `true`: prompt user before proceeding

When pausing, present current state and ask what to do:

```
**Current state:** {stage description}
{Additional context based on step — e.g., phase number}
```

Use AskUserQuestion with step-appropriate options:

For plan step (phase-execution pipeline — phase-plan.md):
- Auto-proceed (no pause). Plan has no pause field.

For execute step:
- "Execute" (Recommended) — Start/resume phase execution
- "Review plan" — Read the PLAN.md first
- "Stop for now" — Come back later

For review step:
- Dispatch directly (review has its own user interaction)

For revise step:
- Dispatch directly (revise has its own user interaction)

**Interactive mode (`--interactive`):**
Prompt at every stage transition, regardless of `pause` field.

Use AskUserQuestion with step-appropriate options:

For discuss step:
- "Discuss" (Recommended) — Dive into gray areas
- "Skip to research" — Move on without resolving
- "Skip to planning" — Jump straight to planning

For research step:
- "Research" (Recommended) — Investigate implementation patterns
- "Skip to planning" — Plan without research
- "Discuss more" — Continue discussion

For plan step (main pipeline — task-level):
- "Plan" (Recommended) — Create roadmap with phase goals
- "Research first" — Run research before planning
- "Discuss more" — Continue discussion

For plan step (phase-execution pipeline — phase-plan.md):
- "Plan this phase" (Recommended) — Create detailed PLAN.md
- "Skip to execute" — Execute without explicit planning
- "Stop for now" — Come back later

For execute step:
- "Execute" (Recommended) — Start/resume phase execution
- "Review plan" — Read the PLAN.md first
- "Stop for now" — Come back later

For review step:
- Dispatch directly (review has its own user interaction)

For revise step:
- Dispatch directly (revise has its own user interaction)

**Auto mode (`--auto`):**
Proceed without prompting. Apply smart skipping (see below). Only stop on errors or task completion.

**If user chooses "Stop for now":**
Save state and exit:
```
───────────────────────────────────────────────────────

Progress saved. Pick up where you left off anytime:

/specd.continue {task-name}
```
End workflow.

**If user chooses an alternative (e.g., "Skip to research"):**
Update `$NEXT_STEP` accordingly and continue to dispatch.

**Smart step skipping (default and auto modes):**
Before dispatching a step, evaluate whether it adds value. Skip if:
- **discuss:** No gray areas remaining in CONTEXT.md → skip, advance to research
- **research (task-level):** Task is straightforward (few files, clear requirements, no external dependencies) → skip, advance to plan

When skipping, log:
```
Skipping {step}: {reason}
```

In interactive mode, don't auto-skip — instead recommend skipping: mark the skip option as "(Recommended)" and the step as the alternative.

Continue to execute_hooks_and_step.
</step>

<step name="execute_hooks_and_step">
Execute pre-hooks, the step workflow, and post-hooks.

**Save state before dispatch:**
Update config.json to reflect the step is starting. For execute step, set `phases.current_status: "executing"` and record `phase_start_commit`.

Commit state:
@~/.claude/specdacular/references/commit-docs.md
- **$FILES:** config.json, STATE.md
- **$MESSAGE:** `docs({task-name}): starting {step-name}`
- **$LABEL:** `state transition`

**Execute pre-hooks:**
@~/.claude/specdacular/references/execute-hooks.md

Run pre-hooks in order:
1. Global `hooks.pre-step` from pipeline.json (if configured)
2. Step's `hooks.pre` from the step config (if configured)
3. Convention fallback: check `.specd/hooks/pre-{step-name}.md` (if file exists and no explicit config)

For each hook, use the execution logic from the reference.

If a required pre-hook fails, stop pipeline and save state. Do NOT dispatch the step.

**Dispatch step workflow:**
Resolve the workflow path from the step's `workflow` field.
Execute the workflow:
@~/.claude/specdacular/workflows/{workflow}

Pass $TASK_NAME as context.

**After step returns:**

**Execute post-hooks:**
@~/.claude/specdacular/references/execute-hooks.md

Run post-hooks in order:
1. Step's `hooks.post` from the step config (if configured)
2. Convention fallback: check `.specd/hooks/post-{step-name}.md` (if file exists and no explicit config)
3. Global `hooks.post-step` from pipeline.json (if configured)

For each hook, use the execution logic from the reference.

If a required post-hook fails, stop pipeline and save state.

Continue to update_state.
</step>

<step name="update_state">
Update state based on which step just completed.

**After discuss completes:**
- Stage stays at "discussion"
- Re-read CONTEXT.md to check if gray areas are resolved
- If all resolved, advance stage to "research"

**After research completes:**
- Set stage to "planning" in config.json

**After plan completes (task-level — main pipeline):**
- plan.md sets stage to "execution" and phases info in config.json
- Brain loops back, routing picks up phase-execution pipeline

**After plan completes (phase-level — phase-execution pipeline, phase-plan.md):**
- phase-plan.md creates PLAN.md but does NOT change config.json
- Status stays "pending" but PLAN.md now exists
- Brain loops back, routing sees pending + PLAN.md exists → routes to execute

**After execute completes:**
- Set `phases.current_status: "executed"` in config.json

**After review completes:**
- Read review outcome from config.json or STATE.md
- If user approved ("Looks good"): set `phases.current_status: "completed"`, increment `phases.completed`, advance to next phase or mark task complete
- If user wants revisions: set up for revise step
- If user stopped: save state, exit

**After revise completes:**
- Read config.json — revise should have set `phases.current_status: "pending"` (fix plan created, needs execution)
- Brain loops back to execute for the current phase (including decimal fix phases)

**Commit state updates:**
@~/.claude/specdacular/references/commit-docs.md
- **$FILES:** config.json, STATE.md
- **$MESSAGE:** `docs({task-name}): {step-name} complete`
- **$LABEL:** `state transition`

Return to main_loop.
</step>

<step name="phase_loop">
Handle the phase-execution sub-pipeline loop.

When the brain reaches the `phase-execution` pipeline reference in the main pipeline:

1. Read ROADMAP.md and config.json to determine current phase
2. Enter the phase-execution sub-pipeline (plan → execute → review → revise)
3. After each iteration through the sub-pipeline:
   - If review approved and more phases remain: advance `phases.current`, set status "pending", loop
   - If review approved and no more phases: exit sub-pipeline, task complete
   - If revise created fix plans: stay on current phase, loop back to execute
   - If user stopped: save state, exit

**Decimal phase handling:**
After revise creates a fix plan (e.g., phase-01.1/):
```bash
ls -d $TASK_DIR/phases/phase-$(printf '%02d' $CURRENT).* 2>/dev/null | sort -V
```
If decimal phases exist and are incomplete, execute them before advancing to next integer phase.

**Phase advancement:**
```
phases.current += 1
phases.current_status = "pending"
phases.phase_start_commit = null
```

Continue to main_loop (which will route to the next phase's execute step).
</step>

<step name="complete">
All phases complete. Task is done.

**Update state:**
- Set stage to "complete" in config.json

**Present:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TASK COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Task:** {task-name}
**Phases completed:** {N}
**Decisions made:** {N}

All phases executed and reviewed. Task is done!
```

End workflow.
</step>

</process>

<success_criteria>
- Pipeline loaded from .specd/pipeline.json or installed default
- Pipeline validated (schema version, references, workflow paths)
- State-based routing matches all 8 state combinations
- Default mode auto-runs, pauses at `pause: true` steps, smart-skips unnecessary steps
- Interactive mode prompts at each transition with skip/jump options
- Auto mode proceeds without prompting, smart-skips, stops on errors
- Phase-execution sub-pipeline loops correctly per phase
- Decimal fix phases handled
- State saved before dispatch for reliable resume
- Stop/resume works at any point via /specd.continue
- Hook execution points marked for Phase 2
</success_criteria>
