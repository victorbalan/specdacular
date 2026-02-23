# Roadmap: multi-project-specd

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 5 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [x] **Phase 1: Templates & Foundation** — Create orchestrator templates, config structures, and DEPENDENCIES.md template *(Complete: 2 plans, 5 tasks)*
- [x] **Phase 2: map-codebase Orchestrator Flow** — Add multi-project detection, project registration, and orchestrator mapping *(Complete: 2 plans, 6 tasks)*
- [x] **Phase 3: new-feature Orchestrator Flow** — Add orchestrator-aware feature creation with project routing and delegation *(Complete: 2 plans, 6 tasks)*
- [x] **Phase 4: plan-feature Orchestrator Flow** — Add cross-project roadmaps, dependency graph, and cycle detection *(Complete: 2 plans, 6 tasks)*
- [x] **Phase 5: Execution & Scheduling** — Add contract validation to execute-plan and cross-project scheduling to next-feature *(Complete: 2 plans, 6 tasks)*

---

## Phase Details

### Phase 1: Templates & Foundation

**Goal:** Create all orchestrator-specific templates and config structures that other phases build on.

**Creates:**
- `specdacular/templates/orchestrator/PROJECTS.md` — Project registry template (name, path, tech stack, purpose)
- `specdacular/templates/orchestrator/TOPOLOGY.md` — Inter-project communication patterns template
- `specdacular/templates/orchestrator/CONTRACTS.md` — Shared interface descriptions template (loose, per DEC-008)
- `specdacular/templates/orchestrator/CONCERNS.md` — Cross-cutting system-level gotchas template
- `specdacular/templates/orchestrator/config.json` — Orchestrator config template with `"type": "orchestrator"` and `"projects"` array
- `specdacular/templates/features/DEPENDENCIES.md` — Cross-project phase dependency graph template (for orchestrator features)

**Modifies:**
- None

**Success Criteria:**
1. All 6 template files exist with proper placeholder structure
2. Templates follow existing placeholder conventions (`{feature-name}`, `{YYYY-MM-DD}`, etc.)
3. DEPENDENCIES.md template includes project involvement table, phase dependency table, and Mermaid graph placeholder
4. Orchestrator config.json template includes `"type": "orchestrator"` and `"projects"` array structure

**Dependencies:** None (first phase)

**Plans:**
- `01-PLAN.md` — Create orchestrator codebase templates (PROJECTS, TOPOLOGY, CONTRACTS, CONCERNS)
- `02-PLAN.md` — Create config and dependencies templates (config.json, DEPENDENCIES.md)

**Status:** Planned

---

### Phase 2: map-codebase Orchestrator Flow

**Goal:** Modify map-codebase workflow to detect multi-project setups, register projects, and produce orchestrator-level codebase docs (PROJECTS.md, TOPOLOGY.md, CONTRACTS.md, CONCERNS.md) in addition to per-project codebase docs.

**Creates:**
- None (modifies existing workflow)

**Modifies:**
- `specdacular/workflows/map-codebase.md` — Add `detect_mode`, `setup_orchestrator`, `create_orchestrator_structure`, `spawn_orchestrator_agents` steps

**Success Criteria:**
1. Running map-codebase asks "multi-project or single project?"
2. Multi-project flow registers projects with name, path, description
3. Writes `.specd/config.json` with `"type": "orchestrator"` and projects array
4. Spawns per-project mappers in parallel (existing 4-agent pattern per project)
5. After sub-project mappers complete, spawns orchestrator mapper that reads sub-project docs + scans codebases
6. Orchestrator `.specd/codebase/` contains PROJECTS.md, TOPOLOGY.md, CONTRACTS.md, CONCERNS.md
7. Single-project flow works exactly as before (no regression)

**Dependencies:** Phase 1 complete (orchestrator templates exist)

**Plans:**
- `01-PLAN.md` — Add mode detection, legacy handling, and project-level config.json
- `02-PLAN.md` — Add full multi-project flow (register, per-project mapping, orchestrator mapping)

**Status:** Planned

---

### Phase 3: new-feature Orchestrator Flow

**Goal:** Modify new-feature workflow to detect orchestrator mode, discuss features at system level, route to involved projects, and delegate feature creation to sub-projects with rich context.

**Creates:**
- None (modifies existing workflow)

**Modifies:**
- `specdacular/workflows/new-feature.md` — Add orchestrator detection after `validate`, add `orchestrator_feature_flow` with project routing and delegation

**Success Criteria:**
1. In orchestrator mode, discussion focuses on system-level behavior (cross-cutting concerns, project responsibilities)
2. After discussion, suggests involved projects based on conversation + CONTRACTS.md
3. User confirms or adjusts project selection
4. Creates orchestrator-level feature folder with FEATURE.md (system view), DECISIONS.md, DEPENDENCIES.md (project involvement)
5. Delegates feature creation to each involved sub-project using existing new-feature logic
6. Sub-project FEATURE.md contains project-specific requirements (translated from system-level needs)
7. Single-project flow works exactly as before (no regression)

