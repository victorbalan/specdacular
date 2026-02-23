---
name: specd.config
description: Create or update .specd/config.json with commit settings
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Create or update `.specd/config.json` with global specd settings.

Currently supports:
- `auto_commit_docs` — Whether to auto-commit `.specd/` file changes (default: true)
- `auto_commit_code` — Whether to auto-commit implementation code changes (default: true)
</objective>

<execution_context>
@~/.claude/specdacular/workflows/config.md
</execution_context>
