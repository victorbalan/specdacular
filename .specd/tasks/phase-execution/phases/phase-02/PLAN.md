# Phase 2: Documentation

**Task:** phase-execution
**Phase:** 2 of 2
**Dependencies:** Phase 1 complete

## Objective

Update all documentation to reflect the new per-phase planning model: plan → execute → review → revise per phase, with phase-plan.md as a separate workflow.

## Tasks

### Task 1: Update STATE-MACHINE.md

**Files:** `specdacular/STATE-MACHINE.md`

**Action:** Update:
1. Routing table — add plan step for pending+no PLAN.md state
2. Full lifecycle diagram — show plan in phase-execution loop
3. Phase sub-lifecycle diagram — add plan step before execute
4. Pipeline configuration reference — update phase-execution array to include plan step with phase-plan.md
5. "Writing Custom Step Workflows" section — add phase-plan replacement guidance

**Verification:** Read STATE-MACHINE.md and confirm all 5 sections updated.

**Done when:**
- [ ] Routing table shows plan routing for pending states
- [ ] Lifecycle diagram shows plan → execute → review → revise per phase
- [ ] Phase sub-lifecycle has plan step
- [ ] Pipeline config example includes plan step in phase-execution

### Task 2: Update README.md

**Files:** `README.md`

**Action:** Update:
1. Pipeline description to mention per-phase planning
2. Phase-execution pipeline description (plan → execute → review → revise)
3. Any pipeline.json example that shows phase-execution steps

**Verification:** Read README.md and confirm phase-execution references updated.

**Done when:**
- [ ] README mentions per-phase just-in-time planning
- [ ] Phase-execution pipeline shown as plan → execute → review → revise
