# Decisions: rm-keep-discussing

**Task:** rm-keep-discussing
**Created:** 2026-03-04
**Last Updated:** 2026-03-04

---

## Active Decisions

### DEC-001: Incremental State Saves After Every Step

**Date:** 2026-03-04
**Status:** Active
**Context:** Workflows currently batch state updates (STATE.md, config.json) at exit time. If the user closes the terminal mid-workflow, progress is lost.
**Decision:** Every workflow step that produces meaningful progress must commit STATE.md and config.json immediately after completing.
**Rationale:**
- Users should be able to close the terminal at any time without data loss
- `/specd.continue` already reads state to determine next step — incremental saves make this reliable
**Implications:**
- All workflow files need additional commit points within their step sequences
- Must respect `auto_commit_docs` setting at each commit point
- More git commits in history (small state-update commits)
**References:**
- `@specdacular/references/commit-docs.md`

### DEC-002: Remove All "Keep Discussing / Stop for Now" Prompts

**Date:** 2026-03-04
**Status:** Active
**Context:** "Keep discussing / stop for now" prompts in `new.md`, `orchestrator/new.md`, `review.md`, and `brain.md` serve partly as state-save triggers. With incremental saves, they're unnecessary.
**Decision:** Remove all such prompts. Workflows should flow forward automatically. Users close the terminal to stop.
**Rationale:**
- Reduces friction — no more "do you want to continue?" interruptions
- State is always current, so no special exit action needed
- Existing mode-based pauses (--auto/--semi-auto/--interactive) handle stage-boundary confirmations
**Implications:**
- `new.md`: Remove `continuation_offer` step, flow directly after init
- `orchestrator/new.md`: Same
- `review.md`: Remove "Stop for now" option from user choices
- `brain.md`: Remove "Stop for now" exit paths
**References:**
- `@specdacular/workflows/new.md` (lines 246-285)
- `@specdacular/workflows/orchestrator/new.md`
- `@specdacular/workflows/review.md`
- `@specdacular/workflows/brain.md`

---

## Superseded Decisions

---

## Revoked Decisions

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-03-04 | Incremental state saves after every step | Active |
| DEC-002 | 2026-03-04 | Remove all "keep discussing / stop for now" prompts | Active |
