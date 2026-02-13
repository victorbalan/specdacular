---
name: specd:feature:research
description: Research implementation patterns for a feature
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebSearch
  - WebFetch
---

<objective>
Research how to implement a feature by investigating codebase integration, external patterns, and common pitfalls. Produces RESEARCH.md.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/research-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS
</context>