**Dependencies:** Phase 1 (DEPENDENCIES.md template), Phase 2 (orchestrator must exist with config.json)

**Plans:**
- `01-PLAN.md` — Orchestrator detection, system-level discussion, project routing (3 tasks)
- `02-PLAN.md` — Feature creation, sub-project delegation, commit and completion (3 tasks)

**Status:** Planned

---

### Phase 4: plan-feature Orchestrator Flow

**Goal:** Modify plan-feature workflow to create per-project roadmaps and orchestrator-level cross-project dependency graph with cycle detection.

**Creates:**
- None (modifies existing workflow)

**Modifies:**
- `specdacular/workflows/plan-feature.md` — Add orchestrator detection, per-project roadmap delegation, dependency graph creation, cycle validation

**Success Criteria:**
1. In orchestrator mode, delegates roadmap creation to each involved sub-project
2. Each sub-project gets its own ROADMAP.md with project-scoped phases
3. Orchestrator creates/updates DEPENDENCIES.md with cross-project phase dependency graph
4. Dependency graph uses table format (parseable) + Mermaid visualization
5. Topological sort validates no cycles in dependency graph (DEC-009)
6. If cycles detected, asks user to restructure before proceeding
7. Single-project flow works exactly as before (no regression)

**Dependencies:** Phase 3 complete (features must be creatable in orchestrator mode)

**Plans:**
- `01-PLAN.md` — Orchestrator detection, multi-project phase derivation, per-project roadmaps (3 tasks)
- `02-PLAN.md` — Dependency graph, cycle detection, commit and completion (3 tasks)

**Status:** Planned

---

### Phase 5: Execution & Scheduling

**Goal:** Modify execute-plan to add contract validation after phase execution, and modify next-feature to add cross-project scheduling with optional project argument.

**Creates:**
- None (modifies existing workflows)

**Modifies:**
- `specdacular/workflows/execute-plan.md` — Add orchestrator detection, inline execution in sub-projects, contract validation after phase completion, replan cascade protection (DEC-010)
- `specdacular/workflows/next-feature.md` — Add orchestrator detection, cross-project state aggregation, dependency-aware scheduling, optional project argument parsing

**Success Criteria:**
1. `execute-plan` in orchestrator mode runs phases inline in sub-project context (user can interact)
2. After phase execution, orchestrator reviews output against feature-level contract expectations
3. Deviations flagged with impact analysis ("affects UI phase 2, Worker phase 1")
4. User can accept deviation (update contract) or trigger replan for affected projects
5. Replan cascade depth limited to 2 before forced pause (DEC-010)
6. `next` in orchestrator mode reads all sub-project STATE.md + DEPENDENCIES.md to compute unblocked work
7. Shows cross-project progress dashboard
8. Accepts optional project argument: `/specd.feature:next feature-name project-name`
9. Auto-picks if one project unblocked, asks if multiple
10. One-session-at-a-time documented (DEC-011)
11. Single-project flow works exactly as before (no regression)

**Dependencies:** Phase 4 complete (plans must exist with cross-project dependencies)

**Plans:**
- `01-PLAN.md` — Contract validation in execute-plan (3 tasks)
- `02-PLAN.md` — Cross-project scheduling in next-feature (3 tasks)

**Status:** Planned

---

## Execution Order

```
Phase 1: Templates & Foundation
├── Orchestrator templates (PROJECTS, TOPOLOGY, CONTRACTS, CONCERNS, config)
└── DEPENDENCIES.md feature template
    ↓
Phase 2: map-codebase Orchestrator Flow
└── Multi-project detection + orchestrator mapping
    ↓
Phase 3: new-feature Orchestrator Flow
└── Project routing + delegated feature creation
    ↓
Phase 4: plan-feature Orchestrator Flow
└── Per-project roadmaps + dependency graph + cycle detection
    ↓
Phase 5: Execution & Scheduling
├── execute-plan: contract validation + replan cascade protection
└── next-feature: cross-project scheduling + project argument
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Sub-projects unaware | All phases — orchestrator wraps existing workflows, never modifies sub-project behavior |
| DEC-006: Config.json type field | Phase 2 creates it, Phases 3-5 check it for mode detection |
| DEC-007: Sub-project mappers first | Phase 2 — execution order for mapping agents |
| DEC-008: Loose contracts | Phase 1 (template), Phase 5 (deviation detection against feature-level contracts) |
| DEC-009: Cycle detection | Phase 4 — topological sort during planning |
| DEC-010: Replan cascade limit | Phase 5 — depth tracking in execute-plan |
| DEC-011: One session at a time | Phase 5 — documented in next-feature scheduling |

---

## Notes

Phases follow natural dependency order: templates → entry point → feature creation → planning → execution. Each phase is independently testable — after Phase 2, you can verify orchestrator setup works; after Phase 3, you can create multi-project features; etc.

All phases maintain zero regression for single-project mode. The branching pattern (detect orchestrator in config.json, branch to orchestrator flow or continue existing) keeps existing behavior untouched.
