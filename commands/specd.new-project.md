---
name: specd.new-project
description: Bootstrap a new project from idea to structured plan
argument-hint: "[project-name]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - AskUserQuestion
  - Task
---

<objective>
Guide users from "I have an idea" to a structured project plan for greenfield projects. Unlike `/specd.new` which adds tasks to existing codebases, this bootstraps entire projects (or multi-service systems) through collaborative questioning, domain research, requirements scoping, and roadmap generation — producing an orchestrator setup with per-project task lifecycles.

**Stages:**
1. **Questioning** — Collaborative discussion to understand vision, goals, users, constraints
2. **Research** — Parallel agents investigate stack, features, architecture, pitfalls
3. **Requirements** — Multi-select scoping from research findings → REQUIREMENTS.md
4. **Roadmap** — Phase planning mapped to requirements, identifies sub-projects
5. **Scaffolding** — Create orchestrator config, sub-project directories, seed setup tasks

**Creates:**
- `.specd/tasks/project/PROJECT.md` — Project vision and goals
- `.specd/tasks/project/research/` — Stack, features, architecture, pitfalls findings
- `.specd/tasks/project/REQUIREMENTS.md` — Scoped v1 requirements with REQ-IDs
- `.specd/tasks/project/ROADMAP.md` — Phased execution plan
- `.specd/config.json` — Orchestrator config with projects array
- Per sub-project: `.specd/config.json` + `.specd/tasks/setup/FEATURE.md`

**This is a standalone command.** It runs its own sequential flow and exits. After scaffolding, use `/specd.new` and `/specd.continue` on individual sub-projects.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/new-project.md
</execution_context>

<context>
Project name: $ARGUMENTS

**No codebase context needed** — this is for greenfield projects with no existing code.

**References:**
- `~/.claude/specdacular/templates/tasks/PROJECT.md` — Project vision template
- `~/.claude/specdacular/templates/tasks/REQUIREMENTS.md` — Requirements template (Phase 3)
- `~/.claude/specdacular/agents/project-researcher.md` — Research agent (Phase 2)
</context>

<success_criteria>
- [ ] Questioning produces PROJECT.md with clear vision, goals, users, constraints
- [ ] Research spawns parallel agents for 4 domains (Phase 2)
- [ ] Requirements scoped via multi-select from research (Phase 3)
- [ ] Roadmap generated with phases mapped to requirements (Phase 3)
- [ ] Sub-projects scaffolded with orchestrator config (Phase 4)
- [ ] Each sub-project independently runnable via `/specd.new` and `/specd.continue`
</success_criteria>
