---
feature: multi-project-specd
phase: 1
plan: 02
depends_on:
  - phase-01/01-PLAN.md
creates:
  - specdacular/templates/orchestrator/config.json
  - specdacular/templates/features/DEPENDENCIES.md
modifies: []
---

# Plan 02: Create Config and Dependencies Templates

## Objective

Create the orchestrator config.json template (with `"type": "orchestrator"` and `"projects"` array) and the cross-project DEPENDENCIES.md feature template that tracks phase dependencies across projects.

## Context

**Reference these files:**
- `@specdacular/templates/features/config.json` — Existing feature config template (follow structure conventions)
- `@.specd/features/multi-project-specd/plans/phase-01/CONTEXT.md` — Phase discussion resolutions
- `@.specd/features/multi-project-specd/RESEARCH.md` — DEPENDENCIES.md format from research

**Relevant Decisions:**
- DEC-002: Per-project roadmaps with orchestrator dependency tracking
- DEC-005: Manual project registration for v1
- DEC-006: Orchestrator mode detected via config.json type field

**From Research:**
- DEPENDENCIES.md format includes project involvement table, phase dependency table, and Mermaid DAG
- Config.json uses `"type": "orchestrator"` with `"projects"` array listing sub-projects

**From Phase Discussion:**
- DEPENDENCIES.md template always exists in `templates/features/`, conditionality handled by workflow logic in Phase 3

---

## Tasks

### Task 1: Create Orchestrator config.json Template

**Files:** `specdacular/templates/orchestrator/config.json`

**Action:**
Create the orchestrator config template. This is written by `map-codebase` (Phase 2) during multi-project setup.

Follow structure from existing `specdacular/templates/features/config.json`:
```json
{
  "feature_name": "{name}",
  "created": "{date}",
  "mode": "interactive",
  "depth": "standard",
  "phases": {
    "total": 0,
    "completed": 0,
    "current": 1
  }
}
```

Create:
```json
{
  "type": "orchestrator",
  "created": "{date}",
  "projects": [
    {
      "name": "{project-name}",
      "path": "{./relative/path}",
      "description": "{One-liner purpose}"
    }
  ]
}
```

The config is intentionally minimal — just enough for mode detection (DEC-006) and project registry (DEC-005). Feature-level settings stay in each feature's own config.json.

**Verify:**
```bash
[ -f "specdacular/templates/orchestrator/config.json" ] && echo "config.json exists" || echo "MISSING"
```

**Done when:**
- [ ] `specdacular/templates/orchestrator/config.json` exists
- [ ] Contains `"type": "orchestrator"` field (DEC-006)
- [ ] Contains `"projects"` array with name, path, description per project (DEC-005)
- [ ] Follows JSON structure conventions from existing config templates

---

### Task 2: Create DEPENDENCIES.md Template

**Files:** `specdacular/templates/features/DEPENDENCIES.md`

**Action:**
Create the cross-project phase dependency graph template. Used only for orchestrator-level features — workflow logic (Phase 3) decides when to create this file.

Follow format from research findings:
```markdown
# Dependencies: {feature-name}

**Last Updated:** {YYYY-MM-DD}

## Overview

{Brief description of how this feature spans multiple projects and what each project contributes.}

---

## Project Involvement

| Project | Role | Path |
|---------|------|------|
| {project-name} | {What this project does for this feature} | {./relative/path} |

---

## Phase Dependencies

| Phase | Depends On | Status |
|-------|------------|--------|
| {project}/phase-{N} | — | pending |
| {project}/phase-{N} | {project}/phase-{N} | blocked |

**Status values:** `pending` | `blocked` | `in-progress` | `complete`

---

## Dependency Graph

```mermaid
graph TD
    A1[{project-a}/phase-1] --> A2[{project-a}/phase-2]
    B1[{project-b}/phase-1] --> B2[{project-b}/phase-2]
    A2 --> B2
```

---

## Scheduling Notes

{Notes about execution order, parallelism opportunities, and constraints.}

- Phases with no dependencies can start immediately
- Phases with all dependencies `complete` are unblocked
- The `next` command reads this table to determine what work is available
```

**Verify:**
```bash
[ -f "specdacular/templates/features/DEPENDENCIES.md" ] && echo "DEPENDENCIES.md exists" || echo "MISSING"
```

**Done when:**
- [ ] `specdacular/templates/features/DEPENDENCIES.md` exists
- [ ] Contains project involvement table (project, role, path)
- [ ] Contains phase dependencies table (phase, depends on, status)
- [ ] Contains Mermaid dependency graph placeholder
- [ ] Contains scheduling notes explaining how the `next` command uses this
- [ ] Uses `{placeholder}` convention consistently

---

## Verification

After all tasks complete:

```bash
# Check both files exist
[ -f "specdacular/templates/orchestrator/config.json" ] && echo "✓ config.json" || echo "✗ config.json MISSING"
[ -f "specdacular/templates/features/DEPENDENCIES.md" ] && echo "✓ DEPENDENCIES.md" || echo "✗ DEPENDENCIES.md MISSING"

# Verify config.json is valid JSON
python3 -c "import json; json.load(open('specdacular/templates/orchestrator/config.json'))" 2>/dev/null && echo "✓ config.json valid JSON" || echo "✗ config.json invalid JSON"
```

**Plan is complete when:**
- [ ] Both template files exist
- [ ] config.json is valid JSON with `type` and `projects` fields
- [ ] DEPENDENCIES.md has all three sections (involvement, dependencies, graph)

---

## Output

When this plan is complete:

1. Update `.specd/features/multi-project-specd/STATE.md`:
   - Mark this plan as complete
   - Update stage to `execution` if not already
   - Note phase 1 progress

2. Commit changes:
   ```bash
   git add specdacular/templates/orchestrator/config.json specdacular/templates/features/DEPENDENCIES.md
   git commit -m "feat(multi-project-specd): create config and dependencies templates

   Plan phase-01/02 complete:
   - config.json: orchestrator config with type field (DEC-006) and projects array (DEC-005)
   - DEPENDENCIES.md: cross-project phase dependency graph template"
   ```

3. Phase 1 complete after this plan. Next: Phase 2 preparation.

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/multi-project-specd/CHANGELOG.md`.

---

## Notes

{Space for the implementing agent to record discoveries during implementation.}
