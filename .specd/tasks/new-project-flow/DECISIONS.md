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

### DEC-003: Parallel research agents for greenfield projects

**Date:** 2026-02-23
**Status:** Active
**Context:** Greenfield projects have no codebase to learn from. Need to gather domain knowledge before making decisions.
**Decision:** Spawn 4 parallel research agents: stack, features, architecture, pitfalls. Similar to GSD's approach but adapted to specd's agent patterns.
**Rationale:**
- Parallel execution saves time
- Covers the four key dimensions a greenfield project needs answered
- Research findings feed directly into requirements and roadmap phases
**Implications:**
- Need to create or adapt research agent definitions
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
