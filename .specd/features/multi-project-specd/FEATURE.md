# Feature: multi-project-specd

## What This Is

Adds an orchestrator layer to Specdacular that coordinates feature planning and execution across multiple sub-projects (monorepos or multi-repo setups). Each sub-project keeps its own independent `.specd/` while the orchestrator tracks cross-project dependencies, contracts, and sequencing.

## Technical Requirements

### Must Create

- [ ] `specdacular/workflows/map-codebase.md` — Modify to detect multi-project vs single-project and branch accordingly
- [ ] `specdacular/templates/orchestrator/PROJECTS.md` — Template for project registry (name, path, tech stack, purpose)
- [ ] `specdacular/templates/orchestrator/TOPOLOGY.md` — Template for inter-project communication patterns and data flow
- [ ] `specdacular/templates/orchestrator/CONTRACTS.md` — Template for shared interfaces, API schemas, event formats
- [ ] `specdacular/templates/orchestrator/CONCERNS.md` — Template for cross-cutting system-level gotchas
- [ ] Orchestrator-aware `new-feature` workflow logic — discussion, project routing, delegated feature creation in sub-projects
- [ ] Orchestrator-aware `plan-feature` workflow logic — per-project roadmaps + cross-project dependency graph
- [ ] Orchestrator-aware `execute-plan` workflow logic — inline execution in sub-projects with cross-project contract review after each phase
- [ ] Orchestrator-aware `next-feature` workflow logic — cross-project scheduler that picks next unblocked work, accepts optional project argument

### Must Integrate With

- `specdacular/workflows/map-codebase.md` — Entry point for multi-project detection; must branch to orchestrator flow
- `specdacular/workflows/new-feature.md` — Orchestrator delegates to existing single-project feature creation logic per sub-project
- `specdacular/workflows/plan-feature.md` — Orchestrator wraps per-project planning with cross-project dependency tracking
- `specdacular/workflows/execute-plan.md` — Orchestrator wraps per-project execution with contract validation after each phase
- `specdacular/workflows/next-feature.md` — Orchestrator adds cross-project scheduling on top of per-project state
- `commands/specd/*.md` — Commands may need awareness of orchestrator mode (to pass project argument)
- `.specd/config.json` — Must store project registry for orchestrator setups

### Constraints

- **Zero changes to single-project workflows** — All existing per-project workflows must continue working exactly as they do today. Orchestrator is additive only.
- **Sub-projects are unaware** — A sub-project's `.specd/` must work identically whether standalone or part of a multi-project setup. No multi-project metadata in sub-project files.
- **Orchestrator is coordination-only** — No code lives at the orchestrator level (for v1). It only tracks system architecture and cross-project concerns.
- **Zero dependencies** — Must use only Node.js built-ins, following existing project constraint.
- **Inline execution** — Execution in sub-projects runs inline (not background agents) so the user can interact during verification, architectural decisions, etc.

---

## Success Criteria

- [ ] `map-codebase` asks "multi-project or single?" and branches accordingly
- [ ] Orchestrator `.specd/codebase/` contains PROJECTS.md, TOPOLOGY.md, CONTRACTS.md, CONCERNS.md
- [ ] Each sub-project gets its own `.specd/codebase/` with standard MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md
- [ ] `new-feature` at orchestrator level: discuss → route to projects → create feature in orchestrator + sub-projects
- [ ] `plan-feature` creates per-project roadmaps + orchestrator-level cross-project dependency graph
- [ ] `execute-plan` runs phases in sub-projects inline, performs cross-project contract review after each phase
- [ ] `next` at orchestrator level shows cross-project progress, auto-picks or asks user, accepts optional project argument
- [ ] Contract deviation detected after execution triggers replan offer for affected projects
- [ ] Running any command inside a sub-project works exactly as single-project mode (no regressions)

---

## Out of Scope

- [X] Orchestrator as a project with its own code — For v1, orchestrator is coordination-only. Supporting the root directory as both orchestrator and project is deferred.
- [X] Parallel execution of multiple sub-projects simultaneously — For v1, execution is sequential (one phase at a time). The orchestrator knows which phases are independent but doesn't run them in parallel.
- [X] Auto-discovery of projects — For v1, projects are manually registered during setup. Auto-detection (scanning for package.json, go.mod, etc.) is deferred.
- [X] New orchestrator-specific slash commands — Existing commands gain orchestrator awareness; no new `/specd:orchestrator:*` namespace.

---

## Initial Context

### User Need
Specdacular currently works for a single repository. Users with monorepos or multi-repo setups need to coordinate features across multiple projects (UI, API, workers, etc.) while keeping each project's planning self-contained.

### Integration Points
- `map-codebase` is the entry point — must detect multi-project and set up orchestrator structure
- All feature lifecycle commands (`new-feature`, `plan-feature`, `execute-plan`, `next-feature`) gain orchestrator-level behavior when running from an orchestrator `.specd/`
- Existing single-project logic is reused via delegation (orchestrator spawns/invokes per-project workflows)

### Key Constraints
- Orchestrator is additive — existing single-project behavior must not change
- Sub-projects stay independent — portable, unaware of multi-project context
- Contracts between projects are the orchestrator's key value — tracking shared interfaces and catching deviations
