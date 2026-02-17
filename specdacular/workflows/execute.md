<purpose>
Execute the next phase's PLAN.md. Runs tasks with verification, handles deviations, commits after each task, and automatically triggers review when the phase is complete.

**Output:** Implemented code, CHANGELOG.md entries, automatic review trigger
</purpose>

<philosophy>

## One Phase at a Time

Execute one phase's PLAN.md, then review before moving on. Never skip review.

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
Find the next phase to execute.

**Read config.json:**
- `phases.current` — current phase number
- `phases.current_status` — pending, executing, executed, completed

**If current_status is "executed":**
Phase is done but not reviewed. Trigger review:
@~/.claude/specdacular/workflows/review.md
End this workflow.

**If current_status is "completed":**
Advance to next phase:
- Increment `phases.current`
- Set `phases.current_status` to "pending"

**Find PLAN.md:**
```bash
PHASE_DIR=".specd/tasks/$TASK_NAME/phases/phase-$(printf '%02d' $CURRENT_PHASE)"
[ -f "$PHASE_DIR/PLAN.md" ] || { echo "no plan"; exit 1; }
```

**Also check for fix plans (decimal phases):**
```bash
ls -d .specd/tasks/$TASK_NAME/phases/phase-$CURRENT_PHASE.* 2>/dev/null
```
If fix plans exist and are incomplete, execute those first.

Read the PLAN.md. Parse tasks.

Continue to record_start.
</step>

<step name="record_start">
Record phase execution start.

**If status is "pending" (first time executing this phase):**
```bash
git rev-parse HEAD
```
Store as `phases.phase_start_commit` in config.json.
Set `phases.current_status` to "executing".

Commit config update:
```bash
git add .specd/tasks/{task-name}/config.json
git commit -m "docs({task-name}): start phase {N} execution"
```

**If status is already "executing":**
Resuming — phase_start_commit already recorded.

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
Mark phase as executed and trigger review.

**Update config.json:**
- Set `phases.current_status` to "executed"

**Update STATE.md:**
- Add phase to Completed Phases table
- Update current phase info

**Commit state:**
@~/.claude/specdacular/references/commit-docs.md
- **$FILES:** `.specd/tasks/{task-name}/STATE.md .specd/tasks/{task-name}/config.json .specd/tasks/{task-name}/CHANGELOG.md`
- **$MESSAGE:** `docs({task-name}): phase {N} executed`
- **$LABEL:** `phase execution complete`

**Automatically trigger review:**
```
Phase {N} execution complete. Starting code review...
```

@~/.claude/specdacular/workflows/review.md

End workflow (review takes over).
</step>

</process>

<success_criteria>
- Phase PLAN.md tasks executed in order
- Each task verified after implementation
- Deviations logged in CHANGELOG.md
- Code committed after each task
- Phase marked as "executed" in config.json
- Review automatically triggered after completion
</success_criteria>
