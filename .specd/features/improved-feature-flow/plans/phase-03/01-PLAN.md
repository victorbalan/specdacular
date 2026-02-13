---
feature: improved-feature-flow
phase: 3
plan: 01
depends_on: []
creates: []
modifies:
  - specdacular/workflows/insert-phase.md
---

# Plan 01: Update Insert-Phase Workflow

## Objective

Update the existing insert-phase workflow to work with the new toolbox-dispatched flow. Add shared feature selection, interactive argument collection, and updated references.

## Context

**Reference these files:**
- `@specdacular/workflows/insert-phase.md` — Current workflow to update
- `@specdacular/workflows/toolbox.md` — Dispatches with feature name
- `@specdacular/references/select-feature.md` — Shared feature selection
- `@specdacular/references/select-phase.md` — Shared phase selection

**Relevant Decisions:**
- DEC-006: Decimal phase numbering (6.1, 6.2, no 6.1.1)
- DEC-010: Use shared references

---

## Tasks

### Task 1: Add select_feature and interactive argument collection

**Files:** `specdacular/workflows/insert-phase.md`

**Action:**
Replace the `parse_arguments` step with a `select_feature` step using the shared reference, followed by an interactive step that asks for the remaining info.

**Replace parse_arguments with:**

```markdown
<step name="select_feature">
@~/.claude/specdacular/references/select-feature.md

Continue to select_target.
</step>

<step name="select_target">
Ask where to insert and what the phase is about.

**If arguments include phase number and description:**
Parse from arguments and continue.

**If arguments are just feature name (e.g., from toolbox):**

Show current phases from ROADMAP.md:
```
Current phases:
{List phases from ROADMAP.md with numbers}
```

Use AskUserQuestion:
- header: "Insert After"
- question: "Insert new phase after which existing phase?"
- options: List each phase as an option

After selection, ask for phase description:
"What's this new phase about? (brief name/goal)"

Wait for response.

Continue to validate (with feature name, phase number, and description).
</step>
```

**Verify:**
```bash
grep -q "select_feature" specdacular/workflows/insert-phase.md && echo "✓ select_feature" || echo "✗ MISSING"
grep -q "select_target" specdacular/workflows/insert-phase.md && echo "✓ select_target" || echo "✗ MISSING"
```

**Done when:**
- [ ] `select_feature` step uses shared reference
- [ ] `select_target` step asks interactively when args are minimal
- [ ] Works both from toolbox (feature name only) and direct invocation (all args)

---

### Task 2: Update completion references and config field

**Files:** `specdacular/workflows/insert-phase.md`

**Action:**

1. In the `completion` step, replace old command references:
   - Replace `/specd:phase:prepare` → `/specd:feature:continue` or `/specd:feature:toolbox`
   - Replace `/specd:phase:plan` → `/specd:feature:continue` or `/specd:feature:toolbox`
   - Replace `/specd:phase:execute` → `/specd:feature:continue`
   - Remove `/specd:phase:renumber` reference (renumber is eliminated per DEC-006)

2. In the `update_config` step, update from `phases_count` to `phases.total` to match the config.json structure used elsewhere.

3. Add auto-commit check to the completion step. After all updates:
   ```bash
   cat .specd/config.json 2>/dev/null || echo '{"auto_commit_docs": true}'
   ```
   If `auto_commit_docs` is true (default), commit all changes. If false, list modified files without committing.

**Verify:**
```bash
! grep -q "specd:phase:renumber" specdacular/workflows/insert-phase.md && echo "✓ no renumber ref" || echo "✗ still has renumber"
grep -q "specd:feature:continue" specdacular/workflows/insert-phase.md && echo "✓ continue ref" || echo "✗ MISSING"
grep -q "phases.total\|phases_count" specdacular/workflows/insert-phase.md && echo "✓ config field" || echo "✗ MISSING"
```

**Done when:**
- [ ] Completion references updated to new commands
- [ ] No reference to `phase:renumber`
- [ ] Config field matches `phases.total` structure
- [ ] Auto-commit check added

---

## Verification

After all tasks:
```bash
# Has shared reference
grep -q "select-feature" specdacular/workflows/insert-phase.md && echo "✓"

# Has interactive selection
grep -q "select_target" specdacular/workflows/insert-phase.md && echo "✓"

# No old phase commands
! grep -q "specd:phase:renumber" specdacular/workflows/insert-phase.md && echo "✓"

# References continue
grep -q "specd:feature:continue" specdacular/workflows/insert-phase.md && echo "✓"
```

---

## Output

When this plan is complete, commit:
```bash
git add specdacular/workflows/insert-phase.md
git commit -m "feat(improved-feature-flow): update insert-phase for toolbox flow

Plan 3.01 complete:
- Shared feature selection reference
- Interactive target phase selection (works from toolbox)
- Updated completion references (continue/toolbox instead of phase commands)
- Aligned config field to phases.total"
```

Phase 3 complete after this plan.
