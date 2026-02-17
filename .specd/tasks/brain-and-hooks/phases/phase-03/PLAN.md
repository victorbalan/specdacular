---
task: brain-and-hooks
phase: 3
depends_on: [1]
creates:
  - specdacular/workflows/revise.md
modifies:
  - specdacular/workflows/continue.md
  - specdacular/workflows/execute.md
  - specdacular/workflows/review.md
  - specdacular/workflows/plan.md
---

# Phase 3: Simplify Step Workflows + Extract Revise

## Objective

Strip flow control from individual step workflows so they become pure execution units. Extract `revise.md` from review.md. Update continue.md to delegate to brain.md. After this phase, all orchestration lives in the brain.

## Context

**Reference these files:**
- `@specdacular/workflows/continue.md` — Current orchestrator to thin out
- `@specdacular/workflows/execute.md` — Has auto-trigger review to remove
- `@specdacular/workflows/review.md` — Has collect_feedback + create_fix_plan to extract
- `@specdacular/workflows/plan.md` — Has orchestrator mode check to remove
- `@specdacular/workflows/brain.md` — The brain that now owns flow control

**Relevant Decisions:**
- DEC-001: Brain owns all flow control — steps just do their job and return
- DEC-009: Revise extracted from review as separate step

**From Research:**
- execute.md: Remove auto-trigger review at end, remove phase status transitions (brain owns these)
- review.md: Remove collect_feedback and create_fix_plan (→ revise.md), remove approve_phase state transitions (→ brain)
- plan.md: Remove orchestrator mode check at top
- continue.md: Becomes thin entry point — parse args, validate, delegate to brain
- Revise must signal outcome to brain (e.g., fix_plan_created flag) for loop routing (Pitfall #1)

---

## Tasks

### Task 1: Create revise.md

**Files:** `specdacular/workflows/revise.md`

**Action:**
Extract from review.md's `collect_feedback` and `create_fix_plan` steps into a new workflow:

Structure:
```
<purpose> — Collect user feedback on review findings and create fix plans
<process>
  <step name="load_context"> — Read review findings from STATE.md / recent review output
  <step name="collect_feedback"> — Ask user what needs fixing (from review.md lines 173-188)
  <step name="create_fix_plan"> — Create decimal phase fix plan (from review.md lines 191-237)
  <step name="signal_outcome"> — Write fix_plan_created flag to config.json for brain routing
  <step name="commit"> — Commit fix plan
</process>
```

Critical: The `signal_outcome` step must write to config.json so the brain knows to route back to execute for the current phase (not advance). Use `phases.current_status: "pending"` to signal the fix plan needs execution.

End with "End workflow (caller handles continuation)."

**Verify:**
```bash
[ -f "specdacular/workflows/revise.md" ] && grep -q "collect_feedback\|create_fix_plan" specdacular/workflows/revise.md && echo "exists with key steps"
```

**Done when:**
- [ ] revise.md created with feedback collection + fix plan creation
- [ ] Signals outcome via config.json for brain routing
- [ ] Follows workflow structure pattern
- [ ] Ends cleanly without dispatching next step

---

### Task 2: Simplify review.md

**Files:** `specdacular/workflows/review.md`

**Action:**
Remove from review.md:
- `collect_feedback` step (moved to revise.md)
- `create_fix_plan` step (moved to revise.md)
- `approve_phase` step — state transitions move to brain (brain updates `phases.current_status` to "completed" and advances `phases.current`)

Keep in review.md:
- `validate` step (but remove the status check — brain handles routing)
- `load_context` step
- `inspect_code` step
- `present_findings` step
- `gather_feedback` step — simplified to just: ask user "Looks good" / "I want to revise" / "Stop for now". Return the choice. Brain routes accordingly.

The workflow now ends after `gather_feedback` with a clear signal:
- If "Looks good" → brain handles phase approval
- If "I want to revise" → brain dispatches revise.md
- If "Stop for now" → brain saves state

Write the user's choice to STATE.md or config.json so the brain can read it on the next loop iteration.

**Verify:**
```bash
! grep -q "create_fix_plan" specdacular/workflows/review.md && echo "flow control removed"
```

**Done when:**
- [ ] collect_feedback, create_fix_plan, approve_phase removed
- [ ] gather_feedback simplified to return user's choice
- [ ] Ends cleanly without dispatching next step
- [ ] Signals review outcome for brain routing

---

### Task 3: Simplify execute.md

**Files:** `specdacular/workflows/execute.md`

**Action:**
Remove from execute.md:
- `phase_complete` step's auto-trigger of review (`@review.md` dispatch at the end)
- Phase status transition to "executed" in `phase_complete` — brain handles this after execute returns

Keep in execute.md:
- `validate` step
- `load_context` step
- `find_phase` step — but remove the "If current_status is executed, trigger review" logic (brain handles)
- `record_start` step — keep recording `phase_start_commit`, but the brain should set `phases.current_status: "executing"` before dispatching
- `execute_tasks` step — task execution, verification, deviation logging, commits
- `phase_complete` step — simplified to just commit state update and end

End with "End workflow (caller handles continuation)."

**Verify:**
```bash
! grep -q "@.*review.md" specdacular/workflows/execute.md && echo "review trigger removed"
```

**Done when:**
- [ ] Auto-trigger of review removed
- [ ] Phase status transitions moved to brain responsibility
- [ ] Ends cleanly without dispatching review
- [ ] Task execution logic preserved intact

---

### Task 4: Simplify plan.md

**Files:** `specdacular/workflows/plan.md`

**Action:**
Remove the orchestrator mode check from `load_context` step:
```
**Check for orchestrator mode:**
Read config.json. If `"orchestrator": true`:
Hand off to orchestrator workflow:
@orchestrator/plan.md
End main workflow.
```

The brain handles mode-specific routing before dispatching plan.md.

Everything else in plan.md stays as-is.

**Verify:**
```bash
! grep -q "orchestrator" specdacular/workflows/plan.md && echo "orchestrator check removed"
```

**Done when:**
- [ ] Orchestrator mode check removed
- [ ] All other planning logic preserved
- [ ] Ends cleanly

---

### Task 5: Thin out continue.md

**Files:** `specdacular/workflows/continue.md`

**Action:**
Replace all of continue.md's content with a thin delegation to brain.md:

```
<purpose>
Continue a task's lifecycle. Delegates to brain.md for all flow control.
</purpose>

<process>
<step name="delegate">
Pass $ARGUMENTS through to brain.md.

@specdacular/workflows/brain.md

End workflow.
</step>
</process>
```

The brain handles all parsing, validation, state loading, routing, mode handling, and dispatch. Continue.md just forwards.

**Verify:**
```bash
wc -l < specdacular/workflows/continue.md | awk '$1 < 30 { print "thinned out" }'
```

**Done when:**
- [ ] continue.md is < 30 lines
- [ ] Delegates entirely to brain.md
- [ ] No flow control logic remains

---

## Verification

After all tasks complete:

```bash
[ -f "specdacular/workflows/revise.md" ] && ! grep -q "create_fix_plan" specdacular/workflows/review.md && ! grep -q "@.*review.md" specdacular/workflows/execute.md && echo "Phase 3 complete"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] revise.md exists with extracted logic
- [ ] review.md, execute.md, plan.md stripped of flow control
- [ ] continue.md is a thin wrapper
- [ ] No step workflow dispatches another step workflow

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/brain-and-hooks/CHANGELOG.md`.
