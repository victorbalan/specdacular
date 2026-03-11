# Task: flow-changes

## What This Is

Rework the specdacular developer flow: add local task state tracking, extract toolbox commands into standalone slash commands, introduce a `/specd.context` command for context+rules injection, and build a RALPH loop (`npx specdacular ralph`) that drives step-by-step execution with fresh Claude contexts.

## Technical Requirements

### Must Create

- [ ] `.specd/state.json` — Committed state file tracking current task (`{"current_task": "task-name"}`)
- [ ] `commands/specd.context.md` — Read-only slash command that loads task context + injects behavioral guardrails
- [ ] `specdacular/workflows/context.md` — Implementation for `/specd.context`
- [ ] `commands/specd.research.md` — Ad-hoc research command in current task context
- [ ] `commands/specd.plan.md` — Phase planning command
- [ ] `commands/specd.execute.md` — Phase execution command
- [ ] `bin/ralph.js` or equivalent — RALPH loop script, invokable via `npx specdacular ralph`
- [ ] Behavioral guardrails template — Rules including: file conventions, auto-commit, state management, direction-change detection
- [ ] Updated `/specd.new` — Expanded to handle full inception (discuss + research + phases)

### Must Integrate With

- `commands/specd.continue.md` — Falls back to `state.local.json` when no task name argument given
- `commands/specd.toolbox.md` — Commands extracted from here become standalone; toolbox may keep advanced ops
- `specdacular/workflows/continue.md` — Pipeline logic, potentially renamed to `/specd.auto` or `/specd.brain`
- `bin/install.js` — Must install new commands, RALPH script, and gitignore setup
- All existing commands that accept task name — Should check `state.local.json` as fallback

### Constraints

- Zero dependencies — RALPH loop must use Node.js stdlib only (consistent with project convention)
- Backward compatible — Existing `/specd.continue` pipeline must survive as `/specd.auto` or similar
- `.specd/state.json` is committed — Travels with branches, merge conflicts accepted for now
- Commands must be self-contained — Each does one step, writes state, exits cleanly for RALPH loop compatibility
- Context guardrails must be re-injectable — User can run `/specd.context` mid-conversation to reset Claude's behavior
- Guardrails must detect direction changes — Prompt user to update specs/decisions/roadmap when steering

---

## Success Criteria

- [ ] Running `/specd.continue` without arguments picks up the current task from `state.local.json`
- [ ] `/specd.context` loads full task context and injects behavioral rules into the conversation
- [ ] Each standalone command completes one logical step and updates `.specd/tasks/` state files
- [ ] `npx specdacular ralph` drives a full task lifecycle step-by-step with fresh Claude instances
- [ ] Existing pipeline users can still use `/specd.auto` (or equivalent) for all-in-one flow

---

## Out of Scope

- [X] Rewriting workflow internals — Focus is on command surface and execution model, not changing what each step does
- [X] Multi-task support in `state.local.json` — Just current task, not a task stack
- [X] GUI or TUI for RALPH loop — CLI only for now

---

## Initial Context

### User Need
Developer forgets task names, wastes time passing arguments. Pipeline eats too much context in a single session. Claude drifts from specd conventions mid-conversation. Need granular control over the development flow.

### Integration Points
- All existing slash commands that accept task name arguments
- Toolbox commands that should become standalone
- `bin/install.js` for installing new commands and RALPH script
- `.gitignore` handling for local state

### Key Constraints
- Command vocabulary needs research — not a 1:1 mirror of workflow stages, should be "developer-natural"
- RALPH loop is the primary execution model going forward; pipeline becomes secondary
- Context guardrails are critical for Claude compliance — must enforce specd file conventions, auto-commit behavior, and state management
