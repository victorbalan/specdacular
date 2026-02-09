---
feature: phase-review
phase: 1
plan: 02
depends_on:
  - phase-01/01-PLAN.md
creates:
  - specdacular/workflows/review-phase.md
modifies: []
---

# Plan 02: Create Review Workflow

## Objective

Create the full review-phase workflow with all 11 steps: validate, load_context, filter_plans, inspect_phase, present_findings, gather_user_input, record_decisions, generate_correctives, update_state, update_changelog, commit_and_next.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Workflow patterns
- `@.specd/codebase/STRUCTURE.md` — Where workflows go
- `@~/.claude/specdacular/workflows/execute-plan.md` — Primary pattern (closest sibling workflow)
- `@~/.claude/specdacular/workflows/prepare-phase.md` — Secondary pattern (also uses AskUserQuestion)
- `@~/.claude/specdacular/workflows/discuss-feature.md` — Pattern for conversation phase

**Relevant Decisions:**
- DEC-001: Claude inspects first, then user weighs in — workflow must have automated inspection THEN user conversation
- DEC-003: Corrective plans continue sequence numbering with `corrects` frontmatter
- DEC-004: Review Cycles tracked in STATE.md — new section with table
- DEC-005: Per-plan status table with ✅/⚠️/❌/⏸️ icons and expanded details
- DEC-006: Partial execution review — only inspect plans with status `Complete`

**From Research:**
- State reconciliation pattern: compare desired (plan) vs actual (code), produce structured diff
- Semantic intent matching, not literal text comparison
- Progressive disclosure: summary → table → expanded details → conversation
- Corrective plan scoping: CAPA framework — fix what was intended, not general improvements
- Max 3 review cycles per phase to prevent iteration fatigue
- Check for uncommitted changes at review start
- CHANGELOG.md review entry format uses `[Deviation]` type prefix

---

## Tasks

### Task 1: Create the workflow file with purpose, philosophy, and structure

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Create the workflow file with `<purpose>`, `<philosophy>`, and the `<process>` wrapper. Follow the structure from `execute-plan.md`.

Create:
```markdown
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
```

**Done when:**
- [ ] File created at `specdacular/workflows/review-phase.md`
- [ ] Has `<purpose>` and `<philosophy>` sections
- [ ] Philosophy covers semantic review, neutral deviations, scoped correctives, iteration limits

---

### Task 2: Implement validate step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the `<process>` block and the validate step. The step checks that the feature exists, the phase exists in ROADMAP.md, and that at least one plan has been executed.

Follow pattern from `execute-plan.md` validate step:
```markdown
<step name="validate">
```

Create:
```markdown
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
```

**Done when:**
- [ ] Validate step checks feature, phase, and execution history
- [ ] Warns about uncommitted changes
- [ ] Has clear error messages for missing feature, phase, or execution history

---

### Task 3: Implement load_context step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the load_context step that reads all necessary files for the review.

Create:
```markdown
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
```

**Done when:**
- [ ] Loads feature, phase, plan, and codebase context
- [ ] Parses plan frontmatter for creates/modifies/corrects
- [ ] Reads CHANGELOG.md to avoid duplicate deviation logging

---

### Task 4: Implement filter_plans step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the filter_plans step that separates completed plans from pending ones (DEC-006).

Create:
```markdown
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
```

**Done when:**
- [ ] Filters plans by completion status from STATE.md
- [ ] Collects file lists from plan frontmatter
- [ ] Handles corrective plans with `corrects` field

---

### Task 5: Implement inspect_phase step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the inspect_phase step — the core review logic. For each completed plan, compare intended changes against actual code.

Create:
```markdown
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
```

**Done when:**
- [ ] File-level checks for creates/modifies
- [ ] Semantic intent comparison for existing files
- [ ] Classification with ✅/⚠️/❌/⏸️
- [ ] Deviation details collected with planned vs actual
- [ ] Phase success criteria checked

---

### Task 6: Implement present_findings step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the present_findings step with progressive disclosure output format (DEC-005).

Create:
```markdown
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
```

**Done when:**
- [ ] Progressive disclosure format: summary → table → expanded details
- [ ] Status icons match DEC-005 specification
- [ ] Only ⚠️ and ❌ plans get expanded detail sections
- [ ] Phase success criteria shown
- [ ] Clean phase path handled

---

### Task 7: Implement gather_user_input step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the gather_user_input step where the user reacts to findings (DEC-001).

Create:
```markdown
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
```

