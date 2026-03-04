---
task: rm-keep-discussing
phase: 1
depends_on: []
creates: []
modifies:
  - specdacular/workflows/discuss.md
  - specdacular/workflows/research.md
  - specdacular/workflows/plan.md
  - specdacular/workflows/execute.md
---

# Phase 1: Incremental State Saves

## Objective

Widen every workflow's commit step to include STATE.md and config.json in $FILES, so state is always persisted alongside work product. No new commit points — just wider `git add` scope per DEC-003.

## Context

**Relevant Decisions:**
- DEC-001: Every workflow step that produces meaningful progress must commit STATE.md and config.json immediately
- DEC-003: Bundle state saves into existing commits — no separate state-only commits

**Key Pattern:** Each workflow has a `commit` step using `@commit-docs.md` with a `$FILES` variable. We add the task's STATE.md and config.json to each `$FILES` list.

---

## Tasks

### Task 1: Widen discuss.md commit step

**Files:** `specdacular/workflows/discuss.md`

**Action:**
In the `commit` step (around line 149-155), the current $FILES is:
```
.specd/tasks/{task-name}/CONTEXT.md .specd/tasks/{task-name}/DECISIONS.md .specd/tasks/{task-name}/STATE.md .specd/tasks/{task-name}/config.json
```

discuss.md already includes STATE.md and config.json. **Verify this is correct and no changes needed.**

**Verify:**
```bash
grep -A2 'FILES:' specdacular/workflows/discuss.md | grep -c 'STATE.md'
```

**Done when:**
- [ ] discuss.md commit step includes STATE.md and config.json in $FILES

---

### Task 2: Widen research.md commit step

**Files:** `specdacular/workflows/research.md`

**Action:**
In the `commit` step (around line 142-147), the current $FILES is:
```
$RESEARCH_OUTPUT .specd/tasks/{task-name}/DECISIONS.md .specd/tasks/{task-name}/STATE.md .specd/tasks/{task-name}/config.json
```

research.md already includes STATE.md and config.json. **Verify this is correct and no changes needed.**

**Verify:**
```bash
grep -A2 'FILES:' specdacular/workflows/research.md | grep -c 'STATE.md'
```

**Done when:**
- [ ] research.md commit step includes STATE.md and config.json in $FILES

---

### Task 3: Widen plan.md commit step

**Files:** `specdacular/workflows/plan.md`

**Action:**
In the `commit` step (around line 133-138), the current $FILES is:
```
.specd/tasks/{task-name}/ROADMAP.md .specd/tasks/{task-name}/STATE.md .specd/tasks/{task-name}/config.json
```

plan.md already includes STATE.md and config.json. **Verify this is correct and no changes needed.**

**Verify:**
```bash
grep -A2 'FILES:' specdacular/workflows/plan.md | grep -c 'STATE.md'
```

**Done when:**
- [ ] plan.md commit step includes STATE.md and config.json in $FILES

---

### Task 4: Widen execute.md commit steps

**Files:** `specdacular/workflows/execute.md`

**Action:**
execute.md has TWO commit points:

1. **Per-task code commit** (step `execute_tasks`, item 5, ~line 112): Uses `@commit-code.md` with only code files. This should also include STATE.md + config.json to persist task-level progress. **Add** `.specd/tasks/{task-name}/STATE.md .specd/tasks/{task-name}/config.json` to the commit description for per-task commits.

2. **Phase completion commit** (step `phase_complete`, ~line 127-129): Uses `@commit-docs.md` with `$TASK_DIR/STATE.md $TASK_DIR/CHANGELOG.md`. Add config.json: `$TASK_DIR/STATE.md $TASK_DIR/CHANGELOG.md $TASK_DIR/config.json`.

**Verify:**
```bash
grep -c 'config.json' specdacular/workflows/execute.md
```

**Done when:**
- [ ] execute.md per-task commit mentions STATE.md + config.json
- [ ] execute.md phase_complete commit includes config.json

---

## Verification

After all tasks complete:

```bash
# Every workflow commit step should reference STATE.md and config.json
for f in specdacular/workflows/discuss.md specdacular/workflows/research.md specdacular/workflows/plan.md specdacular/workflows/execute.md; do
  echo "=== $f ==="
  grep -c 'STATE.md' "$f"
  grep -c 'config.json' "$f"
done
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/rm-keep-discussing/CHANGELOG.md`.
