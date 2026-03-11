---
name: specd.execute
description: Execute next phase — implement and review
argument-hint: "[task-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Execute the next phase for the current task. Implements the phase PLAN.md, then reviews the work. If review reveals issues, collects feedback and creates fix plans.

**Flow:** execute → review → (optional revise → re-execute)

Per DEC-006, review is part of execute — one command does both.
</objective>

<execution_context>
**Resolve task name:**
@~/.claude/specdacular/references/resolve-task.md

Resolve task name from $ARGUMENTS (falls back to `.specd/state.json`, then single-task auto-pick, then asks user).

**Pre-flight check:**
Read `$TASK_DIR/config.json`:
- Verify `stage` is `"execution"`
- Verify current phase has a PLAN.md:
  ```bash
  PHASE_NUM=$(printf '%02d' $CURRENT_PHASE)
  [ -f "$TASK_DIR/phases/phase-$PHASE_NUM/PLAN.md" ] || echo "no plan"
  ```
- If no PLAN.md: suggest `/specd.plan` first and stop

**Step 1 — Execute phase:**
@~/.claude/specdacular/workflows/execute.md

**Step 2 — Review phase:**
After execute completes, run review:
@~/.claude/specdacular/workflows/review.md

**Step 3 — Handle review outcome:**
- If user approves ("Looks good"): advance phase in config.json, update STATE.md
- If user wants revisions: delegate to `@~/.claude/specdacular/workflows/revise.md`, then loop back to execute for fix plans
- If user stops: save state, exit
</execution_context>

<context>
Task name: $ARGUMENTS

**Workflows:**
@~/.claude/specdacular/workflows/execute.md
@~/.claude/specdacular/workflows/review.md
@~/.claude/specdacular/workflows/revise.md

**Task context:**
@.specd/tasks/*/config.json
@.specd/tasks/*/ROADMAP.md
@.specd/tasks/*/phases/*/PLAN.md
</context>

<success_criteria>
- [ ] Task resolved
- [ ] Phase PLAN.md exists (or user directed to /specd.plan)
- [ ] Phase executed with tasks verified
- [ ] Review completed with user feedback
- [ ] Phase approved or fix plan created
</success_criteria>
