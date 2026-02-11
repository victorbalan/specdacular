<purpose>
Review executed plans for a phase by comparing intended changes against actual code.
Surfaces deviations, captures user feedback, records decisions, and generates corrective plans.

**Key principles:**
- Inspect semantically, not literally — did the code achieve what the plan intended?
- Claude inspects first, then asks the user (DEC-001)
- Support partial review — only inspect completed plans (DEC-006)
- Progressive disclosure — summary, then details, then conversation (DEC-005)

**Output:** Review findings, updated STATE.md (Review Cycles), CHANGELOG.md entries, corrective plans (if needed)
</purpose>

<philosophy>

## Semantic Review, Not Literal Diff

Plans describe intent. Code implements intent. The review checks whether intent was fulfilled,
not whether every word matches. A plan saying "create user service" that results in `users.service.ts`
instead of `user-service.ts` is a match, not a deviation.

Use plan `creates`/`modifies` frontmatter for file-level verification.
Use Claude's understanding for intent-level verification.

## Deviations Are Neutral

A deviation means code differs from the plan. It might be an improvement, a mistake, or an
intentional change. The review surfaces it; the user decides if it matters.

## Corrective Plans Fix Gaps, Not Add Features

When generating corrective plans, scope them to what the original plan intended but didn't achieve.
Don't use review as a backdoor to add features or refactor code.

## Iteration Has Limits

Max 3 review cycles per phase. If findings increase between cycles, stop and discuss.
Show progress: "Cycle 2/3: 2 issues (down from 5)".

</philosophy>

<process>

<step name="validate">
Validate feature exists, phase exists, and has execution history.

**Check feature:**
- `.specd/features/{feature}` directory exists
- `STATE.md`, `DECISIONS.md`, `ROADMAP.md` exist

**Check phase:**
- Phase {N} exists in ROADMAP.md
- `.specd/features/{feature}/plans/phase-{NN}/` directory exists
- At least one plan file exists in the phase directory

**Check execution:**
- STATE.md has at least one plan from this phase in the Completed Plans table
- If no completed plans: show error and suggest running `/specd:phase:execute` first

**Check git state:**
- Warn if uncommitted changes exist (review may not reflect actual state)

**If feature not found:**
```
Feature '{name}' not found.

Run /specd:feature:new {name} to create it.
```

**If no executed plans:**
```
No executed plans found for {feature} phase {N}.

Run /specd:phase:execute {feature} to execute plans first.
```

Continue to load_context.
</step>

<step name="load_context">
Load ALL context needed for review.

**Read feature context:**
- `config.json` — Feature settings
- `STATE.md` — Current progress, completed plans, existing review cycles
- `DECISIONS.md` — Active decisions to be aware of
- `RESEARCH.md` — Implementation notes, pitfalls (if exists)
- `ROADMAP.md` — Phase overview, success criteria
- `CHANGELOG.md` — Existing logged deviations (if exists, to avoid duplicates)

**Read phase context:**
- `plans/phase-{NN}/CONTEXT.md` — Phase-specific discussion resolutions (if exists)
- `plans/phase-{NN}/RESEARCH.md` — Phase-specific research findings (if exists)

**Read ALL plan files for this phase:**
- `plans/phase-{NN}/*-PLAN.md` — Every plan file, including any corrective plans
- Parse YAML frontmatter: `creates`, `modifies`, `corrects`, `depends_on`
- Parse plan objectives and task descriptions

**Read codebase context (if available):**
- `PATTERNS.md` — Code patterns to follow
- `STRUCTURE.md` — Where files go
- `MAP.md` — System overview

**Internalize:**
- Which plans are complete vs pending (from STATE.md Completed Plans table)
- What files each plan was supposed to create or modify
- Phase success criteria from ROADMAP.md
- Existing review cycles (to determine cycle number)
- Existing CHANGELOG.md entries (to avoid duplicate logging)

Continue to filter_plans.
</step>

<step name="filter_plans">
Separate completed and pending plans for this phase (DEC-006).

**From STATE.md Completed Plans table:**
1. Identify plans from this phase with status "Complete"
2. These are the plans to inspect

**Remaining plans:**
- Plans without a completion entry are "pending" (not yet executed)
- Show as ⏸️ in the status table but don't inspect

