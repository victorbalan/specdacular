---
name: specd:feature:review
description: Review executed phase work and approve or request fixes
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
User-guided review of an executed phase. Shows what was built (git diff), provides test guidance, and takes user feedback to generate fix plans.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/review-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS
</context>
