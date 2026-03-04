---
task: rm-keep-discussing
phase: 2
depends_on: [1]
creates: []
modifies:
  - specdacular/workflows/new.md
  - specdacular/workflows/orchestrator/new.md
  - specdacular/workflows/review.md
  - specdacular/workflows/brain.md
---

# Phase 2: Remove Stop Prompts

## Objective

Remove all "keep discussing / stop for now" prompts and exit paths. Workflows flow forward automatically — users close the terminal to stop.

## Context

**Relevant Decisions:**
- DEC-002: Remove all such prompts. Workflows flow forward. Users close terminal to stop.

**Phase 1 complete:** State is now saved incrementally, so these prompts are no longer needed as state-save triggers.

---

## Tasks

### Task 1: Remove continuation_offer from new.md

**Files:** `specdacular/workflows/new.md`

**Action:**
1. In `completion` step (line 243): Change `Continue to continuation_offer.` to `End workflow.`
2. Delete the entire `continuation_offer` step (lines 246-285)
3. Update success_criteria if it references continuation

**Verify:**
```bash
! grep -q 'continuation_offer\|Keep discussing\|Stop for now' specdacular/workflows/new.md
```

**Done when:**
- [ ] No `continuation_offer` step exists
- [ ] No "Keep discussing" or "Stop for now" text
- [ ] `completion` step ends workflow

---

### Task 2: Remove continuation_offer from orchestrator/new.md

**Files:** `specdacular/workflows/orchestrator/new.md`

**Action:**
1. In `completion` step (line 225): Change `Continue to continuation_offer.` to `End workflow.`
2. Delete the entire `continuation_offer` step (lines 228-265)

**Verify:**
```bash
! grep -q 'continuation_offer\|Keep discussing\|Stop for now' specdacular/workflows/orchestrator/new.md
```

**Done when:**
- [ ] No `continuation_offer` step exists
- [ ] No "Keep discussing" or "Stop for now" text

---

### Task 3: Remove "Stop for now" from review.md

**Files:** `specdacular/workflows/review.md`

**Action:**
In `gather_feedback` step:
1. Remove `"Stop for now" — Come back later` option from both the findings and clean question blocks (lines 135 and 144)
2. Update the brain routing comment to remove the "Stop for now" line (line 150)

**Verify:**
```bash
! grep -q 'Stop for now' specdacular/workflows/review.md
```

**Done when:**
- [ ] No "Stop for now" option in any AskUserQuestion
- [ ] Brain routing comments updated

---

### Task 4: Remove "Stop for now" from brain.md

**Files:** `specdacular/workflows/brain.md`

**Action:**
In `prompt_or_proceed` step:
1. Remove `"Stop for now" — Come back later` from execute step options (line 146)
2. Remove `"Stop for now" — Come back later` from interactive mode phase-plan options (line 177)
3. Remove `"Stop for now" — Come back later` from interactive mode execute options (line 182)
4. Remove the "If user chooses Stop for now" block (lines 193-202)

**Verify:**
```bash
! grep -q 'Stop for now' specdacular/workflows/brain.md
```

**Done when:**
- [ ] No "Stop for now" options in any mode
- [ ] No "Stop for now" exit handler

---

## Verification

After all tasks complete:

```bash
for f in specdacular/workflows/new.md specdacular/workflows/orchestrator/new.md specdacular/workflows/review.md specdacular/workflows/brain.md; do
  echo "=== $f ==="
  grep -c 'Stop for now\|Keep discussing\|continuation_offer' "$f" || echo "clean"
done
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] No workflow contains "Stop for now", "Keep discussing", or "continuation_offer"

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/rm-keep-discussing/CHANGELOG.md`.
