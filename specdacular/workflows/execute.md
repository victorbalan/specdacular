<purpose>
Execute the current phase's PLAN.md. Runs tasks with verification, handles deviations, commits after each task. Does NOT trigger review — the brain handles that.

**Output:** Implemented code, CHANGELOG.md entries
</purpose>

<philosophy>

## One Phase at a Time

Execute one phase's PLAN.md. The brain decides what happens after.

## Verify Each Task

After each task, run the verification command. If it fails, attempt to fix. If fix fails, stop and ask the user.

## Log Deviations

If implementation differs from plan, log it in CHANGELOG.md. Deviations are neutral — they might be improvements.

## Commit Granularly

Commit after each task (or logical group of closely related tasks). Small commits make review easier.

</philosophy>

<process>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use extended validation (check phases and ROADMAP exist).

Continue to load_context.
</step>

<step name="load_context">
@~/.claude/specdacular/references/load-context.md

Load all task context including phase-specific context.

**Read global config:**
```bash
cat .specd/config.json 2>/dev/null || echo '{}'
```
Check `auto_commit_code` and `auto_commit_docs` settings.

Continue to find_phase.
</step>

<step name="find_phase">
Find the phase to execute.

**Read config.json:**
- `phases.current` — current phase number
- `phases.current_status` — should be "pending" or "executing"

**Find PLAN.md:**
```bash
PHASE_DIR="$TASK_DIR/phases/phase-$(printf '%02d' $CURRENT_PHASE)"
[ -f "$PHASE_DIR/PLAN.md" ] || { echo "no plan"; exit 1; }
```

**Also check for fix plans (decimal phases):**
```bash
ls -d $TASK_DIR/phases/phase-$(printf '%02d' $CURRENT_PHASE).* 2>/dev/null
```
If fix plans exist and are incomplete, execute those first.

Read the PLAN.md. Parse tasks.

Continue to record_start.
</step>

<step name="record_start">
Record phase execution start.

**If this is a fresh start (not resuming):**
```bash
git rev-parse HEAD
```
Store as `phases.phase_start_commit` in config.json if not already set.

Continue to execute_tasks.
</step>

<step name="execute_tasks">
Execute each task from the PLAN.md.

**For each task:**

1. **Announce:** `Starting Task {N}: {title}`

2. **Implement:** Follow the action description. Reference codebase patterns from PATTERNS.md. Follow active decisions from DECISIONS.md.

3. **Verify:** Run the verification command from the plan.
   - If passes: mark done, continue
   - If fails: attempt to fix (max 2 attempts)
   - If still fails: stop and ask user (retry/skip/stop)

4. **Log deviations:** If implementation differs from plan, add to CHANGELOG.md:
   ```markdown
   ### {date} - Phase {N} PLAN.md

   **{Brief title}**
   - **What:** {What was changed/decided}
   - **Why:** {Reason for deviation}
   - **Files:** `{affected files}`
   ```

5. **Commit:**
   @~/.claude/specdacular/references/commit-code.md
   - **$FILES:** files created/modified by this task
   - **$MESSAGE:** `feat({task-name}): {task summary}`

Continue to phase_complete.
</step>

<step name="phase_complete">
Mark phase execution as done.

**Update STATE.md:**
- Add phase to Completed Phases table (or update if fix phase)
- Update current phase info

**Commit state:**
@~/.claude/specdacular/references/commit-docs.md
- **$FILES:** `$TASK_DIR/STATE.md $TASK_DIR/CHANGELOG.md`
- **$MESSAGE:** `docs({task-name}): phase {N} executed`
- **$LABEL:** `phase execution complete`

```
Phase {N} execution complete.
```

End workflow (caller handles continuation).
</step>

</process>

<success_criteria>
- Phase PLAN.md tasks executed in order
- Each task verified after implementation
- Deviations logged in CHANGELOG.md
- Code committed after each task
- Ends cleanly without dispatching review
</success_criteria>
