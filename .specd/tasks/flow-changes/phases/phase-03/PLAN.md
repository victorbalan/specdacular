---
task: flow-changes
phase: 3
depends_on: [1, 2]
creates:
  - commands/specd.research.md
  - commands/specd.plan.md
  - commands/specd.execute.md
modifies:
  - commands/specd.new.md
  - specdacular/workflows/new.md
  - commands/specd.toolbox.md
  - commands/specd.help.md
---

# Phase 3: Standalone Commands

## Objective

Extract toolbox operations into standalone `/specd.research`, `/specd.plan`, `/specd.execute` commands. Expand `/specd.new` to handle full inception flow. Update toolbox and help.

## Context

**Reference these files:**
- `@commands/specd.continue.md` — Pattern for command structure (YAML frontmatter + objective + execution_context + context)
- `@commands/specd.context.md` — Pattern for thin command wrapper (created in Phase 2)
- `@commands/specd.toolbox.md` — Current toolbox with operations to extract
- `@commands/specd.new.md` — Current new command to expand
- `@specdacular/workflows/new.md` — Current inception workflow
- `@specdacular/references/resolve-task.md` — Task resolution (created in Phase 1)
- `@specdacular/guardrails/specd-rules.txt` — Guardrails to inject (created in Phase 2)

**Relevant Decisions:**
- DEC-005: Command vocabulary — new/research/plan/execute as standalone commands
- DEC-006: Review is part of execute — execute command includes review workflow
- DEC-001: state.json for task resolution
- DEC-003: Context is read-only loader with guardrails

**Phase 1 outcomes:**
- resolve-task.md created — use for task resolution in all new commands
- state.json support — all commands should use resolve-task.md

**Phase 2 outcomes:**
- specd-rules.txt created — reference in commands that need guardrails
- commands/specd.context.md pattern — follow for thin wrappers

---

## Tasks

### Task 1: Create commands/specd.research.md

**Files:** `commands/specd.research.md`

**Action:**
Create a thin command wrapper for ad-hoc research. This lets users run `/specd.research` to spawn research agents for the current task without going through the full pipeline.

- YAML frontmatter: name, description, argument-hint, allowed-tools (Read, Write, Edit, Bash, Glob, Grep, Task, WebSearch, WebFetch)
- `<objective>`: Ad-hoc research command. Spawns parallel research agents for the current task's context. Can be used at any stage — during discussion, before planning, or during execution.
- `<execution_context>`: Reference resolve-task.md for task resolution, then delegate to `@~/.claude/specdacular/workflows/research.md`
- `<context>`: Reference resolve-task.md, research.md workflow
- Follow the pattern from specd.context.md / specd.continue.md

**Verify:**
```bash
[ -f "commands/specd.research.md" ] && grep -q "research.md" commands/specd.research.md && echo "OK"
```

**Done when:**
- [ ] Command file exists with proper YAML frontmatter
- [ ] Delegates to research.md workflow
- [ ] Uses resolve-task.md for task resolution

---

### Task 2: Create commands/specd.plan.md

**Files:** `commands/specd.plan.md`

**Action:**
Create a thin command wrapper for phase planning. Lets users run `/specd.plan` to create/review the roadmap or plan the current phase.

- YAML frontmatter: name, description, argument-hint, allowed-tools (Read, Write, Edit, Bash, Glob, Grep, Task, AskUserQuestion)
- `<objective>`: Phase planning command. If no roadmap exists, creates one (delegates to plan.md workflow). If roadmap exists and current phase needs planning, creates phase PLAN.md (delegates to phase-plan.md workflow).
- `<execution_context>`: Reference resolve-task.md, then check state to determine whether to call plan.md or phase-plan.md
- `<context>`: Reference resolve-task.md, plan.md, phase-plan.md workflows

**Verify:**
```bash
[ -f "commands/specd.plan.md" ] && grep -q "plan.md" commands/specd.plan.md && echo "OK"
```

**Done when:**
- [ ] Command file exists with proper YAML frontmatter
- [ ] Routes to plan.md (roadmap) or phase-plan.md (phase detail) based on state
- [ ] Uses resolve-task.md for task resolution

---

### Task 3: Create commands/specd.execute.md

**Files:** `commands/specd.execute.md`

**Action:**
Create a command wrapper for phase execution. Per DEC-006, this includes review after execution.

