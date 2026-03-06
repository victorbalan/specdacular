# Decisions: fix-slowness

**Task:** fix-slowness
**Created:** 2026-03-06
**Last Updated:** 2026-03-06

---

## Active Decisions

### DEC-001: Use Node.js for utility script

**Date:** 2026-03-06
**Status:** Active
**Context:** Needed to choose a language for the utility script that offloads deterministic operations
**Decision:** Use Node.js (not Python)
**Rationale:**
- Stays zero-dependency — Node.js stdlib only
- Matches existing hooks pattern (`specd-check-update.js`, `specd-statusline.js`)
- Project is already Node.js based
**Implications:**
- Script goes in `hooks/specd-utils.js`
- Uses `fs`, `path`, `child_process` from stdlib
**References:**
- `@hooks/specd-check-update.js` — existing pattern to follow
- `@hooks/specd-statusline.js` — existing pattern to follow

### DEC-002: Include brain routing in the script

**Date:** 2026-03-06
**Status:** Active
**Context:** Brain routing reads 3 files and applies conditional logic to determine next step — could stay as Claude reasoning or be scripted
**Decision:** Include brain routing as a `route` subcommand in specd-utils.js
**Rationale:**
- Brain routing is a deterministic state machine (8 state combinations)
- Removes one of the most repeated reasoning tasks (runs every loop iteration)
- JSON output makes it easy for Claude to act on the result
**Implications:**
- `brain-routing.md` reference simplified to a single script call
- Script reads config.json, CONTEXT.md (gray areas count), checks file existence
**References:**
- `@specdacular/references/brain-routing.md`

### DEC-003: Lean context loading for execution mode

**Date:** 2026-03-06
**Status:** Active
**Context:** `load-context.md` dumps all docs (5,000-15,000+ lines) even during execute when most aren't needed for writing code
**Decision:** Add execution mode to load-context.md that skips CONTEXT.md, MAP.md, STRUCTURE.md, CONCERNS.md
**Rationale:**
- During execution, Claude follows the PLAN.md — it doesn't need discussion history or codebase structure docs
- Reduces context by ~3,000-10,000 lines per execute call
- PATTERNS.md kept because it has code examples to follow
**Implications:**
- `load-context.md` gets two modes: full (for discuss/research/plan) and execution (for execute/review)
- `execute.md` calls load-context in execution mode
**References:**
- `@specdacular/references/load-context.md`

### DEC-004: Single file with subcommands

**Date:** 2026-03-06
**Status:** Active
**Context:** Could organize as many small scripts or one CLI with subcommands
**Decision:** Single `specd-utils.js` file with subcommands
**Rationale:**
- Simpler installation (one file to copy)
- Shared helpers (JSON read/write, arg parsing, date formatting)
- Matches the pattern of having focused utility files in `hooks/`
**Implications:**
- All 13+ subcommands in one file
- Subcommand dispatch via `process.argv[2]`

---

## Superseded Decisions

---

## Revoked Decisions

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-03-06 | Use Node.js for utility script | Active |
| DEC-002 | 2026-03-06 | Include brain routing in the script | Active |
| DEC-003 | 2026-03-06 | Lean context loading for execution mode | Active |
| DEC-004 | 2026-03-06 | Single file with subcommands | Active |
