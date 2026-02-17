---
name: specd:research
description: Research implementation patterns with parallel agents
argument-hint: "[task-name]"
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
Spawn three parallel research agents to investigate codebase integration, implementation patterns, and pitfalls. Synthesizes findings into RESEARCH.md.

**Creates:** `.specd/tasks/{name}/RESEARCH.md`
**Updates:** DECISIONS.md (research-driven decisions)
</objective>

<execution_context>
@~/.claude/specdacular/workflows/research.md
</execution_context>

<context>
Task name: $ARGUMENTS
</context>

<success_criteria>
- [ ] Three research agents completed
- [ ] RESEARCH.md synthesized from findings
- [ ] Research-driven decisions recorded
- [ ] Changes committed
</success_criteria>
