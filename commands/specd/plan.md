---
name: specd:plan
description: Create execution phases from task context
argument-hint: "[task-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Derive execution phases from task requirements and create one PLAN.md per phase. Phases are small and focused, ordered by dependencies.

**Creates:** `phases/phase-NN/PLAN.md` files, ROADMAP.md
**Updates:** STATE.md, config.json
</objective>

<execution_context>
@~/.claude/specdacular/workflows/plan.md
</execution_context>

<context>
Task name: $ARGUMENTS
</context>

<success_criteria>
- [ ] Phases derived from requirements
- [ ] One PLAN.md per phase
- [ ] ROADMAP.md created
- [ ] Changes committed
</success_criteria>
