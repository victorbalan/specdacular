---
name: specd:feature:toolbox
description: Advanced feature operations — discuss, research, plan, review, insert
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Menu of advanced feature operations. Presents options and dispatches to the appropriate workflow.

**Operations:**
- Discuss — Explore open questions (feature or phase level)
- Research — Spawn parallel research agents (feature or phase level)
- Plan — Create implementation plans (feature or phase level)
- Review — Review executed work, report issues, generate fix plans
- Insert phase — Add a new phase with decimal numbering
</objective>

<execution_context>
@~/.claude/specdacular/workflows/toolbox.md
</execution_context>

<context>
Feature name: $ARGUMENTS

**Delegates to workflows:**
@~/.claude/specdacular/workflows/discuss-feature.md
@~/.claude/specdacular/workflows/research-feature.md
@~/.claude/specdacular/workflows/plan-feature.md
@~/.claude/specdacular/workflows/review-feature.md
@~/.claude/specdacular/workflows/insert-phase.md
@~/.claude/specdacular/workflows/prepare-phase.md
@~/.claude/specdacular/workflows/plan-phase.md
</context>

<success_criteria>
- [ ] Feature selected (from argument or picker)
- [ ] Menu presented with all 5 operations
- [ ] Selected operation executed via correct workflow
- [ ] Scope selection works for discuss/research/plan
</success_criteria>
