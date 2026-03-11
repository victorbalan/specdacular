# Decisions: flow-changes

**Task:** flow-changes
**Created:** 2026-03-11
**Last Updated:** 2026-03-11

---

## Active Decisions

### DEC-001: Minimal local state file

**Date:** 2026-03-11
**Status:** Active
**Context:** Commands currently require explicit task name arguments. Developer needs to remember which task they're working on.
**Decision:** Create `.specd/state.local.json` with minimal content: `{"current_task": "task-name"}` only. No phase tracking, no command history.
**Rationale:**
- Task-level state already lives in `config.json` and `STATE.md` — no need to duplicate
- Minimal surface area means fewer things to keep in sync
- Single responsibility: just answers "what am I working on?"
**Implications:**
- All commands that accept task name must add fallback to read from `state.local.json`
- File must be added to `.gitignore` (local per-developer)
- `/specd.new` should set current_task when creating a new task
**References:**
- `@commands/specd.continue.md` — Primary consumer

### DEC-002: Keep pipeline as renamed command

**Date:** 2026-03-11
**Status:** Active
**Context:** The existing `/specd.continue` pipeline drives the whole lifecycle in one context window. RALPH loop replaces this as primary flow.
**Decision:** Rename the pipeline to `/specd.auto` or `/specd.brain` (name TBD). Keep it functional for users who prefer all-in-one execution.
**Rationale:**
- Backward compatibility for existing users
- Some tasks may benefit from single-context execution
- Low maintenance cost to keep it alongside new commands
**Implications:**
- `/specd.continue` name freed up for potential reuse or becomes alias
- Need to update help docs and command list
- RALPH loop becomes the recommended primary flow

### DEC-003: Context command as mode setter

**Date:** 2026-03-11
**Status:** Active
**Context:** Claude drifts from specd conventions mid-conversation — writes its own files, skips auto-commit, doesn't follow state management patterns.
**Decision:** Create `/specd.context` that loads task context AND injects behavioral guardrails. Re-runnable mid-conversation to reset Claude's behavior.
**Rationale:**
- Context alone isn't enough — Claude needs explicit rules to stay on-rails
- Re-injectability handles drift without restarting conversation
- In RALPH loop, this gets injected automatically at each step start
**Implications:**
- Need a guardrails template with specific behavioral rules
- RALPH loop must include context injection in every step
- Rules must cover: file conventions, auto-commit, state management, specd tool usage

---

## Superseded Decisions

---

## Revoked Decisions

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-03-11 | Minimal local state file | Active |
| DEC-002 | 2026-03-11 | Keep pipeline as renamed command | Active |
| DEC-003 | 2026-03-11 | Context command as mode setter | Active |
