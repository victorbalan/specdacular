<purpose>
Review executed phase by comparing plan intent against actual code. Combines semantic inspection with git diff presentation. User approves or requests revisions.

**Core principle:** Claude inspects first, then shows findings to user. User decides.

**Output:** Review findings presented, user choice recorded for brain routing (approve, revise, or stop).
</purpose>

<philosophy>

## Semantic Review, Not Literal Diff

Plans describe intent. Code implements intent. Check whether intent was fulfilled, not whether every word matches.

## Inspect, Then Show

Claude reads the code and compares against the plan first. Then presents findings with the git diff. The user gets a curated view, not a raw dump.

## Deviations Are Neutral

A deviation means code differs from plan. It might be an improvement. The review surfaces it; the user decides.

</philosophy>

<process>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use extended validation. Also check:
- `config.json` → `phases.phase_start_commit` must exist

Continue to load_context.
</step>

<step name="load_context">
@~/.claude/specdacular/references/load-context.md

Load all context including the current phase's PLAN.md.

**Read phase plan:**
```bash
PHASE_NUM=$(cat $TASK_DIR/config.json | grep -o '"current": [0-9]*' | grep -o '[0-9]*')
PHASE_DIR="$TASK_DIR/phases/phase-$(printf '%02d' $PHASE_NUM)"
cat "$PHASE_DIR/PLAN.md"
```

**Get phase start commit:**
```bash
cat $TASK_DIR/config.json | grep phase_start_commit
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

**Record the user's choice** so the brain can route accordingly.
The brain reads this choice and handles:
- "Looks good" → brain approves phase (updates config.json, advances)
- "I want to revise" / "I have concerns" → brain dispatches revise.md
- "Stop for now" → brain saves state, exits

End workflow (caller handles continuation).
</step>

</process>

<success_criteria>
- Plan intent compared against actual code (semantic review)
- Git diff presented to user
- Per-task status with icons (✅ ⚠️ ❌)
- User can approve, revise, or stop
- User's choice recorded for brain routing
- Phase advances only through brain (not in this workflow)
</success_criteria>
