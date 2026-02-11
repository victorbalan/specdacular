---
feature: multi-project-specd
phase: 2
plan: 02
depends_on:
  - phase-02/01-PLAN.md
creates: []
modifies:
  - specdacular/workflows/map-codebase.md
---

# Plan 02: Add Multi-Project Flow to map-codebase

## Objective

Add the full multi-project mapping flow: project registration, per-project mapper spawning, orchestrator mapper, and orchestrator commit — all as new steps that branch from `detect_mode` when mode = "orchestrator".

## Context

**Reference these files:**
- `@specdacular/workflows/map-codebase.md` — Workflow being modified (already has detect_mode from Plan 01)
- `@.specd/features/multi-project-specd/plans/phase-02/CONTEXT.md` — Phase discussion resolutions
- `@specdacular/templates/orchestrator/PROJECTS.md` — Template for PROJECTS.md
- `@specdacular/templates/orchestrator/TOPOLOGY.md` — Template for TOPOLOGY.md
- `@specdacular/templates/orchestrator/CONTRACTS.md` — Template for CONTRACTS.md
- `@specdacular/templates/orchestrator/CONCERNS.md` — Template for CONCERNS.md
- `@specdacular/templates/orchestrator/config.json` — Orchestrator config template

**Relevant Decisions:**
- DEC-001: Sub-projects are unaware of multi-project setup
- DEC-005: Manual project registration for v1 (with auto-suggestion)
- DEC-006: Config.json type field for mode detection
- DEC-007: Sub-project mappers run first, orchestrator mapper runs after
- DEC-012: specd_version at both levels

**From Phase Discussion:**
- All per-project agents spawn in parallel (one batch)
- One orchestrator mapper agent for all 4 orchestrator docs
- Auto-suggest projects from directory scan, user confirms
- Scan for: package.json, go.mod, Cargo.toml, pyproject.toml, pom.xml, build.gradle, Makefile, Gemfile

---

## Tasks

### Task 1: Add register_projects step

**Files:** `specdacular/workflows/map-codebase.md`

**Action:**
Add `register_projects` step after `detect_mode`. This step scans for projects, suggests them, and lets the user confirm.

Insert this step after `detect_mode` (only reached when mode = "orchestrator"):

```markdown
<step name="register_projects">
Register sub-projects for orchestrator mode.

**Scan for project markers in immediate subdirectories:**

```bash
# Find directories with common project markers
for dir in */; do
  if [ -f "${dir}package.json" ] || [ -f "${dir}go.mod" ] || [ -f "${dir}Cargo.toml" ] || [ -f "${dir}pyproject.toml" ] || [ -f "${dir}pom.xml" ] || [ -f "${dir}build.gradle" ] || [ -f "${dir}Makefile" ] || [ -f "${dir}Gemfile" ]; then
    echo "${dir%/}"
  fi
done
```

**Present found projects:**
```
Found these potential projects:
- {dir1}/ (has package.json)
- {dir2}/ (has go.mod)
- {dir3}/ (has package.json)

These will be registered as sub-projects.
```

Use AskUserQuestion:
- header: "Projects"
- question: "Are these the right projects? You can adjust in the next step."
- options:
  - "Yes, these are correct" — Continue with found projects
  - "I need to adjust" — Let user add/remove projects

**If "I need to adjust":**
Ask user to describe which projects to add or remove. Update the list accordingly.

**For each project, ask for a one-liner description:**
Use AskUserQuestion for each project (or batch if 3 or fewer):
- header: "{project-name}"
- question: "Brief description of {project-name}?"
- options: Provide 2-3 inferred descriptions based on directory contents + "Something else"

**Build project registry:**
```json
[
  {"name": "{dir1}", "path": "./{dir1}", "description": "{user description}"},
  {"name": "{dir2}", "path": "./{dir2}", "description": "{user description}"}
]
```

Continue to create_orchestrator_structure.
</step>
```

**Verify:**
```bash
grep -c "register_projects" specdacular/workflows/map-codebase.md
```
Should return at least 2.

**Done when:**
- [ ] `register_projects` step exists
- [ ] Scans immediate subdirectories for project markers
- [ ] Presents found projects with AskUserQuestion
- [ ] Collects descriptions for each project
- [ ] Builds project registry array

---

### Task 2: Add create_orchestrator_structure and spawn_per_project_agents steps

**Files:** `specdacular/workflows/map-codebase.md`

**Action:**
Add two steps: one to create the orchestrator `.specd/` structure, and one to spawn per-project mapper agents in parallel.

**Step: create_orchestrator_structure**

