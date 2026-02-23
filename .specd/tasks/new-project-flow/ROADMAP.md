# Roadmap: new-project-flow

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 4 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Command & Workflow Shell** — Slash command + workflow skeleton with questioning stage
- [ ] **Phase 2: Research Agent & Stage** — Project researcher agent + parallel spawn logic in workflow
- [ ] **Phase 3: Requirements & Roadmap Stages** — Multi-select scoping, REQUIREMENTS.md generation, roadmap creation
- [ ] **Phase 4: Scaffolding** — Orchestrator config, sub-project directories, setup task seeding

---

## Phase Details

### Phase 1: Command & Workflow Shell

**Goal:** User can run `/specd.new-project`, answer questioning prompts, and get a PROJECT.md written.

**Creates:**
- `commands/specd.new-project.md` — Slash command definition
- `specdacular/workflows/new-project.md` — Main workflow (questioning stage functional, later stages stubbed)
- `specdacular/templates/tasks/PROJECT.md` — Project vision template

**Modifies:**
- `commands/specd.help.md` — Add new-project to help listing

**Plan:** `phases/phase-01/PLAN.md`

**Success Criteria:**
1. `/specd.new-project` is recognized as a command and launches the workflow
2. Questioning stage asks open-ended questions, follows threads, and produces PROJECT.md
3. PROJECT.md is written to `.specd/tasks/project/PROJECT.md` and committed

**Dependencies:** None (first phase)

---

### Phase 2: Research Agent & Stage

**Goal:** After questioning, 4 parallel research agents investigate stack/features/architecture/pitfalls and produce research files.

**Creates:**
- `specdacular/agents/project-researcher.md` — Agent definition (one file, spawned 4 times with different focus)
- Research stage in `new-project.md` workflow (replacing stub)

**Plan:** `phases/phase-02/PLAN.md`

**Success Criteria:**
1. Four research agents spawn in parallel after PROJECT.md is written
2. Each agent writes its research file to `.specd/tasks/project/research/` (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md)
3. SUMMARY.md synthesized from all 4 outputs
4. Research findings committed

**Dependencies:** Phase 1 complete (needs working workflow + PROJECT.md output)

---

### Phase 3: Requirements & Roadmap Stages

**Goal:** User scopes v1 features from research findings, gets REQUIREMENTS.md and ROADMAP.md.

**Creates:**
- `specdacular/templates/tasks/REQUIREMENTS.md` — Requirements template with REQ-IDs
- Requirements stage in `new-project.md` workflow (replacing stub)
- Roadmap stage in `new-project.md` workflow (replacing stub)

**Plan:** `phases/phase-03/PLAN.md`

**Success Criteria:**
1. Features from research FEATURES.md presented by category with multi-select
2. User selections produce REQUIREMENTS.md with v1/v2/out-of-scope sections and REQ-IDs
3. Roadmap generated from requirements with phases mapped to REQ-IDs
4. Both files committed

**Dependencies:** Phase 2 complete (needs research FEATURES.md for scoping)

---

### Phase 4: Scaffolding

**Goal:** Create orchestrator config, sub-project directories, and seed each with a setup task.

**Creates:**
- Scaffolding stage in `new-project.md` workflow (replacing stub)

**Plan:** `phases/phase-04/PLAN.md`

**Success Criteria:**
1. `.specd/config.json` created at root with `"type": "orchestrator"` and `projects` array
2. Each sub-project directory created with `.specd/config.json` linking back to orchestrator
3. Each sub-project has `.specd/tasks/setup/FEATURE.md` seeded from system-level research/requirements
4. Completion banner shows all artifacts and next steps

**Dependencies:** Phase 3 complete (needs ROADMAP.md to identify sub-projects)

---

## Execution Order

```
Phase 1: Command & Workflow Shell
└── PLAN.md
    ↓
Phase 2: Research Agent & Stage
└── PLAN.md
    ↓
Phase 3: Requirements & Roadmap Stages
└── PLAN.md
    ↓
Phase 4: Scaffolding
└── PLAN.md
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-003: Single research agent, 4 spawns | Phase 2 creates one agent file, workflow spawns it 4x |
| DEC-005: Setup task per sub-project | Phase 4 seeds FEATURE.md, not raw boilerplate |
| DEC-006: Standalone command | No pipeline/brain integration needed in any phase |
| DEC-007: Multi-select from research | Phase 3 depends on Phase 2's FEATURES.md output |
