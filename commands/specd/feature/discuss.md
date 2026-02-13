---
name: specd:feature:discuss
description: Continue or deepen discussion about a feature
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
Continue or deepen understanding of a feature through targeted discussion. Can be called many times — context accumulates across sessions.

Shows what's already been discussed, identifies remaining gray areas, probes until clear, and records decisions.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/discuss-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS
</context>