**Build plan list:**
For each completed plan, collect:
- Plan path (e.g., `phase-01/01-PLAN.md`)
- Plan title
- `creates` list from frontmatter
- `modifies` list from frontmatter
- `corrects` list from frontmatter (if corrective plan)
- Completion date from STATE.md

**If corrective plans exist (have `corrects` frontmatter):**
- Note which original plans they correct
- Inspection of corrective plans follows the same process

Continue to inspect_phase.
</step>

<step name="inspect_phase">
For each completed plan, compare intended changes against actual code.

**For each completed plan:**

### 1. File-level verification
For each file in `creates`:
- Check if file exists on disk
- If missing: mark ❌ Incomplete

For each file in `modifies`:
- Check if file exists on disk
- If missing: mark ❌ Incomplete (file may have been deleted)

### 2. Intent-level verification
For each file that exists:
- Read the file content
- Read the plan's task descriptions for that file
- Compare semantically: did the code achieve what the plan described?
- Consider:
  - Does the file fulfill the plan's stated objective?
  - Are the key structures/patterns the plan specified present?
  - Are there significant omissions vs what the plan described?

### 3. Classify each plan
Assign a status based on findings:

| Status | Icon | Criteria |
|--------|------|----------|
| Match | ✅ | All files exist, intent fulfilled, no significant deviations |
| Deviation | ⚠️ | Files exist and work, but implementation differs from plan |
| Incomplete | ❌ | Missing files, or plan objectives clearly not met |
| Not executed | ⏸️ | Plan not in Completed Plans table (pending) |

### 4. Collect deviation details
For each deviation (⚠️) or incomplete (❌):
- **Plan reference:** Which plan, which task
- **Planned:** What the plan specified
- **Actual:** What was actually implemented (or what's missing)
- **Files:** Affected file paths
- **Impact:** Low (cosmetic/naming), Medium (behavioral), High (missing functionality)

### 5. Check phase success criteria
Read phase success criteria from ROADMAP.md.
For each criterion, assess if it's been met by the executed plans.
Flag unmet criteria as additional findings.

Continue to present_findings.
</step>

<step name="present_findings">
Present review findings using progressive disclosure (DEC-005).

**Display review header:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}
**Phase:** {N} — {phase title}
**Review Cycle:** {cycle number}
**Plans reviewed:** {completed count} of {total count}
```

**1. Summary line:**
```
Summary: {N} ✅ | {N} ⚠️ | {N} ❌ | {N} ⏸️
```

**2. Per-plan status table:**
```
| Plan | Title | Status | Files |
|------|-------|--------|-------|
| 01 | {title} | ✅ Match | {N} files checked |
| 02 | {title} | ⚠️ Deviation | {N} of {M} files match |
| 03 | {title} | ❌ Incomplete | {N} files missing |
| 04 | {title} | ⏸️ Not executed | — |
```

**3. Expanded details (only for ⚠️ and ❌):**

For each plan with deviations or incomplete status:
```
───────────────────────────────────────────────────────
Plan {NN}: {Title} — {⚠️ Deviation | ❌ Incomplete}
───────────────────────────────────────────────────────

