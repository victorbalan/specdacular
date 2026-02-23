---
feature: multi-project-specd
phase: 5
plan: 02
depends_on:
  - phase-05/01-PLAN.md
creates: []
modifies:
  - specdacular/workflows/next-feature.md
---

# Plan 02: Add Orchestrator Scheduling to next-feature

## Objective

Add orchestrator detection, cross-project state aggregation, dependency-aware scheduling, progress dashboard, and optional project argument to the next-feature workflow.

## Context

**Reference these files:**
- `@specdacular/workflows/next-feature.md` — Workflow being modified
- `@.specd/features/multi-project-specd/plans/phase-05/CONTEXT.md` — Phase discussion resolutions
- `@.specd/features/multi-project-specd/DECISIONS.md` — Active decisions

**Relevant Decisions:**
- DEC-001: Sub-projects unaware — direct access always works
- DEC-002: Per-project roadmaps with orchestrator dependency tracking
- DEC-011: One active orchestrator session at a time

**From Phase Discussion:**
- Aggregate state from all sub-project STATE.md + DEPENDENCIES.md
- Compute unblocked work from dependency graph
- Auto-suggest if one project unblocked, ask if multiple
- Accept optional project argument
- Document one-session-at-a-time constraint
- Direct sub-project access always works for single-project work

---

## Tasks

### Task 1: Add orchestrator detection to read_state

**Files:** `specdacular/workflows/next-feature.md`

**Action:**
Modify the existing `read_state` step to detect orchestrator mode and aggregate cross-project state.

After existing state reading, add:

```markdown
**Check for orchestrator mode:**

Read feature's `config.json`. If `"orchestrator": true`:

Set mode = "orchestrator".

**Aggregate cross-project state:**
1. Read orchestrator DEPENDENCIES.md — cross-project phase dependency graph
2. For each project in feature config.json `"projects"` array:
   - Read `{project-path}/.specd/features/{feature-name}/config.json` — stage, phases
   - Read `{project-path}/.specd/features/{feature-name}/STATE.md` — detailed progress

**Build combined state:**
For each project phase, determine status:
- **complete** — All plans executed for this phase
- **in_progress** — Some plans executed
- **ready** — All cross-project dependencies satisfied, phase can start
- **blocked** — Waiting on another project's phase to complete
- **not_started** — Phase exists but not yet prepared/planned

**Check for optional project argument:**
If arguments contain a project name (e.g., `/specd.feature:next feature-name project-name`):
- Set target_project = project name
- Validate project exists in feature config.json

```
Orchestrator mode: aggregating state across {N} projects.
```

Continue to show_status (orchestrator variant).

**If not orchestrator:**
Set mode = "project".
Continue with existing flow.
```

**Verify:**
```bash
grep -c "orchestrator" specdacular/workflows/next-feature.md
```
Should return at least 5.

**Done when:**
- [ ] `read_state` detects orchestrator mode from feature config.json
- [ ] Aggregates state from all sub-project STATE.md files
- [ ] Reads DEPENDENCIES.md for dependency graph
- [ ] Computes per-phase status (complete, ready, blocked, etc.)
- [ ] Parses optional project argument
- [ ] Single-project flow unchanged

---

### Task 2: Add orchestrator show_status and orchestrator_schedule steps

**Files:** `specdacular/workflows/next-feature.md`

**Action:**
Add orchestrator-specific status display and scheduling logic.

**Modify show_status for orchestrator mode:**

After existing status display logic, add an orchestrator branch:

```markdown
**If mode = "orchestrator":**

```
## {feature-name} (Multi-Project)

**Stage:** {stage}
**Overall progress:** {total completed phases}/{total phases} across {N} projects

### Per-Project Status

{For each project:}
**{project-name}** — {completed}/{total} phases
  {For each phase: emoji + name + status}
  ✓ Phase 1: {name} — complete
  ▶ Phase 2: {name} — ready
  ○ Phase 3: {name} — blocked by {dep}

### Cross-Project Dependencies

{Summary of key dependencies and their status}

**Note:** One orchestrator session at a time (DEC-011). Re-reads all state fresh.
```

Continue to orchestrator_schedule.
```

**Step: orchestrator_schedule**

```markdown
<step name="orchestrator_schedule">
Determine next work based on cross-project dependencies.

**Compute unblocked work:**
From the combined state and dependency graph:
1. Find all phases with status "ready" (dependencies satisfied, not started/in-progress)
2. Among "ready" phases, prioritize by:
   - Phases that unblock the most downstream work
   - Earlier phases within a project
   - Projects with less progress (balance workload)

**If target_project specified (from argument):**
Filter to only that project's unblocked work.

**If no unblocked work:**
```
All available phases are blocked or complete.

{If all complete:}
All phases across all projects are complete! Feature is implemented.

