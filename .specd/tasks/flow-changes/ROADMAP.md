# Roadmap: flow-changes

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 5 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [x] **Phase 1: State File & Task Resolution** — Add `.specd/state.json` and fallback task resolution to existing commands
- [ ] **Phase 2: Guardrails Template & Context Command** — Create behavioral guardrails file and `/specd.context` command
- [ ] **Phase 3: Standalone Commands** — Extract toolbox operations into `/specd.research`, `/specd.plan`, `/specd.execute`, expand `/specd.new`
- [ ] **Phase 4: RALPH Loop** — Build `bin/ralph.js` state-machine loop spawning Claude CLI per step
- [ ] **Phase 5: Install & Help Updates** — Wire new commands into installer, update help docs

---

## Phase Details

### Phase 1: State File & Task Resolution

**Goal:** Every specd command can determine the current task without explicit arguments.

**Creates:**
- `.specd/state.json` — `{"current_task": "task-name"}` committed file
- `specdacular/references/resolve-task.md` — Shared reference for task name resolution (argument → state.json → ask)

**Modifies:**
- `commands/specd.continue.md` — Add state.json fallback
- `commands/specd.toolbox.md` — Add state.json fallback
- `commands/specd.status.md` — Show current task from state.json
- `specdacular/workflows/new.md` — Write state.json when creating new task

**Success Criteria:**
1. `/specd.continue` without arguments picks up task from state.json
2. `/specd.new my-task` writes state.json with `{"current_task": "my-task"}`
3. state.json is committed to git (not gitignored)

**Dependencies:** None (first phase)

---

### Phase 2: Guardrails Template & Context Command

**Goal:** A `/specd.context` command that loads task state and injects behavioral rules, plus the guardrails template used by both the command and the RALPH loop.

**Creates:**
- `specdacular/guardrails/specd-rules.txt` — Behavioral guardrails (<60 lines): file conventions, auto-commit, state management, direction-change detection
- `commands/specd.context.md` — Thin command wrapper
- `specdacular/workflows/context.md` — Read-only context loader: reads all task docs, displays summary, injects guardrails

**Success Criteria:**
1. `/specd.context` displays task summary (stage, decisions, gray areas, current phase)
2. After running `/specd.context`, Claude follows specd file conventions for the remainder of the session
3. Guardrails file is under 60 lines with 2-3 IMPORTANT rules max
4. Direction-change detection rule is included

**Dependencies:** Phase 1 (needs state.json for task resolution)

---

### Phase 3: Standalone Commands

**Goal:** Toolbox operations become standalone slash commands. `/specd.new` expanded to full inception flow.

**Creates:**
- `commands/specd.research.md` — Ad-hoc research command (thin wrapper)
- `commands/specd.plan.md` — Phase planning command (thin wrapper, delegates to existing plan.md workflow)
- `commands/specd.execute.md` — Phase execution command (thin wrapper, delegates to execute.md + review.md workflows)

**Modifies:**
- `commands/specd.new.md` — Expand to handle full inception (discuss + research + phases)
- `specdacular/workflows/new.md` — Expanded inception workflow: iterates discuss/research until ready, then produces phases
- `commands/specd.toolbox.md` — Remove extracted operations, keep only advanced ops (insert-phase, etc.)
- `commands/specd.help.md` — Add new commands to help output

**Success Criteria:**
1. `/specd.research` spawns research agents for current task
2. `/specd.plan` creates roadmap for current task
3. `/specd.execute` runs next phase (implement + review) for current task
4. `/specd.new task-name` drives full inception flow through to phases
5. All commands use state.json fallback for task resolution
6. All commands inject guardrails via context reference

**Dependencies:** Phase 1 (state.json), Phase 2 (guardrails + context)

---

### Phase 4: RALPH Loop

**Goal:** A Node.js script that drives the full task lifecycle by spawning fresh Claude CLI instances per step.

**Creates:**
- `bin/ralph.js` — State-machine loop: read state → determine step → spawn `claude -p` → check results → loop
- Includes: `runClaudeStep()` spawning with `stdio: ['inherit', 'pipe', 'pipe']`, `--append-system-prompt-file`, `--output-format json`
- Includes: pre-flight check for `--dangerously-skip-permissions`, process group cleanup, SIGINT handling
- Includes: atomic state writes (temp file + rename)

**Modifies:**
- `bin/install.js` — Add `ralph` subcommand dispatch: `if (args[0] === 'ralph') require('./ralph.js')`

**Success Criteria:**
1. `npx specdacular ralph` starts the loop for the current task
2. Each step spawns a fresh Claude instance with guardrails injected
3. Loop reads state after each step and routes to the next
4. Ctrl+C gracefully stops with state saved
5. Non-zero exit codes from Claude are handled (retry or stop)
6. Process group cleanup prevents orphaned Claude processes

**Dependencies:** Phase 1 (state.json), Phase 2 (guardrails file), Phase 3 (commands that RALPH prompts reference)

---

### Phase 5: Install & Help Updates

**Goal:** New commands and RALPH script are properly installed and documented.

**Modifies:**
- `bin/install.js` — Copy new command files (specd.context, specd.research, specd.plan, specd.execute), guardrails dir, ralph.js
- `commands/specd.help.md` — Full command list with new commands and RALPH usage
- `commands/specd.update.md` — Ensure update handles new files

**Success Criteria:**
1. `npx specdacular` installs all new commands to `~/.claude/commands/`
2. `npx specdacular ralph` is accessible after install
3. `/specd.help` shows updated command list with descriptions
4. Guardrails file installed to `~/.claude/specdacular/guardrails/`

**Dependencies:** All previous phases

---

## Execution Order

```
Phase 1: State File & Task Resolution
    ↓
Phase 2: Guardrails Template & Context Command
    ↓
Phase 3: Standalone Commands
    ↓
Phase 4: RALPH Loop
    ↓
Phase 5: Install & Help Updates
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Committed state.json | Phase 1 — no gitignore, commit state.json |
| DEC-002: Keep /specd.continue | No rename needed — pipeline stays as-is |
| DEC-003: Context is read-only | Phase 2 — context command loads + displays, no editing |
| DEC-004: Steering as guardrail | Phase 2 — direction-change rule in guardrails template |
| DEC-005: Command vocabulary | Phase 3 — new/research/plan/execute as standalone commands |
| DEC-006: Review in execute | Phase 3 — execute command includes review workflow |
