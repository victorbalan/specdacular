# Roadmap: rm-keep-discussing

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 2 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Incremental State Saves** — Widen existing commit points to include STATE.md + config.json
- [ ] **Phase 2: Remove Stop Prompts** — Remove "keep discussing / stop for now" prompts and exit paths

---

## Phase Details

### Phase 1: Incremental State Saves

**Goal:** Every workflow commit point includes STATE.md and config.json so progress is never lost on terminal close.

**Modifies:**
- `specdacular/workflows/discuss.md` — Add STATE.md + config.json to commit step's $FILES
- `specdacular/workflows/research.md` — Add STATE.md + config.json to commit step's $FILES
- `specdacular/workflows/plan.md` — Add STATE.md + config.json to commit step's $FILES (already has them, verify)
- `specdacular/workflows/execute.md` — Add STATE.md + config.json to phase_complete commit's $FILES

**Plan:** `phases/phase-01/PLAN.md`

**Success Criteria:**
1. Every workflow's commit step includes STATE.md and config.json in $FILES
2. No workflow commits state-only — always bundled with work product

**Dependencies:** None (first phase)

---

### Phase 2: Remove Stop Prompts

**Goal:** Remove all "keep discussing / stop for now" and "continue?" prompts that exist as state-save triggers. Workflows flow forward automatically.

**Modifies:**
- `specdacular/workflows/new.md` — Remove `continuation_offer` step; `completion` step ends workflow
- `specdacular/workflows/orchestrator/new.md` — Remove `continuation_offer` step; `completion` step ends workflow
- `specdacular/workflows/review.md` — Remove "Stop for now" option from gather_feedback
- `specdacular/workflows/brain.md` — Remove "Stop for now" exit paths from prompt_or_proceed

**Plan:** `phases/phase-02/PLAN.md`

**Success Criteria:**
1. No workflow contains "Keep discussing" or "Stop for now" prompts
2. `new.md` completion step ends workflow without offering continuation
3. `orchestrator/new.md` completion step ends workflow without offering continuation
4. `review.md` gather_feedback has only "Looks good" and revision options
5. `brain.md` prompt_or_proceed has no "Stop for now" options

**Dependencies:** Phase 1 complete (state saves must be in place before removing the save-trigger prompts)

---

## Execution Order

```
Phase 1: Incremental State Saves
└── PLAN.md
    ↓
Phase 2: Remove Stop Prompts
└── PLAN.md
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Incremental state saves after every step | Drives Phase 1 — all commit points widen scope |
| DEC-002: Remove all stop prompts | Drives Phase 2 — prompt removal across 4 files |
| DEC-003: Bundle state into existing commits | Phase 1 approach — no new commit points, just wider $FILES |
