# Context: multi-project-specd

**Last Updated:** 2026-02-10
**Sessions:** 1

## Discussion Summary

Discussed the need for multi-project support in Specdacular. Established a two-level architecture: an orchestrator `.specd/` that coordinates across sub-projects, and per-project `.specd/` folders that work exactly like today's single-project mode. The orchestrator is coordination-only (no code), tracks system architecture, manages cross-project contracts, and delegates real work to sub-project workflows. Existing single-project workflows stay completely untouched.

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
- `/specd:feature:next auth-system` — auto-picks or asks
- `/specd:feature:next auth-system api` — explicitly targets API project
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

---

## Gray Areas Remaining

- [ ] Orchestrator `.specd/` directory structure — exact file layout and how it differs from single-project `.specd/`
- [ ] `map-codebase` multi-project flow — exact UX for project registration (how many questions, what info to collect)
- [ ] Cross-project dependency format — how the orchestrator stores and reads the dependency graph between project phases
- [ ] Contract format — what CONTRACTS.md looks like and how deviation detection works in practice
- [ ] How `new-feature` routes to projects — automatic detection from discussion vs. explicit user selection vs. both

---

## Quick Reference

- **Feature:** `.specd/features/multi-project-specd/FEATURE.md`
- **Decisions:** `.specd/features/multi-project-specd/DECISIONS.md`
- **Research:** `.specd/features/multi-project-specd/RESEARCH.md` (if exists)
