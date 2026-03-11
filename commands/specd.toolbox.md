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
  - AskUserQuestion
---

<objective>
Advanced task operations that aren't part of the regular workflow. For standard operations, use the standalone commands: `/specd.new`, `/specd.research`, `/specd.plan`, `/specd.execute`, `/specd.context`.
</objective>

<execution_context>
**Resolve task name:**
@~/.claude/specdacular/references/resolve-task.md

Resolve task name from $ARGUMENTS (falls back to `.specd/state.json`, then single-task auto-pick, then asks user).

**Validate task:**
@~/.claude/specdacular/references/validate-task.md

Then present the menu using AskUserQuestion:
- header: "Advanced Operations"
- question: "What would you like to do with {task-name}?"
- options:
  - "Insert phase" — Add a new phase to the roadmap at a specific position
  - "Skip phase" — Mark the current or specified phase as skipped
  - "Reset phase" — Re-run a completed phase from scratch
  - "View docs" — Browse task documentation (FEATURE, CONTEXT, DECISIONS, ROADMAP)
  - "Discuss" — Explore gray areas and record decisions

Based on selection:

**Insert phase:**
- Ask what the phase should accomplish
- Ask where to insert (after which phase)
- Create the phase directory and update ROADMAP.md
- Renumber subsequent phases if needed

**Skip phase:**
- Confirm which phase to skip
- Mark as skipped in config.json and STATE.md
- Advance to next phase

**Reset phase:**
- Confirm which phase to reset
- Remove phase execution artifacts (keep PLAN.md)
- Set phase status back to "pending"
- Reset phase_start_commit

**View docs:**
- Show a file picker for task documents
- Display the selected file

**Discuss:**
- Delegate to @~/.claude/specdacular/workflows/discuss.md

</execution_context>

<context>
Arguments: $ARGUMENTS

@~/.claude/specdacular/workflows/discuss.md
</context>

<success_criteria>
- [ ] Task validated and operation menu shown
- [ ] Selected operation executed
</success_criteria>
