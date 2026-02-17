---
name: specd:discuss
description: Deepen task discussion — explore gray areas and record decisions
argument-hint: "[task-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Continue or deepen discussion for an existing task. Targets gray areas from CONTEXT.md, explores them through collaborative conversation, and records decisions.

**Updates:** CONTEXT.md, DECISIONS.md, STATE.md
</objective>

<execution_context>
@~/.claude/specdacular/workflows/discuss.md
</execution_context>

<context>
Task name: $ARGUMENTS
</context>

<success_criteria>
- [ ] Gray areas explored through conversation
- [ ] New decisions recorded in DECISIONS.md
- [ ] CONTEXT.md updated with resolutions
- [ ] Changes committed
</success_criteria>
