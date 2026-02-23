# Task: phase-execution

## What This Is

Change the phase-execution pipeline so each phase runs its own mini-lifecycle (research → plan → execute → review → revise) instead of having all phases planned upfront. The big plan step creates a high-level roadmap only; detailed PLAN.md files are created per-phase when execution reaches them.

## Technical Requirements

### Must Modify

- [ ] `specdacular/pipeline.json` — Add research + plan steps to phase-execution pipeline
- [ ] `specdacular/workflows/brain.md` — Update routing, state transitions for new phase sub-lifecycle
- [ ] `specdacular/workflows/plan.md` — Detect phase-level vs task-level planning; task-level creates ROADMAP only (no PLAN.md files, no phase directories)
- [ ] `specdacular/references/brain-routing.md` — Add routing for phase-level research/plan states
- [ ] `specdacular/STATE-MACHINE.md` — Update docs for new phase lifecycle
- [ ] `specdacular/HELP.md` — Update phase-execution description
- [ ] `README.md` — Update pipeline description

### Must Integrate With

- `specdacular/workflows/research.md` — Already supports phase-level detection (stage=execution), no changes needed
- `specdacular/workflows/execute.md` — Unchanged, still executes PLAN.md tasks
- `specdacular/workflows/review.md` — Unchanged
- `specdacular/workflows/revise.md` — Unchanged
- `specdacular/references/resolve-pipeline.md` — Pipeline validation (may need update for new steps)

### Constraints

- Pipeline-driven — All changes go through pipeline.json, brain reads config
- Smart skipping — Phase research is skipped most of the time (task-level research covers it), only runs for complex/unfamiliar phases
- `plan.md` must detect context — Phase-level plan reads phase goal from ROADMAP.md, creates PLAN.md in phase directory; task-level plan creates ROADMAP.md with phase goals only
- No phase directories upfront — Created when phase starts, not during task-level planning
- Later phases can adapt — Phase-level planning happens just-in-time, informed by what happened in earlier phases

---

## Success Criteria

- [ ] `pipeline.json` phase-execution pipeline is: research → plan → execute → review → revise
- [ ] Task-level plan creates ROADMAP.md with phase goals (no PLAN.md files)
- [ ] Phase-level plan creates `phases/phase-NN/PLAN.md` with detailed tasks
- [ ] Phase-level research is smart-skipped when task research already covers it
- [ ] Brain correctly routes through new phase sub-lifecycle
- [ ] Phase directories created just-in-time when phase starts

---

## Out of Scope

- [X] Changes to research.md — Already supports phase-level detection
- [X] Changes to execute.md — Still runs PLAN.md tasks as before
- [X] Changes to review.md or revise.md — Unchanged
- [X] New commands — Everything works through existing /specd.continue

---

## Initial Context

### User Need
The current approach plans all phases upfront, which means later phases can't adapt to what happened in earlier ones. Per-phase research and planning gives smaller blast radius and more accurate plans.

### Integration Points
- brain.md orchestrator (routing and state transitions)
- pipeline.json (step configuration)
- plan.md (dual-mode: task-level roadmap vs phase-level detailed plan)
- research.md (already phase-aware)

### Key Constraints
- Phase research should be skipped most of the time — brain evaluates whether it adds value
- ROADMAP.md is the source of truth for phase goals
- Phase directories only created when that phase starts execution
