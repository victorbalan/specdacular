---
feature: new-command-rearchitect
phase: 2
depends_on:
  - phase-01
creates:
  - specdacular/templates/tasks/FEATURE.md
  - specdacular/templates/tasks/CONTEXT.md
  - specdacular/templates/tasks/DECISIONS.md
  - specdacular/templates/tasks/CHANGELOG.md
  - specdacular/templates/tasks/STATE.md
  - specdacular/templates/tasks/ROADMAP.md
  - specdacular/templates/tasks/PLAN.md
  - specdacular/templates/tasks/RESEARCH.md
  - specdacular/templates/tasks/config.json
modifies: []
---

# Phase 2: Templates

## Objective

Create updated document templates in `specdacular/templates/tasks/` that reflect the new structure: `.specd/tasks/`, single PLAN.md per phase, and simplified state tracking.

## Context

**Reference these files:**
- `@specdacular/templates/features/` — Current templates to adapt
- `@.specd/codebase/PATTERNS.md` — Template file structure pattern

**Relevant Decisions:**
- DEC-001: Rename features to tasks (all paths use `.specd/tasks/`)
- DEC-002: One plan per phase (`phases/phase-NN/PLAN.md`)
- DEC-006: Keep "phases" naming

---

## Tasks

### Task 1: Create tasks/ template directory and copy-adapt existing templates

**Files:** `specdacular/templates/tasks/`

**Action:**
Create the `specdacular/templates/tasks/` directory. For each template in `specdacular/templates/features/`, create an updated version in `tasks/`:

**FEATURE.md** — Keep same structure. Update Quick Reference paths from `.specd/features/{feature-name}/` to `.specd/tasks/{task-name}/`. Replace `{feature-name}` placeholders with `{task-name}`.

**CONTEXT.md** — Same structure. Update paths and references. Change "Feature:" to "Task:" in Quick Reference. Update resume command from `/specd:feature:continue` to `/specd:continue`.

**DECISIONS.md** — Same structure. Update feature references to task references.

**CHANGELOG.md** — Same structure. Update "Phase 1" references to use `phases/phase-01/PLAN.md` (single plan).

**RESEARCH.md** — Same structure. Update paths.

**config.json** — Same structure. Rename `feature_name` to `task_name`. Keep `feature_abbrev` as `task_abbrev`.

**Verify:**
```bash
ls specdacular/templates/tasks/
```

**Done when:**
- [ ] All template files exist in `tasks/` directory
- [ ] No references to `.specd/features/` remain
- [ ] No references to `/specd:feature:*` commands remain

---

### Task 2: Update STATE.md template for single-plan phases

**Files:** `specdacular/templates/tasks/STATE.md`

**Action:**
Adapt the STATE.md template:
- Replace phase/plan tracking with single-plan-per-phase tracking
- The "Completed Plans" table becomes simpler — just phase number and PLAN.md status
- Remove plan-level tracking (no "Plan: phase-01/02-PLAN.md" references)
- Update "Current Plan" section to "Current Phase"
- Update resume command to `/specd:continue {task-name}`
- Reference `phases/phase-NN/PLAN.md` instead of `plans/phase-NN/NN-PLAN.md`

Key changes from current template:
```markdown
## Execution Progress

### Current Phase
- Phase: {N}
- Started: —

### Completed Phases
| Phase | Completed | Tasks | Deviations |
|-------|-----------|-------|------------|
```

**Verify:**
```bash
grep -c "features" specdacular/templates/tasks/STATE.md  # should be 0
grep -c "tasks" specdacular/templates/tasks/STATE.md      # should be > 0
```

**Done when:**
- [ ] STATE.md uses single-plan-per-phase tracking
- [ ] No `plans/phase-NN/NN-PLAN.md` references (uses `phases/phase-NN/PLAN.md`)
- [ ] Resume command points to `/specd:continue`

---

### Task 3: Update ROADMAP.md template for single-plan phases

**Files:** `specdacular/templates/tasks/ROADMAP.md`

**Action:**
Adapt the ROADMAP.md template:
- Remove "Total Plans" from overview (just "Total Phases")
- Each phase has one plan reference: `phases/phase-NN/PLAN.md`
- Simplify the "Plans:" section in phase details to just reference the single PLAN.md
- Update execution order diagram to show phases only (no sub-plans)

**Done when:**
- [ ] ROADMAP.md references `phases/phase-NN/PLAN.md` (single plan)
- [ ] No multi-plan references
- [ ] Overview table simplified

---

### Task 4: Update PLAN.md template

**Files:** `specdacular/templates/tasks/PLAN.md`

**Action:**
Adapt the PLAN.md template:
- Remove `plan: {NN}` from frontmatter (only one plan per phase, so just `phase: {N}`)
- Change title from `# Plan {NN}: {Plan Title}` to `# Phase {N}: {Phase Title}`
- Update output section: references `.specd/tasks/` and `phases/phase-{NN}/PLAN.md`
- Keep tasks, verification, and implementation log sections as-is

**Done when:**
- [ ] PLAN.md uses `phase: {N}` not `plan: {NN}`
- [ ] Title reflects phase, not plan number
- [ ] Output references updated paths

---

## Verification

```bash
# All templates exist
ls specdacular/templates/tasks/{FEATURE,CONTEXT,DECISIONS,CHANGELOG,STATE,ROADMAP,PLAN,RESEARCH}.md specdacular/templates/tasks/config.json

# No "features" path references
grep -r "\.specd/features/" specdacular/templates/tasks/ && echo "FAIL: old paths found" || echo "PASS: no old paths"

# No old command references
grep -r "specd:feature:" specdacular/templates/tasks/ && echo "FAIL: old commands found" || echo "PASS: no old commands"
```

**Plan is complete when:**
- [ ] All 9 template files exist in `tasks/`
- [ ] Zero references to `.specd/features/` or `/specd:feature:*`
- [ ] STATE.md and ROADMAP.md use single-plan-per-phase structure
- [ ] PLAN.md uses phase-only frontmatter
