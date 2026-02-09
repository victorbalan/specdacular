# Decisions: phase-review

**Feature:** phase-review
**Created:** 2026-02-09
**Last Updated:** 2026-02-09

---

## Active Decisions

### DEC-001: Claude inspects first, then user weighs in

**Date:** 2026-02-09
**Status:** Active
**Context:** Needed to decide who drives the review — user telling Claude what's wrong, Claude inspecting automatically, or both
**Decision:** Both in sequence — Claude does automated inspection of plans vs actual code first, then asks the user for input on satisfaction and desired changes
**Rationale:**
- Claude can do the mechanical work (diff plans vs code) without the user having to remember every change
- But Claude can't know if the user is satisfied — that's subjective human judgment
- Sequential approach gives the user a starting point to react to rather than a blank prompt
**Implications:**
- Workflow needs to read plan files and inspect the code they reference
- Review output must be structured enough for user to quickly scan and respond
- Conversation phase needs to capture new decisions and deviations

---

### DEC-002: Command named `phase:review`

**Date:** 2026-02-09
**Status:** Active
**Context:** Initial name was "verify-phase" but that implies binary pass/fail
**Decision:** Name the command `/specd:phase:review` to match existing namespace pattern
**Rationale:**
- "Review" implies both inspection and conversation, which matches the feature's nature
- Consistent with `phase:prepare`, `phase:plan`, `phase:execute`
- "Verify" is too rigid — this is iterative refinement, not a gate check
**Implications:**
- Command file: `commands/specd/phase-review.md`
- Workflow file: `specdacular/workflows/review-phase.md`

---

## Superseded Decisions

---

## Revoked Decisions

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-09 | Claude inspects first, then user weighs in | Active |
| DEC-002 | 2026-02-09 | Command named phase:review | Active |
