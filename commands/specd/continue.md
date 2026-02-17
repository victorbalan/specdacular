---
name: specd:continue
description: Continue task lifecycle — picks up where you left off
argument-hint: "[task-name] [--semi-auto|--auto]"
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
Smart state machine that reads current task state and drives the entire lifecycle. One command from discussion through execution and review.

**Modes:**
- **Default (interactive):** Prompts at each stage transition
- **--semi-auto:** Auto-runs discuss→research→plan, pauses after each phase execution + review
- **--auto:** Runs everything, only stops on review issues or task completion

**How it works:**
1. Select task (from argument or picker)
2. Read current state
3. Determine natural next step
4. Execute it (delegating to workflows)
5. Loop back — offer the next step or stop

**Covers the full lifecycle:**
- Discussion → Research → Planning → Execution → Review → Next phase
</objective>

<execution_context>
@~/.claude/specdacular/workflows/continue.md
</execution_context>

<context>
Task name and flags: $ARGUMENTS

**Scans for tasks:**
@.specd/tasks/*/config.json

**Delegates to workflows:**
@~/.claude/specdacular/workflows/discuss.md
@~/.claude/specdacular/workflows/research.md
@~/.claude/specdacular/workflows/plan.md
@~/.claude/specdacular/workflows/execute.md
@~/.claude/specdacular/workflows/review.md
</context>

<success_criteria>
- [ ] Task selected (from argument or picker)
- [ ] Current state accurately assessed
- [ ] Correct next action offered/executed
- [ ] Mode flags (--semi-auto, --auto) respected
- [ ] User can stop at any natural boundary
</success_criteria>
