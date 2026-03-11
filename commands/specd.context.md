---
name: specd.context
description: Load task context and inject behavioral guardrails
argument-hint: "[task-name]"
allowed-tools:
  - Read
  - Glob
  - Bash
---

<objective>
Read-only context loader that displays task summary and injects behavioral guardrails. Re-runnable mid-conversation to reset Claude's behavior to specd conventions.

**What it does:**
1. Resolves current task (from argument, state.json, or scan)
2. Reads task state and displays a summary (stage, phase, decisions, gray areas)
3. Injects behavioral guardrails for the remainder of the session

**What it does NOT do:**
- Modify any files
- Commit anything
- Dispatch workflows or next steps
</objective>

<execution_context>
@~/.claude/specdacular/workflows/context.md
</execution_context>

<context>
**Task resolution:**
@~/.claude/specdacular/references/resolve-task.md

Resolve task name from $ARGUMENTS (falls back to `.specd/state.json`, then single-task auto-pick, then asks user).

**Behavioral guardrails:**
@~/.claude/specdacular/guardrails/specd-rules.txt

**Reads from task directory:**
@.specd/tasks/*/config.json
@.specd/tasks/*/STATE.md
@.specd/tasks/*/DECISIONS.md
@.specd/tasks/*/CONTEXT.md
@.specd/tasks/*/ROADMAP.md
</context>

<success_criteria>
- [ ] Task resolved (from argument, state.json, or scan)
- [ ] Task summary displayed (stage, phase, decisions, gray areas, next step)
- [ ] Behavioral guardrails injected for session
</success_criteria>
