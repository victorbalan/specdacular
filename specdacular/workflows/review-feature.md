<purpose>
User-guided review of an executed phase. Shows what was built (git diff), provides test guidance, and takes user feedback to generate fix plans.

**Core principle:** Show, don't fix. The user examines the code, reports issues, and the review workflow creates targeted fix plans.

**Output:** Phase approved (status → completed) or fix plans in decimal-numbered phase directories.
</purpose>

<philosophy>

## Show, Don't Fix

The review workflow does NOT auto-fix code. It presents what was built and lets the user drive. The user has better judgment about code quality, correctness, and fit.

## Git Diff Is Ground Truth

File tracking uses `git diff` against the phase start commit (DEC-012). This captures everything: planned work, auto-fixes, deviations — not just what the plan intended.

## Fix Plans, Not Inline Fixes

When the user reports issues, the review creates proper PLAN.md files in decimal-numbered directories (DEC-006, DEC-014). These fix plans are executed with the same execute-plan workflow as regular plans, maintaining consistency.

## Review Loop

After fix plans execute, the review loops back — showing the updated diff and asking again. This continues until the user approves.

</philosophy>

<process>

<step name="select_feature">
@~/.claude/specdacular/references/select-feature.md

Continue to load_context.
</step>

<step name="load_context">
Load context needed for review.

**Read feature context:**
- `config.json` — `phases.current`, `phases.phase_start_commit`, `phases.current_status`
- `STATE.md` — Completed plans for current phase
- `ROADMAP.md` — Phase name and goals
- `CHANGELOG.md` — Deviations from this phase

**Validate:**
- `phases.current_status` must be `"executed"` (all plans done, pending review)
- `phases.phase_start_commit` must exist (recorded when execution started)

**If current_status is not "executed":**
```
Phase {N} is not in "executed" state (current: {status}).

Run /specd:feature:continue to get to the right step.
```
End workflow.

**Read current phase's PLAN.md files:**
```bash
ls .specd/features/{feature}/plans/phase-{NN}/*-PLAN.md
```
For each plan, extract:
- Objective
- Success criteria
- Files listed in tasks

Continue to show_review.
</step>

<step name="show_review">
Present what was built and ask for approval.

**Get files changed:**
```bash
git diff {phase_start_commit}..HEAD --stat
git diff {phase_start_commit}..HEAD --name-status
```

**Build summary from plan objectives:**
For each executed plan in this phase, extract the one-line objective.

**Derive test guidance from:**
- Plan success criteria (what should be verifiable)
- File types created (e.g., if workflow .md files: "test by running the commands")
- CHANGELOG.md deviations (anything unusual to check)

**Present:**
```
### Phase {N}: {phase-name} — Review

**Files changed:**
{git diff --stat output}

**What was built:**
{For each plan: one-line objective summary}

**How to test:**
{Test guidance derived from success criteria and file types}

**Deviations from plan:**
{From CHANGELOG.md for this phase, or "None"}
```

Use AskUserQuestion:
- header: "Review"
- question: "Is Phase {N} OK, or do you want to revise?"
- options:
  - "Looks good" — Approve phase, mark completed
  - "I want to revise" — Describe what needs fixing
  - "Stop for now" — Come back later with /specd:feature:continue

**If "Looks good":**
→ Go to approve_phase

**If "I want to revise":**
→ Go to collect_feedback

**If "Stop for now":**
```
───────────────────────────────────────────────────────

Progress saved. Phase stays in "executed" state.
Resume review with /specd:feature:continue {feature-name}
```
End workflow.
</step>

<step name="collect_feedback">
Gather user feedback on what needs fixing.

**Ask the user to describe issues:**
```
Tell me what needs fixing. You can describe:
- Bugs or incorrect behavior
- Approach you'd prefer changed
- Missing functionality
- Code quality issues

Describe as many issues as you want — I'll create a fix plan for all of them.
```

Wait for user response.

**Follow up to understand each issue:**
For each issue mentioned:
- What file/component is affected?
- What's wrong (bug, wrong approach, missing)?
- What should it look like instead?

