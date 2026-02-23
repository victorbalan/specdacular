# Decisions: new-project-flow

**Task:** new-project-flow
**Created:** 2026-02-23
**Last Updated:** 2026-02-23

---

## Active Decisions

### DEC-001: System-level docs live at orchestrator root

**Date:** 2026-02-23
**Status:** Active
**Context:** Needed to decide where PROJECT.md, REQUIREMENTS.md, ROADMAP.md and other system-level artifacts live when multiple sub-projects exist.
**Decision:** System-level docs go in `.specd/tasks/project/` at the monorepo/orchestrator root. The orchestrator's `.specd/config.json` has `"type": "orchestrator"` with a `projects` array pointing to sub-project directories.
**Rationale:**
- Reuses the existing orchestrator pattern already in specd
- Keeps system-level and project-level concerns separated
- Each sub-project remains independently manageable via `/specd.continue`
**Implications:**
- Orchestrator config must be created during scaffolding
- `/specd.continue project` must handle project-level stages differently from feature-level stages

### DEC-002: Multi-project support via orchestrator mode

**Date:** 2026-02-23
**Status:** Active
**Context:** A new project might be a single app or a multi-service system (ui, api, worker). Need to handle both.
**Decision:** Always use orchestrator mode. Even a single-project setup uses the orchestrator pattern — it just has one entry in the `projects` array.
**Rationale:**
- Consistent architecture regardless of project count
- Easy to add projects later without restructuring
- Aligns with existing specd orchestrator support
**Implications:**
- Every `/specd.new-project` creates an orchestrator config
- Single-project setups have a small amount of overhead but gain consistency

### DEC-003: Single research agent covering all 4 domains

**Date:** 2026-02-23 (updated 2026-02-23)
**Status:** Active
**Context:** Greenfield projects have no codebase to learn from. Need to gather domain knowledge before making decisions.
**Decision:** One research agent covers all 4 domains (stack, features, architecture, pitfalls), adapted from GSD's `gsd-project-researcher` pattern. Writes SUMMARY.md, STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md to `.specd/tasks/project/research/`.
**Rationale:**
- GSD's proven single-agent approach works well
- Opinionated output ("Use X because Y") over option listing
- Confidence levels with source hierarchy ensure quality
- SUMMARY.md includes roadmap implications, directly feeding next stages
**Implications:**
- Create one agent definition file adapted from GSD's project-researcher
- Research output goes to `.specd/tasks/project/research/`
- Research synthesis feeds into REQUIREMENTS.md creation

### DEC-004: Separate command, not a mode of `/specd.new`

**Date:** 2026-02-23
**Status:** Active
**Context:** Could either add project detection to `/specd.new` or create a dedicated `/specd.new-project` command.
**Decision:** Create `/specd.new-project` as a separate command.
**Rationale:**
- Different flow (questioning → research → requirements → roadmap → scaffold vs. discussion → feature docs)
- Different artifacts (PROJECT.md, REQUIREMENTS.md vs. FEATURE.md)
- Clearer user intent — user knows they're starting a project, not adding a feature
**Implications:**
- New command file and workflow needed
- Help command needs updating
- No changes to existing `/specd.new`

### DEC-005: Sub-projects get a pre-populated setup task

**Date:** 2026-02-23
**Status:** Active
**Context:** Need to decide what gets scaffolded per sub-project directory when new-project completes.
**Decision:** Each sub-project gets `.specd/config.json` + `.specd/tasks/setup/FEATURE.md` seeded from system-level research/requirements. No raw boilerplate or code scaffolding — setup executes through the normal task lifecycle (discuss → plan → execute).
**Rationale:**
- Research already figured out the stack/libs — setup task has real context
- User can customize before executing (change their mind about a library)
- It's just a regular specd task — no special machinery needed
- Keeps new-project focused on planning, not code generation
**Implications:**
- FEATURE.md template needs to support setup-type tasks
- Each sub-project's setup task is independently runnable via `/specd.continue setup`

### DEC-006: Standalone command, no pipeline integration

**Date:** 2026-02-23
**Status:** Active
**Context:** Whether new-project should integrate with the brain/pipeline system or be self-contained.
**Decision:** `/specd.new-project` is a standalone command that runs its own flow (questioning → research → requirements → roadmap → scaffold) and exits. No brain, no pipeline, no state machine. After scaffolding, users use `/specd.new` and `/specd.continue` on individual sub-projects.
**Rationale:**
- Simpler — no need for project task types or stage routing changes
- The flow is linear and always the same, no need for pipeline flexibility
- Keeps the brain/pipeline system focused on feature task execution
**Implications:**
- No changes to brain.md or pipeline.json
- One workflow file handles the entire flow sequentially
- No resume support mid-flow (acceptable for a one-time setup command)

### DEC-007: Requirements scoping via multi-select from research

**Date:** 2026-02-23
**Status:** Active
**Context:** How the user scopes v1 features — conversational or structured selection.
**Decision:** Show researched features organized by category (table stakes, differentiators, anti-features), let user multi-select what's v1 vs later vs out-of-scope. Write REQUIREMENTS.md from their choices.
**Rationale:**
- Research already produces categorized FEATURES.md — natural to select from it
- Structured selection is faster and more consistent than freeform conversation
- Matches GSD's proven pattern
**Implications:**
- Workflow needs to parse research FEATURES.md and present as selectable options
- REQUIREMENTS.md template needs v1/later/out-of-scope sections with REQ-IDs

---

## Superseded Decisions

---

## Revoked Decisions

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-23 | System-level docs live at orchestrator root | Active |
| DEC-002 | 2026-02-23 | Multi-project support via orchestrator mode | Active |
| DEC-003 | 2026-02-23 | Parallel research agents for greenfield projects | Active |
| DEC-004 | 2026-02-23 | Separate command, not a mode of /specd.new | Active |
| DEC-005 | 2026-02-23 | Sub-projects get a pre-populated setup task | Active |
| DEC-006 | 2026-02-23 | Standalone command, no pipeline integration | Active |
| DEC-007 | 2026-02-23 | Requirements scoping via multi-select from research | Active |