```markdown
<step name="create_orchestrator_structure">
Create orchestrator-level .specd/ directory and config.

```bash
mkdir -p .specd/codebase
```

**Write .specd/config.json:**
```json
{
  "type": "orchestrator",
  "specd_version": 1,
  "created": "{YYYY-MM-DD}",
  "projects": [
    {For each registered project:}
    {"name": "{name}", "path": "{path}", "description": "{description}"}
  ]
}
```

**Create per-project .specd/ structures:**
For each registered project:
```bash
mkdir -p {project-path}/.specd/codebase
```

**Write per-project config.json:**
For each registered project, write `{project-path}/.specd/config.json`:
```json
{
  "type": "project",
  "specd_version": 1,
  "created": "{YYYY-MM-DD}"
}
```

Continue to spawn_per_project_agents.
</step>
```

**Step: spawn_per_project_agents**

```markdown
<step name="spawn_per_project_agents">
Spawn 4 mapper agents per sub-project, all in parallel.

For each registered project, spawn the same 4 agents as the single-project flow (map, patterns, structure, concerns), but scoped to the project's directory.

**CRITICAL:** Each agent's prompt must specify the project path so it writes to `{project-path}/.specd/codebase/`.

Use Task tool with `subagent_type="specd-codebase-mapper"` and `run_in_background=true`.

**Per project, spawn 4 agents:**

Agent prompts follow the same pattern as the single-project agents in `spawn_agents`, with these modifications:
- Working directory context: "This project is at {project-path}/"
- Output path: "Write to {project-path}/.specd/codebase/{DOC}.md"
- Scope: "Only analyze code within {project-path}/"

All agents (across all projects) are spawned simultaneously for maximum parallelism.

Wait for all agents to complete. Verify each project has all 4 documents.

```bash
# Verify per-project docs
for project in {project-paths}; do
  echo "Checking $project..."
  ls -la "$project/.specd/codebase/"
  wc -l "$project/.specd/codebase/"*.md 2>/dev/null
done
```

If any agents failed, note which project/document and continue.

Continue to spawn_orchestrator_agent.
</step>
```

**Verify:**
```bash
grep -c "spawn_per_project_agents" specdacular/workflows/map-codebase.md
grep -c "create_orchestrator_structure" specdacular/workflows/map-codebase.md
```
Both should return at least 2.

**Done when:**
- [ ] `create_orchestrator_structure` step creates orchestrator config + per-project configs
- [ ] `spawn_per_project_agents` step spawns 4 agents per project in parallel
- [ ] Agents scoped to project directories
- [ ] Verification checks all projects have all 4 docs

---

### Task 3: Add spawn_orchestrator_agent step and multi-project commit

**Files:** `specdacular/workflows/map-codebase.md`

**Action:**
Add the orchestrator mapper agent step (runs after all per-project agents) and a multi-project commit step.

**Step: spawn_orchestrator_agent**

```markdown
<step name="spawn_orchestrator_agent">
Spawn a single orchestrator mapper agent to synthesize system-level docs.

This agent runs AFTER all per-project mappers complete (DEC-007). It reads sub-project codebase docs and scans codebases for system-level artifacts.

Use Task tool:
```
subagent_type: "specd-codebase-mapper"
model: "sonnet"
run_in_background: true
description: "Map orchestrator system docs"
```

Prompt:
```
Focus: orchestrator

You are mapping a multi-project system. Sub-project analysis is already complete.

**Projects in this system:**
{For each project: name, path, description}

**Sub-project docs available:**
{For each project: list the 4 .specd/codebase/ files}

**Your job:**
1. Read all sub-project codebase docs (MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md for each project)
2. Scan codebases for system-level artifacts:
   - docker-compose.yml, docker files
   - CI/CD configs (.github/workflows/, .gitlab-ci.yml, etc.)
   - Shared configs (eslint, prettier, tsconfig at root)
   - Cross-project imports or references
   - Shared databases, APIs, message queues
3. Write 4 orchestrator-level docs to .specd/codebase/:

**PROJECTS.md** — Project registry with responsibilities and entry points
Follow template structure: registry table, per-project details, codebase doc links.

**TOPOLOGY.md** — How projects communicate
Follow template: per-relationship sections with communication method, pattern, shared domains, source of truth, data flow. Include shared resources table and Mermaid diagram.

**CONTRACTS.md** — Shared interface descriptions (keep loose per DEC-008)
Follow template: per-relationship contract nature. Describe relationships, not specific endpoints.

**CONCERNS.md** — Cross-cutting system-level gotchas
Follow template: per-concern with scope, issue, impact, mitigation. Focus on SYSTEM-level concerns that span projects, not project-internal concerns.