After understanding all issues, continue to create_fix_plan.
</step>

<step name="create_fix_plan">
Create a fix plan from user feedback.

**Determine fix phase number:**
```bash
# Check existing decimal phases for current phase
ls -d .specd/features/{feature}/plans/phase-{N}.* 2>/dev/null | sort -V | tail -1
```

- If no decimal phases exist → create `phase-{N}.1/`
- If `phase-{N}.1/` exists → create `phase-{N}.2/`, etc.
- Increment from the highest existing decimal

**Create fix phase directory:**
```bash
mkdir -p .specd/features/{feature}/plans/phase-{N.M}/
```

**Write fix plan:**
Write `01-PLAN.md` in the new directory using standard plan format:

```markdown
---
feature: {feature-name}
phase: {N.M}
plan: 01
depends_on: []
creates: []
modifies:
  - {files that need fixing}
---

# Plan 01: Fix Phase {N} Issues

## Objective

Address review feedback for Phase {N}: {phase-name}.

## Context

**User feedback:**
{Summarize each issue reported}

## Tasks

### Task 1: {Fix description}
**Files:** `{file}`
**Action:** {What to change}
**Verify:** {How to verify the fix}
**Done when:** {Acceptance criteria}

{Repeat for each issue}
```

**Update ROADMAP.md:**
Add the fix phase entry after the parent phase.

**Commit the fix plan:**
```bash
git add .specd/features/{feature}/plans/phase-{N.M}/ .specd/features/{feature}/ROADMAP.md
git commit -m "docs({feature}): create fix plan phase-{N.M}

Review feedback:
- {issue summaries}"
```

Present:
```
Fix plan created: plans/phase-{N.M}/01-PLAN.md
{task_count} task(s) to address your feedback.
```

Continue to offer_execution.
</step>

<step name="offer_execution">
Offer to execute the fix plan.

Use AskUserQuestion:
- header: "Fix Plan"
- question: "Execute the fix plan now?"
- options:
  - "Execute" — Run the fix plan (recommended)
  - "Stop for now" — Come back later

**If "Execute":**
Execute the fix plan using the execute-plan workflow logic:
@~/.claude/specdacular/workflows/execute-plan.md

Pass feature name as argument. The execute-plan workflow will find the fix plan as the next incomplete plan.

After execution completes, loop back to show_review (updated diff will reflect fixes).

**If "Stop for now":**
```
───────────────────────────────────────────────────────

Fix plan saved. Resume with /specd:feature:continue {feature-name}
```
End workflow.
</step>

<step name="approve_phase">
Mark phase as completed and advance to next.

**Update config.json:**
```json
{
  "phases": {
    "current_status": "completed",
    "completed": {N},
    "current": {N+1},
    "phase_start_commit": null
  }
}
```

Then immediately reset for next phase:
```json
{
  "phases": {
    "current_status": "pending"
  }
}
```

(In practice: increment completed, advance current, set current_status to "pending", remove phase_start_commit.)

**Update STATE.md:**
Mark phase as complete in execution progress checkboxes.

**Commit state changes:**
```bash
git add .specd/features/{feature}/config.json .specd/features/{feature}/STATE.md
git commit -m "docs({feature}): phase {N} approved — review complete"
```

**Present:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE {N} COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {N}: {phase-name} approved.
{If more phases: "Next: Phase {N+1}: {next-phase-name}"}
{If all phases done: "All phases complete!"}
```

End workflow (returns to continue-feature which re-reads state).
</step>

</process>

<success_criteria>
- [ ] Feature selected (from argument or picker)
- [ ] Phase validated as "executed" status
- [ ] Git diff shows actual files changed (DEC-012)
- [ ] Test guidance derived from plan objectives/success criteria
- [ ] User can approve or request revisions
- [ ] Fix plans created in decimal-numbered directories (DEC-006, DEC-014)
- [ ] Fix plan execution loops back to review
- [ ] Approval updates config.json and STATE.md (DEC-009, DEC-013)
- [ ] Phase advances only after explicit user approval
</success_criteria>
