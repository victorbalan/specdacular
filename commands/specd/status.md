---
name: specd:status
description: Show feature status dashboard
argument-hint: "[--all]"
allowed-tools:
  - Read
  - Glob
  - Bash
---

<objective>
Display a dashboard showing all tasks and their current status, stage, plan progress, and recommended next action.

- By default, hide completed features
- With `--all` flag, show completed features in a separate section
</objective>

<execution_context>
@~/.claude/specdacular/workflows/status.md
</execution_context>
