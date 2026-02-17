---
feature: new-command-rearchitect
phase: 4
depends_on:
  - phase-03
creates:
  - commands/specd/new.md
  - commands/specd/continue.md
  - commands/specd/discuss.md
  - commands/specd/research.md
  - commands/specd/plan.md
  - commands/specd/execute.md
  - commands/specd/review.md
modifies:
  - commands/specd/help.md
  - commands/specd/status.md
  - commands/specd/toolbox.md
---

# Phase 4: Commands

## Objective

Create new command files with updated names, each pointing to its corresponding workflow. Update help, status, and toolbox commands.

## Context

**Reference these files:**
- `@commands/specd/map-codebase.md` — Pattern to follow for command file structure
- `@.specd/codebase/PATTERNS.md` — Command file structure pattern
- `@commands/specd/help.md` — Current help to update
- `@commands/specd/status.md` — Current status to update
- `@commands/specd/toolbox.md` — Current toolbox to update

**Relevant Decisions:**
- DEC-001: Commands become `/specd:new`, `/specd:continue`, etc.
- DEC-003: `continue` accepts `--semi-auto` and `--auto` flags

---

## Tasks

### Task 1: Create 7 new command files

**Files:** `commands/specd/new.md`, `commands/specd/continue.md`, `commands/specd/discuss.md`, `commands/specd/research.md`, `commands/specd/plan.md`, `commands/specd/execute.md`, `commands/specd/review.md`

**Action:**
Create each command as a thin wrapper following the pattern from `map-codebase.md`:

```yaml
---
name: specd:{command-name}
description: {Brief description}
argument-hint: "{task-name} [flags]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---
```

Each command has:
- `<objective>` — Brief description
- `<execution_context>` — `@~/.claude/specdacular/workflows/{command}.md`
- `<context>` — Variable passing (task name from $ARGUMENTS)
- `<process>` — Brief numbered summary
- `<success_criteria>` — Checklist

**Command specifics:**
- `new.md` — argument-hint: `"[task-name]"`, description: "Initialize a new task and start discussion"
- `continue.md` — argument-hint: `"[task-name] [--semi-auto|--auto]"`, description: "Continue task lifecycle"
- `discuss.md` — argument-hint: `"[task-name]"`, description: "Deepen task discussion"
- `research.md` — argument-hint: `"[task-name]"`, description: "Research implementation patterns"
- `plan.md` — argument-hint: `"[task-name]"`, description: "Create execution phases"
- `execute.md` — argument-hint: `"[task-name]"`, description: "Execute next phase"
- `review.md` — argument-hint: `"[task-name]"`, description: "Review executed phase"

**Verify:**
```bash
ls commands/specd/{new,continue,discuss,research,plan,execute,review}.md
```

**Done when:**
- [ ] All 7 command files exist
- [ ] Each references correct workflow via `@` path
- [ ] Frontmatter follows established pattern

---

### Task 2: Update help.md

**Files:** `commands/specd/help.md`

**Action:**
Update the help command to list new commands:
- Replace all `/specd:feature:*` references with `/specd:*`
- Remove phase-specific commands (discuss-phase, research-phase, etc.)
- Add `/specd:review` to the command list
- Update descriptions to match new command names
- Update the workflow diagram to show the simplified lifecycle

**Done when:**
- [ ] No references to old command names
- [ ] All 7 new commands listed
- [ ] Phase-specific commands removed

---

### Task 3: Update status.md

**Files:** `commands/specd/status.md`

**Action:**
Update to read from `.specd/tasks/` instead of `.specd/features/`:
- Change all path references
- Update command suggestions to use new names
- Reference `phases/phase-NN/PLAN.md` (single plan)

**Done when:**
- [ ] Reads from `.specd/tasks/`
- [ ] No references to old paths or commands

---

### Task 4: Update toolbox.md

**Files:** `commands/specd/toolbox.md`

**Action:**
Update toolbox to reference new commands:
- Remove phase-specific operations
- Update all command references to new names
- Simplify — fewer operations needed with unified commands

**Done when:**
- [ ] References new command names
- [ ] No phase-specific operations

---

## Verification

```bash
# All new commands exist
ls commands/specd/{new,continue,discuss,research,plan,execute,review}.md

# No old paths in new commands
grep -r "\.specd/features/" commands/specd/{new,continue,discuss,research,plan,execute,review,help,status,toolbox}.md && echo "FAIL" || echo "PASS"

# No old command names
grep -r "specd:feature:" commands/specd/{new,continue,discuss,research,plan,execute,review,help,status,toolbox}.md && echo "FAIL" || echo "PASS"
```

**Plan is complete when:**
- [ ] All 7 new command files exist with correct frontmatter
- [ ] help.md, status.md, toolbox.md updated
- [ ] Zero old path or command references
