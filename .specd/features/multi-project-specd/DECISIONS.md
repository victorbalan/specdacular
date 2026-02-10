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

### DEC-006: Orchestrator mode detected via config.json type field

**Date:** 2026-02-10
**Status:** Active
**Context:** Commands need to know whether they're running in single-project or orchestrator mode to branch behavior accordingly.
**Decision:** `.specd/config.json` has a `"type": "orchestrator"` field. Commands read this to decide which mode to operate in. Absence of the field (or `"type": "project"`) means single-project mode.
**Rationale:**
- Simple, explicit flag — no heuristics needed
- Set once during `map-codebase`, read by all subsequent commands
- Backwards compatible — existing single-project configs without `type` default to single-project
**Implications:**
- All orchestrator-aware commands must check `config.json` type field at startup
- `map-codebase` writes the type field during initial setup
- Config format: `{"type": "orchestrator", "projects": [...]}`

---

### DEC-007: Sub-project mappers run first, orchestrator mapper runs after with full context

**Date:** 2026-02-10
**Status:** Active
**Context:** Needed to decide the order of mapping in multi-project mode — orchestrator first, sub-projects first, or parallel.
**Decision:** Sub-project mappers run first in parallel (existing logic). After all complete, the orchestrator mapper runs with access to all sub-project analysis AND does its own system-level codebase scan.
**Rationale:**
- Orchestrator docs are more accurate when informed by actual sub-project analysis
- CONTRACTS.md and TOPOLOGY.md can reference real endpoints, types, and patterns found in code
- Sub-project mapping is the heavy lifting; orchestrator synthesis is fast since it reads existing docs
- Orchestrator also scans codebases directly for system-level artifacts (docker-compose, cross-project imports, shared configs)
- One-time operation, so extra scanning cost is acceptable for richer context
**Implications:**
- Map-codebase flow: register projects → parallel sub-project mappers → wait → orchestrator mapper
- Orchestrator mapper has richest possible context (sub-project docs + its own scan)

---

### DEC-008: Loose contracts in CONTRACTS.md, specific contracts per-feature

**Date:** 2026-02-10
**Status:** Active
**Context:** Needed to decide how detailed CONTRACTS.md should be. Exact API specs would go stale quickly if not continuously updated.
**Decision:** CONTRACTS.md describes the nature of relationships between projects (communication patterns, shared domains, source of truth) — loose descriptions that age well. Specific contracts for a feature are defined in the feature's orchestrator FEATURE.md during planning — that's what deviation detection checks against.
**Rationale:**
- Detailed specs go stale the moment someone pushes a change
- Relationship descriptions (REST, pub/sub, shared DB) change rarely
- Feature-level contracts are specific and scoped — easier to keep accurate
- CONTRACTS.md serves as stable reference for project routing during feature creation
**Implications:**
- CONTRACTS.md is a reference document, not a living spec
- Deviation detection runs against feature FEATURE.md expectations, not CONTRACTS.md
- Feature routing uses CONTRACTS.md to suggest which projects are involved

---

### DEC-009: Validate dependency graph for cycles during planning

**Date:** 2026-02-10
**Status:** Active
**Context:** Research identified circular dependency deadlock as a critical pitfall. If Project A phase 2 depends on Project B phase 2, which depends on Project A phase 2, the scheduler deadlocks.
**Decision:** Run topological sort on the cross-project dependency graph during `plan-feature`. Fail and ask user to restructure if cycles are detected. Re-validate after any replan.
**Rationale:**
- Proven pattern from CI/CD tools (GitHub Actions, Nx)
- Catches deadlocks before execution, not during
- Topological sort is simple and well-understood
**Implications:**
- `plan-feature` orchestrator flow must include cycle detection step
- After replanning (due to contract deviations), re-validate graph
**References:**
- Nx dependency graph validation
- GitHub Actions `needs` validation

---

### DEC-010: Limit replan cascade depth to 2

**Date:** 2026-02-10
**Status:** Active
**Context:** Research shows cascading failures are amplified in multi-agent LLM systems. One contract deviation can trigger replans that cascade through the entire system.
**Decision:** After 2 cascading replans triggered by a single change, pause and ask user to review the overall approach before continuing. Batch all deviations from a phase before triggering any replans.
**Rationale:**
- Research shows 41-86.7% failure rates in multi-agent systems, with cascading failures as a primary cause
- Human review prevents the orchestrator from spiraling into unproductive replan loops
- Batching deviations gives a complete picture before acting
**Implications:**
- Track replan chain depth in orchestrator state
- Show full impact analysis before replanning: "Changing X affects Y, Z, W"
- After depth 2, force pause: "Multiple cascading replans detected. Review overall approach?"

---

### DEC-011: One active orchestrator session at a time

**Date:** 2026-02-10
**Status:** Active
**Context:** Research identified stale state race conditions as a critical pitfall. File-based state with no locking means concurrent Claude Code sessions can read/write state simultaneously.
**Decision:** Document "one active session at a time" as a constraint for orchestrator mode. Re-read all state files before determining next action.
**Rationale:**
- File-based state has no locking mechanism
- Concurrent sessions cause stale dependency graphs and wrong scheduling
- Adding proper locking would require runtime code (violates zero-dependency constraint)
**Implications:**
- Document this constraint in orchestrator setup
- `next` command always re-reads state files fresh before scheduling
- Future: could add advisory `.specd/.lock` file

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
| DEC-006 | 2026-02-10 | Orchestrator mode detected via config.json type field | Active |
| DEC-007 | 2026-02-10 | Sub-project mappers run first, orchestrator mapper runs after | Active |
| DEC-008 | 2026-02-10 | Loose contracts in CONTRACTS.md, specific contracts per-feature | Active |
| DEC-009 | 2026-02-10 | Validate dependency graph for cycles during planning | Active |
| DEC-010 | 2026-02-10 | Limit replan cascade depth to 2 | Active |
| DEC-011 | 2026-02-10 | One active orchestrator session at a time | Active |
