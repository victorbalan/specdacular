# Phase 2 Context: Review + State Machine

**Feature:** improved-feature-flow
**Phase:** 2
**Prepared:** 2026-02-13

---

## Phase Goal

Add user-guided review after phase execution and gate phase transitions on explicit user approval. After this phase, `continue` never skips review in fresh contexts.

---

## Resolved Questions

### How does the review workflow determine files created/modified?

**Resolution:** Git diff. Store `phases.phase_start_commit` in config.json when phase execution begins. Review runs `git diff {start_commit}..HEAD --stat` to show exactly what changed — captures planned work, auto-fixes, and deviations.

**Why not plan files?** Plan files only show what was intended, not what actually changed. Git diff is ground truth.

**Related Decisions:** DEC-012

---

### Where does executed vs completed status live?

**Resolution:** Single field `phases.current_status` in config.json. Values: `"pending"` | `"executing"` | `"executed"` | `"completed"`. When a phase passes review, `current` advances, `completed` increments, and `current_status` resets to `"pending"`.

**Why not per-phase array?** Overkill — we only need to know the current phase's status. Historical phases are all completed.

**Related Decisions:** DEC-013

---

### How does continue detect and route to review?

**Resolution:** Explicit field check. `continue` reads `phases.current_status` from config.json:
- `"executing"` + plans remain → execute next plan
- `"executing"` + no plans remain → set to `"executed"`, show review
- `"executed"` → show review (handles fresh context correctly)
- `"completed"` → advance to next phase

This is the core fix for DEC-009 — fresh context always lands on the right step.

**Related Decisions:** DEC-009

---

### How does the review workflow create fix plans?

**Resolution:** Review writes fix plans directly. The conversational flow:
1. Show files created/modified (git diff --stat)
2. Show test guidance (derived from plan objectives/success criteria)
3. Ask "Is this OK, or do you want to revise?"
4. If revise: user describes issues in conversation
5. Review writes `plans/phase-{N.1}/01-PLAN.md` (decimal numbering per DEC-006)
6. Offers to execute fix plan immediately
7. After fix execution, loops back to review (updated diff)
8. User says "OK" → phase marked `completed`

**Why not delegate to plan-phase?** Would lose conversational context about what needs fixing.

**Related Decisions:** DEC-014

---

## Gray Areas Remaining

_(All resolved)_
