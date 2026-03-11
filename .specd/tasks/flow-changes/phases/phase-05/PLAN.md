---
task: flow-changes
phase: 5
depends_on: [1, 2, 3, 4]
creates: []
modifies:
  - specdacular/HELP.md
  - bin/install.js
---

# Phase 5: Install & Help Updates

## Objective

Wire RALPH loop documentation into HELP.md and update the installer's completion message to reflect the new command set. All files already install correctly — this phase is about documentation and polish.

## Context

**Reference these files:**
- `@specdacular/HELP.md` — Current help docs (missing RALPH section)
- `@bin/install.js` — Installer (already copies all commands, guardrails, ralph.js)
- `@bin/ralph.js` — RALPH loop script (created in phase 4)

**Relevant Decisions:**
- DEC-002: Keep /specd.continue as the pipeline command (RALPH is separate entry point)
- DEC-005: Command vocabulary — new/research/plan/execute
- DEC-006: Review is part of execute

**Previous phase outcomes:**
- Phase 1: state.json, resolve-task reference, commands updated with fallback
- Phase 2: guardrails template (`specdacular/guardrails/specd-rules.txt`), `/specd.context` command
- Phase 3: Standalone commands (`specd.research`, `specd.plan`, `specd.execute`), expanded `/specd.new`
- Phase 4: `bin/ralph.js` state-machine loop, ralph dispatch in install.js

**What's already working:**
- install.js copies all `specd.*.md` commands (iterates directory)
- install.js copies entire `specdacular/` dir (includes guardrails)
- install.js dispatches `ralph` subcommand
- `specd.update.md` re-runs full installer via `npx specdacular@latest`
- All new command files exist in `commands/`

---

## Tasks

### Task 1: Add RALPH section to HELP.md

**Files:** `specdacular/HELP.md`

**Action:**
Add a "RALPH — Autonomous Loop" section after "The Brain" section. Include:
- What RALPH is (autonomous task lifecycle runner)
- Usage: `npx specdacular ralph`
- How it works: reads state → spawns Claude CLI per step → checks results → loops
- Key features: guardrails injection, graceful Ctrl+C, process cleanup
- When to use RALPH vs `/specd.continue` (RALPH = fresh context per step, continue = single context)

Keep the section concise — match the style and density of "The Brain" section.

**Verify:**
```bash
grep -c "ralph" specdacular/HELP.md
```

**Done when:**
- [ ] HELP.md has a RALPH section explaining usage and when to use it
- [ ] Section style matches existing HELP.md sections

---

### Task 2: Update installer completion message

**Files:** `bin/install.js`

**Action:**
Update the completion message at the end of the `install()` function (the `console.log` block starting around line 472) to show the new primary workflow:

```
Done! Launch Claude Code and run /specd.help.

Quick start:
  /specd.new my-feature    Start a new task
  /specd.execute           Execute next phase
  /specd.continue          Full pipeline (one context)
  npx specdacular ralph    Autonomous loop (recommended)
  /specd.help              Show all commands
```

Replace the current 3-command list with this more complete set.

**Verify:**
```bash
grep -c "specd.new" bin/install.js
```

**Done when:**
- [ ] Completion message shows the new primary commands
- [ ] `npx specdacular ralph` is listed

---

### Task 3: Verify install handles all new files

**Files:** `bin/install.js`

**Action:**
Run a dry verification that the installer would handle all new artifacts:
1. Check that `commands/` contains all new command files: `specd.context.md`, `specd.research.md`, `specd.plan.md`, `specd.execute.md`
2. Check that `specdacular/guardrails/` exists with `specd-rules.txt`
3. Check that `bin/ralph.js` exists and is included in package.json `files`
4. Verify `specd.update.md` re-runs full installer (no changes needed — just confirm)

This is a verification-only task — if everything checks out, no code changes needed.

**Verify:**
```bash
ls commands/specd.context.md commands/specd.research.md commands/specd.plan.md commands/specd.execute.md specdacular/guardrails/specd-rules.txt bin/ralph.js 2>&1
```

**Done when:**
- [ ] All new command files exist in `commands/`
- [ ] Guardrails dir exists with specd-rules.txt
- [ ] ralph.js exists in bin/
- [ ] package.json `files` includes `bin` directory

---

## Verification

After all tasks complete:

```bash
# All new commands present
ls commands/specd.{context,research,plan,execute,new}.md

# Guardrails installed
ls specdacular/guardrails/specd-rules.txt

# RALPH documented
grep "ralph" specdacular/HELP.md

# Install message updated
grep "specd.new" bin/install.js

# ralph.js accessible
node -e "require('./bin/ralph.js')" 2>&1 | head -1
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/flow-changes/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