- YAML frontmatter: name, description, argument-hint, allowed-tools (Read, Write, Edit, Bash, Glob, Grep, Task, AskUserQuestion)
- `<objective>`: Execute the next phase for the current task. Implements the phase PLAN.md, then reviews the work. Combines execute.md + review.md workflows in sequence.
- `<execution_context>`: Reference resolve-task.md, then:
  1. Check that current phase has a PLAN.md (if not, suggest `/specd.plan` first)
  2. Execute: delegate to `@~/.claude/specdacular/workflows/execute.md`
  3. After execute completes, run review: delegate to `@~/.claude/specdacular/workflows/review.md`
  4. If review leads to revisions, delegate to `@~/.claude/specdacular/workflows/revise.md`
- `<context>`: Reference resolve-task.md, execute.md, review.md, revise.md workflows

**Verify:**
```bash
[ -f "commands/specd.execute.md" ] && grep -q "execute.md" commands/specd.execute.md && grep -q "review.md" commands/specd.execute.md && echo "OK"
```

**Done when:**
- [ ] Command file exists with proper YAML frontmatter
- [ ] Chains execute → review → (optional revise) workflows
- [ ] Uses resolve-task.md for task resolution

---

### Task 4: Update commands/specd.new.md and specdacular/workflows/new.md

**Files:** `commands/specd.new.md`, `specdacular/workflows/new.md`

**Action:**
Expand `/specd.new` to handle full inception: discuss → research → plan, iterating until phases are ready.

**commands/specd.new.md changes:**
- Update objective to mention full inception flow (discuss + research + produce phases)
- Add reference to guardrails file in context section
- Keep existing structure

**specdacular/workflows/new.md changes:**
- In the `continuation_offer` step, update the "Continue" option to offer research and planning as explicit choices, not just hand off to continue.md
- When user chooses to continue after discussion, offer:
  - "Research" — Run research agents
  - "Plan" — Create roadmap and phases
  - "Keep discussing" — More discussion
  - "Stop for now" — Come back later
- After research, offer to plan. After planning, signal completion.

This makes `/specd.new` a self-contained inception flow rather than just "init + punt to continue".

**Verify:**
```bash
grep -q "research" commands/specd.new.md && grep -q "guardrails" commands/specd.new.md && echo "command: OK"
grep -q "Research" specdacular/workflows/new.md && echo "workflow: OK"
```

**Done when:**
- [ ] specd.new.md mentions full inception flow
- [ ] new.md offers research/plan/discuss after initial discussion
- [ ] Guardrails referenced in command

---

### Task 5: Update commands/specd.toolbox.md and commands/specd.help.md

**Files:** `commands/specd.toolbox.md`, `commands/specd.help.md`

**Action:**

**specd.toolbox.md changes:**
- Remove Discuss, Research, Plan, Execute from the menu — these are now standalone commands
- Keep only advanced operations. Add menu items for:
  - "Insert phase" — Add a phase to the roadmap
  - "Skip phase" — Mark a phase as skipped
  - "Reset phase" — Re-run a completed phase
  - "View docs" — Browse task documentation
- Update objective to reflect "Advanced task operations"

**specd.help.md changes:**
- This command reads HELP.md, so update `specdacular/HELP.md` instead
- Add new commands to the Core Flow table: `/specd.research`, `/specd.plan`, `/specd.execute`, `/specd.context`
- Update the Quick Start section to show the new command vocabulary
- Update the Task Flow diagram

**Verify:**
```bash
grep -q "specd.research" specdacular/HELP.md && grep -q "specd.execute" specdacular/HELP.md && echo "help: OK"
grep -q "Insert phase" commands/specd.toolbox.md && echo "toolbox: OK"
```

**Done when:**
- [ ] Toolbox no longer shows Discuss/Research/Plan/Execute options
- [ ] Toolbox shows advanced operations only
- [ ] HELP.md lists all new commands
- [ ] Quick Start updated with new vocabulary

---

## Verification

After all tasks complete:

```bash
# New commands exist
[ -f "commands/specd.research.md" ] && echo "research cmd: OK"
[ -f "commands/specd.plan.md" ] && echo "plan cmd: OK"
[ -f "commands/specd.execute.md" ] && echo "execute cmd: OK"

# Commands reference correct workflows
grep -q "research.md" commands/specd.research.md && echo "research ref: OK"
grep -q "plan.md" commands/specd.plan.md && echo "plan ref: OK"
grep -q "execute.md" commands/specd.execute.md && echo "execute ref: OK"

# Help updated
grep -q "specd.research" specdacular/HELP.md && echo "help updated: OK"

# Toolbox stripped
grep -q "Insert phase" commands/specd.toolbox.md && echo "toolbox updated: OK"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] New commands delegate to correct workflows
- [ ] Toolbox retains only advanced operations
- [ ] HELP.md reflects new command vocabulary

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/flow-changes/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
