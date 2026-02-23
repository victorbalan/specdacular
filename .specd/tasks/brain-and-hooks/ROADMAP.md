# Roadmap: brain-and-hooks

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 4 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Pipeline Config + Brain Foundation** — Create pipeline.json and brain's core loop
- [ ] **Phase 2: Hook System** — Add hook resolution, inline/subagent execution, error handling
- [ ] **Phase 3: Simplify Step Workflows + Extract Revise** — Strip flow control, create revise.md, thin continue.md
- [ ] **Phase 4: Integration + Command Wiring** — Wire commands, verify install, end-to-end validation

---

## Phase Details

### Phase 1: Pipeline Config + Brain Foundation

**Goal:** Create the default pipeline config and the brain orchestrator's core state machine — routing, dispatch, modes, and phase loop.

**Creates:**
- `specdacular/pipeline.json` — Default pipeline config
- `specdacular/workflows/brain.md` — Central orchestrator
- `specdacular/references/resolve-pipeline.md` — Pipeline resolution logic
- `specdacular/references/brain-routing.md` — State-to-step routing table

**Plan:** `phases/phase-01/PLAN.md`

**Success Criteria:**
1. pipeline.json is valid JSON with main + phase-execution pipelines
2. brain.md has core loop with all 3 modes, phase loop, and stop/resume
3. Reference files extract sub-behaviors to keep brain focused

**Dependencies:** None (first phase)

---

### Phase 2: Hook System

**Goal:** Add full hook lifecycle to the brain — resolution (explicit + convention), execution (inline + subagent), and error handling (optional + required).

**Modifies:**
- `specdacular/workflows/brain.md` — Add hook execution
- `specdacular/references/resolve-pipeline.md` — Add hook file discovery

**Plan:** `phases/phase-02/PLAN.md`

**Success Criteria:**
1. Hooks resolve from pipeline.json paths + `.specd/hooks/` convention fallback
2. Inline hooks execute in brain context, subagent hooks spawn Task agents
3. Optional hooks log and continue, required hooks stop pipeline

**Dependencies:** Phase 1 complete

---

### Phase 3: Simplify Step Workflows + Extract Revise

**Goal:** Strip flow control from execute.md, review.md, plan.md. Extract revise.md from review.md. Thin continue.md to pure delegation.

**Creates:**
- `specdacular/workflows/revise.md` — Fix plan creation (from review.md)

**Modifies:**
- `specdacular/workflows/continue.md` — Thin wrapper
- `specdacular/workflows/execute.md` — Remove review trigger
- `specdacular/workflows/review.md` — Remove fix plan logic
- `specdacular/workflows/plan.md` — Remove orchestrator check

**Plan:** `phases/phase-03/PLAN.md`

**Success Criteria:**
1. No step workflow dispatches another step workflow
2. revise.md signals outcome for brain routing
3. continue.md is < 30 lines

**Dependencies:** Phase 1 complete (can run in parallel with Phase 2)

---

### Phase 4: Integration + Command Wiring

**Goal:** Wire brain into command entry points, verify install path, end-to-end validation.

**Modifies:**
- `commands/specd.continue.md` — Update allowed-tools
- `specdacular/workflows/brain.md` — Fix any gaps from review

**Plan:** `phases/phase-04/PLAN.md`

**Success Criteria:**
1. Command entry point works with brain
2. pipeline.json installs correctly
3. All routing cases handled, all modes work

**Dependencies:** Phases 1, 2, 3 complete

---

## Execution Order

```
Phase 1: Pipeline Config + Brain Foundation
└── PLAN.md (4 tasks)
    ↓
Phase 2: Hook System          Phase 3: Simplify Workflows
└── PLAN.md (3 tasks)         └── PLAN.md (5 tasks)
    ↓                             ↓
    └─────────┬───────────────────┘
              ↓
Phase 4: Integration + Command Wiring
└── PLAN.md (3 tasks)
```

Note: Phases 2 and 3 can run in parallel (both depend on Phase 1 only).

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Brain owns flow control | Phase 3 must strip all flow control from step workflows |
| DEC-005: No hook output contract | Phase 2 simpler — no special plumbing for hook output |
| DEC-008: Nested pipelines | Phase 1 must implement phase-execution loop in brain |
| DEC-009: Revise extraction | Phase 3 must create revise.md and fix the review→fix loop |
