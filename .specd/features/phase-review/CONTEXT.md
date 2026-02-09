# Context: phase-review

**Last Updated:** 2026-02-09
**Sessions:** 1

## Discussion Summary

Discussed the need for a post-execution review step in the feature flow. The user identified that after executing plans, they make modifications and decisions that go unrecorded. The current flow is linear (plan → execute → done) but reality requires iteration. We agreed on a review command that has Claude inspect code against plans first, then asks the user for input, and can generate corrective plans to feed back into execution.

---

## Resolved Questions

### What is the review flow?

**Question:** Should the review be user-driven, Claude-driven, or both?

**Resolution:** Both, in sequence. Claude inspects first (mechanical comparison of plans vs actual code), then the user weighs in on satisfaction and desired changes.

**Details:**
- Claude reads executed plans and the actual code they touched
- Claude presents what matched, what diverged, what looks incomplete
- User reacts — confirms, flags additional issues, or requests rework
- If issues exist → corrective plans generated → execute → review again
- If clean → phase marked truly complete

**Related Decisions:** DEC-001

---

### What should the command be named?

**Question:** "verify-phase" vs other naming options

**Resolution:** `phase:review` — it's a review, not a pass/fail test. Fits the existing namespace pattern.

**Details:**
- Consistent with `phase:prepare`, `phase:plan`, `phase:execute`
- "Review" implies both inspection and conversation
- "Verify" implies binary pass/fail which is too rigid

**Related Decisions:** DEC-002

---

## Deferred Questions

### Corrective plan numbering

**Reason:** Need to see existing plan structure to decide how corrective plans are numbered/named
**Default for now:** Append to existing phase plan set with incremented numbers
**Revisit when:** During research or planning phase

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-09 | Core concept, review flow, naming, integration with execute loop | Feature initialized, 2 decisions, 1 gray area deferred |

---

## Gray Areas Remaining

- [ ] How corrective plans are numbered and named — Append to phase or create sub-numbering?
- [ ] How STATE.md tracks review cycles — New section or extend existing execution progress?
- [ ] What the review output format looks like — Table, narrative, checklist?
- [ ] How to handle partial phase execution — Review after some plans but not all?

---

## Quick Reference

- **Feature:** `.specd/features/phase-review/FEATURE.md`
- **Decisions:** `.specd/features/phase-review/DECISIONS.md`
- **Research:** `.specd/features/phase-review/RESEARCH.md` (if exists)