**Finding 1: {Short description}**
- **Planned:** {What the plan specified}
- **Actual:** {What was implemented or what's missing}
- **Files:** `{file paths}`
- **Impact:** {Low | Medium | High}

**Finding 2: {Short description}**
...
```

**4. Phase success criteria check:**
```
Phase Success Criteria:
- [x] {Met criterion}
- [ ] {Unmet criterion} — {brief explanation}
```

**If all clean (no ⚠️ or ❌):**
```
All executed plans match their intended implementation. Phase {N} is clean.
```

Continue to gather_user_input.
</step>

<step name="gather_user_input">
Ask the user for feedback on the review findings (DEC-001).

**If findings exist (⚠️ or ❌):**

Use AskUserQuestion:
- header: "Review"
- question: "How would you like to handle these findings?"
- options:
  - "Generate corrective plans" — Create corrective plans for all issues
  - "Discuss findings" — Talk through each finding before deciding
  - "Accept all deviations" — Mark all deviations as intentional, phase is clean
  - "Accept some, fix others" — Go through findings one by one

**If "Discuss findings" or "Accept some, fix others":**
For each finding, ask:
- header: "Finding"
- question: "{Finding description} — how to handle?"
- options:
  - "Accept as-is" — Deviation is intentional, no action needed
  - "Generate corrective plan" — Create a plan to fix this
  - "Record as decision" — This is a deliberate choice, record in DECISIONS.md

Collect user's response for each finding.

**If clean (no ⚠️ or ❌):**

Use AskUserQuestion:
- header: "Review"
- question: "Review is clean. Any additional issues to flag?"
- options:
  - "No, phase looks good" — Mark phase as clean
  - "Yes, I have concerns" — Capture user's additional issues

**If user has additional concerns:**
Ask them to describe the issues. For each issue:
- Classify as deviation or new requirement
- Add to findings list for corrective plan generation

Continue to record_decisions.
</step>

<step name="record_decisions">
Record any new decisions made during the review conversation.

**Collect decisions from:**
- User accepting deviations as intentional ("we meant to do it this way")
- User choosing a different approach than the plan specified
- User flagging issues that reveal design choices

**For each new decision:**
Append to `.specd/features/{feature}/DECISIONS.md`:
```markdown
### DEC-{NNN}: {Decision title}

**Date:** {YYYY-MM-DD}
**Status:** Active
**Context:** Discovered during phase {N} review (cycle {C})
**Decision:** {What was decided}
**Rationale:**
- {Why this decision was made}
**Implications:**
- {What this means for implementation}
```

**Update decision count** in `config.json`.

**If no new decisions:** Skip this step.

Continue to generate_correctives.
</step>

<step name="generate_correctives">
Generate corrective plans for findings that need fixes (DEC-003).

**Skip if:** All findings were accepted or no findings exist.

**Determine next plan number:**
- Count existing plan files in the phase directory
- Next corrective plan number = max existing number + 1

**For each group of findings to fix:**

Create a corrective plan file at `plans/phase-{NN}/{MM}-PLAN.md`:

```yaml
---
feature: {feature-name}
phase: {N}
plan: {MM}
depends_on:
  - phase-{NN}/{last-executed}-PLAN.md
creates:
  - {any new files needed}
modifies:
  - {files that need fixing}
corrects:
  - {original plan numbers being corrected, e.g., [01, 03]}
---
```

**Corrective plan content:**
- Objective: Fix specific deviations/issues from review cycle {C}
- Reference the original plan's intent
- Tasks scoped to fixing gaps, not adding features
- Each task has verification
- Include the planned vs actual from review findings

**Scoping rules (CAPA framework):**
- Corrective plans should modify fewer files than the original plans, not more
- Fix what was intended but not done — don't add features
- If a finding spans multiple original plans, one corrective plan can reference multiple via `corrects: [01, 03]`
- Ask user before generating if scope seems large

**Present generated plans:**
```
Generated corrective plans:

| Plan | Corrects | Title | Files |
|------|----------|-------|-------|
| {MM}-PLAN.md | Plan(s) {NN} | {title} | {file count} |

These will be picked up by /specd:phase:execute automatically.
```

Continue to update_state.
</step>

<step name="update_state">
Update STATE.md with review cycle data (DEC-004).

**Determine cycle number:**
- Read existing Review Cycles table in STATE.md
- If section doesn't exist, create it
- Cycle number = max existing cycle for this phase + 1

**Add/create Review Cycles section** (after "Execution Progress", before "Discussion Sessions"):

```markdown
## Review Cycles

| Phase | Cycle | Date | Findings | Corrective Plans | Status |
|-------|-------|------|----------|------------------|--------|
| {N} | {C} | {YYYY-MM-DD} | {summary, e.g., "2 deviations, 1 incomplete"} | {plan refs or "—"} | {clean or fixes-pending} |
```

**Status values:**
- `clean` — No unresolved findings, all accepted or no deviations
- `fixes-pending` — Corrective plans generated, awaiting execution

**If status is `clean` and all plans executed:**
- Update Execution Progress to mark phase as complete:
  ```markdown
  - [x] Phase {N} complete
  ```

**If this is a subsequent cycle (cycle > 1):**
- Show progress: "Cycle {C}: {N} findings (down from {M})"
- If findings increased, add warning: "Findings increased from {M} to {N}. Consider discussing before continuing."

Continue to update_changelog.
</step>

<step name="update_changelog">
Log deviations to CHANGELOG.md.

**Skip if:** No deviations found, or all deviations already logged from a previous review cycle.

**Check for duplicates:**
- Read existing CHANGELOG.md entries
- Skip any deviation already logged (compare file paths and descriptions)

**Add review entry:**
```markdown
### {YYYY-MM-DD} - Review {feature}/phase-{NN} (Cycle {C})

**[Deviation] {Short description}**
- **Planned:** {What plan specified}
- **Actual:** {What was actually implemented}
- **Files:** `{affected file paths}`
- **Impact:** {Low | Medium | High}
```

**For accepted deviations (user said "accept as-is"):**
```markdown
**[Accepted] {Short description}**
- **Planned:** {What plan specified}
- **Actual:** {What was actually implemented}
- **Files:** `{affected file paths}`
- **Reason:** {User's reason for accepting}
```

Continue to commit_and_next.
</step>

<step name="commit_and_next">
Commit review changes and suggest next steps.

**First, check auto-commit setting. Run this command:**

```bash
cat .specd/config.json 2>/dev/null || echo '{"auto_commit_docs": true}'
```

Read the output. If `auto_commit_docs` is `false`, do NOT run the git commands below. Instead print:

```
Auto-commit disabled for docs — changes not committed.
Modified files: .specd/features/{feature}/STATE.md, DECISIONS.md, CHANGELOG.md, config.json, plans/phase-{NN}/
```

Then skip ahead to presenting next steps below.

**Only if `auto_commit_docs` is `true` or not set (default), run:**

```bash
git add .specd/features/{feature}/STATE.md
git add .specd/features/{feature}/DECISIONS.md
git add .specd/features/{feature}/CHANGELOG.md
# If corrective plans were generated:
git add .specd/features/{feature}/plans/phase-{NN}/
git add .specd/features/{feature}/config.json

git commit -m "docs({feature}): review phase {N} (cycle {C})

Review findings: {summary}
Status: {clean | fixes-pending}
{If corrective plans:}Corrective plans: {list}"
```

**Present next steps:**

**If status = `fixes-pending`:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 REVIEW COMPLETE — Fixes Pending
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Review cycle {C} recorded. Corrective plans ready for execution.

**Next steps:**
- `/specd:phase:execute {feature}` — Execute corrective plans
- Then `/specd:phase:review {feature} {N}` — Re-review after fixes
```

**If status = `clean` and phase complete:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 REVIEW COMPLETE — Phase Clean
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {N} review is clean. All executed plans match their intent.

{If all plans executed:}
Phase {N} is complete!

**Next steps:**
{If next phase exists:}
- `/specd:phase:prepare {feature} {N+1}` — Prepare next phase
- `/specd:phase:plan {feature} {N+1}` — Plan next phase

{If last phase:}
Feature '{feature}' implementation is complete!
Review STATE.md for full summary.
```

**If status = `clean` but partial execution:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 REVIEW COMPLETE — Clean (Partial)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reviewed {M} of {N} plans. All reviewed plans are clean.

**Next steps:**
- `/specd:phase:execute {feature}` — Continue executing remaining plans
- `/specd:phase:review {feature} {N}` — Re-review after more execution
```

End workflow.
</step>

</process>

<changelog_format>
When logging to CHANGELOG.md during review, use these types:

```markdown
### {YYYY-MM-DD} - Review {feature}/phase-{NN} (Cycle {C})

**[{Type}] {Short description}**
- **Planned:** {What plan specified}
- **Actual:** {What was implemented or missing}
- **Files:** `{comma-separated file paths}`
- **Impact:** {Low | Medium | High}
```

Types:
- `[Deviation]` — Code works but differs from plan
- `[Incomplete]` — Plan objective not fully met
- `[Accepted]` — User accepted deviation as intentional
- `[User-flagged]` — Issue raised by user during conversation phase
</changelog_format>

<success_criteria>
- Feature and phase validated with execution history
- All completed plans inspected against actual code
- Per-plan status table displayed with correct icons
- Deviations surfaced with planned vs actual comparison
- User input captured and processed
- New decisions recorded in DECISIONS.md
- Corrective plans generated with `corrects` frontmatter (if needed)
- Review Cycles section updated in STATE.md
- Deviations logged in CHANGELOG.md (no duplicates)
- Changes committed
- Next steps suggested based on review outcome
</success_criteria>
