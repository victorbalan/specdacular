---
feature: improved-feature-flow
phase: 1
plan: 02
depends_on:
  - 01
creates:
  - commands/specd/feature/continue.md
  - specdacular/workflows/continue-feature.md
modifies:
  - commands/specd/feature/new.md
  - commands/specd/feature/plan.md
  - commands/specd/feature/research.md
  - commands/specd/feature/discuss.md
  - specdacular/workflows/new-feature.md
  - specdacular/workflows/execute-plan.md
  - specdacular/workflows/plan-feature.md
  - specdacular/templates/features/STATE.md
---

# Plan 02: Rename next → continue

## Objective

Rename the `next-feature` command and workflow to `continue-feature`, and update all references across 12 source files. The continue workflow should use the shared `select-feature.md` reference from Plan 01.

## Context

**Reference these files:**
- `@commands/specd/feature/next.md` — Command to be renamed
- `@specdacular/workflows/next-feature.md` — Workflow to be renamed
- `@specdacular/references/select-feature.md` — Shared reference to use (from Plan 01)
- `@.specd/features/improved-feature-flow/plans/phase-01/CONTEXT.md` — Reference audit with all 12 files

**Relevant Decisions:**
- DEC-004: Rename next to continue
- DEC-010: Use shared references

---

## Tasks

### Task 1: Create continue command file

**Files:** `commands/specd/feature/continue.md`

**Action:**
Create the new command file by copying `commands/specd/feature/next.md` and updating:
- `name:` → `specd:feature:continue`
- `description:` → `Continue feature lifecycle — picks up where you left off`
- `<execution_context>` → `@~/.claude/specdacular/workflows/continue-feature.md`
- All text references from `next` to `continue`

Follow the exact pattern from `commands/specd/feature/next.md` — same frontmatter structure, same allowed-tools, same sections.

**Verify:**
```bash
[ -f "commands/specd/feature/continue.md" ] && grep -c "specd:feature:continue" commands/specd/feature/continue.md
```

**Done when:**
- [ ] `commands/specd/feature/continue.md` exists
- [ ] Frontmatter has `name: specd:feature:continue`
- [ ] References `continue-feature.md` workflow
- [ ] No remaining references to `next`

---

### Task 2: Create continue workflow file

**Files:** `specdacular/workflows/continue-feature.md`

**Action:**
Copy `specdacular/workflows/next-feature.md` to `specdacular/workflows/continue-feature.md` and update:
1. Replace all `/specd:feature:next` → `/specd:feature:continue` (~12 occurrences)
2. Replace `next-feature` → `continue-feature` in purpose/description text
3. Replace the `select_feature` step body with an `@` reference to the shared select-feature:
   ```markdown
   <step name="select_feature">
   @~/.claude/specdacular/references/select-feature.md

   Continue to read_state.
   </step>
   ```
4. Keep ALL other logic identical — this is a rename, not a rewrite

**Verify:**
```bash
# File exists
[ -f "specdacular/workflows/continue-feature.md" ] && echo "exists"

# No remaining references to "next"
grep -c "feature:next" specdacular/workflows/continue-feature.md || echo "clean"

# Has continue references
grep -c "feature:continue" specdacular/workflows/continue-feature.md
```

**Done when:**
- [ ] `specdacular/workflows/continue-feature.md` exists
- [ ] All `/specd:feature:next` replaced with `/specd:feature:continue`
- [ ] `select_feature` step uses shared reference
- [ ] All other workflow logic preserved identically

---

### Task 3: Update all reference files

**Files:** 8 files with references to update

**Action:**
Find-and-replace in each file. The changes are:
- `/specd:feature:next` → `/specd:feature:continue`
- `next-feature` workflow references → `continue-feature`

**File-by-file changes:**

1. **`commands/specd/feature/new.md`** (2 refs):
   - Line with `/specd:feature:next` → `/specd:feature:continue`
   - Success criteria line referencing `next` → `continue`

2. **`commands/specd/feature/plan.md`** (1 ref):
   - Note suggesting `/specd:feature:next` → `/specd:feature:continue`

3. **`commands/specd/feature/research.md`** (1 ref):
   - Note suggesting `/specd:feature:next` → `/specd:feature:continue`

4. **`commands/specd/feature/discuss.md`** (1 ref):
   - Note suggesting `/specd:feature:next` → `/specd:feature:continue`

5. **`specdacular/workflows/new-feature.md`** (8 refs):
   - All `/specd:feature:next` → `/specd:feature:continue`
   - `@~/.claude/specdacular/workflows/next-feature.md` → `@~/.claude/specdacular/workflows/continue-feature.md`
   - `next-feature workflow` text → `continue-feature workflow`

6. **`specdacular/workflows/execute-plan.md`** (1 ref):
   - Resume instruction referencing `next` → `continue`

7. **`specdacular/workflows/plan-feature.md`** (2 refs):
   - References to `/specd:feature:next` → `/specd:feature:continue`

8. **`specdacular/templates/features/STATE.md`** (1 ref):
   - Resume line: `/specd:feature:next` → `/specd:feature:continue`

**Verify:**
```bash
# No remaining references to feature:next in source files (excluding .specd/features/ history)
grep -r "feature:next" commands/specd/ specdacular/workflows/ specdacular/templates/ --include="*.md" | grep -v ".specd/features/" || echo "all clean"
```

**Done when:**
- [ ] All 8 files updated
- [ ] No remaining `feature:next` references in source files
- [ ] No remaining `next-feature.md` workflow references in source files

---

## Verification

After all tasks complete:

```bash
# New files exist
ls commands/specd/feature/continue.md specdacular/workflows/continue-feature.md

# No stale references in source files
echo "Checking for stale 'feature:next' references..."
grep -r "feature:next" commands/ specdacular/ --include="*.md" | grep -v "feature:next.md" || echo "✓ No stale references"

echo "Checking for stale 'next-feature.md' workflow references..."
grep -r "next-feature.md" commands/ specdacular/ --include="*.md" || echo "✓ No stale workflow references"
```

**Plan is complete when:**
- [ ] `commands/specd/feature/continue.md` created
- [ ] `specdacular/workflows/continue-feature.md` created
- [ ] All 8 reference files updated
- [ ] Zero stale `next` references in source files
- [ ] Continue workflow uses shared `select-feature.md` reference

---

## Output

When this plan is complete:

1. Update `.specd/features/improved-feature-flow/STATE.md`:
   - Mark this plan as complete

2. Commit changes:
   ```bash
   git add commands/specd/feature/continue.md specdacular/workflows/continue-feature.md
   git add commands/specd/feature/new.md commands/specd/feature/plan.md commands/specd/feature/research.md commands/specd/feature/discuss.md
   git add specdacular/workflows/new-feature.md specdacular/workflows/execute-plan.md specdacular/workflows/plan-feature.md
   git add specdacular/templates/features/STATE.md
   git commit -m "feat(improved-feature-flow): rename next → continue

   Plan 1.02 complete:
   - Created continue-feature command + workflow
   - Updated 8 files with reference changes
   - Continue workflow uses shared select-feature reference"
   ```

3. Next plan: `phase-01/03-PLAN.md`

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/improved-feature-flow/CHANGELOG.md`.

---

## Notes

Do NOT delete `commands/specd/feature/next.md` or `specdacular/workflows/next-feature.md` in this plan. Old files are removed in Phase 4 (Cleanup). Both old and new can coexist temporarily.
