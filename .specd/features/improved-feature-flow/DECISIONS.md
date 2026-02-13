# Decisions: improved-feature-flow

**Feature:** improved-feature-flow
**Created:** 2026-02-13
**Last Updated:** 2026-02-13

---

## Active Decisions

### DEC-001: Group advanced operations under toolbox command

**Date:** 2026-02-13
**Status:** Active
**Context:** Users face ~15 commands in autocomplete. Need to reduce to ~7 while keeping all functionality accessible.
**Decision:** Create a single `/specd:feature:toolbox` command that presents a menu (via AskUserQuestion) with options: discuss, research, plan, review, insert. Each option dispatches to the corresponding workflow.
**Rationale:**
- Single command file = one autocomplete entry instead of five
- Menu gives descriptions of what each option does
- Workflows stay unchanged — only the entry point changes
**Implications:**
- Remove command files: `discuss-feature.md`, `research-feature.md`, `plan-feature.md`
- Keep workflow files: `discuss-feature.md`, `research-feature.md`, `plan-feature.md` in `specdacular/workflows/`
- New files: `commands/specd/toolbox.md`, `specdacular/workflows/toolbox.md`

---

### DEC-002: Remove all standalone phase commands

**Date:** 2026-02-13
**Status:** Active
**Context:** Phase commands (`phase:insert`, `phase:renumber`, `phase:review`, `phase:research`, `phase:prepare`, `phase:plan`, `phase:execute`) add clutter and are better accessed through the flow.
**Decision:** Delete all `commands/specd/*-phase.md` command files. Absorb their functionality into `continue` flow and `toolbox` menu.
**Rationale:**
- Phase operations are contextual — they only make sense at certain stages
- `continue` already routes to the right operation based on state
- Insert and review are useful as manual operations → available via toolbox
- Renumber is mechanical → happens automatically on insert
**Implications:**
- Delete 7 command files from `commands/specd/`
- Update `bin/install.js` to not install these files
- Keep workflow files that are still needed

---

### DEC-003: Review is user-guided, not auto-fix

**Date:** 2026-02-13
**Status:** Active
**Context:** Current review behavior goes into the code and attempts auto-fixes. User wants to drive the review — they look at the code, report issues, and the agent generates fix plans.
**Decision:** Review workflow shows a summary of what was implemented, then enters a conversation where the user provides feedback. That feedback gets turned into new fix plans.
**Rationale:**
- User has better judgment about code quality and correctness
- Auto-fix can introduce new issues
- User-guided review builds trust and keeps human in the loop
**Implications:**
- New workflow: `specdacular/workflows/review-feature.md`
- `continue` adds review checkpoint after phase execution
- Review output: fix plans (same format as regular plans)

---

### DEC-004: Rename `next` to `continue`

**Date:** 2026-02-13
**Status:** Active
**Context:** Naming choice for the main flow driver command.
**Decision:** Use `continue` instead of `next`. Command becomes `/specd:feature:continue`.
**Rationale:**
- "Continue where you left off" reads naturally
- More descriptive of what the command does
**Implications:**
- Rename `commands/specd/next-feature.md` → `commands/specd/continue-feature.md`
- Rename/refactor `specdacular/workflows/next-feature.md` → `specdacular/workflows/continue-feature.md`
- Update all references in templates, help, other workflows

---

### DEC-005: Autocomplete shows exactly 7 entries

**Date:** 2026-02-13
**Status:** Active
**Context:** Claude Code shows one autocomplete entry per command file in `commands/specd/`.
**Decision:** Command directory contains exactly 7 files: `new-feature.md`, `continue-feature.md`, `toolbox.md`, `map-codebase.md`, `status.md`, `help.md`, `update.md`.
**Rationale:**
- Minimal cognitive load for users
- All functionality still accessible via toolbox or continue
- Clean, scannable list
**Implications:**
- Delete all other command files from `commands/specd/`
- Toolbox dispatches to workflows without needing command stubs

---

## Superseded Decisions

_(none)_

---

## Revoked Decisions

_(none)_

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-13 | Group advanced operations under toolbox command | Active |
| DEC-002 | 2026-02-13 | Remove all standalone phase commands | Active |
| DEC-003 | 2026-02-13 | Review is user-guided, not auto-fix | Active |
| DEC-004 | 2026-02-13 | Rename next to continue | Active |
| DEC-005 | 2026-02-13 | Autocomplete shows exactly 7 entries | Active |
