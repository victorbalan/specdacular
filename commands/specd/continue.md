---
name: specd:continue
description: Continue task lifecycle — picks up where you left off
argument-hint: "[task-name] [--auto]"
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
Config-driven orchestrator that reads pipeline.json and drives the entire task lifecycle. One command from discussion through execution and review.

**Modes:**
- **Default:** Auto-runs steps, pauses where `pause: true`
- **--auto:** Runs everything, only stops on errors or task completion

**How it works:**
1. Select task (from argument or picker)
2. Load pipeline.json (user override or default)
3. Read current state → determine next step
4. Execute pre-hooks → step → post-hooks
5. Update state → loop back or stop

**Pipeline customization:**
- Place `.specd/pipeline.json` to fully replace the default pipeline
- Swap any step's workflow to a custom `.md` file
- Add pre/post hooks (markdown workflow files)
</objective>

<execution_context>
@~/.claude/specdacular/workflows/continue.md
</execution_context>

<context>
Task name and flags: $ARGUMENTS

**Pipeline config:**
@.specd/pipeline.json (user override, if exists)
@~/.claude/specdacular/pipeline.json (default)

**Scans for tasks:**
@.specd/tasks/*/config.json

**Delegates to brain which dispatches:**
@~/.claude/specdacular/workflows/discuss.md
@~/.claude/specdacular/workflows/research.md
@~/.claude/specdacular/workflows/plan.md
@~/.claude/specdacular/workflows/execute.md
@~/.claude/specdacular/workflows/review.md
@~/.claude/specdacular/workflows/revise.md
</context>

<success_criteria>
- [ ] Task selected (from argument or picker)
- [ ] Pipeline loaded and validated
- [ ] Current state accurately assessed
- [ ] Correct next step dispatched with hooks
- [ ] Mode flag (--auto) respected
- [ ] User can stop at any natural boundary
</success_criteria>
