---
feature: multi-project-specd
phase: 5
plan: 01
depends_on: []
creates: []
modifies:
  - specdacular/workflows/execute-plan.md
---

# Plan 01: Add Orchestrator Flow to execute-plan

## Objective

Add orchestrator detection, inline sub-project execution, contract validation after phase completion, and replan cascade protection to the execute-plan workflow.

## Context

**Reference these files:**
- `@specdacular/workflows/execute-plan.md` — Workflow being modified
- `@.specd/features/multi-project-specd/plans/phase-05/CONTEXT.md` — Phase discussion resolutions
- `@.specd/features/multi-project-specd/DECISIONS.md` — Active decisions

**Relevant Decisions:**
- DEC-001: Sub-projects unaware
- DEC-004: Orchestrator as contract guardian
- DEC-008: Feature-level contracts for deviation detection
- DEC-010: Replan cascade depth limit of 2

**From Phase Discussion:**
- Path-prefix approach for sub-project execution (no directory change)
- Lightweight contract review by agent after each phase
- Impact analysis shows which project phases are affected by deviations
- User decides: accept or replan
- Cascade depth tracking with forced pause after 2

---

## Tasks

### Task 1: Add orchestrator detection to load_context

**Files:** `specdacular/workflows/execute-plan.md`

**Action:**
Modify the existing `load_context` step to detect orchestrator mode.

After existing context loading, add:

```markdown
**Check for orchestrator mode:**

Read feature's `config.json`. If `"orchestrator": true`:

Set mode = "orchestrator".

**Load orchestrator context:**
- Orchestrator FEATURE.md — System-level expectations (used for contract validation)
- Orchestrator DEPENDENCIES.md — Cross-project dependency graph
- Orchestrator STATE.md — Which project/phase to execute

**Determine target project:**
From orchestrator STATE.md or arguments, identify which project and phase to execute.
Read the target project's feature context:
- `{project-path}/.specd/features/{feature-name}/config.json`
- `{project-path}/.specd/features/{feature-name}/STATE.md`
- `{project-path}/.specd/features/{feature-name}/ROADMAP.md`
- `{project-path}/.specd/features/{feature-name}/DECISIONS.md`

Read the project's codebase context:
- `{project-path}/.specd/codebase/PATTERNS.md`
- `{project-path}/.specd/codebase/STRUCTURE.md`
- `{project-path}/.specd/codebase/MAP.md`

```
Orchestrator mode: executing in {project-name} ({project-path}).
Feature: {feature-name}, Phase {N}.
```

Continue to find_plan (with project-path-prefixed plan lookup).

**If not orchestrator:**
Set mode = "project".
Continue with existing flow.
```

**Verify:**
```bash
grep -c "orchestrator" specdacular/workflows/execute-plan.md
```
Should return at least 3.

**Done when:**
- [ ] `load_context` detects orchestrator mode from feature config.json
- [ ] Loads orchestrator context (FEATURE.md, DEPENDENCIES.md)
- [ ] Determines target project and loads project context
- [ ] Single-project flow unchanged

---

### Task 2: Add contract_review step

**Files:** `specdacular/workflows/execute-plan.md`

**Action:**
Add `contract_review` step that runs after `complete_plan` when in orchestrator mode. This is the core contract guardian behavior (DEC-004).

```markdown
<step name="contract_review">
Review completed phase against cross-project contract expectations (orchestrator mode only).

**Only runs in orchestrator mode, after a plan completes in a sub-project.**

**Gather what was implemented:**
1. Read the sub-project's CHANGELOG.md for this plan — deviations and changes
2. Review files created/modified during this plan
3. Understand what the phase actually produced

**Compare against expectations:**
1. Read orchestrator FEATURE.md — system-level requirements and cross-project contracts
2. Read DEPENDENCIES.md — which other project phases depend on this phase's output
3. For each downstream dependency, check: does the actual output match what the dependent phase expects?

**Assessment:**
```
### Contract Review: {project-name}/phase-{N}

**Implemented:** {brief summary of what was built}

**Cross-project impact:**
{For each dependent phase:}
- {other-project}/phase-{M}: {expects X} → {actual output matches / deviates}
```

**If no deviations:**
```
No contract deviations detected. Downstream phases can proceed as planned.
```

Update orchestrator STATE.md: mark this project phase as complete.
Continue to orchestrator_phase_complete.

**If deviations detected:**
```
Contract deviation detected:

**What changed:** {description of deviation}
**Expected by:** {list of dependent project phases}
**Impact:** {what breaks or needs updating}

