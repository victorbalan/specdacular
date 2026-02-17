# Workflow: Plan Task (Orchestrator Mode)

This workflow handles planning when the task's `config.json` has `"orchestrator": true`.
Called from the main `plan.md` workflow after orchestrator mode detection.

## Input

- `$TASK_NAME` — Validated task name
- Orchestrator config and context already loaded

## Steps

<step name="load_cross_project_context">
Load system-level and sub-project context.

**System-level codebase docs:**
- `.specd/codebase/PROJECTS.md` — Project registry
- `.specd/codebase/TOPOLOGY.md` — Communication patterns
- `.specd/codebase/CONTRACTS.md` — Shared interfaces

**Sub-project context:**
From task config.json `"projects"` array, for each project:
- Read `{project-path}/.specd/tasks/{task-name}/FEATURE.md` — Project-specific requirements
- Read `{project-path}/.specd/codebase/MAP.md` — Project code overview (if exists)
- Read `{project-path}/.specd/codebase/PATTERNS.md` — Project patterns (if exists)

```
Orchestrator mode: {N} projects involved in this task.
Loading cross-project context for phase derivation.
```

Continue to derive_phases.
</step>

<step name="derive_phases">
Derive phases for all involved projects in a single orchestrator pass.

**For each project, analyze:**
- Project's FEATURE.md requirements
- Project's codebase patterns
- Cross-project dependencies (from CONTRACTS.md, TOPOLOGY.md)

**Derive per-project phases:**
Apply dependency-driven phasing for each project:
1. Types/interfaces needed
2. Data layer changes
3. Business logic
4. UI components (if applicable)
5. Integration/wiring

Adjust per project — not all projects need all phases.

**Present consolidated view:**
```
Here's the proposed phase structure across all projects:

**{project-1}** ({N} phases):
  Phase 1: {Name} — {Goal}
  Phase 2: {Name} — {Goal}

**{project-2}** ({N} phases):
  Phase 1: {Name} — {Goal}

**Cross-project dependencies (preliminary):**
- {project-1}/phase-1 → no cross-project deps
- {project-2}/phase-2 → after {project-1}/phase-2

Does this phasing make sense? Any adjustments?
```

Use AskUserQuestion to confirm or adjust.

Continue to write_project_roadmaps.
</step>

<step name="write_project_roadmaps">
Write ROADMAP.md for each involved sub-project.

For each project, use template at `~/.claude/specdacular/templates/tasks/ROADMAP.md`.

**IMPORTANT:** Sub-project ROADMAP.md must be self-contained. Dependencies listed are intra-project only. No references to other projects.

**Create phase directories:**
```bash
mkdir -p {project-path}/.specd/tasks/{task-name}/phases/phase-01
# ... for each phase
```

**Update sub-project STATE.md and config.json** with planning status.

Continue to build_dependency_graph.
</step>

<step name="build_dependency_graph">
Build cross-project phase dependency graph.

**Analyze:** For each phase across all projects, determine cross-project dependencies using:
- CONTRACTS.md — Interface creation/consumption
- TOPOLOGY.md — Communication patterns
- Per-project FEATURE.md — Integration points
- Per-project ROADMAP.md — Phase goals

**Present dependency table and confirm with user.**

Continue to validate_dependencies.
</step>

<step name="validate_dependencies">
Validate the dependency graph has no cycles.

**Perform topological sort.** If cycle detected, present options to user to resolve.

Continue to write_dependencies.
</step>

<step name="write_dependencies">
Write DEPENDENCIES.md in orchestrator's task folder.

Contents:
- Project Involvement table
- Phase Dependencies table (all "pending" initially)
- Mermaid DAG visualization
- Scheduling Notes

**Update orchestrator STATE.md and config.json** to stage: planned.

Continue to commit.
</step>

<step name="commit">
Commit all roadmaps and dependency graph.

@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** Orchestrator DEPENDENCIES.md, STATE.md, config.json + per-project ROADMAP.md, phases/, STATE.md, config.json
- **$MESSAGE:** `docs({task-name}): create multi-project roadmap`
- **$LABEL:** `multi-project roadmap creation`

Continue to completion.
</step>

<step name="completion">
Present multi-project roadmap summary.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MULTI-PROJECT ROADMAP CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Task:** {task-name}

## Per-Project Phases

{For each project:}
**{project-name}** ({N} phases):
  Phase 1: {Name} — {Goal}
  ...

## Cross-Project Dependencies

{dependency summary}

## What's Next

/specd:continue {task-name} — Start executing phases
```

End workflow.
</step>
