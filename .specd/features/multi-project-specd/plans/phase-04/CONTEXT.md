# Phase 4 Context: plan-feature Orchestrator Flow

**Phase:** 4 — plan-feature Orchestrator Flow
**Date:** 2026-02-11
**Status:** All gray areas resolved

---

## Resolved Questions

### 1. Orchestrator Detection & Context Loading

**Question:** Where does orchestrator detection happen in plan-feature?

**Resolution:** Merge into the existing `load_context` step. When the feature's `config.json` has `orchestrator: true`:
- Load orchestrator-level FEATURE.md, CONTEXT.md, DECISIONS.md
- Load system-level codebase docs (PROJECTS.md, TOPOLOGY.md, CONTRACTS.md)
- Read sub-project feature folders (per the `projects` array in feature config.json)
- Branch to `orchestrator_derive_phases` instead of `derive_phases`

---

### 2. Roadmap Delegation Strategy

**Question:** How do we create per-project roadmaps?

**Resolution:** Derive all roadmaps in one orchestrator pass, then confirm with the user:
- The orchestrator has the full system picture — better positioned to derive coherent per-project phases
- Same pattern as feature delegation (Phase 3): translate system-level needs into project-specific artifacts
- Flow: orchestrator derives all project phases → presents consolidated view → user adjusts → writes ROADMAP.md per project
- Each sub-project's ROADMAP.md is self-contained, following existing template (DEC-001)

---

### 3. Dependency Graph & Cycle Detection

**Question:** How do we build the cross-project dependency graph and validate it?

**Resolution:**
- After deriving per-project phases, propose cross-project dependencies based on CONTRACTS.md + project responsibilities
- Present as a table: "api/phase-1 → no deps", "ui/phase-2 → after api/phase-2"
- User confirms or adjusts
- Write DEPENDENCIES.md (using Phase 1 template) in orchestrator's feature folder
- Run topological sort to validate no cycles (DEC-009)
- If cycles detected: show cycle path, ask user to restructure
- Include Mermaid DAG visualization

---

## Key Decisions Referenced

- DEC-001: Sub-projects unaware — per-project ROADMAP.md is self-contained
- DEC-002: Per-project roadmaps with orchestrator dependency tracking
- DEC-009: Validate dependency graph for cycles during planning

## Notes

No new decisions needed.
