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
- Existing commits in workflows widen their file scope to include STATE.md + config.json
- No additional commits needed — state piggybacks on existing commit points
- Must respect `auto_commit_docs` setting at each commit point
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

### DEC-003: Bundle State Saves Into Existing Commits

**Date:** 2026-03-04
**Status:** Active
**Context:** Incremental state saves could mean extra commits cluttering git history, or they could piggyback on commits already happening.
**Decision:** Include STATE.md and config.json in the commits that workflows already make (e.g., discuss commits CONTEXT.md + DECISIONS.md → add STATE.md + config.json to that same commit). No separate state-only commits.
**Rationale:**
- No extra commit noise in git history
- State is always consistent with the work it describes
- Simpler implementation — just widen `git add` scope
**Implications:**
- Each workflow's commit step needs to add STATE.md + config.json to its file list
- Commit messages stay as-is (they already describe the work done)

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
| DEC-003 | 2026-03-04 | Bundle state saves into existing commits | Active |
