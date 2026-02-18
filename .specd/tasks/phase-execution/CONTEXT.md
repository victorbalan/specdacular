# Context: phase-execution

**Last Updated:** 2026-02-18
**Sessions:** 1

## Discussion Summary

Discussed changing the phase-execution pipeline from a "plan everything upfront" model to a per-phase mini-lifecycle. Each phase would do its own research (usually skipped) → plan → execute → review → revise. The big plan step becomes a high-level roadmap creator. User confirmed this should all be driven through pipeline.json changes. User emphasized that phase-level research should be skipped most of the time since task-level research usually covers it.

---

## Resolved Questions

### How should phase goals be stored?

**Question:** Where do phase goals live — in ROADMAP.md, in separate files, or in empty directories?

**Resolution:** ROADMAP.md is the single source of truth for phase goals. No phase directories or PLAN.md files created upfront. Phase directories created just-in-time when the phase starts.

**Related Decisions:** DEC-001

### Should plan.md be one workflow or two?

**Question:** Separate workflows for task-level and phase-level planning, or one smart workflow?

**Resolution:** One `plan.md` that detects context (like research.md already does). If stage=execution, it's phase-level planning — reads goal from ROADMAP.md, creates PLAN.md. Otherwise, task-level — creates ROADMAP.md.

**Related Decisions:** DEC-002

### How to add research/plan to phase pipeline?

**Question:** Should brain handle research/plan as pre-steps, or should pipeline.json be updated?

**Resolution:** Update pipeline.json. Everything goes through the pipeline config. Phase-execution pipeline becomes: research → plan → execute → review → revise.

**Related Decisions:** DEC-003

---

## Deferred Questions

None.

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-18 | Phase lifecycle, pipeline config, smart skipping, plan.md dual-mode | All questions resolved, ready for research |

---

## Gray Areas Remaining

None — all questions resolved in initial discussion.

---

## Quick Reference

- **Task:** `.specd/tasks/phase-execution/FEATURE.md`
- **Decisions:** `.specd/tasks/phase-execution/DECISIONS.md`
- **Research:** `.specd/tasks/phase-execution/RESEARCH.md` (if exists)
