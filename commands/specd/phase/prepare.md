---
name: specd:phase:prepare
description: Prepare a phase by discussing gray areas and optionally researching
argument-hint: "[feature-name] [phase-number]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
  - WebSearch
  - WebFetch
---

<objective>
Prepare a phase for execution by discussing phase-specific gray areas and optionally researching implementation patterns. Single command replaces the discuss-then-research two-step.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/prepare-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (feature-name phase-number)
</context>
