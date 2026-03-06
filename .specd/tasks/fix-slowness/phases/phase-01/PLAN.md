---
task: fix-slowness
phase: 1
depends_on: []
creates:
  - hooks/specd-utils.js
modifies:
  - specdacular/references/commit-code.md
  - specdacular/references/commit-docs.md
  - specdacular/references/brain-routing.md
---

# Phase 1: Utility Script

## Objective

Create `hooks/specd-utils.js` with subcommands for all deterministic workflow operations, then replace the multi-step logic in commit-code.md, commit-docs.md, and brain-routing.md with single script calls.

## Context

**Reference these files:**
- `hooks/specd-statusline.js` — Pattern to follow (Node.js stdlib only, silent fail)
- `hooks/specd-check-update.js` — Same pattern

**Relevant Decisions:**
- DEC-001: Use Node.js for utility script (zero-dependency, matches existing hooks)
- DEC-002: Include brain routing in the script (deterministic state machine)
- DEC-004: Single file with subcommands (simpler install, shared helpers)

**From Research:**
- config.json read 12 times per 4-task phase for the same auto-commit boolean
- commit-code.md and commit-docs.md each have 3-step check-read-commit logic (37-38 lines)
- brain-routing.md is 168 lines of state parsing that's fully deterministic
- Script must output JSON for machine readability

---

## Tasks

### Task 1: Create hooks/specd-utils.js

**Files:** `hooks/specd-utils.js`

**Action:**
Create a Node.js CLI script with subcommand dispatch via `process.argv[2]`. Uses only Node.js stdlib (fs, path, child_process). Each subcommand reads files, does deterministic work, writes results, outputs JSON to stdout.

Required subcommands:

1. **commit** — `--task-dir DIR --files "f1 f2" --message "msg" --type code|docs`
   - Reads `.specd/config.json` for `auto_commit_code` or `auto_commit_docs`
   - If enabled: runs `git add` + `git commit`
   - Outputs `{"committed": true/false, "message": "..."}`

2. **config-update** — `--task-dir DIR --set "key=value"`
   - Reads task config.json, sets nested key (dot notation), writes back
   - Outputs `{"updated": true, "key": "...", "value": "..."}`

3. **config-get** — `--task-dir DIR --key "key"`
   - Reads task config.json, returns value at key path
   - Outputs `{"key": "...", "value": ...}`

4. **phase-info** — `--task-dir DIR`
   - Reads config.json for current phase number, reads ROADMAP.md for phase title/goal
   - Reads `phases/phase-NN/PLAN.md` if exists
   - Outputs `{"phase": N, "title": "...", "status": "...", "plan_exists": bool, "tasks_count": N}`

5. **route** — `--task-dir DIR`
   - Implements the full brain-routing state machine
   - Reads config.json (stage, phases.*), checks file existence (RESEARCH.md, phases/, PLAN.md)
   - Reads CONTEXT.md for gray area count
   - Outputs `{"next_step": "...", "pipeline": "...", "resume": bool}`

6. **advance-phase** — `--task-dir DIR`
   - Increments phases.current, sets current_status to "pending"
   - Outputs `{"phase": N, "status": "pending"}`

7. **log-changelog** — `--task-dir DIR --phase N --title "x" --what "x" --why "x" --files "x"`
   - Appends entry to CHANGELOG.md
   - Outputs `{"logged": true}`

8. **state-add-phase** — `--task-dir DIR --phase N --tasks N --deviations N`
   - Updates STATE.md completed phases table
   - Outputs `{"updated": true}`

9. **next-decision-number** — `--task-dir DIR`
   - Reads DECISIONS.md, finds highest DEC-NNN, returns next
   - Outputs `{"next": "DEC-005"}`

10. **record-phase-start** — `--task-dir DIR --phase N`
    - Updates STATE.md current phase section
    - Outputs `{"recorded": true}`

11. **increment** — `--task-dir DIR --key "key"`
    - Reads config.json, increments numeric value at key, writes back
    - Outputs `{"key": "...", "value": N}`

12. **next-decimal-phase** — `--task-dir DIR`
    - Reads config.json phases.current, finds next available decimal (e.g., 1.1, 1.2)
    - Creates phase directory
    - Outputs `{"phase": "1.1", "dir": "phases/phase-01.1"}`

