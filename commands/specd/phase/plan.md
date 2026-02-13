---
name: specd:phase:plan
description: Create detailed executable plans for a phase
argument-hint: "[feature-name] [phase-number]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Create detailed, executable PLAN.md files for a single phase. Plans are prompts — each contains everything needed to implement without asking questions.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/plan-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (feature-name phase-number)
</context>
