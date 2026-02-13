---
feature: improved-feature-flow
phase: 2
plan: 01
depends_on: []
creates:
  - specdacular/workflows/review-feature.md
modifies: []
---

# Plan 01: Create Review Workflow

## Objective

Create the user-guided review workflow that shows what was built, provides test guidance, and takes user feedback to generate fix plans.

## Context

**Reference these files:**
- `@specdacular/workflows/execute-plan.md` — Understand what execution produces (STATE.md, CHANGELOG.md)
- `@specdacular/references/select-feature.md` — Shared feature selection
- `@.specd/features/improved-feature-flow/plans/phase-02/CONTEXT.md` — Phase 2 design decisions

**Relevant Decisions:**
- DEC-003: Review is user-guided, not auto-fix
- DEC-008: Show summary + test guidance, revisions become fix plans
- DEC-012: Use git diff for file tracking (phase_start_commit)
- DEC-014: Review writes fix plans directly

---

## Tasks

### Task 1: Create review-feature.md workflow

**Files:** `specdacular/workflows/review-feature.md`

**Action:**
Create the review workflow with these steps:

**Structure:**
```
<purpose> — User-guided review of executed phase work
<philosophy> — Show don't fix, user drives, fix plans for issues
<process>
  <step name="select_feature"> — Shared reference
  <step name="load_context"> — Read config.json, STATE.md, plans, CHANGELOG
  <step name="show_review"> — Git diff --stat, test guidance, ask approval
  <step name="collect_feedback"> — Conversational: what's wrong?
  <step name="create_fix_plan"> — Write PLAN.md in phase-{N.1}/ directory
  <step name="offer_execution"> — Execute fix plan or stop
  <step name="approve_phase"> — Mark completed, advance
</process>
```

**Step details:**

**select_feature:**
```
@~/.claude/specdacular/references/select-feature.md
Continue to load_context.
```

**load_context:**
- Read config.json — get `phases.current`, `phases.phase_start_commit`
- Read STATE.md — completed plans for current phase
- Read ROADMAP.md — phase name and goals
- Read current phase's PLAN.md files — objectives and success criteria
- Read CHANGELOG.md — deviations from this phase

**show_review:**
- Run `git diff {phase_start_commit}..HEAD --stat` to get files changed
- Run `git diff {phase_start_commit}..HEAD --name-status` for created/modified/deleted breakdown
- Derive test guidance from:
  - Plan objectives (what should work)
  - Plan success criteria (what to verify)
  - File types created (e.g., "run tests" if test files exist)
- Present:
```
### Phase {N}: {name} — Review

**Files changed:**
{git diff --stat output}

**What was built:**
{Brief summary from plan objectives}

**Test guidance:**
{What to verify based on success criteria}

**Deviations from plan:**
{From CHANGELOG.md, or "None"}
```

Use AskUserQuestion:
- header: "Review"
- question: "Is this phase OK, or do you want to revise?"
- options:
  - "Looks good" — Approve phase, mark completed
  - "I want to revise" — Describe what needs fixing
  - "Stop for now" — Come back later

If "Looks good" → approve_phase
If "I want to revise" → collect_feedback
If "Stop for now" → end workflow

**collect_feedback:**
Ask user to describe issues. This is conversational — let user explain in natural language. Follow up to understand:
- What file/component has the issue
- What's wrong (bug, approach, missing feature)
- What should change

After understanding the issues, continue to create_fix_plan.

**create_fix_plan:**
- Determine fix phase number: check existing decimal phases for current phase
  - If no `phase-{N}.1/` exists → create `phase-{N}.1/`
  - If `phase-{N}.1/` exists → create `phase-{N}.2/`, etc.
- Create directory: `mkdir -p .specd/features/{feature}/plans/phase-{N.M}/`
- Write `01-PLAN.md` in the new directory using standard plan format
- Plan should contain tasks that address each piece of user feedback
- Update ROADMAP.md to include the fix phase

Present:
```
Fix plan created: plans/phase-{N.M}/01-PLAN.md
{N} tasks to address your feedback.
```

Continue to offer_execution.

**offer_execution:**
Use AskUserQuestion:
- header: "Fix Plan"
- question: "Execute the fix plan now?"
- options:
  - "Execute" — Run the fix plan with execute-plan workflow
  - "Stop for now" — Come back later

If "Execute":
Delegate to execute-plan workflow:
@~/.claude/specdacular/workflows/execute-plan.md

After execution, loop back to show_review (with updated git diff).

**approve_phase:**
- Update config.json: set `phases.current_status` to `"completed"`
- Increment `phases.completed`
- Advance `phases.current` to next phase
- Reset `phases.current_status` to `"pending"`
- Remove `phases.phase_start_commit` (clean up)
- Update STATE.md: mark phase as complete in execution progress
- Commit state changes

```
Phase {N} approved and completed.
```

End workflow (returns to continue-feature which re-reads state).

**Verify:**
```bash
[ -f "specdacular/workflows/review-feature.md" ] && echo "exists"

# Has all required steps
for step in select_feature load_context show_review collect_feedback create_fix_plan offer_execution approve_phase; do
  grep -q "$step" specdacular/workflows/review-feature.md && echo "✓ $step" || echo "✗ $step MISSING"
done
```

**Done when:**
- [ ] `specdacular/workflows/review-feature.md` exists
- [ ] Has 7 steps covering the full review flow
- [ ] Uses git diff for file tracking (DEC-012)
- [ ] Test guidance derived from plan objectives/success criteria
- [ ] Fix plans created in decimal-numbered directories (DEC-006, DEC-014)
- [ ] Approval updates config.json and STATE.md
- [ ] Uses shared select-feature reference (DEC-010)

---

## Verification

```bash
# File exists
ls specdacular/workflows/review-feature.md

# Has all steps
grep -c "step name=" specdacular/workflows/review-feature.md

# References git diff
grep -c "git diff" specdacular/workflows/review-feature.md

# References phase_start_commit
grep -c "phase_start_commit" specdacular/workflows/review-feature.md
```

---

## Output

When this plan is complete, commit:
```bash
git add specdacular/workflows/review-feature.md
git commit -m "feat(improved-feature-flow): create review-feature workflow

Plan 2.01 complete:
- User-guided review with git diff file tracking
- Test guidance from plan objectives/success criteria
- Fix plan creation with decimal phase numbering
- Approval gate for phase transitions"
```