13. **init-task** — `--task-dir DIR --name "name"`
    - Creates initial config.json for a new task
    - Outputs `{"created": true}`

**Error handling:** All subcommands catch errors and output `{"error": "message"}` with exit code 1. Never crash with unhandled exceptions.

**Verify:**
```bash
node hooks/specd-utils.js commit --help 2>&1 | head -1
node hooks/specd-utils.js route --task-dir .specd/tasks/fix-slowness 2>&1
node hooks/specd-utils.js config-get --task-dir .specd/tasks/fix-slowness --key "stage" 2>&1
```

**Done when:**
- [ ] All 13 subcommands implemented
- [ ] `node hooks/specd-utils.js route --task-dir .specd/tasks/fix-slowness` returns valid JSON with next_step
- [ ] `node hooks/specd-utils.js config-get --task-dir .specd/tasks/fix-slowness --key "stage"` returns `{"key":"stage","value":"execution"}`
- [ ] `node hooks/specd-utils.js commit --type code --files "test.txt" --message "test" --task-dir .specd/tasks/fix-slowness` respects auto_commit setting

---

### Task 2: Replace commit-code.md with script call

**Files:** `specdacular/references/commit-code.md`

**Action:**
Replace the 3-step check-read-commit logic (37 lines) with a single script call. The reference should instruct Claude to run:

```bash
node ~/.claude/hooks/specd-utils.js commit --task-dir .specd/tasks/$TASK_NAME --type code --files "$FILES" --message "$MESSAGE"
```

Then read the JSON output to determine if committed or skipped.

Keep the `<shared name="commit_code">` wrapper. Target: <10 lines of content.

**Verify:**
```bash
wc -l specdacular/references/commit-code.md
```

**Done when:**
- [ ] commit-code.md is under 15 lines total
- [ ] References the specd-utils.js script
- [ ] Still uses `<shared name="commit_code">` wrapper
- [ ] Explains what $FILES and $MESSAGE should be set to

---

### Task 3: Replace commit-docs.md with script call

**Files:** `specdacular/references/commit-docs.md`

**Action:**
Same as Task 2 but for docs commits. Replace 3-step logic with:

```bash
node ~/.claude/hooks/specd-utils.js commit --task-dir .specd/tasks/$TASK_NAME --type docs --files "$FILES" --message "$MESSAGE"
```

Keep the `<shared name="commit_docs">` wrapper. Target: <10 lines of content.

**Verify:**
```bash
wc -l specdacular/references/commit-docs.md
```

**Done when:**
- [ ] commit-docs.md is under 15 lines total
- [ ] References the specd-utils.js script
- [ ] Still uses `<shared name="commit_docs">` wrapper
- [ ] Explains what $FILES, $MESSAGE, and $LABEL should be set to

---

### Task 4: Replace brain-routing.md with script call

**Files:** `specdacular/references/brain-routing.md`

**Action:**
Replace the 168-line state parsing + conditional logic with a single script call:

```bash
node ~/.claude/hooks/specd-utils.js route --task-dir $TASK_DIR
```

The script returns JSON with `next_step`, `pipeline`, and `resume` fields. The reference should instruct Claude to:
1. Run the route command
2. Parse the JSON output
3. Use the values to dispatch to the next step

Keep the `<shared name="brain_routing">` wrapper. Keep the "Find Step in Pipeline" and "Resolve Workflow Path" sections (those are still needed by brain.md). Target: <30 lines.

**Verify:**
```bash
wc -l specdacular/references/brain-routing.md
```

**Done when:**
- [ ] brain-routing.md is under 40 lines total
- [ ] All routing logic is in the script, not in the reference
- [ ] "Find Step in Pipeline" section preserved
- [ ] "Resolve Workflow Path" section preserved

---

## Verification

After all tasks complete:

```bash
# Script exists and runs
node hooks/specd-utils.js route --task-dir .specd/tasks/fix-slowness

# References are slim
wc -l specdacular/references/commit-code.md specdacular/references/commit-docs.md specdacular/references/brain-routing.md

# Script handles errors gracefully
node hooks/specd-utils.js nonexistent-command 2>&1
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] commit-code.md and commit-docs.md are each <15 lines
- [ ] brain-routing.md is <40 lines
- [ ] specd-utils.js has 13 working subcommands

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/fix-slowness/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
