---
name: specd.research
description: Spawn parallel research agents for current task
argument-hint: "[task-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - WebSearch
  - WebFetch
---

<objective>
Ad-hoc research command. Spawns three parallel agents to investigate codebase integration, implementation patterns, and pitfalls for the current task.

Can be used at any stage — during discussion, before planning, or mid-execution for phase-level research.
</objective>

<execution_context>
**Resolve task name:**
@~/.claude/specdacular/references/resolve-task.md

Resolve task name from $ARGUMENTS (falls back to `.specd/state.json`, then single-task auto-pick, then asks user).

**Execute research:**
@~/.claude/specdacular/workflows/research.md
</execution_context>

<context>
Task name: $ARGUMENTS

**Task context:**
@.specd/tasks/*/config.json
@.specd/tasks/*/FEATURE.md
@.specd/tasks/*/DECISIONS.md
</context>

<success_criteria>
- [ ] Task resolved
- [ ] Three research agents spawned and completed
- [ ] RESEARCH.md created with findings
- [ ] Research-driven decisions recorded
</success_criteria>
