---
name: specd:phase:execute
description: Execute plans for a feature with progress tracking
argument-hint: "[feature-name]"
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
Execute a plan from a feature, tracking progress and logging deviations. Auto-fixes bugs/blockers, asks before architectural changes, stops on verification failure.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/execute-plan.md
</execution_context>

<context>
Feature name: $ARGUMENTS
</context>
