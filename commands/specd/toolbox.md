---
name: specd:toolbox
description: "Advanced task operations and context management"
argument-hint: "[tasks <task-name>|context]"
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
Toolbox with two subdomains:

1. **tasks** — Task lifecycle operations (requires task name): discuss, research, plan, execute, review
2. **context** — Codebase context management (no task name): status, review, add
</objective>

<execution_context>
**Parse $ARGUMENTS to determine subdomain:**

- If starts with "tasks" → extract remaining words as task name, go to Tasks flow
- If starts with "context" → go to Context flow
- If a bare word that matches a directory in `.specd/tasks/` or `.specd/features/` → treat as `tasks {name}`
- If empty or unrecognized → ask user which subdomain

**If subdomain unclear, ask:**
Use AskUserQuestion:
- header: "Toolbox"
- question: "Which toolbox?"
- options:
  - "Tasks" — Discuss, research, plan, execute, or review a task
  - "Context" — View status, review, or add to codebase context

---

## Tasks Flow

Requires a task name. If not provided after "tasks", check `.specd/tasks/` for available tasks. If only one task exists, use it automatically. If multiple, ask.

Validate using:
@~/.claude/specdacular/references/validate-task.md

Then present the menu using AskUserQuestion:
- header: "Operation"
- question: "What would you like to do with {task-name}?"
- options:
  - "Discuss" — Explore gray areas and record decisions
  - "Research" — Spawn parallel agents for patterns/pitfalls
  - "Plan" — Create execution phases
  - "Execute / Review" — Execute next phase or review executed phase

Based on selection, delegate to the appropriate workflow:
- Discuss → follow the discuss.md workflow
- Research → follow the research.md workflow
- Plan → follow the plan.md workflow
- Execute / Review → Check `config.json` → `phases.current_status`:
  - If "executed" → follow the review.md workflow
  - Otherwise → follow the execute.md workflow

---

## Context Flow

No task name needed. Present the menu using AskUserQuestion:
- header: "Context"
- question: "What would you like to do with codebase context?"
- options:
  - "Status" — View dashboard of all context files
  - "Review" — Walk through and review a context file section by section
  - "Add" — Add new content to a context file

Based on selection, delegate to the appropriate workflow:
- Status → follow the context-status.md workflow
- Review → follow the context-review.md workflow
- Add → follow the context-add.md workflow
</execution_context>

<context>
Arguments: $ARGUMENTS

**Task workflows:**
@~/.claude/specdacular/workflows/discuss.md
@~/.claude/specdacular/workflows/research.md
@~/.claude/specdacular/workflows/plan.md
@~/.claude/specdacular/workflows/execute.md
@~/.claude/specdacular/workflows/review.md

**Context workflows:**
@~/.claude/specdacular/workflows/context-status.md
@~/.claude/specdacular/workflows/context-review.md
@~/.claude/specdacular/workflows/context-add.md
</context>

<success_criteria>
- [ ] Subdomain selected (tasks or context) — from argument or prompt
- [ ] For tasks: task validated and operation menu shown
- [ ] For context: context operation menu shown
- [ ] Selected operation executed via correct workflow
</success_criteria>
