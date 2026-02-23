---
name: specd.codebase.review
description: "Review and edit codebase context files section by section"
argument-hint: ""
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
Walk through and review a codebase context file (.specd/codebase/*.md) section by section. Confirm, edit, remove, or re-map individual sections.

Output: Updated context file with reviewed/edited sections and updated timestamps.
</objective>

<execution_context>
Follow the context-manual-review workflow:
@~/.claude/specdacular/workflows/context-manual-review.md
</execution_context>

<context>
**Context workflows:**
@~/.claude/specdacular/workflows/context-manual-review.md
@~/.claude/specdacular/workflows/context-add.md
</context>

<success_criteria>
- [ ] User selects a context file to review
- [ ] Section list shown with tag status
- [ ] User can confirm, edit, remove, or re-map each section
- [ ] Timestamps updated after review
- [ ] Changes committed
</success_criteria>
