<purpose>
Review executed phase by comparing plan intent against actual code. Combines semantic inspection with git diff presentation. User approves or requests revisions.

**Core principle:** Claude inspects first, then shows findings to user. User decides.

**Output:** Phase approved (advance to next) or fix plans in decimal phases (e.g., phase-01.1/)
</purpose>

<philosophy>

## Semantic Review, Not Literal Diff

Plans describe intent. Code implements intent. Check whether intent was fulfilled, not whether every word matches.

## Inspect, Then Show

Claude reads the code and compares against the plan first. Then presents findings with the git diff. The user gets a curated view, not a raw dump.

## Fix Plans, Not Inline Fixes

When the user reports issues, create proper PLAN.md files in decimal phases. These get executed through the same execute workflow.

## Deviations Are Neutral

A deviation means code differs from plan. It might be an improvement. The review surfaces it; the user decides.

</philosophy>

<process>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use extended validation. Also check:
- `config.json` → `phases.current_status` must be "executed"
- `config.json` → `phases.phase_start_commit` must exist

**If status is not "executed":**
```
Phase {N} is not ready for review (status: {status}).

Run /specd:continue {task-name} to get to the right step.
```
End workflow.

Continue to load_context.
</step>

<step name="load_context">
@~/.claude/specdacular/references/load-context.md

Load all context including the current phase's PLAN.md.

**Read phase plan:**
```bash
PHASE_NUM=$(cat .specd/tasks/$TASK_NAME/config.json | grep -o '"current": [0-9]*' | grep -o '[0-9]*')
PHASE_DIR=".specd/tasks/$TASK_NAME/phases/phase-$(printf '%02d' $PHASE_NUM)"
cat "$PHASE_DIR/PLAN.md"
```

**Get phase start commit:**
```bash
cat .specd/tasks/$TASK_NAME/config.json | grep phase_start_commit
```

Continue to inspect_code.
</step>

<step name="inspect_code">
Compare plan intent against actual implementation.

**Get git diff:**
```bash
git diff {phase_start_commit}..HEAD --stat
git diff {phase_start_commit}..HEAD --name-status
```

**For each task in the PLAN.md:**

1. **File check:** Do the files listed in `creates` exist? Do the files in `modifies` still exist?

2. **Intent check:** Read each created/modified file. Does the code achieve what the task described?

3. **Classify:**
   - ✅ **Match** — Files exist, intent fulfilled
   - ⚠️ **Deviation** — Works but differs from plan
   - ❌ **Incomplete** — Missing files or objectives not met

4. **For deviations/incomplete, note:**
   - What the plan specified
   - What was actually implemented (or what's missing)
   - Impact: Low (cosmetic), Medium (behavioral), High (missing functionality)

**Check CHANGELOG.md** for already-logged deviations to avoid duplicates.

Continue to present_findings.
</step>

<step name="present_findings">
Show review results to user.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Task:** {task-name}
**Phase:** {N} — {phase title}

**Files changed:**
{git diff --stat output}

**Summary:** {N} ✅ | {N} ⚠️ | {N} ❌

**What was built:**
{For each task: one-line status with icon}
```

**If deviations or incomplete items exist:**
For each:
```
───────────────────────────────────────────────────────
Task {N}: {Title} — {⚠️ | ❌}
───────────────────────────────────────────────────────
**Planned:** {what the plan specified}
**Actual:** {what was implemented or missing}
**Impact:** {Low | Medium | High}
```

**If all clean:**
```
All tasks match their intended implementation. Phase {N} is clean.
```

Continue to gather_feedback.
</step>

<step name="gather_feedback">
Ask user for their assessment.

**If findings exist (⚠️ or ❌):**
Use AskUserQuestion:
- header: "Review"
- question: "How would you like to handle these findings?"
- options:
  - "Looks good" — Accept all, approve phase
  - "I want to revise" — Describe what needs fixing
  - "Stop for now" — Come back later

**If clean:**
Use AskUserQuestion:
- header: "Review"
- question: "Phase {N} review is clean. Approve?"
- options:
  - "Looks good" — Approve phase
  - "I have concerns" — Describe issues
  - "Stop for now" — Come back later

**If "Looks good":**
Continue to approve_phase.

**If "I want to revise" or "I have concerns":**
Continue to collect_feedback.

**If "Stop for now":**
```
Progress saved. Phase stays in "executed" state.
Resume review with /specd:continue {task-name}
```
End workflow.
</step>

<step name="collect_feedback">
Gather specific feedback from user.

```
Tell me what needs fixing. You can describe:
- Bugs or incorrect behavior
- Approach you'd prefer changed
- Missing functionality
- Code quality issues

Describe as many issues as you want — I'll create a fix plan for all of them.
```

Wait for user response. Follow up to understand each issue clearly.

Continue to create_fix_plan.
</step>

<step name="create_fix_plan">
Create a fix plan in a decimal phase.

**Determine fix phase number:**
```bash
ls -d .specd/tasks/$TASK_NAME/phases/phase-$CURRENT.* 2>/dev/null | sort -V | tail -1
```
- If no decimal phases → create `phase-{N}.1/`
- If `phase-{N}.1/` exists → create `phase-{N}.2/`, etc.

**Create fix phase directory and PLAN.md:**
```bash
mkdir -p .specd/tasks/$TASK_NAME/phases/phase-{N.M}/
```

Write `PLAN.md` using standard plan format:
- Objective: Address review feedback for Phase {N}
- Tasks: One per issue reported, with clear fix description and verification

**Update ROADMAP.md:**
Add fix phase entry after the parent phase.

**Commit:**
@~/.claude/specdacular/references/commit-docs.md
- **$FILES:** fix plan directory + ROADMAP.md
- **$MESSAGE:** `docs({task-name}): create fix plan phase-{N.M}`
- **$LABEL:** `fix plan`

**Offer execution:**
Use AskUserQuestion:
- header: "Fix Plan"
- question: "Execute the fix plan now?"
- options:
  - "Execute" — Run the fix plan
  - "Stop for now" — Come back later

**If "Execute":**
Execute fix plan via:
@~/.claude/specdacular/workflows/execute.md

After fix execution, loop back to the validate step of this review workflow (re-review with updated diff).

**If "Stop for now":**
```
Fix plan saved. Resume with /specd:continue {task-name}
```
End workflow.
</step>

<step name="approve_phase">
Mark phase as completed and advance.

**Update config.json:**
- Set `phases.current_status` to "completed"
- Increment `phases.completed`
- Advance `phases.current` to next phase
- Reset `phases.phase_start_commit` to null
- Set new phase status to "pending"

**Update STATE.md:**
- Mark phase as complete in execution progress

**Add review cycle to STATE.md:**
```markdown
| {N} | 1 | {date} | {summary} | {fix plans or "—"} | clean |
```

**Commit:**
@~/.claude/specdacular/references/commit-docs.md
- **$FILES:** config.json + STATE.md
- **$MESSAGE:** `docs({task-name}): phase {N} approved`
- **$LABEL:** `phase approved`

**Present:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE {N} COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {N}: {phase-name} approved.
{If more phases: "Next: Phase {N+1}: {next-phase-name}"}
{If all phases done: "All phases complete! Task '{task-name}' is done."}
```

End workflow (caller handles continuation).
</step>

</process>

<success_criteria>
- Plan intent compared against actual code (semantic review)
- Git diff presented to user
- Per-task status with icons (✅ ⚠️ ❌)
- User can approve, revise, or stop
- Fix plans created in decimal phases when needed
- Fix plans execute through same execute workflow
- Review loops after fix execution
- Phase advances only after explicit user approval
</success_criteria>
