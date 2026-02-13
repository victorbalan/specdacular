---
name: specd:phase:insert
description: Insert a new phase into the roadmap
argument-hint: "[feature-name] [after-phase]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Insert a new phase into an existing roadmap using decimal numbering (e.g., phase 2.1 between phases 2 and 3). Useful when review reveals needed additions.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/insert-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (feature-name after-phase-number)
</context>
