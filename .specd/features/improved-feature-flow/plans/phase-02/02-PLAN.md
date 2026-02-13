---
feature: improved-feature-flow
phase: 2
plan: 02
depends_on: []
creates: []
modifies:
  - specdacular/workflows/execute-plan.md
---

# Plan 02: Update Execute-Plan for State Machine

## Objective

Modify execute-plan.md to record the phase start commit and mark phases as `executed` (not `completed`) when all plans finish. This is the "write" side of the DEC-009 state machine.

## Context

**Reference these files:**
- `@specdacular/workflows/execute-plan.md` — Current workflow to modify
- `@.specd/features/improved-feature-flow/plans/phase-02/CONTEXT.md` — State machine design

**Relevant Decisions:**
- DEC-009: Phase transition requires explicit user approval
- DEC-012: Store phase_start_commit for review git diff
- DEC-013: Single current_status field in config.json

---

## Tasks

### Task 1: Record phase start commit and set executing status

**Files:** `specdacular/workflows/execute-plan.md`

**Action:**
In the `load_context` step, after reading config.json, add logic:

**After loading config.json, check if this is the first plan of a new phase:**

If `phases.current_status` is `"pending"` or missing:
1. Record the current commit hash:
   ```bash
   git rev-parse HEAD
   ```
2. Update config.json:
   - Set `phases.phase_start_commit` to the commit hash
   - Set `phases.current_status` to `"executing"`
3. Commit the config update:
   ```bash
   git add .specd/features/{feature}/config.json
   git commit -m "docs({feature}): start phase {N} execution"
   ```

If `phases.current_status` is already `"executing"`:
- Phase execution is resuming (context reset mid-phase). No changes needed.

**Verify:**
```bash
grep -q "phase_start_commit" specdacular/workflows/execute-plan.md && echo "✓ start commit tracking" || echo "✗ MISSING"
grep -q "current_status" specdacular/workflows/execute-plan.md && echo "✓ status tracking" || echo "✗ MISSING"
```

**Done when:**
- [ ] load_context step checks `current_status`
- [ ] Records `phase_start_commit` on first plan of phase
- [ ] Sets `current_status` to `"executing"`
- [ ] Handles resume case (already executing)

---

### Task 2: Mark phase as executed when all plans complete

**Files:** `specdacular/workflows/execute-plan.md`

**Action:**
In the `complete_plan` step, after "Find next plan", modify the logic:

**Current behavior:** When all plans complete, shows "All plans complete! Feature is implemented."

**New behavior:** When the last plan in the current phase completes (no more plans in this phase):

1. Update config.json:
   - Set `phases.current_status` to `"executed"`
   - Do NOT increment `phases.completed`
   - Do NOT advance `phases.current`
2. Update STATE.md: note phase is executed, pending review

Present:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE {N} EXECUTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All plans for Phase {N} have been executed.
Phase is pending review before advancing to Phase {N+1}.

Resume with /specd:feature:continue {feature} for review.
```

**Important:** Do NOT say "Feature is implemented" or advance to the next phase. The review gate (DEC-009) must happen first via the review-feature workflow.

**If there ARE more plans in the current phase:**
Continue with existing behavior — present next plan.

**Verify:**
```bash
grep -q '"executed"' specdacular/workflows/execute-plan.md && echo "✓ executed status" || echo "✗ MISSING"
grep -q "PHASE.*EXECUTED" specdacular/workflows/execute-plan.md && echo "✓ executed message" || echo "✗ MISSING"
```

**Done when:**
- [ ] Last plan in phase sets `current_status` to `"executed"` (not advancing)
- [ ] Message says "pending review" not "feature is implemented"
- [ ] Does NOT increment `phases.completed` or advance `phases.current`
- [ ] Remaining plans in phase still work normally

---

## Verification

After all tasks complete:

```bash
# Both changes present
grep -c "phase_start_commit" specdacular/workflows/execute-plan.md
grep -c "current_status" specdacular/workflows/execute-plan.md
grep -c "executed" specdacular/workflows/execute-plan.md
```

---

## Output

When this plan is complete, commit:
```bash
git add specdacular/workflows/execute-plan.md
git commit -m "feat(improved-feature-flow): add state machine to execute-plan

Plan 2.02 complete:
- Record phase_start_commit on first plan execution (DEC-012)
- Set current_status to executing/executed (DEC-013)
- Phase stays executed until review approval (DEC-009)"
```
