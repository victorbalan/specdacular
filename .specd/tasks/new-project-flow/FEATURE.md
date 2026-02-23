# Task: new-project-flow

## What This Is

A new `/specd.new-project` command that guides users from "I have an idea" to "I have a structured plan ready to build" for greenfield projects. Unlike `/specd.new` which adds tasks to existing codebases, this bootstraps entire projects (or multi-service systems) through collaborative questioning, domain research, requirements scoping, and roadmap generation — producing an orchestrator setup with per-project task lifecycles.

## Technical Requirements

### Must Create

- [ ] `commands/specd.new-project.md` — Slash command definition with frontmatter, execution_context pointing to workflow
- [ ] `specdacular/workflows/new-project.md` — Main workflow: questioning → PROJECT.md → research → requirements → roadmap → scaffold
- [ ] `specdacular/templates/tasks/PROJECT.md` — Template for project vision document (system-level goals, users, constraints, key decisions)
- [ ] `specdacular/templates/tasks/REQUIREMENTS.md` — Template for scoped v1 requirements with REQ-IDs by category

### Must Integrate With

- `specdacular/workflows/continue.md` — No changes needed (DEC-006: standalone command)
- `.specd/config.json` — Orchestrator config: `"type": "orchestrator"` with `projects` array listing sub-projects
- `specdacular/workflows/new.md` — Existing `codebase_context` step already checks for orchestrator mode; new-project scaffolded sub-projects feed into this
- `agents/specd-codebase-mapper.md` — Not used during new-project (no codebase yet), but scaffolded projects will use it later
- `specdacular/agents/feature-researcher.md` — Adapt or create project-level researcher agents for stack/features/architecture/pitfalls research

### Constraints

- Zero dependencies — No npm packages, Node scripts, or external tools. Pure markdown workflows + Claude Code tools
- Follows existing patterns — Command → workflow → templates structure, same as all other specd commands
- Multi-project support — A single new-project run can identify and scaffold multiple sub-projects (ui, api, worker, etc.)
- Orchestrator-first — System-level docs live at orchestrator root `.specd/tasks/project/`, sub-projects each get their own `.specd/`
- Reuses existing lifecycle — After scaffolding, each sub-project uses `/specd.continue` for discuss → research → plan → execute → review

---

## Success Criteria

- [ ] `/specd.new-project` command is available and runs the full flow
- [ ] Questioning phase produces a PROJECT.md with clear vision, goals, users, and constraints
- [ ] Research phase spawns parallel agents for stack, features, architecture, pitfalls — writes findings to `.specd/tasks/project/research/`
- [ ] Requirements phase produces REQUIREMENTS.md with categorized REQ-IDs, v1/v2/out-of-scope scoping
- [ ] Roadmap phase produces ROADMAP.md with phases mapped to requirements, identifies sub-projects
- [ ] Sub-projects are scaffolded: directories created, `.specd/config.json` initialized per project, orchestrator config updated with `projects` array
- [ ] `/specd.continue project` can drive through each stage of the project setup
- [ ] Each scaffolded sub-project can independently run `/specd.new` and `/specd.continue`

---

## Out of Scope

- [X] Modifying existing `/specd.new` behavior — That command stays for adding tasks to existing codebases
- [X] Auto-execution of sub-project tasks — Scaffolding creates the structure, user drives each project separately
- [X] CI/CD or deployment scaffolding — This is about planning and requirements, not devops
- [X] Package manager integration — No `npm init`, `cargo init`, etc. Just `.specd/` documentation structure

---

## Initial Context

### User Need
Users starting a new project from scratch have no codebase to map. They need help making foundational decisions (stack, architecture, project structure) before any code exists. Current specd flow assumes an existing codebase.

### Integration Points
- Orchestrator mode in `.specd/config.json` — multi-project coordination
- `/specd.continue` workflow — needs to handle project-type tasks with different stages
- Research agents — need project-level variants (stack, features, architecture, pitfalls)
- Template system — new templates for PROJECT.md and REQUIREMENTS.md

### Key Constraints
- Must produce artifacts that downstream specd workflows can consume
- Sub-projects identified during roadmap phase must be scaffoldable as independent specd-managed projects
- The questioning phase should support both user-specified projects ("I need a React frontend and a Node API") and emergent projects (research reveals the need for a worker service)
