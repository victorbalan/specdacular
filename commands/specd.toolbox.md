---
name: specd.toolbox
description: "Advanced task operations"
argument-hint: "[<task-name>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
  - WebSearch
  - WebFetch
---

<objective>
Task lifecycle operations: discuss, research, plan, execute, review.
</objective>

<execution_context>
**Parse $ARGUMENTS as task name.**

- If a bare word that matches a directory in `.specd/tasks/` or `.specd/features/` → use as task name
- If empty → check `.specd/tasks/` for available tasks. If only one task exists, use it automatically. If multiple, ask.

Validate using:
@~/.claude/specdacular/references/validate-task.md

Then present the menu using AskUserQuestion:
- header: "Operation"
- question: "What would you like to do with {task-name}?"
- options:
  - "Discuss" — Explore gray areas and record decisions
  - "Research" — Spawn parallel agents for patterns/pitfalls
  - "Plan" — Create execution phases
  - "Execute" — Execute the next phase
  - "Review" — Review executed phase

Based on selection, delegate to the appropriate workflow:
- Discuss → @~/.claude/specdacular/workflows/discuss.md
- Research → @~/.claude/specdacular/workflows/research.md
- Plan → @~/.claude/specdacular/workflows/plan.md
- Execute → @~/.claude/specdacular/workflows/execute.md
- Review → @~/.claude/specdacular/workflows/review.md

</execution_context>

<context>
Arguments: $ARGUMENTS

@~/.claude/specdacular/workflows/discuss.md
@~/.claude/specdacular/workflows/research.md
@~/.claude/specdacular/workflows/plan.md
@~/.claude/specdacular/workflows/execute.md
@~/.claude/specdacular/workflows/review.md
</context>

<success_criteria>
- [ ] Task validated and operation menu shown
- [ ] Selected operation executed via correct workflow
</success_criteria>
