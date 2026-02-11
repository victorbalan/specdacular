# Phase 1 Context: Templates & Foundation

**Feature:** multi-project-specd
**Phase Type:** Templates/Schema
**Discussed:** 2026-02-11

## Phase Overview

Create all orchestrator-specific templates and config structures that other phases build on. Six template files covering project registry, topology, contracts, concerns, orchestrator config, and cross-project dependencies.

## Resolved Questions

### PROJECTS.md template structure

**Question:** What fields and sections should the project registry template include? Should it have runtime/deployment info?

**Resolution:** Code-only — no runtime/deployment info (ports, URLs, environment). Those change too often and belong in deployment docs, not planning docs.

**Details:**
- Registry table at top: Project, Path, Tech Stack, Purpose
- Per-project detail sections with: path, tech stack, purpose, responsibilities, key entry points
- Link to sub-project's `.specd/codebase/` docs (MAP.md, PATTERNS.md) for deeper reference
- Orchestrator mapper (Phase 2) fills this from sub-project analysis

---

### TOPOLOGY.md template structure

**Question:** How to structure inter-project communication patterns — per-relationship or per-pattern?

**Resolution:** Per-relationship (one section per project pair). Matches the CONTRACTS.md pattern from DEC-008 and aligns with how the orchestrator routes features by project relationships.

**Details:**
- Each section: `{project-a} ↔ {project-b}`
- Fields: Communication method, Pattern (who initiates), Shared domains, Source of truth
- This structure makes feature routing natural — "auth touches API and UI" maps directly to a relationship section

---

### CONCERNS.md differentiation from per-project concerns

**Question:** How should the orchestrator-level CONCERNS.md differ from per-project CONCERNS.md produced by the codebase mapper?

**Resolution:** Orchestrator CONCERNS.md focuses on system-level cross-cutting issues that span multiple projects. Per-project CONCERNS.md stays code-level.

**Details:**
- Per-project: code-level gotchas (library issues, circular imports, tech debt)
- Orchestrator: system-level cross-cutting issues (auth flow sync, migration ordering, shared state consistency)
- Each concern includes: Scope (which projects), Issue, Impact, Mitigation
- Examples: "DB migrations in API must complete before Worker deploys new consumer code"

---

### DEPENDENCIES.md conditionality

**Question:** DEPENDENCIES.md lives in `templates/features/` but is orchestrator-only. How should workflows handle its presence/absence?

**Resolution:** Template file always exists in `templates/features/`. Conditionality lives in workflow logic (Phase 3's `new-feature`), not the template. If `config.json` has `"type": "orchestrator"`, create DEPENDENCIES.md from template. If single-project, skip it.

**Details:**
- Phase 1 just creates the template file — no workflow changes
- Phase 3 (new-feature orchestrator flow) adds the conditional creation logic
- Clean separation: templates are always available, workflows decide when to use them

---

## Gray Areas Remaining

None — all resolved.

## Implications for Plans

- PROJECTS.md template needs registry table + per-project detail sections (no runtime info)
- TOPOLOGY.md template uses per-relationship structure with 4 fields per relationship
- CONCERNS.md template uses system-level format with Scope/Issue/Impact/Mitigation per concern
- DEPENDENCIES.md template follows the format from RESEARCH.md (project involvement table + phase dependency table + Mermaid graph)
- All templates should follow existing placeholder conventions (`{placeholder-name}`)
