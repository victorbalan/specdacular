---
feature: improved-feature-flow
phase: 2
plan: 03
depends_on:
  - 01
  - 02
creates: []
modifies:
  - specdacular/workflows/continue-feature.md
  - specdacular/templates/features/STATE.md
---

# Plan 03: Update Continue + State Template for State Machine

## Objective

Update continue-feature.md to use the explicit `current_status` field for routing and delegate to the new review-feature.md workflow. Update the STATE.md template to document the phase status tracking.

## Context

**Reference these files:**
- `@specdacular/workflows/continue-feature.md` — Current workflow to modify
- `@specdacular/workflows/review-feature.md` — New review workflow (from Plan 01)
- `@specdacular/templates/features/STATE.md` — Template to update
- `@.specd/features/improved-feature-flow/plans/phase-02/CONTEXT.md` — State machine design

**Relevant Decisions:**
- DEC-009: Phase transition requires explicit user approval
- DEC-013: Single current_status field for routing

---

## Tasks

### Task 1: Update determine_action routing in continue-feature.md

**Files:** `specdacular/workflows/continue-feature.md`

**Action:**
In the `determine_action` step, update the routing logic for execution stage.

**Current routing:**
```
stage=execution, current phase planned but not all plans executed → action_phase_execute
stage=execution, current phase all plans executed → action_phase_review
stage=execution, all phases done → action_complete
```

**New routing (uses explicit current_status from config.json):**
```
stage=execution, current_status == "pending", phase not prepared → action_phase_prepare
stage=execution, current_status == "pending", phase prepared not planned → action_phase_plan
stage=execution, current_status == "executing" → action_phase_execute
stage=execution, current_status == "executed" → action_phase_review
stage=execution, phases.completed == phases.total → action_complete
```

Replace the execution routing section in `determine_action` with the new routing that checks `current_status` explicitly.

**Verify:**
```bash
grep -q "current_status" specdacular/workflows/continue-feature.md && echo "✓ current_status routing" || echo "✗ MISSING"
```

**Done when:**
- [ ] `determine_action` uses `current_status` field for execution routing
- [ ] `"executing"` routes to plan execute
- [ ] `"executed"` routes to review
- [ ] `"pending"` routes to prepare/plan as before
- [ ] All phases done routes to complete

---

### Task 2: Update action_phase_review to use review-feature.md

**Files:** `specdacular/workflows/continue-feature.md`

**Action:**
Update the `action_phase_review` step:

**Current behavior:**
- Shows "Review compares what was planned against what was actually built"
- Offers: Review, Skip to next phase, Stop
- Delegates to `review-phase.md` (old auto-fix workflow)

**New behavior:**
- Shows "All plans executed. Review to approve phase and advance."
- Offers: Review (Recommended), Skip review (approve without reviewing), Stop
- Delegates to `review-feature.md` (new user-guided workflow)
- After review completes (phase approved), loop back to read_state

Replace the `action_phase_review` step content:

```markdown
<step name="action_phase_review">
Offer user-guided review for the executed phase.

```
### Phase {N} Executed — Pending Review

All plans for Phase {N}: {phase-name} have been executed.
Review shows what was built and lets you approve or request revisions.
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Review Phase {N}?"
- options:
  - "Review" — See what changed, approve or request fixes (recommended)
  - "Approve without review" — Mark phase complete and move on
  - "Stop for now" — Come back with /specd:feature:continue

**If Review:**
Execute the review-feature workflow logic:
@~/.claude/specdacular/workflows/review-feature.md

Pass feature name as argument.

After review completes (phase approved and marked completed), loop back to read_state.

**If Approve without review:**
Update config.json:
- Set `phases.current_status` to `"completed"`
- Increment `phases.completed`
- Advance `phases.current`
- Reset `phases.current_status` to `"pending"`
- Remove `phases.phase_start_commit`

Update STATE.md: mark phase as complete.

Commit state changes.

Loop back to read_state.

**If Stop for now:**
→ Go to action_stop
</step>
```

**Verify:**
```bash
grep -q "review-feature" specdacular/workflows/continue-feature.md && echo "✓ review-feature reference" || echo "✗ MISSING"
grep -q "Approve without review" specdacular/workflows/continue-feature.md && echo "✓ skip option" || echo "✗ MISSING"
```

**Done when:**
- [ ] `action_phase_review` delegates to `review-feature.md` (not `review-phase.md`)
- [ ] Offers "Approve without review" as skip option
- [ ] Skip option handles config.json and STATE.md updates
- [ ] Review completion loops back to read_state

---

### Task 3: Update show_status to display current_status

**Files:** `specdacular/workflows/continue-feature.md`

**Action:**
In the `show_status` step, the execution stage display currently shows:
```
**Phase status:** {prepared | planned | executing | executed}
```

This already includes `executed` as a possible value. Verify this is correctly derived from `config.json.phases.current_status` rather than inferred. If it's already using the right source, no change needed. If it's inferring from plan completion, update to read from `current_status` field.

**Done when:**
- [ ] Phase status in show_status reflects `current_status` from config.json

---

### Task 4: Update STATE.md template

**Files:** `specdacular/templates/features/STATE.md`

**Action:**
Add documentation about the phase status tracking. In the "Execution Progress" section, add a note:

After the "Current Plan" subsection, add:
```markdown
### Phase Status

Phase status tracks: `pending` → `executing` → `executed` → `completed`
- **pending** — Phase not yet started
- **executing** — Plans are being executed
- **executed** — All plans done, pending review
- **completed** — User approved, ready for next phase

Current phase status is tracked in `config.json` → `phases.current_status`.
```

**Verify:**
```bash
grep -q "executing.*executed.*completed" specdacular/templates/features/STATE.md && echo "✓ status docs" || echo "✗ MISSING"
```

**Done when:**
- [ ] STATE.md template documents the phase status lifecycle
- [ ] All four states described

---

## Verification

After all tasks complete:

```bash
# continue-feature uses current_status routing
grep -c "current_status" specdacular/workflows/continue-feature.md

# continue-feature references review-feature
grep -c "review-feature" specdacular/workflows/continue-feature.md

# STATE.md template has phase status docs
grep -c "executed" specdacular/templates/features/STATE.md
```

---

## Output

When this plan is complete, commit:
```bash
git add specdacular/workflows/continue-feature.md specdacular/templates/features/STATE.md
git commit -m "feat(improved-feature-flow): wire state machine into continue workflow

Plan 2.03 complete:
- determine_action uses explicit current_status field (DEC-013)
- action_phase_review delegates to review-feature.md (DEC-003)
- Approve without review option for skipping
- STATE.md template documents phase status lifecycle"
```

Phase 2 complete after this plan.
