# Context: phase-review

**Last Updated:** 2026-02-09
**Sessions:** 2

## Discussion Summary

Discussed the need for a post-execution review step in the feature flow. The user identified that after executing plans, they make modifications and decisions that go unrecorded. The current flow is linear (plan → execute → done) but reality requires iteration. We agreed on a review command that has Claude inspect code against plans first, then asks the user for input, and can generate corrective plans to feed back into execution.

Session 2 resolved all remaining gray areas: corrective plan numbering (continue sequence with `corrects` frontmatter), STATE.md tracking (new Review Cycles section), review output format (per-plan status table + expanded details + user input), and partial execution support (review only completed plans).

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

### How should corrective plans be numbered?

**Question:** Should corrective plans use sub-numbering (03.1), suffix naming (03-FIX), or continue the sequence?

**Resolution:** Continue the existing numbering sequence with a `corrects` field in YAML frontmatter for traceability.

**Details:**
- Corrective plans get the next number in sequence (e.g., 04-PLAN.md after 01, 02, 03)
- YAML frontmatter includes `corrects: [01, 03]` to link back to original plans
- Execute-plan works as-is — no changes needed since it finds "first incomplete plan"

**Related Decisions:** DEC-003

---

### How should STATE.md track review cycles?

**Question:** Add a column to Plan Status table, or create a new section?

**Resolution:** New "Review Cycles" section in STATE.md with per-cycle tracking.

**Details:**
- Table tracks: phase, cycle number, date, findings count, corrective plans generated, status
- Status values: `clean` or `fixes-pending`
- Phase completion requires last review cycle status = `clean`
- Separate from Plan Status table to keep concerns isolated

**Related Decisions:** DEC-004

---

### What should the review output format look like?

**Question:** Table, narrative, checklist, or hybrid?

**Resolution:** Per-plan status table + expanded detail sections for deviations/issues + user input phase.

**Details:**
- Status table uses icons: ✅ Match, ⚠️ Deviation, ❌ Incomplete
- Deviations section shows planned vs actual with impact assessment
- Issues section shows what's missing with file references
- After presenting, ask user for additional flags or confirmation
- User conversation captures new decisions and additional issues

**Related Decisions:** DEC-005

---

### Can you review a phase with partial execution?

**Question:** Must all plans be executed before review, or can you review mid-phase?

**Resolution:** Support partial review — only inspect plans with status `Complete` in STATE.md.

**Details:**
- Unexecuted plans shown in table as "Not yet executed" but not treated as issues
- Review cycle status is relative to executed plans only
- Enables early sanity-checking before committing to remaining plans
- Execute → review loop works naturally with partial execution

**Related Decisions:** DEC-006

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-09 | Core concept, review flow, naming, integration with execute loop | Feature initialized, 2 decisions, 1 gray area deferred |
| 2026-02-09 | Corrective plans, STATE tracking, output format, partial review | All 4 gray areas resolved, 4 new decisions |

---

## Gray Areas Remaining

None — all gray areas resolved.

---

## Quick Reference

- **Feature:** `.specd/features/phase-review/FEATURE.md`
- **Decisions:** `.specd/features/phase-review/DECISIONS.md`
- **Research:** `.specd/features/phase-review/RESEARCH.md` (if exists)
