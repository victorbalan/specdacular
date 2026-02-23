# Context: multi-project-specd

**Last Updated:** 2026-02-10
**Sessions:** 2

## Discussion Summary

Established a two-level architecture: an orchestrator `.specd/` that coordinates across sub-projects, and per-project `.specd/` folders that work exactly like today's single-project mode. The orchestrator is coordination-only (no code), tracks system architecture, manages cross-project contracts, and delegates real work to sub-project workflows. Existing single-project workflows stay completely untouched.

In session 2, resolved all five gray areas: orchestrator directory structure (same layout, different codebase docs + config with `"type": "orchestrator"`), map-codebase flow (sub-project mappers first in parallel, then orchestrator reads their output + does its own system-level scan), contract format (loose relationship descriptions in CONTRACTS.md that age well, specific contracts per-feature in FEATURE.md), dependency format (DEPENDENCIES.md per feature with project involvement + phase dependency graph), and feature routing (smart suggestion from discussion + CONTRACTS.md, user confirms).

---

## Resolved Questions

### How do sub-projects relate to the orchestrator?

**Question:** Should sub-projects know they're part of a multi-project setup?

**Resolution:** No. Sub-projects are completely unaware. Their `.specd/` folders work identically whether standalone or part of a multi-project setup. The orchestrator translates system-level needs into project-specific requirements that look like normal feature requirements to the sub-project.

**Details:**
- Orchestrator passes rich context when creating features in sub-projects
- That context becomes normal technical requirements in the sub-project's FEATURE.md
- Sub-project `.specd/` is portable — can be extracted and still makes sense
- Zero changes to existing per-project workflows

**Related Decisions:** DEC-001

---

### What does the orchestrator's `.specd/codebase/` contain?

**Question:** What codebase docs does the orchestrator level need?

**Resolution:** System-level architecture docs, not code-level docs. Four documents: PROJECTS.md (project registry), TOPOLOGY.md (how projects communicate), CONTRACTS.md (shared interfaces), CONCERNS.md (cross-cutting gotchas).

**Details:**
- PROJECTS.md — name, path, tech stack, purpose for each sub-project
- TOPOLOGY.md — communication patterns, data flow, shared resources
- CONTRACTS.md — API schemas, event formats, shared types (used for deviation detection)
- CONCERNS.md — system-level gotchas, cross-cutting issues

---

### How does planning work across projects?

**Question:** Unified roadmap or per-project roadmaps?

**Resolution:** Per-project roadmaps with orchestrator-level cross-project dependency tracking. Each sub-project gets its own ROADMAP.md with its own phases. The orchestrator tracks which project phases depend on which other project phases.

**Details:**
- Each sub-project's `.specd/` stays self-contained with its own ROADMAP.md
- Orchestrator maintains a dependency graph: "api/ phase 1 must complete before ui/ phase 1"
- Independent phases can be identified as parallel-ready (though v1 executes sequentially)
- Sub-project roadmaps make sense on their own even without the orchestrator

**Related Decisions:** DEC-002

---

### How does `next` work at the orchestrator level?

**Question:** How does the user navigate between projects during feature execution?

**Resolution:** `next` accepts an optional project argument. Without it, the orchestrator auto-picks the next unblocked work or asks the user if multiple projects are ready. Shows a cross-project progress dashboard.

**Details:**
- `/specd.feature:next auth-system` — auto-picks or asks
- `/specd.feature:next auth-system api` — explicitly targets API project
- After finishing a phase, returns to orchestrator level for cross-project review
- Dashboard shows per-project progress with dependency status

---

### What happens when a project deviates from the plan?

**Question:** If API changes an endpoint shape during execution, how does the UI plan get updated?

**Resolution:** The orchestrator acts as a "contract guardian." After each phase execution, it reviews whether actual output matches what other projects' plans expect. If there's a mismatch, it flags it and offers to replan affected phases in the other projects.

**Details:**
- CONTRACTS.md defines the expected interfaces between projects
- After phase execution, orchestrator checks contracts against actual implementation
- Deviations trigger: "API changed X. UI phase 2 depends on this. Update UI plan?"
- User decides whether to accept and replan, or investigate further

**Related Decisions:** DEC-004

---

### How does execution work in sub-projects?

**Question:** Should the orchestrator spawn background agents or run inline?

**Resolution:** Inline execution. The orchestrator sets context to the sub-project and runs the existing execute-plan logic directly. This allows user interaction during execution (verification failures, architectural decisions, etc.).

**Details:**
- Not background agents — user needs to interact during execution
- Orchestrator wraps the existing execute-plan workflow
- After execution returns, orchestrator does cross-project contract review
- Essentially a wrapper that adds the cross-project check

---

### What does the orchestrator `.specd/` directory structure look like?

**Question:** How does the orchestrator's file layout differ from single-project?

