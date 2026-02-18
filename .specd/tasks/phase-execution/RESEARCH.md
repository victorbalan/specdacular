# Research: phase-execution

**Confidence:** HIGH
**Date:** 2026-02-18

---

## Key Recommendation

Update pipeline.json phase-execution to `plan → execute → review → revise`. Task-level plan creates ROADMAP.md only. Phase-level plan creates PLAN.md just-in-time. No per-phase research step needed — task-level research is sufficient.

---

## Codebase Integration

### Current State

**pipeline.json** (source: `specdacular/pipeline.json`):
- phase-execution pipeline: `[execute, review, revise]`
- Needs: add `plan` step at the beginning

**brain.md** (source: `specdacular/workflows/brain.md`):
- `prompt_or_proceed`: has execute/review/revise handling for phase-execution
- `update_state`: handles after-execute, after-review, after-revise transitions
- `phase_loop`: manages phase advancement and decimal phases
- Needs: add plan step handling, update routing for "pending" to route to plan first

**brain-routing.md** (source: `specdacular/references/brain-routing.md`):
- Current routing when stage=execution, current_status=pending → routes to `execute`
- Needs: route pending → `plan` instead (plan creates PLAN.md, then brain routes to execute)

**plan.md** (source: `specdacular/workflows/plan.md`):
- Currently: always creates ROADMAP.md + phases/ directories + PLAN.md files
- Needs: dual-mode detection (like research.md does)
  - Task-level (stage≠execution): create ROADMAP.md only, set phases.total, set stage=execution
  - Phase-level (stage=execution): read goal from ROADMAP.md, create phases/phase-NN/PLAN.md

**research.md**: Already has phase-level detection. No changes needed (and won't be in phase-execution pipeline).

**execute.md**: Unchanged — still reads PLAN.md and executes tasks.

**review.md, revise.md**: Unchanged.

### Integration Pattern

research.md already established the pattern for dual-mode workflows:
```
Read config.json → if stage="execution" → phase-level mode
                 → else → task-level mode
```
plan.md follows the same pattern.

---

## State Machine Design

### No New Status Values Needed

Existing statuses work: `pending`, `executing`, `executed`, `completed`

**Phase mini-lifecycle with new plan step:**
```
pending → plan creates PLAN.md → pending (with PLAN.md) → execute → executed → review → completed/revise
```

Wait — we need to distinguish "pending, needs planning" from "pending, has plan, ready to execute". Two options:

**Option A: Check for PLAN.md existence** (RECOMMENDED)
- `pending` + no PLAN.md → route to `plan`
- `pending` + PLAN.md exists → route to `execute`
- No new status values needed
- Consistent with how brain already checks for RESEARCH.md existence

**Option B: Add "planning" status**
- Adds complexity, changes state machine
- Not recommended

### Routing Table (Updated)

```
stage=execution, current_status=pending:
  → Check phases/phase-NN/PLAN.md exists?
    → No:  route to "plan" (phase-execution pipeline)
    → Yes: route to "execute" (phase-execution pipeline)
stage=execution, current_status=executing:  → execute
stage=execution, current_status=executed:   → review
stage=execution, current_status=completed:  → next phase or COMPLETE
```

### State Transitions

| Step completes | Config.json change | Brain routes to |
|---|---|---|
| plan (phase-level) | No status change (stays pending, but PLAN.md now exists) | execute |
| execute | current_status → "executed" | review |
| review (approved) | current_status → "completed" | next phase or complete |
| review (revisions) | stays "executed" | revise |
| revise | current_status → "pending" | plan (if no PLAN.md) or execute |

---

## Edge Cases

### Decimal fix phases (phase-01.1)
These already have PLAN.md from revise.md. Brain checks PLAN.md existence → finds it → routes to execute. Fix phases skip plan step automatically. No special handling needed.

### Resume after interruption
- If interrupted during plan: no PLAN.md exists yet → brain routes to plan again
- If interrupted during execute: current_status="executing" → brain routes to execute (resume)
- If PLAN.md exists but execute hasn't started: current_status="pending" + PLAN.md → routes to execute

### Phase advancement
When phase completes and advances to next phase:
- `phases.current` incremented, `current_status` set to "pending"
- No PLAN.md exists for next phase → brain routes to plan
- This is the key mechanism: just-in-time planning per phase

### Task-level plan output change
Currently plan.md creates:
- ROADMAP.md + phases/ directory + phase-NN/PLAN.md files

Must change to:
- ROADMAP.md only (with phase goals/scope)
- No phases/ directory
- No PLAN.md files
- Set phases.total from ROADMAP.md phase count

---

## Files to Modify (6 total)

| File | Change | Complexity |
|------|--------|------------|
| `specdacular/pipeline.json` | Add plan step to phase-execution | Low |
| `specdacular/workflows/plan.md` | Dual-mode: task-level (ROADMAP only) vs phase-level (PLAN.md) | High |
| `specdacular/workflows/brain.md` | Update routing, prompt_or_proceed, update_state for plan step | Medium |
| `specdacular/references/brain-routing.md` | Add plan routing for pending+no PLAN.md | Low |
| `specdacular/STATE-MACHINE.md` | Update diagrams, routing table, phase lifecycle | Medium |
| `README.md` | Update pipeline description | Low |

**No changes needed:** research.md, execute.md, review.md, revise.md, HELP.md (already generic enough)

---

## Implementation Order

1. **pipeline.json** — Add plan step (foundation)
2. **brain-routing.md** — Update routing table
3. **plan.md** — Add phase-level detection (most complex)
4. **brain.md** — Update prompt_or_proceed + update_state
5. **STATE-MACHINE.md** — Update docs
6. **README.md** — Update pipeline description
