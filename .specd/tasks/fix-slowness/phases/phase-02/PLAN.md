---
task: fix-slowness
phase: 2
depends_on: [1]
creates: []
modifies:
  - specdacular/workflows/execute.md
  - specdacular/workflows/brain.md
  - specdacular/workflows/revise.md
---

# Phase 2: Workflow Integration

## Objective

Update execute.md, brain.md, and revise.md to use specd-utils.js for all mechanical operations — config reads, state transitions, changelog entries, phase management. Eliminate `cat .specd/config.json` patterns and manual JSON editing.

## Context

**From Phase 1:**
- `hooks/specd-utils.js` exists with 13 subcommands (commit, config-update, config-get, phase-info, route, advance-phase, log-changelog, state-add-phase, next-decision-number, record-phase-start, increment, next-decimal-phase, init-task)
- commit-code.md and commit-docs.md already call the script
- brain-routing.md already calls the script

**Relevant Decisions:**
- DEC-001: Node.js for utility script
- DEC-002: Brain routing in script
- DEC-004: Single file with subcommands

---

## Tasks

### Task 1: Update execute.md to use script calls

**Files:** `specdacular/workflows/execute.md`

**Action:**
Replace manual operations in execute.md with specd-utils calls:

1. **find_phase step:** Replace `cat config.json | grep` and `ls -d` with:
   ```bash
   node ~/.claude/hooks/specd-utils.js phase-info --task-dir $TASK_DIR
   ```
   Parse JSON output for phase number, status, plan_exists, tasks_count.

2. **record_start step:** Replace `git rev-parse HEAD` + manual config edit with:
   ```bash
   node ~/.claude/hooks/specd-utils.js config-update --task-dir $TASK_DIR --set "phases.phase_start_commit=$(git rev-parse HEAD)"
   node ~/.claude/hooks/specd-utils.js record-phase-start --task-dir $TASK_DIR --phase $PHASE_NUM
   ```

3. **execute_tasks step, deviation logging:** Replace manual CHANGELOG.md append with:
   ```bash
   node ~/.claude/hooks/specd-utils.js log-changelog --task-dir $TASK_DIR --phase $N --title "..." --what "..." --why "..." --files "..."
   ```

4. **phase_complete step:** Replace manual STATE.md table editing with:
   ```bash
   node ~/.claude/hooks/specd-utils.js state-add-phase --task-dir $TASK_DIR --phase $N --tasks $TASKS --deviations $DEVS
   ```

5. **load_context step:** Remove the `cat .specd/config.json` block — commit references now handle auto-commit internally.

**Verify:**
```bash
grep -c 'cat .specd/config.json\|cat \$TASK_DIR/config.json' specdacular/workflows/execute.md
```
Should return 0.

**Done when:**
- [ ] Zero `cat` config.json patterns in execute.md
- [ ] find_phase uses phase-info script
- [ ] record_start uses config-update + record-phase-start scripts
- [ ] Deviation logging uses log-changelog script
- [ ] phase_complete uses state-add-phase script

---

### Task 2: Update brain.md state transitions to use script calls

**Files:** `specdacular/workflows/brain.md`

**Action:**
Replace manual config.json editing in brain.md with specd-utils calls:

1. **execute_hooks_and_step step:** Replace manual config.json update for execute step with:
   ```bash
   node ~/.claude/hooks/specd-utils.js config-update --task-dir $TASK_DIR --set "phases.current_status=executing"
   node ~/.claude/hooks/specd-utils.js config-update --task-dir $TASK_DIR --set "phases.phase_start_commit=$(git rev-parse HEAD)"
   ```

2. **update_state step:** Replace all state transition logic with script calls:
   - After discuss: `config-update --set "stage=research"` (when gray areas resolved)
   - After research: `config-update --set "stage=planning"`
   - After execute: `config-update --set "phases.current_status=executed"`
   - After review (approved): `config-update --set "phases.current_status=completed"` + `increment --key "phases.completed"`
   - After review (approved, advance): `advance-phase`

3. **phase_loop step:** Replace manual phase advancement with:
   ```bash
   node ~/.claude/hooks/specd-utils.js advance-phase --task-dir $TASK_DIR
   ```

4. **complete step:** Replace manual stage update with:
   ```bash
   node ~/.claude/hooks/specd-utils.js config-update --task-dir $TASK_DIR --set "stage=complete"
   ```

**Verify:**
```bash
grep -c 'cat .specd/config.json\|cat \$TASK_DIR/config.json\|phases\.current += 1' specdacular/workflows/brain.md
```
Should return 0.

**Done when:**
- [ ] All config.json mutations use config-update or advance-phase script
- [ ] No manual JSON editing instructions remain
- [ ] Phase advancement uses advance-phase script
- [ ] State transitions all use script calls

---

### Task 3: Update revise.md to use script calls

**Files:** `specdacular/workflows/revise.md`

**Action:**
Replace manual operations in revise.md with specd-utils calls:

1. **load_context step:** Replace `cat $TASK_DIR/config.json | grep` with:
   ```bash
   node ~/.claude/hooks/specd-utils.js phase-info --task-dir $TASK_DIR
   ```

2. **create_fix_plan step:** Replace manual decimal phase detection and mkdir with:
   ```bash
   node ~/.claude/hooks/specd-utils.js next-decimal-phase --task-dir $TASK_DIR
   ```
   Parse JSON output for phase name and directory path.

3. **signal_outcome step:** Replace manual config.json edit with:
   ```bash
   node ~/.claude/hooks/specd-utils.js config-update --task-dir $TASK_DIR --set "phases.current_status=pending"
   ```

**Verify:**
```bash
grep -c 'cat .specd/config.json\|cat \$TASK_DIR/config.json\|mkdir -p.*phase-' specdacular/workflows/revise.md
```
Should return 0.

**Done when:**
- [ ] Phase info uses phase-info script
- [ ] Decimal phase creation uses next-decimal-phase script
- [ ] Config update uses config-update script
- [ ] No manual bash for config reads or directory creation

---

## Verification

After all tasks complete:

```bash
# No cat config.json in any of the three files
grep -c 'cat .specd/config.json\|cat \$TASK_DIR/config.json' specdacular/workflows/execute.md specdacular/workflows/brain.md specdacular/workflows/revise.md

# Script still works
node hooks/specd-utils.js phase-info --task-dir .specd/tasks/fix-slowness
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] Zero `cat config.json` patterns in execute.md, brain.md, revise.md
- [ ] All state transitions use specd-utils calls
- [ ] All verification commands pass

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/fix-slowness/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
