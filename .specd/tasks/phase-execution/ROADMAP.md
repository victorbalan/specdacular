# Roadmap: phase-execution

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 2 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Core Pipeline Logic** — Add plan step to phase-execution pipeline and update brain routing
- [ ] **Phase 2: Documentation** — Update STATE-MACHINE.md and README.md

---

## Phase Details

### Phase 1: Core Pipeline Logic

**Goal:** Make the brain route through plan → execute → review → revise per phase. Task-level plan creates ROADMAP.md only; phase-level plan creates PLAN.md just-in-time.

**Modifies:**
- `specdacular/pipeline.json` — Add plan step to phase-execution pipeline
- `specdacular/references/brain-routing.md` — Route pending+no PLAN.md to plan
- `specdacular/workflows/plan.md` — Dual-mode: task-level (ROADMAP only) vs phase-level (PLAN.md)
- `specdacular/workflows/brain.md` — Update prompt_or_proceed and update_state for plan step

**Success Criteria:**
1. pipeline.json phase-execution has plan → execute → review → revise
2. brain-routing.md routes pending+no PLAN.md to plan, pending+PLAN.md to execute
3. plan.md detects phase-level mode and creates single-phase PLAN.md
4. brain.md handles plan step in prompt_or_proceed and update_state

**Dependencies:** None (first phase)

---

### Phase 2: Documentation

**Goal:** Update all documentation to reflect the new per-phase planning model.

**Modifies:**
- `specdacular/STATE-MACHINE.md` — Update routing table, lifecycle diagram, phase sub-lifecycle, pipeline config
- `README.md` — Update pipeline description and phase-execution references

**Success Criteria:**
1. STATE-MACHINE.md routing table shows plan step in phase-execution
2. Phase sub-lifecycle diagram shows plan → execute → review → revise
3. README pipeline description matches new architecture

**Dependencies:** Phase 1 complete

---

## Execution Order

```
Phase 1: Core Pipeline Logic
    ↓
Phase 2: Documentation
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: ROADMAP.md as source of truth | Phase-level plan reads goals from here |
| DEC-002: Single plan.md with context detection | plan.md handles both modes in one workflow |
| DEC-003: Pipeline.json drives phase sub-lifecycle | pipeline.json gets plan step added |
