<purpose>
Execute the current phase's PLAN.md. Runs tasks with verification, handles deviations, commits after each task. Does NOT trigger review — the brain handles that.

**Output:** Implemented code, CHANGELOG.md entries
</purpose>


<process>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use extended validation (check phases and ROADMAP exist).

Continue to load_context.
</step>

<step name="load_context">
@~/.claude/specdacular/references/load-context.md

Set `$CONTEXT_MODE = execution`. Load task context in execution mode (skips discussion history and codebase structure docs).

Continue to find_phase.
</step>

<step name="find_phase">
Find the phase to execute.

```bash
node ~/.claude/hooks/specd-utils.js phase-info --task-dir $TASK_DIR
```

Parse JSON output: `phase`, `status`, `plan_exists`, `tasks_count`, `title`.

If `plan_exists` is false → error, no plan for this phase.

Read the PLAN.md at `$TASK_DIR/phases/phase-{NN}/PLAN.md`. Parse tasks.

Continue to record_start.
</step>

<step name="record_start">
Record phase execution start.

**If this is a fresh start (not resuming):**
```bash
node ~/.claude/hooks/specd-utils.js config-update --task-dir $TASK_DIR --set "phases.phase_start_commit=$(git rev-parse HEAD)"
node ~/.claude/hooks/specd-utils.js record-phase-start --task-dir $TASK_DIR --phase $PHASE_NUM
```

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

4. **Log deviations:** If implementation differs from plan:
   ```bash
   node ~/.claude/hooks/specd-utils.js log-changelog --task-dir $TASK_DIR --phase $N --title "Brief title" --what "What changed" --why "Reason" --files "affected files"
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
```bash
node ~/.claude/hooks/specd-utils.js state-add-phase --task-dir $TASK_DIR --phase $N --tasks $TASK_COUNT --deviations $DEV_COUNT
```

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