**Resolution:** Same top-level structure (`.specd/codebase/`, `.specd/features/`, `.specd/config.json`), but `config.json` has `"type": "orchestrator"` with a `"projects"` array listing sub-projects. Codebase docs are system-level (PROJECTS.md, TOPOLOGY.md, CONTRACTS.md, CONCERNS.md). Feature folders gain a DEPENDENCIES.md for cross-project phase tracking.

**Details:**
- `config.json`: `{"type": "orchestrator", "projects": [{"name": "api", "path": "./api", "description": "REST API"}, ...]}`
- Commands read `config.json` to decide single-project vs orchestrator mode
- Feature-level DEPENDENCIES.md tracks project involvement + phase dependency graph

**Related Decisions:** DEC-006

---

### How does map-codebase work in multi-project mode?

**Question:** What's the exact flow for the initial multi-project setup?

**Resolution:** Ask if multi-project → register projects → spawn sub-project mappers in parallel (existing logic) → wait for all to finish → orchestrator mapper reads sub-project maps AND does its own system-level codebase scan → produces orchestrator docs.

**Details:**
- Sub-project mappers run first, producing standard MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md
- Orchestrator mapper runs after, with full context from sub-project analysis
- Orchestrator also scans codebases directly for system-level things (docker-compose, cross-project imports, shared configs, deployment topology)
- One-time operation, so extra scanning cost is acceptable for richer context

**Related Decisions:** DEC-007

---

### What format do contracts take?

**Question:** How detailed should CONTRACTS.md be? Exact specs vs. loose descriptions?

**Resolution:** Loose relationship descriptions that age well. CONTRACTS.md describes the nature of relationships (communication patterns, shared domains, source of truth). Specific contracts for a feature are defined in the feature's orchestrator FEATURE.md during planning — that's what gets checked for deviations.

**Details:**
- CONTRACTS.md: "API ↔ UI communicate via REST, shared domains are Auth and Users, API defines the contract"
- Feature FEATURE.md: "API must expose login endpoint, UI must consume it" (specific to the feature)
- Deviation detection runs against feature-level expectations, not global CONTRACTS.md
- CONTRACTS.md is stable reference for project routing ("auth touches API and UI")

**Related Decisions:** DEC-008

---

### How does cross-project dependency tracking work?

**Question:** How does the orchestrator store and read the phase dependency graph?

**Resolution:** Per-feature DEPENDENCIES.md in the orchestrator's feature folder. Lists which projects are involved with their responsibilities, then defines phase dependencies as a simple directed graph.

**Details:**
- Project involvement section: which projects and what each does for this feature
- Phase dependencies section: `api/phase-1 → no deps`, `ui/phase-2 → after api/phase-2, ui/phase-1`
- `next` command reads this to determine what's unblocked
- Created during `plan-feature` at orchestrator level

---

### How does feature routing work?

**Question:** How does the orchestrator decide which projects a feature involves?

**Resolution:** Smart suggestion + user confirmation. During the initial feature discussion, the orchestrator picks up on clues from the conversation and cross-references CONTRACTS.md to suggest involved projects. User confirms or adjusts.

**Details:**
- Orchestrator uses discussion context ("needs an API endpoint and a login page")
- Cross-references CONTRACTS.md ("auth domain involves API and UI")
- Proposes: "These projects will be involved: api, ui. Look right?"
- User can add or remove projects from the suggestion
- No magic auto-detection, just informed suggestion

---

## Deferred Questions

### Can the orchestrator also be a project?

**Reason:** Not needed for v1. Most multi-project setups have the orchestrator as pure coordination.
**Default for now:** Orchestrator is coordination-only, no code.
**Revisit when:** User requests it or a clear use case emerges (e.g., monorepo with shared code at root).

### Should project auto-discovery be supported?

**Reason:** One-time manual setup is sufficient for v1. Auto-discovery adds complexity.
**Default for now:** Projects are manually registered in `.specd/config.json`.
**Revisit when:** Users find manual registration tedious or when supporting very large monorepos.

### Should parallel execution across projects be supported?

**Reason:** V1 executes sequentially. The orchestrator knows which phases are independent but doesn't run them simultaneously.
**Default for now:** Sequential execution, but dependency graph allows identifying parallel-ready phases.
**Revisit when:** Users need speed optimization for large multi-project features.

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-10 | Overall architecture, orchestrator vs sub-project separation, codebase mapping, feature creation flow, planning approach, execution and contracts, next command behavior | 5 decisions recorded, core architecture established |
| 2026-02-10 | Orchestrator directory structure, map-codebase flow, contract format, dependency format, feature routing | 3 new decisions, all 5 gray areas resolved |

---

## Gray Areas Remaining

(none — all resolved in session 2)

---

## Quick Reference

- **Feature:** `.specd/features/multi-project-specd/FEATURE.md`
- **Decisions:** `.specd/features/multi-project-specd/DECISIONS.md`
- **Research:** `.specd/features/multi-project-specd/RESEARCH.md` (if exists)
