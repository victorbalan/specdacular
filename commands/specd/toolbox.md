---
name: specd:toolbox
description: "Advanced task operations and context management"
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
Menu of advanced task operations and codebase context management. Presents a category choice, then dispatches to the appropriate workflow.

**Task Operations:**
- **Discuss** — Explore open questions, record decisions
- **Research** — Spawn parallel research agents
- **Plan** — Create execution phases from task context
- **Execute** — Execute the next phase's plan
- **Review** — Review executed phase, approve or request fixes

**Context Management:**
- **Context Review** — Walk through a context file section by section
- **Context Add** — Add new content to the codebase context
- **Context Status** — Show context files dashboard with staleness info
</objective>

<execution_context>
First, present the category choice using AskUserQuestion:
- header: "Category"
- question: "What type of operation?"
- options:
  - "Task operations" — Work on a specific task (discuss, research, plan, execute, review)
  - "Context management" — Review, add to, or check status of codebase context

**If Task operations:**

Select the task using:
@~/.claude/specdacular/references/validate-task.md

Then present the task menu using AskUserQuestion:
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

**If Context management:**

Present the context menu using AskUserQuestion:
- header: "Context"
- question: "What would you like to do with the codebase context?"
- options:
  - "Review" — Walk through a context file section by section
  - "Add" — Add new content to the codebase context
  - "Status" — Show context files dashboard with staleness info

Based on selection, delegate to the appropriate workflow:
- Review → @~/.claude/specdacular/workflows/context-review.md
- Add → @~/.claude/specdacular/workflows/context-add.md
- Status → @~/.claude/specdacular/workflows/context-status.md
</execution_context>

<context>
Task name: $ARGUMENTS (used for task operations only, ignored for context management)
</context>

<success_criteria>
- [ ] Category selected (task operations or context management)
- [ ] For task operations: task selected, operation menu shown, workflow dispatched
- [ ] For context management: context menu shown, workflow dispatched
</success_criteria>
