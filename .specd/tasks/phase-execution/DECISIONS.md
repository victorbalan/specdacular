# Decisions: phase-execution

**Task:** phase-execution
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

---

## Active Decisions

### DEC-001: ROADMAP.md as single source of truth for phase goals

**Date:** 2026-02-18
**Status:** Active
**Context:** Need to store phase goals somewhere that the phase-level plan step can read when creating detailed PLAN.md
**Decision:** ROADMAP.md holds all phase goals/scope. No phase directories or PLAN.md files created during task-level planning. Phase directories created just-in-time.
**Rationale:**
- One place to look for phase context
- No empty directories cluttering the task folder
- Phase-level plan reads from ROADMAP.md and creates directory + PLAN.md
**Implications:**
- Task-level plan.md creates ROADMAP.md only (no phases/ directory)
- config.json `phases.total` set from ROADMAP.md phase count
- Brain creates phase directory when phase starts

### DEC-002: Single plan.md with context detection

**Date:** 2026-02-18
**Status:** Active
**Context:** Need both task-level planning (create roadmap) and phase-level planning (create PLAN.md for one phase)
**Decision:** One `plan.md` workflow that detects context, like research.md already does. If stage=execution, it's phase-level. Otherwise, task-level.
**Rationale:**
- Consistent pattern with research.md
- Less workflow files to maintain
- Brain dispatches same step name, workflow adapts
**Implications:**
- plan.md needs phase-level detection logic
- Task-level: creates ROADMAP.md, sets stage=execution
- Phase-level: reads goal from ROADMAP.md, creates phases/phase-NN/PLAN.md

### DEC-003: Pipeline.json drives phase sub-lifecycle

**Date:** 2026-02-18
**Status:** Active
**Context:** Could handle research/plan as brain pre-steps or as pipeline config
**Decision:** Update pipeline.json phase-execution pipeline to: research → plan → execute → review → revise
**Rationale:**
- Consistent with "everything through pipeline.json" principle
- Users can customize/swap phase-level research or plan workflows
- Brain routing stays simple — follows pipeline config
**Implications:**
- pipeline.json phase-execution gets 2 new steps (research, plan)
- research step: pause: false (auto-proceed, smart-skip)
- plan step: pause: false (auto-proceed)

---

## Superseded Decisions

None.

---

## Revoked Decisions

None.

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-18 | ROADMAP.md as source of truth | Active |
| DEC-002 | 2026-02-18 | Single plan.md with context detection | Active |
| DEC-003 | 2026-02-18 | Pipeline.json drives phase sub-lifecycle | Active |
