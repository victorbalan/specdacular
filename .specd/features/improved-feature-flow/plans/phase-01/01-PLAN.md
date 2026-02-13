---
feature: improved-feature-flow
phase: 1
plan: 01
depends_on: []
creates:
  - specdacular/references/select-feature.md
  - specdacular/references/select-phase.md
  - specdacular/references/commit-config.md
modifies: []
---

# Plan 01: Extract Shared References

## Objective

Extract duplicated workflow logic (feature selection, phase selection, commit config) into reusable reference files in `specdacular/references/`. These will be `@`-referenced by toolbox, continue, and other workflows.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Workflow structure pattern, `@` reference pattern
- `@.specd/codebase/STRUCTURE.md` — `specdacular/references/` is the target directory
- `@specdacular/workflows/next-feature.md` — Source for feature selection logic (select_feature step)
- `@specdacular/workflows/prepare-phase.md` — Source for phase selection logic

**Relevant Decisions:**
- DEC-010: Extract shared workflow logic into reusable references

---

## Tasks

### Task 1: Create select-feature.md

**Files:** `specdacular/references/select-feature.md`

**Action:**
Extract the feature selection logic from `specdacular/workflows/next-feature.md` (the `select_feature` step, lines 38-77) into a standalone reference file.

The reference should include:
1. If `$ARGUMENTS` provided: validate feature exists, use as feature name
2. If no arguments: scan `.specd/features/*/config.json` for in-progress features
3. If no features found: tell user to run `/specd:feature:new`
4. If features found: use AskUserQuestion to let user pick, showing feature name + current stage

Write as a self-contained workflow step that can be `@`-included:

```markdown
<shared name="select_feature">
## Feature Selection

**If $ARGUMENTS provided:**
Use as feature name. Normalize to kebab-case.

```bash
[ -d ".specd/features/$ARGUMENTS" ] || { echo "not found"; exit 1; }
```

**If no arguments:**
Scan for in-progress features:

```bash
for dir in .specd/features/*/config.json; do
  [ -f "$dir" ] && echo "$dir"
done
```

Read each config.json and filter where stage != "complete".

**If no features found:**
```
No features in progress.

Start one with /specd:feature:new
```
End workflow.

**If features found:**
Use AskUserQuestion:
- header: "Feature"
- question: "Which feature would you like to work on?"
- options: List each feature with its current stage

Use the selected feature name.
</shared>
```

**Verify:**
```bash
[ -f "specdacular/references/select-feature.md" ] && echo "exists" && wc -l specdacular/references/select-feature.md
```

**Done when:**
- [ ] `specdacular/references/select-feature.md` exists
- [ ] Contains feature selection logic (argument check, scan, picker)
- [ ] Can be `@`-referenced from any workflow

---

### Task 2: Create select-phase.md

**Files:** `specdacular/references/select-phase.md`

**Action:**
Create a shared reference for phase selection. This is used by the toolbox (when scope = specific phase) and by prepare-phase, plan-phase workflows.

The reference should include:
1. Read ROADMAP.md for the feature to get phase list
2. Present AskUserQuestion with available phases (name + status)
3. Return selected phase number

```markdown
<shared name="select_phase">
## Phase Selection

**Read available phases:**
Read `.specd/features/{feature-name}/ROADMAP.md` and extract phase list with status.

```bash
[ -f ".specd/features/{feature-name}/ROADMAP.md" ] || { echo "No roadmap found"; exit 1; }
```

**Present phase picker:**
Use AskUserQuestion:
- header: "Phase"
- question: "Which phase?"
- options: List each phase with status (e.g., "Phase 1: Foundation — not started", "Phase 2: API — complete")

Use the selected phase number.
</shared>
```

**Verify:**
```bash
[ -f "specdacular/references/select-phase.md" ] && echo "exists" && wc -l specdacular/references/select-phase.md
```

**Done when:**
- [ ] `specdacular/references/select-phase.md` exists
- [ ] Contains phase listing from ROADMAP.md and AskUserQuestion picker
- [ ] Can be `@`-referenced from any workflow

---

### Task 3: Create commit-config.md

**Files:** `specdacular/references/commit-config.md`

**Action:**
Extract commit configuration reading from execute-plan workflow. This shared reference reads auto-commit settings from feature config.json.

The reference should include:
1. Read `.specd/features/{feature-name}/config.json`
2. Extract `execution.auto_commit` value
3. If true: commit after each task automatically
4. If false: ask user before committing

```markdown
<shared name="commit_config">
## Commit Configuration

**Read from config:**
```bash
cat .specd/features/{feature-name}/config.json
```

Extract `execution.auto_commit` field.

**If auto_commit = true:**
Commit after each task without asking.

**If auto_commit = false (default):**
After each task, ask user before committing.
</shared>
```

**Verify:**
```bash
[ -f "specdacular/references/commit-config.md" ] && echo "exists" && wc -l specdacular/references/commit-config.md
```

**Done when:**
- [ ] `specdacular/references/commit-config.md` exists
- [ ] Contains auto-commit configuration reading logic
- [ ] Can be `@`-referenced from execute-plan and review workflows

---

## Verification

After all tasks complete:

```bash
# All three reference files exist
ls -la specdacular/references/select-feature.md specdacular/references/select-phase.md specdacular/references/commit-config.md

# Each has content (>5 lines)
for f in specdacular/references/*.md; do
  lines=$(wc -l < "$f")
  echo "$f: $lines lines"
  [ "$lines" -gt 5 ] || echo "WARNING: $f seems too short"
done
```

**Plan is complete when:**
- [ ] All 3 reference files created in `specdacular/references/`
- [ ] Each contains self-contained, reusable logic
- [ ] Each follows the `<shared>` tag pattern for clarity

---

## Output

When this plan is complete:

1. Update `.specd/features/improved-feature-flow/STATE.md`:
   - Mark this plan as complete

2. Commit changes:
   ```bash
   git add specdacular/references/*.md
   git commit -m "feat(improved-feature-flow): extract shared workflow references

   Plan 1.01 complete:
   - select-feature.md: Feature argument handling + scanner/picker
   - select-phase.md: Phase selection from ROADMAP.md
   - commit-config.md: Auto-commit configuration reading"
   ```

3. Next plan: `phase-01/02-PLAN.md`

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/improved-feature-flow/CHANGELOG.md`.

---

## Notes

