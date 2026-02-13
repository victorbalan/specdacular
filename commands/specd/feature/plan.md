---
name: specd:feature:plan
description: Create roadmap with phase overview for a feature
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
Create a roadmap with phase overview and empty phase directories. Phases follow natural code dependencies (types->API->UI). Detailed plans are created later per-phase.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/plan-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS
</context>
