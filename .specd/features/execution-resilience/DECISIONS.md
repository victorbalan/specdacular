# Decisions: execution-resilience

**Feature:** execution-resilience
**Created:** 2026-02-06
**Last Updated:** 2026-02-06

---

## Active Decisions

### DEC-001: Git tags for phase rollback points

**Date:** 2026-02-06
**Status:** Active
**Phase:** 0
**Context:** Execution commits after each task but has no way to revert to pre-phase state if things go wrong.
**Decision:** Create git tags at phase boundaries: `specd/{feature}/phase-{N}/start` before execution and `specd/{feature}/phase-{N}/done` after success.
**Rationale:**
- Git tags are lightweight and native
- Clean rollback: `git reset --hard specd/{feature}/phase-{N}/start`
- No custom tooling needed
- Tags serve as documentation of execution history
**Implications:**
- `execute-plan.md` must create start tag before first task
- `execute-plan.md` must create done tag after last task verification passes
- Rollback command uses these tags as reset targets
- Tag naming convention must be documented and consistent

---

### DEC-002: Plans survive rollback

**Date:** 2026-02-06
**Status:** Active
**Phase:** 0
**Context:** When rolling back a failed phase, need to decide what gets reset vs preserved.
**Decision:** Rollback resets only execution artifacts (code changes, CHANGELOG entries). Plans, decisions, research, and roadmap are preserved.
**Rationale:**
- Plans are usually correct — execution is what failed
- Re-planning is expensive and usually unnecessary
- Users may want to fix the plan slightly and re-execute, not start over
- Decisions and research are independent of execution
**Implications:**
- Rollback workflow must selectively reset STATE.md (execution progress only)
- `.specd/features/` files in git may need to be explicitly restored after reset
- CHANGELOG.md entries from the rolled-back phase are removed

---

### DEC-003: Structured diagnostics replace vague retry/skip/stop

**Date:** 2026-02-06
**Status:** Active
**Phase:** 0
**Context:** When verification fails during execution, current guidance is "ask user: retry/skip/stop" which doesn't help identify the problem.
**Decision:** Replace with structured diagnostic output: files modified, test output, likely cause, actionable suggestion.
**Rationale:**
- Diagnostics help both Claude and the user understand what went wrong
- "Likely cause" leverages Claude's analysis ability
- Actionable suggestions reduce manual debugging
- Still presents options (fix and retry / skip / stop) but with context
**Implications:**
- execute-plan.md must include diagnostic template for verification failures
- Diagnostics capture: files modified in current task, verification command output, analysis of failure
- Suggestion should reference plan context (e.g., "dependency created in next task")

---

## Superseded Decisions

(none)

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-06 | Git tags for phase rollback points | Active |
| DEC-002 | 2026-02-06 | Plans survive rollback | Active |
| DEC-003 | 2026-02-06 | Structured diagnostics replace vague retry/skip/stop | Active |
