---
feature: multi-project-specd
phase: 4
plan: 01
depends_on: []
creates: []
modifies:
  - specdacular/workflows/plan-feature.md
---

# Plan 01: Orchestrator Detection & Multi-Project Phase Derivation

## Objective

Add orchestrator mode detection to `load_context`, orchestrator-specific phase derivation that produces per-project phases in a single pass, and user confirmation of the consolidated view.

## Context

**Reference these files:**
- `@specdacular/workflows/plan-feature.md` — Workflow being modified
- `@.specd/features/multi-project-specd/plans/phase-04/CONTEXT.md` — Phase discussion resolutions
- `@.specd/features/multi-project-specd/DECISIONS.md` — Active decisions
- `@specdacular/templates/features/ROADMAP.md` — Roadmap template

**Relevant Decisions:**
- DEC-001: Sub-projects unaware — per-project ROADMAP.md is self-contained
- DEC-002: Per-project roadmaps with orchestrator dependency tracking
- DEC-006: Config.json type field for mode detection

**From Phase Discussion:**
- Detection merges into existing `load_context` step
- Single-pass derivation: orchestrator derives all project phases at once
- Present consolidated view, user confirms/adjusts

---

## Tasks

### Task 1: Add orchestrator detection to load_context step

**Files:** `specdacular/workflows/plan-feature.md`

**Action:**
Modify the existing `load_context` step to detect orchestrator mode and load cross-project context.

After the existing context loading, add:

```markdown
**Check for orchestrator mode:**

Read feature's `config.json`. If `"orchestrator": true`:

Set mode = "orchestrator".

**Load orchestrator-level context:**
- Orchestrator FEATURE.md — System-level requirements, project responsibilities
- Orchestrator CONTEXT.md — Cross-project discussion, resolved questions
- Orchestrator DECISIONS.md — System-level decisions

**Load system-level codebase docs:**
- `.specd/codebase/PROJECTS.md` — Project registry
- `.specd/codebase/TOPOLOGY.md` — Communication patterns
- `.specd/codebase/CONTRACTS.md` — Shared interfaces

**Load sub-project feature context:**
From feature config.json `"projects"` array, for each project:
- Read `{project-path}/.specd/features/{feature-name}/FEATURE.md` — Project-specific requirements
- Read `{project-path}/.specd/codebase/MAP.md` — Project code overview (if exists)
- Read `{project-path}/.specd/codebase/PATTERNS.md` — Project patterns (if exists)

```
Orchestrator mode: {N} projects involved in this feature.
Loading cross-project context for phase derivation.
```

Continue to orchestrator_derive_phases.

**If not orchestrator:**
Set mode = "project".
Continue with existing flow (assess_readiness).
```

**Verify:**
```bash
grep -c "orchestrator" specdacular/workflows/plan-feature.md
```
Should return at least 3.

**Done when:**
- [ ] `load_context` detects orchestrator mode from feature config.json
- [ ] System-level codebase docs loaded
- [ ] Sub-project feature contexts loaded
- [ ] Single-project flow unchanged (branches to existing `assess_readiness`)

---

### Task 2: Add orchestrator_derive_phases step

**Files:** `specdacular/workflows/plan-feature.md`

**Action:**
Add `orchestrator_derive_phases` step after `load_context`. This derives per-project phases in one pass.

```markdown
<step name="orchestrator_derive_phases">
Derive phases for all involved projects in a single orchestrator pass.

**For each involved project, analyze:**
- Project's FEATURE.md requirements (what it must create)
- Project's codebase patterns (how code is organized)
- Cross-project dependencies (from CONTRACTS.md, TOPOLOGY.md)

**Derive per-project phases:**
Apply the same dependency-driven phasing as single-project mode, but for each project:
1. Types/interfaces needed by this project
2. Data layer changes
3. Business logic
4. UI components (if applicable)
5. Integration/wiring

Adjust per project — not all projects need all phases. A backend API project may have 3 phases while a UI project has 4.

**Consider cross-project ordering:**
- Which project phases produce outputs that other project phases consume?
- Which phases can run independently?
- Reference CONTRACTS.md for interface dependencies

**Present consolidated view:**
```
Here's the proposed phase structure across all projects:

**{project-1}** ({N} phases):
  Phase 1: {Name} — {Goal}
  Phase 2: {Name} — {Goal}
  ...

**{project-2}** ({N} phases):
  Phase 1: {Name} — {Goal}
  Phase 2: {Name} — {Goal}
  ...

**Cross-project dependencies (preliminary):**
- {project-1}/phase-1 → no cross-project deps
- {project-2}/phase-2 → after {project-1}/phase-2