Return confirmation with line counts for all 4 docs.
```

Wait for orchestrator agent to complete. Verify docs exist:

```bash
ls -la .specd/codebase/
wc -l .specd/codebase/*.md
```

Continue to commit_orchestrator_map.
</step>
```

**Step: commit_orchestrator_map**

```markdown
<step name="commit_orchestrator_map">
Commit all mapping results (orchestrator + all sub-projects).

```bash
# Add orchestrator docs and config
git add .specd/codebase/*.md .specd/config.json

# Add per-project docs and configs
{For each project:}
git add {project-path}/.specd/codebase/*.md {project-path}/.specd/config.json

git commit -m "docs: map multi-project codebase for Claude

Orchestrator:
- PROJECTS.md - Project registry
- TOPOLOGY.md - Communication patterns
- CONTRACTS.md - Shared interfaces
- CONCERNS.md - System-level gotchas

Projects mapped:
- {project-1}: MAP, PATTERNS, STRUCTURE, CONCERNS
- {project-2}: MAP, PATTERNS, STRUCTURE, CONCERNS
...

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Continue to orchestrator_completion.
</step>
```

**Step: orchestrator_completion**

```markdown
<step name="orchestrator_completion">
Present multi-project completion summary.

```
Multi-project codebase mapped for Claude.

Orchestrator (.specd/codebase/):
- PROJECTS.md ({N} lines) — Project registry
- TOPOLOGY.md ({N} lines) — Communication patterns
- CONTRACTS.md ({N} lines) — Shared interfaces
- CONCERNS.md ({N} lines) — System-level concerns

{For each project:}
{project-name} ({project-path}/.specd/codebase/):
- MAP.md ({N} lines) — Navigation
- PATTERNS.md ({N} lines) — Code patterns
- STRUCTURE.md ({N} lines) — File organization
- CONCERNS.md ({N} lines) — Project-level gotchas

These docs help Claude understand your system across projects.
```

End workflow.
</step>
```

Also update the `<success_criteria>` at the end of the workflow to include multi-project criteria.

**Verify:**
```bash
grep -c "spawn_orchestrator_agent" specdacular/workflows/map-codebase.md
grep -c "commit_orchestrator_map" specdacular/workflows/map-codebase.md
grep -c "orchestrator_completion" specdacular/workflows/map-codebase.md
```
All should return at least 1.

**Done when:**
- [ ] `spawn_orchestrator_agent` step spawns single agent with full sub-project context
- [ ] Orchestrator agent writes PROJECTS.md, TOPOLOGY.md, CONTRACTS.md, CONCERNS.md
- [ ] `commit_orchestrator_map` commits all project + orchestrator docs
- [ ] `orchestrator_completion` shows multi-project summary
- [ ] Success criteria updated for multi-project

---

## Verification

After all tasks complete:

```bash
# Verify all new steps exist
for step in detect_mode register_projects create_orchestrator_structure spawn_per_project_agents spawn_orchestrator_agent commit_orchestrator_map orchestrator_completion; do
  grep -q "$step" specdacular/workflows/map-codebase.md && echo "✓ $step" || echo "✗ $step MISSING"
done

# Verify existing steps still exist (no regression)
for step in check_existing check_existing_docs create_structure spawn_agents collect_confirmations verify_output commit_codebase_map completion; do
  grep -q "$step" specdacular/workflows/map-codebase.md && echo "✓ $step (existing)" || echo "✗ $step MISSING (REGRESSION)"
done
```

**Plan is complete when:**
- [ ] All 7 new steps exist in the workflow
- [ ] All 8 existing steps still exist (no regression)
- [ ] Multi-project flow: detect → register → create structure → per-project agents → orchestrator agent → commit
- [ ] Single-project flow unchanged except for config.json addition (Plan 01)

---

## Output

When this plan is complete:

1. Update `.specd/features/multi-project-specd/STATE.md`:
   - Mark this plan as complete
   - Mark Phase 2 as complete

2. Commit changes:
   ```bash
   git add specdacular/workflows/map-codebase.md
   git commit -m "feat(multi-project-specd): add multi-project flow to map-codebase

   Plan phase-02/02 complete:
   - register_projects: auto-suggest + user confirm
   - create_orchestrator_structure: orchestrator + per-project configs
   - spawn_per_project_agents: 4 agents per project, all parallel
   - spawn_orchestrator_agent: single agent for system docs
   - Multi-project commit and completion summary"
   ```

3. Phase 2 complete. Next: Phase 3 preparation.

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/multi-project-specd/CHANGELOG.md`.

---

## Notes

{Space for the implementing agent to record discoveries during implementation.}