**Done when:**
- [ ] User prompted after automated inspection (DEC-001 sequence)
- [ ] Multiple response options: fix all, discuss, accept all, selective
- [ ] Per-finding decision flow for selective handling
- [ ] Clean review path asks for additional concerns
- [ ] User-raised issues captured and classified

---

### Task 8: Implement record_decisions step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the record_decisions step that saves new decisions from the review to DECISIONS.md.

Create:
```markdown
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
```

**Done when:**
- [ ] Decisions from review conversation captured
- [ ] Follows existing DECISIONS.md format
- [ ] Decision count updated in config.json
- [ ] Skips cleanly when no decisions to record

---

### Task 9: Implement generate_correctives step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the generate_correctives step that creates corrective plans for unresolved findings (DEC-003).

Create:
```markdown
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
```

**Done when:**
- [ ] Corrective plans use next sequence number (DEC-003)
- [ ] YAML frontmatter includes `corrects` field
- [ ] Plans scoped to fixes, not features
- [ ] Plans follow standard PLAN.md template
- [ ] User informed about generated plans

---

### Task 10: Implement update_state step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the update_state step that updates the Review Cycles section in STATE.md (DEC-004).

Create:
```markdown
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
```

**Done when:**
- [ ] Review Cycles section created or appended
- [ ] Correct cycle numbering
- [ ] Status set to `clean` or `fixes-pending`
- [ ] Phase marked complete when clean and all plans executed
- [ ] Progress shown for subsequent cycles

---

### Task 11: Implement update_changelog step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the update_changelog step that logs deviations to CHANGELOG.md.

Create:
```markdown
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
```

**Done when:**
- [ ] Deviations logged with correct format
- [ ] Duplicate entries avoided
- [ ] Accepted deviations use `[Accepted]` type
- [ ] File paths and impact included

---

### Task 12: Implement commit_and_next step

**Files:** `specdacular/workflows/review-phase.md`

**Action:**
Add the commit_and_next step and close the `</process>` tag. Also add `<changelog_format>` and `<success_criteria>` sections.

Create:
```markdown
<step name="commit_and_next">
Commit review changes and suggest next steps.

**Commit changes:**
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
```

**Done when:**
- [ ] commit_and_next step handles all three outcomes (fixes-pending, clean, clean-partial)
- [ ] `</process>` tag closes properly
- [ ] `<changelog_format>` section defines review-specific types
- [ ] `<success_criteria>` section lists all requirements

---

## Verification

After all tasks complete, verify the plan is done:

```bash
# File exists
[ -f "specdacular/workflows/review-phase.md" ] && echo "exists"

# Has all 11 steps
grep -c '<step name=' specdacular/workflows/review-phase.md
# Should output: 11

# Has required sections
grep -c "<purpose>\|<philosophy>\|<process>\|<changelog_format>\|<success_criteria>" specdacular/workflows/review-phase.md
# Should output: 5

# All step names present
for step in validate load_context filter_plans inspect_phase present_findings gather_user_input record_decisions generate_correctives update_state update_changelog commit_and_next; do
  grep -q "name=\"$step\"" specdacular/workflows/review-phase.md && echo "$step: ok" || echo "$step: MISSING"
done
```

**Plan is complete when:**
- [ ] Workflow file created at correct path
- [ ] All 11 steps implemented
- [ ] Follows execute-plan.md structural pattern
- [ ] All 6 decisions (DEC-001 through DEC-006) reflected in workflow
- [ ] All verification commands pass

---

## Output

When this plan is complete:

1. Update `.specd/features/phase-review/STATE.md`:
   - Mark this plan as complete
   - Mark Phase 1 execution progress
   - Note any discoveries or decisions made

2. Commit changes:
   ```bash
   git add specdacular/workflows/review-phase.md
   git commit -m "feat(phase-review): create review workflow with 11-step process

   Plan 1.02 complete:
   - Full review-phase workflow implementation
   - 11 steps: validate through commit_and_next
   - Semantic inspection, progressive disclosure output
   - Corrective plan generation with CAPA scoping
   - Review cycles tracking in STATE.md"
   ```

3. Next plan: Phase 1 complete. Proceed to Phase 2 planning or execution.

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/phase-review/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach

**Format:**
```markdown
### {YYYY-MM-DD} - Plan phase-01/02

**{Brief title}**
- **What:** {What you decided/changed}
- **Why:** {Reason for the change}
- **Files:** `{affected files}`
```

**Don't log:**
- Minor implementation details
- Standard coding patterns
- Things working as planned

---

## Notes

