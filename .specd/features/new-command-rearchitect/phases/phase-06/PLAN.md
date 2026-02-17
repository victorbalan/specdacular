---
feature: new-command-rearchitect
phase: 6
depends_on:
  - phase-04
  - phase-05
creates: []
modifies:
  - bin/install.js
  - hooks/specd-statusline.js
---

# Phase 6: Installer & Cleanup

## Objective

Update the installer for new file paths, remove all old files, and verify the full system works end-to-end.

## Context

**Reference these files:**
- `@bin/install.js` — Installer to update
- `@hooks/specd-statusline.js` — Check for feature path references
- `@.specd/codebase/MAP.md` — System overview

**Relevant Decisions:**
- DEC-001: Rename features to tasks
- DEC-004: No backward compatibility
- DEC-011: Remove phase-specific command variants

---

## Tasks

### Task 1: Update bin/install.js

**Files:** `bin/install.js`

**Action:**
Update the installer to handle new file structure:

1. **Commands directory:** Still copies `commands/specd/` — new filenames will be picked up automatically since it copies the whole directory. Verify old files won't be left behind (installer does `rmSync` before copy).

2. **Workflows directory:** Still copies `specdacular/workflows/` — same. Verify `orchestrator/` subdirectory is copied.

3. **Templates directory:** Change from `specdacular/templates/features/` to `specdacular/templates/tasks/`. Update any references in `copyWithPathReplacement`.

4. **Path replacement:** The `copyWithPathReplacement` function replaces `~/.claude/` paths. Verify this still works for all new file references.

5. **Agents directory:** Still copies `agents/` — no change needed.

6. **References directory:** Verify `specdacular/references/` is copied (should be, since it copies all of `specdacular/`).

**Verify:**
```bash
node bin/install.js --help 2>/dev/null || echo "check manually"
```

**Done when:**
- [ ] Installer copies new command files
- [ ] Installer copies new workflow files (including orchestrator/)
- [ ] Installer copies `templates/tasks/` (not `templates/features/`)
- [ ] Path replacement works for new files

---

### Task 2: Check and update hooks

**Files:** `hooks/specd-statusline.js`

**Action:**
Check if `specd-statusline.js` references `.specd/features/` anywhere. If so, update to `.specd/tasks/`. Also check `specd-check-update.js`.

**Verify:**
```bash
grep "features" hooks/specd-statusline.js hooks/specd-check-update.js
```

**Done when:**
- [ ] No references to `.specd/features/` in hooks
- [ ] Hooks still function correctly

---

### Task 3: Remove old command files

**Files:** `commands/specd/`

**Action:**
Remove old command files that have been replaced:
- `commands/specd/new-feature.md`
- `commands/specd/continue-feature.md` (if exists)
- `commands/specd/discuss-feature.md`
- `commands/specd/research-feature.md`
- `commands/specd/plan-feature.md`
- `commands/specd/execute-plan.md`
- `commands/specd/discuss-phase.md`
- `commands/specd/research-phase.md`
- `commands/specd/plan-phase.md`
- `commands/specd/review-feature.md` (if exists as command)
- `commands/specd/review-phase.md` (if exists as command)

First list what actually exists, then remove only files that exist.

**Verify:**
```bash
# No old feature commands remain
ls commands/specd/*feature* commands/specd/*phase* 2>/dev/null && echo "FAIL: old files remain" || echo "PASS"
```

**Done when:**
- [ ] All old command files removed
- [ ] No `*-feature.md` or `*-phase.md` commands remain

---

### Task 4: Remove old workflow files

**Files:** `specdacular/workflows/`

**Action:**
Remove old workflow files:
- `specdacular/workflows/new-feature.md`
- `specdacular/workflows/continue-feature.md`
- `specdacular/workflows/discuss-feature.md`
- `specdacular/workflows/research-feature.md`
- `specdacular/workflows/plan-feature.md`
- `specdacular/workflows/execute-plan.md`
- `specdacular/workflows/review-feature.md`
- `specdacular/workflows/review-phase.md`
- `specdacular/workflows/discuss-phase.md`
- `specdacular/workflows/research-phase.md`
- `specdacular/workflows/plan-phase.md`
- `specdacular/workflows/prepare-phase.md`
- `specdacular/workflows/insert-phase.md`
- `specdacular/workflows/renumber-phases.md`

First list what exists, then remove.

**Verify:**
```bash
ls specdacular/workflows/*feature* specdacular/workflows/*phase* 2>/dev/null && echo "FAIL" || echo "PASS"
```

**Done when:**
- [ ] All old workflow files removed
- [ ] No `*-feature.md` or `*-phase.md` workflows remain

---

### Task 5: Remove old templates directory

**Files:** `specdacular/templates/features/`

**Action:**
Remove the entire `specdacular/templates/features/` directory now that `templates/tasks/` exists.

```bash
rm -rf specdacular/templates/features/
```

**Verify:**
```bash
[ ! -d specdacular/templates/features/ ] && echo "PASS" || echo "FAIL"
```

**Done when:**
- [ ] `templates/features/` directory removed

---

### Task 6: Cross-reference verification

**Action:**
Verify no broken references exist anywhere in the codebase:

```bash
# Check for any remaining old path references
grep -r "\.specd/features/" commands/ specdacular/ agents/ hooks/ bin/ --include="*.md" --include="*.js" && echo "FAIL: old paths found" || echo "PASS"

# Check for old command references
grep -r "specd:feature:" commands/ specdacular/ agents/ hooks/ bin/ --include="*.md" --include="*.js" && echo "FAIL: old commands found" || echo "PASS"

# Check for references to removed files
grep -r "new-feature\.md\|continue-feature\.md\|discuss-feature\.md\|research-feature\.md\|plan-feature\.md\|execute-plan\.md" commands/ specdacular/ --include="*.md" && echo "FAIL: dead refs" || echo "PASS"
```

**Done when:**
- [ ] Zero references to `.specd/features/`
- [ ] Zero references to `/specd:feature:*`
- [ ] Zero references to removed files

---

## Verification

Full end-to-end check:

```bash
# New structure exists
ls commands/specd/{new,continue,discuss,research,plan,execute,review}.md
ls specdacular/workflows/{new,continue,discuss,research,plan,execute,review}.md
ls specdacular/workflows/orchestrator/{new,plan}.md
ls specdacular/references/{validate-task,load-context,record-decision,spawn-research-agents,synthesize-research}.md
ls specdacular/templates/tasks/

# Old structure removed
ls commands/specd/*feature* commands/specd/*phase* 2>/dev/null && echo "FAIL" || echo "PASS"
ls specdacular/workflows/*feature* specdacular/workflows/*phase* 2>/dev/null && echo "FAIL" || echo "PASS"
[ ! -d specdacular/templates/features/ ] && echo "PASS" || echo "FAIL"

# No broken references
grep -r "\.specd/features/" commands/ specdacular/ agents/ hooks/ bin/ --include="*.md" --include="*.js" 2>/dev/null && echo "FAIL" || echo "PASS"

# Install test
npx specdacular --local 2>&1 | tail -5
```

**Plan is complete when:**
- [ ] Installer works with new file structure
- [ ] All old files removed
- [ ] Zero broken references
- [ ] `npx specdacular --local` succeeds
