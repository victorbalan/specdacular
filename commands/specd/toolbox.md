---
name: specd:toolbox
description: "Advanced task operations — discuss, research, plan, execute, review"
argument-hint: "[task-name]"
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
Menu of advanced task operations. Presents options and dispatches to the appropriate workflow.

**Operations:**
- **Discuss** — Explore open questions, record decisions
- **Research** — Spawn parallel research agents
- **Plan** — Create execution phases from task context
- **Execute** — Execute the next phase's plan
- **Review** — Review executed phase, approve or request fixes
</objective>

<execution_context>
First, select the task using:
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
Task name: $ARGUMENTS
</context>

<success_criteria>
- [ ] Task selected (from argument or picker)
- [ ] Menu presented with operations
- [ ] Selected operation executed via correct workflow
</success_criteria>
