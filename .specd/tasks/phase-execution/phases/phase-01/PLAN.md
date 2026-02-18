# Phase 1: Core Pipeline Logic

**Task:** phase-execution
**Phase:** 1 of 2
**Dependencies:** None

## Objective

Add plan step to phase-execution pipeline and update brain routing so each phase gets just-in-time planning. Task-level plan creates ROADMAP.md only; phase-level plan creates PLAN.md.

## Tasks

### Task 1: Add plan step to pipeline.json

**Files:** `specdacular/pipeline.json`

**Action:** Add a `plan` step as the first entry in the `phase-execution` pipeline array. Set `pause: false` (auto-proceed). Keep existing execute/review/revise steps unchanged.

**Verification:** Read pipeline.json and confirm phase-execution has plan → execute → review → revise.

**Done when:**
- [ ] phase-execution pipeline starts with plan step
- [ ] plan step has `pause: false` (or no pause field)
- [ ] plan step references `plan.md` workflow

### Task 2: Update brain-routing.md

**Files:** `specdacular/references/brain-routing.md`

**Action:** Change routing rule #5 (stage=execution, current_status=pending) to check for PLAN.md existence:
- pending + no PLAN.md → route to `plan` (phase-execution pipeline)
- pending + PLAN.md exists → route to `execute` (phase-execution pipeline)

Update the state-to-step mapping table accordingly.

**Verification:** Read brain-routing.md and confirm the pending state checks for PLAN.md.

**Done when:**
- [ ] Routing table shows plan step for pending+no PLAN.md
- [ ] Routing logic section updated with PLAN.md existence check
- [ ] Comments explain the just-in-time planning model

### Task 3: Update plan.md for dual-mode detection

**Files:** `specdacular/workflows/plan.md`

**Action:** Add phase-level detection (following research.md pattern):
- Read config.json stage field
- If stage=execution: phase-level mode
  - Read phases.current to get phase number
  - Read phase goal from ROADMAP.md
  - Create phases/phase-NN/ directory
  - Create PLAN.md with detailed tasks for this phase only
  - Do NOT change stage or status in config.json (stays execution/pending)
- If stage≠execution: task-level mode (existing behavior BUT):
  - Create ROADMAP.md only (no phases/ directory, no PLAN.md files)
  - Set stages.total from phase count
  - Set stage to "execution", phases.current_status to "pending"

Also update the `derive_phases` and `write_plans` steps to only run in task-level mode. Add a new `write_phase_plan` step for phase-level mode.

**Verification:** Read plan.md and confirm both modes are present with detection logic.

**Done when:**
- [ ] Phase-level detection added (check stage=execution)
- [ ] Task-level mode creates ROADMAP.md only
- [ ] Phase-level mode creates single PLAN.md from ROADMAP.md goal
- [ ] Phase directory created just-in-time in phase-level mode

### Task 4: Update brain.md routing and state transitions

**Files:** `specdacular/workflows/brain.md`

**Action:**
1. In `prompt_or_proceed`: Add handling for plan step in phase-execution context:
   - Default mode: plan has no pause, auto-proceed
   - Interactive mode: Add plan step options ("Plan this phase", "Skip to execute", "Stop")
   - Remove "Research this phase" option from execute step (no longer needed — research isn't in phase pipeline)
2. In `update_state`: Add "After plan completes (phase-level)" section:
   - If stage=execution (phase-level plan): no state change needed (stays pending, PLAN.md now exists, brain loops and routes to execute)
   - Update existing "After plan completes" to clarify it's task-level only
3. In `phase_loop`: Update sub-pipeline description to plan → execute → review → revise

**Verification:** Read brain.md and confirm plan step handling exists in all three sections.

**Done when:**
- [ ] prompt_or_proceed handles plan step for phase-execution
- [ ] update_state has phase-level plan completion logic
- [ ] phase_loop references plan → execute → review → revise
- [ ] "Research this phase" removed from execute options