{If blocked:}
Waiting on:
{List blocked phases and what they're waiting on}
```

→ Go to action_complete (if all done) or action_stop (if blocked).

**If one phase unblocked:**
Auto-suggest:
```
Next: {project-name}/Phase {N} — {phase-name}
{Brief description of what this phase does}
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Execute {project-name} Phase {N}?"
- options:
  - "Execute (Recommended)" — Run this phase
  - "Stop for now" — Come back later

**If multiple phases unblocked:**
```
Multiple phases are ready:

{For each ready phase:}
- **{project-name}/Phase {N}** — {phase-name} ({brief description})
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Which phase should we work on next?"
- options: List each ready phase as an option + "Stop for now"

**After selection:**
Set the target project and phase.

**Determine phase readiness:**
Check if the target phase is prepared and planned:
- If not prepared: → delegate to prepare-phase workflow
- If prepared but not planned: → delegate to plan-phase workflow
- If planned: → delegate to execute-plan workflow

Pass feature name and project context to the delegated workflow.

After delegated workflow completes, loop back to read_state.
</step>
```

**Verify:**
```bash
grep -c "orchestrator_schedule" specdacular/workflows/next-feature.md
```
Should return at least 2.

**Done when:**
- [ ] Orchestrator status shows per-project progress dashboard
- [ ] Dashboard includes dependency status
- [ ] DEC-011 one-session-at-a-time documented in display
- [ ] `orchestrator_schedule` computes unblocked work
- [ ] Auto-suggests when one phase ready, asks when multiple
- [ ] Optional project argument filters to that project
- [ ] Delegates to prepare/plan/execute based on phase readiness

---

### Task 3: Update success criteria and add direct-access documentation

**Files:** `specdacular/workflows/next-feature.md`

**Action:**
Update the `<success_criteria>` section and add documentation about direct sub-project access.

**Update success criteria:**

```markdown
## Single-Project Mode
- Feature selected (from argument or picker)
- Current state accurately read and displayed
- Correct next action determined from state
- Delegated to appropriate workflow for execution
- Looped back after action completion
- User could stop at any natural boundary
- Clean exit with resume instructions

## Multi-Project Mode (Orchestrator)
- Orchestrator mode detected from feature config.json
- Cross-project state aggregated from all sub-projects
- Dependency graph read from DEPENDENCIES.md
- Per-project progress dashboard displayed
- Unblocked work computed from dependency graph
- Auto-suggests when one phase ready, asks when multiple
- Optional project argument: /specd.feature:next feature project
- Delegates to prepare/plan/execute based on phase readiness
- One-session-at-a-time constraint documented (DEC-011)
- Direct sub-project access always works (DEC-001)
```

**Add note to purpose section:**

In the `<purpose>` section, add a note about orchestrator mode:

```markdown
**Multi-project:** In orchestrator mode, aggregates state across all sub-projects and uses the dependency graph to schedule work. Users can also work directly in sub-projects for single-project changes.
```

**Verify:**
```bash
grep -c "Multi-Project" specdacular/workflows/next-feature.md
grep -c "DEC-011" specdacular/workflows/next-feature.md
```
Both should return at least 1.

**Done when:**
- [ ] Success criteria includes multi-project section
- [ ] Purpose mentions orchestrator mode
- [ ] DEC-011 referenced in workflow
- [ ] Direct sub-project access documented

---

## Verification

After all tasks complete:

```bash
# Verify new steps exist
grep -q "orchestrator_schedule" specdacular/workflows/next-feature.md && echo "✓ orchestrator_schedule" || echo "✗ orchestrator_schedule MISSING"

# Verify existing steps still exist
for step in select_feature read_state show_status determine_action action_discuss action_research_offer action_plan_offer action_plan_execute action_phase_prepare action_phase_plan action_phase_execute action_phase_review action_complete action_stop; do
  grep -q "$step" specdacular/workflows/next-feature.md && echo "✓ $step (existing)" || echo "✗ $step MISSING (REGRESSION)"
done
```

**Plan is complete when:**
- [ ] Orchestrator state aggregation in `read_state`
- [ ] Cross-project progress dashboard in `show_status`
- [ ] `orchestrator_schedule` with dependency-aware work selection
- [ ] Optional project argument support
- [ ] All 14 existing steps preserved (no regression)
- [ ] Success criteria and documentation updated

---

## Output

When this plan is complete:

1. Update `.specd/features/multi-project-specd/STATE.md`:
   - Mark both Phase 5 plans as complete
   - Mark Phase 5 as complete
   - Mark feature as complete

2. Update `.specd/features/multi-project-specd/config.json`:
   - Set completed phases to 5
   - Set stage to "complete" (if all phases done)

3. Commit changes:
   ```bash
   git add specdacular/workflows/next-feature.md
   git commit -m "feat(multi-project-specd): add cross-project scheduling to next-feature

   Plan phase-05/02 complete:
   - read_state: orchestrator state aggregation across projects
   - show_status: cross-project progress dashboard
   - orchestrator_schedule: dependency-aware work selection
   - Optional project argument: /specd.feature:next feature project
   - One-session-at-a-time documented (DEC-011)"
   ```

4. Feature complete! All 5 phases executed.

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/multi-project-specd/CHANGELOG.md`.

---

## Notes

{Space for the implementing agent to record discoveries during implementation.}
