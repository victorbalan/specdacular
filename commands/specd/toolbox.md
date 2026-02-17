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
- Discuss → @~/.claude/specdacular/workflows/discuss.md
- Research → @~/.claude/specdacular/workflows/research.md
- Plan → @~/.claude/specdacular/workflows/plan.md
- Execute / Review → Check `config.json` → `phases.current_status`:
  - If "executed" → @~/.claude/specdacular/workflows/review.md
  - Otherwise → @~/.claude/specdacular/workflows/execute.md

---

## Context Flow

No task name needed. Present the menu using AskUserQuestion:
- header: "Context"
- question: "What would you like to do with codebase context?"
- options:
  - "Status" — View dashboard of all context files
  - "Review" — Walk through and review a context file section by section
  - "Add" — Add new content to a context file

Based on selection, read and follow the appropriate workflow:
- Status → Read `~/.claude/specdacular/workflows/context-status.md` and follow its process
- Review → Read `~/.claude/specdacular/workflows/context-review.md` and follow its process
- Add → Read `~/.claude/specdacular/workflows/context-add.md` and follow its process

IMPORTANT: Use the Read tool to load the selected workflow file, then execute its <process> steps in order. Do NOT improvise — the workflow file contains the complete process.
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<success_criteria>
- [ ] Subdomain selected (tasks or context) — from argument or prompt
- [ ] For tasks: task validated and operation menu shown
- [ ] For context: context operation menu shown
- [ ] Selected operation executed via correct workflow
</success_criteria>