Does this phasing make sense? Any adjustments?
```

Use AskUserQuestion:
- header: "Phases"
- question: "Does this phase structure look right?"
- options:
  - "Yes, looks good" — Continue with this structure
  - "I want to adjust" — Modify phases or ordering

**If "I want to adjust":**
Ask user for specific changes. Apply adjustments.

Continue to write_project_roadmaps.
</step>
```

**Verify:**
```bash
grep -c "orchestrator_derive_phases" specdacular/workflows/plan-feature.md
```
Should return at least 2.

**Done when:**
- [ ] `orchestrator_derive_phases` step exists
- [ ] Derives per-project phases using same dependency analysis as single-project
- [ ] Considers cross-project ordering from CONTRACTS.md
- [ ] Presents consolidated view with all projects
- [ ] User can confirm or adjust

---

### Task 3: Add write_project_roadmaps step

**Files:** `specdacular/workflows/plan-feature.md`

**Action:**
Add `write_project_roadmaps` step that writes ROADMAP.md for each sub-project and creates phase directories.

```markdown
<step name="write_project_roadmaps">
Write ROADMAP.md for each involved sub-project.

For each project:

**Write ROADMAP.md:**
Use template at `~/.claude/specdacular/templates/features/ROADMAP.md`

Fill in with project-specific phases:
- Overview table: total phases, current phase 1, not started
- Phase list with one-liners
- Phase details: goal, creates, modifies, success criteria, dependencies (within this project only)
- Execution order
- Key decisions affecting this project's roadmap

**IMPORTANT (DEC-001):** Sub-project ROADMAP.md must be self-contained. Dependencies listed are intra-project only. No references to other projects or cross-project phases.

**Create phase directories:**
```bash
{For each project:}
mkdir -p {project-path}/.specd/features/{feature-name}/plans/phase-01
mkdir -p {project-path}/.specd/features/{feature-name}/plans/phase-02
# ... for each phase
```

**Update sub-project STATE.md:**
- Stage: discussion -> planned
- Add phases info

**Update sub-project config.json:**
```json
{
  "stage": "planned",
  "phases": {
    "total": {N},
    "completed": 0,
    "current": 1
  }
}
```

After all projects processed, verify:
```bash
for project in {project-paths}; do
  echo "Checking $project..."
  ls "$project/.specd/features/{feature-name}/ROADMAP.md"
  ls "$project/.specd/features/{feature-name}/plans/"
done
```

Continue to build_dependency_graph (Plan 02).
</step>
```

**Verify:**
```bash
grep -c "write_project_roadmaps" specdacular/workflows/plan-feature.md
```
Should return at least 2.

**Done when:**
- [ ] `write_project_roadmaps` step exists
- [ ] Writes ROADMAP.md per sub-project using existing template
- [ ] Creates empty phase directories per project
- [ ] Updates sub-project STATE.md and config.json
- [ ] Self-contained per DEC-001

---

## Verification

After all tasks complete:

```bash
# Verify new steps exist
for step in orchestrator_derive_phases write_project_roadmaps; do
  grep -q "$step" specdacular/workflows/plan-feature.md && echo "✓ $step" || echo "✗ $step MISSING"
done

# Verify existing steps still exist
for step in validate load_context assess_readiness derive_phases write_roadmap create_directories update_state commit completion; do
  grep -q "$step" specdacular/workflows/plan-feature.md && echo "✓ $step (existing)" || echo "✗ $step MISSING (REGRESSION)"
done
```

**Plan is complete when:**
- [ ] Orchestrator detection added to `load_context`
- [ ] `orchestrator_derive_phases` derives per-project phases in one pass
- [ ] `write_project_roadmaps` creates per-project ROADMAP.md files
- [ ] All 9 existing steps preserved (no regression)

---

## Output

When this plan is complete:

1. Update `.specd/features/multi-project-specd/STATE.md`:
   - Add this plan to completed plans table

2. Commit changes:
   ```bash
   git add specdacular/workflows/plan-feature.md
   git commit -m "feat(multi-project-specd): add orchestrator detection and phase derivation to plan-feature

   Plan phase-04/01 complete:
   - load_context: orchestrator mode detection + cross-project context
   - orchestrator_derive_phases: single-pass per-project phase derivation
   - write_project_roadmaps: per-project ROADMAP.md + phase directories"
   ```

3. Continue to Plan 02 (dependency graph and cycle detection).

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/multi-project-specd/CHANGELOG.md`.

---

## Notes

{Space for the implementing agent to record discoveries during implementation.}
