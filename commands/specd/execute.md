---
name: specd:execute
description: Execute the next phase's plan
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
Execute the next phase's PLAN.md. Runs tasks with verification, handles deviations, commits after each task, and automatically triggers code review when the phase is complete.

**Flow:** Execute tasks → Commit per task → Phase complete → Auto-trigger review
</objective>

<execution_context>
@~/.claude/specdacular/workflows/execute.md
</execution_context>

<context>
Task name: $ARGUMENTS
</context>

<success_criteria>
- [ ] Phase tasks executed with verification
- [ ] Deviations logged in CHANGELOG.md
- [ ] Code committed per task
- [ ] Review automatically triggered after completion
</success_criteria>