For example:
"API changed /auth/login response from {token: string} to {accessToken: string, refreshToken: string}.
UI phase 2 expects {token: string}. Will need to update token handling."
```

Use AskUserQuestion:
- header: "Deviation"
- question: "How would you like to handle this contract deviation?"
- options:
  - "Accept and update" — Accept the deviation, update orchestrator notes, continue
  - "Trigger replan" — Replan affected project phases to accommodate the change
  - "Investigate" — Look deeper before deciding

**If "Accept and update":**
- Log deviation to orchestrator CHANGELOG.md
- Note that downstream phases should account for the change
- Continue to orchestrator_phase_complete

**If "Trigger replan":**
- Check cascade depth (DEC-010)
- If depth < 2: trigger replan for affected project phases
  - Update affected project's ROADMAP.md phase description
  - Regenerate affected PLAN.md files
  - Log to orchestrator CHANGELOG.md
  - Increment cascade depth
- If depth >= 2: force pause
  ```
  Multiple cascading replans detected (depth {N}).

  This suggests a significant architectural mismatch.
  Before continuing, review the overall approach:
  - Are the project responsibilities correctly divided?
  - Should the feature be restructured?

  Recommend: /specd:feature:discuss {feature-name} to reassess.
  ```
  End workflow (user must explicitly resume).
</step>
```

**Verify:**
```bash
grep -c "contract_review" specdacular/workflows/execute-plan.md
```
Should return at least 2.

**Done when:**
- [ ] `contract_review` step exists
- [ ] Reads orchestrator FEATURE.md and DEPENDENCIES.md for expectations
- [ ] Compares actual output against cross-project expectations
- [ ] Shows impact analysis when deviations found
- [ ] User can accept or trigger replan
- [ ] Cascade depth tracked with forced pause at 2 (DEC-010)

---

### Task 3: Add orchestrator_phase_complete step and update success criteria

**Files:** `specdacular/workflows/execute-plan.md`

**Action:**
Add `orchestrator_phase_complete` step and update the `complete_plan` step to branch to contract review in orchestrator mode. Also update success criteria.

**Modify complete_plan:**
At the end of `complete_plan`, add:

```markdown
**If orchestrator mode:**
Continue to contract_review.

**If single-project mode:**
Present summary (existing behavior).
```

**Step: orchestrator_phase_complete**

```markdown
<step name="orchestrator_phase_complete">
Update orchestrator state and present summary after contract review.

**Update orchestrator STATE.md:**
- Mark this project's phase as complete in Sub-Project Features table
- Update orchestrator progress

**Update orchestrator config.json:**
- Increment completed phase count if all plans for this project phase are done

**Present summary:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE COMPLETE (ORCHESTRATOR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}
**Project:** {project-name}
**Phase:** {N}
**Contract review:** {passed / deviations accepted / replanned}

**Next unblocked work:**
{From DEPENDENCIES.md — which phases are now unblocked by this completion}

───────────────────────────────────────────────────────

Resume with /specd:feature:next {feature-name}
```

End workflow (returns to orchestrator scheduling via next).
</step>
```

**Update success criteria:**

Add multi-project section to `<success_criteria>`:

```markdown
## Multi-Project Mode (Orchestrator)
- Orchestrator mode detected from feature config.json
- Sub-project context loaded with path-prefixed file access
- Plans executed inline in sub-project context
- Contract review performed after phase completion
- Deviations flagged with cross-project impact analysis
- User can accept deviation or trigger replan
- Replan cascade depth limited to 2 (DEC-010)
- Orchestrator STATE.md updated after each phase
```

**Verify:**
```bash
grep -c "orchestrator_phase_complete" specdacular/workflows/execute-plan.md
grep -c "contract_review" specdacular/workflows/execute-plan.md
```
Both should return at least 2.

**Done when:**
- [ ] `complete_plan` branches to `contract_review` in orchestrator mode
- [ ] `orchestrator_phase_complete` updates orchestrator state
- [ ] Summary shows cross-project context (next unblocked work)
- [ ] Success criteria updated for multi-project

---

## Verification

After all tasks complete:

```bash
# Verify new steps exist
for step in contract_review orchestrator_phase_complete; do
  grep -q "$step" specdacular/workflows/execute-plan.md && echo "✓ $step" || echo "✗ $step MISSING"
done

# Verify existing steps still exist
for step in validate load_context find_plan execute_tasks complete_plan; do
  grep -q "$step" specdacular/workflows/execute-plan.md && echo "✓ $step (existing)" || echo "✗ $step MISSING (REGRESSION)"
done
```

**Plan is complete when:**
- [ ] Orchestrator detection added to `load_context`
- [ ] `contract_review` performs cross-project deviation analysis
- [ ] `orchestrator_phase_complete` updates orchestrator state
- [ ] Replan cascade protection at depth 2
- [ ] All 5 existing steps preserved (no regression)

---

## Output

When this plan is complete:

1. Update `.specd/features/multi-project-specd/STATE.md`:
   - Add this plan to completed plans table

2. Commit changes:
   ```bash
   git add specdacular/workflows/execute-plan.md
   git commit -m "feat(multi-project-specd): add contract validation to execute-plan

   Plan phase-05/01 complete:
   - load_context: orchestrator mode detection + sub-project context
   - contract_review: cross-project deviation analysis (DEC-004)
   - orchestrator_phase_complete: orchestrator state updates
   - Replan cascade protection at depth 2 (DEC-010)"
   ```

3. Continue to Plan 02 (next-feature scheduling).

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/multi-project-specd/CHANGELOG.md`.

---

## Notes

{Space for the implementing agent to record discoveries during implementation.}
