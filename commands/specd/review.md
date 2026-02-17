---
name: specd:review
description: Review executed phase — inspect code, approve, or request fixes
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
Review an executed phase by comparing plan intent against actual code. Presents findings with git diff, user approves or requests revisions. Fix plans go in decimal phases.

**Flow:** Inspect code → Present findings → User decision → Approve or create fix plan
</objective>

<execution_context>
@~/.claude/specdacular/workflows/review.md
</execution_context>

<context>
Task name: $ARGUMENTS
</context>

<success_criteria>
- [ ] Code compared against plan intent
- [ ] Findings presented to user
- [ ] User approved or fix plan created
- [ ] State updated accordingly
</success_criteria>
