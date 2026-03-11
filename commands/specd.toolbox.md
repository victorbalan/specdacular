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
**Resolve task name:**
@~/.claude/specdacular/references/resolve-task.md

Resolve task name from $ARGUMENTS (falls back to `.specd/state.json`, then single-task auto-pick, then asks user).

**Validate task:**
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
