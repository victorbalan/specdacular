# Decisions: multi-project-specd

**Feature:** multi-project-specd
**Created:** 2026-02-10
**Last Updated:** 2026-02-10

---

## Active Decisions

### DEC-001: Sub-projects are unaware of multi-project setup

**Date:** 2026-02-10
**Status:** Active
**Context:** Needed to decide whether sub-project `.specd/` folders should contain metadata about being part of a larger system, or remain independent.
**Decision:** Sub-projects have zero awareness of the orchestrator. Their `.specd/` works identically whether standalone or part of a multi-project setup.
**Rationale:**
- Keeps existing single-project workflows completely untouched (no code changes)
- Sub-projects are portable — can be extracted and still work on their own
- Orchestrator translates system-level needs into normal project-level requirements
- Simpler mental model — each project's `.specd/` is self-contained
**Implications:**
- Orchestrator must pass all cross-project context as normal technical requirements when delegating
- No new fields or metadata in sub-project FEATURE.md, STATE.md, etc.
- Sub-project workflows (`new-feature`, `execute-plan`, etc.) need zero modifications

---

### DEC-002: Per-project roadmaps with orchestrator dependency tracking

**Date:** 2026-02-10
**Status:** Active
**Context:** Needed to decide between a unified cross-project roadmap vs. per-project roadmaps with orchestrator coordination.
**Decision:** Each sub-project gets its own ROADMAP.md with its own phases. The orchestrator maintains a cross-project dependency graph that tracks which project phases depend on other project phases.
**Rationale:**
- Per-project roadmaps are self-contained — make sense even without the orchestrator
- Follows the same principle as DEC-001 (sub-projects stay independent)
- Orchestrator only adds coordination layer on top, not a replacement
- Allows working on a single project independently when needed
**Implications:**
- Orchestrator needs a new document or section to store cross-project phase dependencies
- `next` command at orchestrator level must read all sub-project STATE.md files + dependency graph
- Planning phase must produce per-project roadmaps AND orchestrator dependency mapping

---

### DEC-003: Orchestrator is coordination-only (no code) for v1

**Date:** 2026-02-10
**Status:** Active
**Context:** Some monorepos have shared code at the root level. Needed to decide if the orchestrator directory can also be a project with its own code.
**Decision:** For v1, the orchestrator is purely a coordination layer. It does not have its own code, only system-level architecture docs and cross-project tracking.
**Rationale:**
- Simpler to implement — clear separation between orchestrator and project concerns
- Most multi-project setups have a clean orchestrator level (no shared code at root)
- Can be extended later to support "orchestrator as project" without breaking v1
**Implications:**
- Orchestrator `.specd/codebase/` contains system docs (PROJECTS.md, TOPOLOGY.md, etc.), not code-level docs (no MAP.md, PATTERNS.md)
- No code-level planning or execution at the orchestrator level
- Later versions can add support for root-level code alongside orchestration

---

### DEC-004: Orchestrator acts as contract guardian

**Date:** 2026-02-10
**Status:** Active
**Context:** When one project deviates from its plan during execution, other projects' plans that depend on shared interfaces may become stale. Needed a mechanism to catch this.
**Decision:** The orchestrator tracks contracts (shared interfaces between projects) in CONTRACTS.md. After each phase execution in a sub-project, it reviews whether actual output matches what other projects' plans expect. Deviations trigger a replan offer.
**Rationale:**
- Cross-project contract tracking is the orchestrator's key value proposition
- Catching deviations early prevents cascading plan failures
- User stays in control — deviations are flagged, not auto-fixed
**Implications:**
- CONTRACTS.md must be structured enough for automated comparison (not just prose)
- Post-execution review step added to orchestrator's execute-plan wrapper
- Replanning flow needed for when contracts change

---

### DEC-005: Manual project registration for v1

**Date:** 2026-02-10
**Status:** Active
**Context:** Needed to decide how projects are discovered — auto-detection (scanning for package.json, go.mod, etc.) vs. manual configuration.
**Decision:** Projects are manually registered during the initial `map-codebase` setup. Stored in `.specd/config.json`.
**Rationale:**
- One-time setup cost is low
- Manual registration is more reliable than auto-detection heuristics
- User explicitly defines what counts as a "project" — avoids false positives
- Auto-discovery can be added later without breaking manual registration
**Implications:**
- `map-codebase` in multi-project mode must ask the user to identify projects
- `.specd/config.json` gains a `projects` array with name, path, description per project
- All orchestrator commands read project list from config

---

## Superseded Decisions

(none)

---

## Revoked Decisions

(none)

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-10 | Sub-projects are unaware of multi-project setup | Active |
| DEC-002 | 2026-02-10 | Per-project roadmaps with orchestrator dependency tracking | Active |
| DEC-003 | 2026-02-10 | Orchestrator is coordination-only (no code) for v1 | Active |
| DEC-004 | 2026-02-10 | Orchestrator acts as contract guardian | Active |
| DEC-005 | 2026-02-10 | Manual project registration for v1 | Active |
