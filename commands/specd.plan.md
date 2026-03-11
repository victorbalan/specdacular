---
name: specd.plan
description: Create roadmap or plan current phase
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
Phase planning command. Routes based on task state:

- **No roadmap yet:** Creates high-level ROADMAP.md with phase goals (delegates to plan.md workflow)
- **Roadmap exists, current phase needs planning:** Creates detailed PLAN.md for the current phase (delegates to phase-plan.md workflow)
- **Current phase already planned:** Shows the existing plan
</objective>

<execution_context>
**Resolve task name:**
@~/.claude/specdacular/references/resolve-task.md

Resolve task name from $ARGUMENTS (falls back to `.specd/state.json`, then single-task auto-pick, then asks user).

**Determine routing:**

Read `$TASK_DIR/config.json` and check:
1. If `stage` is not `"execution"` (no roadmap yet) → delegate to `@~/.claude/specdacular/workflows/plan.md`
2. If `stage` is `"execution"` and current phase has no PLAN.md → delegate to `@~/.claude/specdacular/workflows/phase-plan.md`
3. If current phase already has PLAN.md → display it and ask if user wants to re-plan
</execution_context>

<context>
Task name: $ARGUMENTS

**Workflows:**
@~/.claude/specdacular/workflows/plan.md
@~/.claude/specdacular/workflows/phase-plan.md

**Task context:**
@.specd/tasks/*/config.json
@.specd/tasks/*/ROADMAP.md
</context>

<success_criteria>
- [ ] Task resolved
- [ ] Correct workflow dispatched based on state
- [ ] Roadmap or phase PLAN.md created
</success_criteria>
