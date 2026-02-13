<purpose>
Smart state machine that reads current feature state and drives the entire lifecycle. After each action, loops back and offers the next step. User can stop at any natural boundary.

**One command for the entire lifecycle:** discussion, research, planning, phase preparation, phase planning, phase execution, phase review.

**Multi-project:** In orchestrator mode, aggregates state across all sub-projects and uses the dependency graph to schedule work. Users can also work directly in sub-projects for single-project changes (DEC-001).

**Core loop:**
```
read state → show status → determine next action → execute → loop
```

The user only needs to remember `/specd:feature:continue`. The state machine figures out what to do next.
</purpose>

<philosophy>

## Guide, Don't Force

Show the user where they are and what the natural next step is. Always offer alternatives and a "stop for now" option. The user controls the rhythm.

## DRY — Delegate to Existing Workflows

This workflow is a dispatcher. It reads state, determines the next action, then delegates to existing workflow files for the actual work. It does NOT duplicate logic from other workflows.

## Natural Boundaries

After each significant action (discussion session, research, planning, phase completion), offer the user a chance to stop. These are natural context-window boundaries too.

## Feature Selection

When no argument is given, scan for in-progress features and let the user pick. Always show the picker, even for a single feature — it confirms intent.

</philosophy>

<process>

<step name="select_feature">
@~/.claude/specdacular/references/select-feature.md

Continue to read_state.
</step>

<step name="read_state">
Load all feature context to determine current position.

**Read:**
- `.specd/features/{name}/config.json` — Stage, phases info
- `.specd/features/{name}/STATE.md` — Detailed progress
- `.specd/features/{name}/CONTEXT.md` — Discussion context, gray areas
- `.specd/features/{name}/ROADMAP.md` — If exists, phase overview
- `.specd/features/{name}/FEATURE.md` — Requirements summary

**Parse from config.json:**
- `stage` — discussion | research | planned | execution | complete
- `phases.total` — Number of phases (if planned)
- `phases.current` — Current phase number (if in execution)
- `phases.completed` — Number of completed phases

**Parse from CONTEXT.md:**
- Gray areas remaining (from "Gray Areas Remaining" section)

**Parse from ROADMAP.md (if exists):**
- Phase list with status

**Parse from STATE.md:**
- Execution progress (which plans are complete)
- Review cycles

**Determine phase status (if in planned/execution stage):**
For the current/next phase, check:
```bash
# Check if phase directory has CONTEXT.md (prepared)
[ -f ".specd/features/{name}/plans/phase-{NN}/CONTEXT.md" ] && echo "prepared"

# Check if phase has PLAN.md files (planned)
ls .specd/features/{name}/plans/phase-{NN}/*-PLAN.md 2>/dev/null | head -1

# Check STATE.md for completed plans in this phase
```

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
If arguments contain a second token after feature name (e.g., `/specd:feature:continue feature-name project-name`):

- Set target_project = project name
- Validate project exists in feature config.json

```
Orchestrator mode: aggregating state across {N} projects.
```

Continue to show_status (orchestrator variant).

**If not orchestrator:**
Set mode = "project".

Continue to show_status.
</step>

<step name="show_status">
Present a concise status summary.

```
## {feature-name}

**Stage:** {stage}
**Last updated:** {date}

{Stage-specific summary — see below}
```

**If stage=discussion:**
```
**Discussion sessions:** {N}
**Decisions made:** {N}
**Gray areas remaining:** {count}
{If count > 0: list them}
```

**If stage=research:**
```
**Research:** Complete
**Key findings:** {2-3 bullet points from RESEARCH.md}
```

**If stage=planned:**
```
**Phases:** {total}
{List phases with one-liner goals}
```

**If stage=execution:**
```
**Phases:** {completed}/{total}
**Current phase:** {N} — {name}
**Phase status:** {from config.json phases.current_status: pending | executing | executed}
```

**If mode = "project":**
Continue to determine_action.

**If mode = "orchestrator":**

```
## {feature-name} (Multi-Project)

**Stage:** {stage}
**Overall progress:** {total completed phases}/{total phases} across {N} projects

### Per-Project Status

{For each project:}
**{project-name}** — {completed}/{total} phases
  {For each phase: status indicator + name}
  ✓ Phase 1: {name} — complete
  ▶ Phase 2: {name} — ready
  ○ Phase 3: {name} — blocked by {dep}

### Cross-Project Dependencies

{Summary of key dependencies and their status}

**Note:** One orchestrator session at a time (DEC-011). State re-read fresh each time.
```

Continue to orchestrator_schedule.
</step>

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

<step name="determine_action">
Based on current state, determine and offer the next action.

Route to the appropriate sub-step based on state:

**stage=discussion, gray areas remain:**
→ Go to action_discuss

**stage=discussion, no gray areas (or user wants to skip):**
→ Go to action_research_offer

**stage=research (RESEARCH.md exists):**
→ Go to action_plan_offer

**stage=planned or stage=execution, current_status == "pending", phase not prepared:**
→ Go to action_phase_prepare

**stage=planned or stage=execution, current_status == "pending", phase prepared but not planned:**
→ Go to action_phase_plan

**stage=execution, current_status == "executing":**
→ Go to action_phase_execute

**stage=execution, current_status == "executed":**
→ Go to action_phase_review

**stage=execution, phases.completed == phases.total:**
→ Go to action_complete

**Note:** `current_status` is read from `config.json` → `phases.current_status` (DEC-013).
When `current_status` is missing, treat as `"pending"`.

</step>

<step name="action_discuss">
Offer discussion when gray areas remain.

```
### Open Areas

These areas could use more clarity:

{List gray areas from CONTEXT.md}
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Want to discuss these areas, or skip ahead?"
- options:
  - "Discuss" — Probe open areas (recommended if gray areas exist)
  - "Skip to research" — Move to researching implementation patterns
  - "Skip to planning" — Jump to creating the roadmap (only if enough context)
  - "Stop for now" — Save progress, come back with /specd:feature:continue

**If Discuss:**
Execute the discuss-feature workflow logic:
@~/.claude/specdacular/workflows/discuss-feature.md

After discussion completes (commit done), loop back to read_state.

**If Skip to research:**
→ Go to action_research_offer

**If Skip to planning:**
→ Go to action_plan_execute

**If Stop for now:**
→ Go to action_stop
</step>

<step name="action_research_offer">
Offer research when discussion is sufficient.

**If RESEARCH.md already exists:**
```
Research has already been conducted.
```
→ Go to action_plan_offer

**If no RESEARCH.md:**
```
### Discussion Looks Solid

You've resolved the key gray areas. Next step is usually research — investigating implementation patterns, libraries, and pitfalls.
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Research implementation patterns?"
- options:
  - "Research" — Spawn parallel agents to investigate patterns (recommended)
  - "Skip to planning" — Jump straight to roadmap creation
  - "Discuss more" — Go back to discussion
  - "Stop for now" — Come back with /specd:feature:continue

**If Research:**
Execute the research-feature workflow logic:
@~/.claude/specdacular/workflows/research-feature.md

After research completes (commit done), loop back to read_state.

**If Skip to planning:**
→ Go to action_plan_offer

**If Discuss more:**
→ Go to action_discuss

**If Stop for now:**
→ Go to action_stop
</step>

<step name="action_plan_offer">
Offer roadmap creation.

```
### Ready to Plan

{If RESEARCH.md exists: "Research is complete. "}Time to create the roadmap — breaking the feature into ordered phases.
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Create the roadmap?"
- options:
  - "Create roadmap" — Derive phases and write ROADMAP.md (recommended)
  - "Discuss more" — Go back to discussion
  - "Stop for now" — Come back with /specd:feature:continue

**If Create roadmap:**
→ Go to action_plan_execute

**If Discuss more:**
→ Go to action_discuss

**If Stop for now:**
→ Go to action_stop
</step>

<step name="action_plan_execute">
Execute the plan-feature workflow.

Execute the plan-feature workflow logic:
@~/.claude/specdacular/workflows/plan-feature.md

After planning completes (commit done), loop back to read_state.
</step>

<step name="action_phase_prepare">
Offer to prepare the next phase.

**Determine next phase:** First phase without a CONTEXT.md in its directory (not yet prepared), or phase 1 if none started.

```
### Roadmap Ready

{total} phases planned. Time to prepare Phase {N}: {phase-name}.

Phase preparation involves discussing phase-specific gray areas and optionally researching implementation patterns.
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Prepare Phase {N}?"
- options:
  - "Prepare phase" — Discuss gray areas + optional research (recommended)
  - "Skip to planning" — Jump to creating detailed plans
  - "Stop for now" — Come back with /specd:feature:continue

**If Prepare phase:**
Execute the prepare-phase workflow logic:
@~/.claude/specdacular/workflows/prepare-phase.md

Pass feature name and phase number as arguments.

After preparation completes (commit done), loop back to read_state.

**If Skip to planning:**
→ Go to action_phase_plan

**If Stop for now:**
→ Go to action_stop
</step>

<step name="action_phase_plan">
Offer to create detailed plans for the current phase.

**Determine phase:** Current phase that has been prepared (or not) but doesn't have PLAN.md files yet.

```
### Phase {N} Ready for Planning

Time to create detailed, executable plans for Phase {N}: {phase-name}.
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Create detailed plans for Phase {N}?"
- options:
  - "Create plans" — Write executable PLAN.md files (recommended)
  - "Prepare first" — Go back to phase preparation
  - "Stop for now" — Come back with /specd:feature:continue

**If Create plans:**
Execute the plan-phase workflow logic:
@~/.claude/specdacular/workflows/plan-phase.md

Pass feature name and phase number as arguments.

After planning completes (commit done), loop back to read_state.

**If Prepare first:**
→ Go to action_phase_prepare

**If Stop for now:**
→ Go to action_stop
</step>

<step name="action_phase_execute">
Offer to execute plans for the current phase.

**Determine:** Which plans exist and which are not yet executed.

```
### Phase {N} Has Plans Ready

{count} plan(s) ready to execute for Phase {N}: {phase-name}.
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Execute Phase {N} plans?"
- options:
  - "Execute" — Run the next plan with progress tracking (recommended)
  - "Stop for now" — Come back with /specd:feature:continue

**If Execute:**
Execute the execute-plan workflow logic:
@~/.claude/specdacular/workflows/execute-plan.md

Pass feature name as argument (it finds the next incomplete plan).

After execution completes (commit done), loop back to read_state.

**If Stop for now:**
→ Go to action_stop
</step>

<step name="action_phase_review">
Offer user-guided review for the executed phase (DEC-003, DEC-009).

```
### Phase {N} Executed — Pending Review

All plans for Phase {N}: {phase-name} have been executed.
Review shows what was built and lets you approve or request revisions.
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Review Phase {N}?"
- options:
  - "Review" — See what changed, approve or request fixes (recommended)
  - "Approve without review" — Mark phase complete and move on
  - "Stop for now" — Come back with /specd:feature:continue

**If Review:**
Execute the review-feature workflow logic:
@~/.claude/specdacular/workflows/review-feature.md

Pass feature name as argument.

After review completes (phase approved and marked completed), loop back to read_state.

**If Approve without review:**
Update config.json:
- Set `phases.current_status` to `"pending"`
- Increment `phases.completed`
- Advance `phases.current` to next phase
- Remove `phases.phase_start_commit`

Update STATE.md: mark phase as complete.

Commit state changes:
```bash
git add .specd/features/{feature}/config.json .specd/features/{feature}/STATE.md
git commit -m "docs({feature}): phase {N} approved (without review)"
```

Loop back to read_state.

**If Stop for now:**
→ Go to action_stop
</step>

<step name="action_complete">
Feature is complete.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FEATURE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}
**Phases completed:** {total}
**Decisions made:** {count}

All phases have been executed{and reviewed, if applicable}.
```

**Update config.json:**
Set `stage` to `"complete"`.

**Update STATE.md:**
Set stage to `complete`.

**First, check auto-commit setting. Run this command:**

```bash
cat .specd/config.json 2>/dev/null || echo '{"auto_commit_docs": true}'
```

Read the output. If `auto_commit_docs` is `false`, do NOT run the git commands below. Instead print:

```
Auto-commit disabled for docs — feature completion not committed.
Modified files: .specd/features/{name}/config.json, .specd/features/{name}/STATE.md
```

Then end the workflow.

**Only if `auto_commit_docs` is `true` or not set (default), run:**

```bash
git add .specd/features/{name}/config.json .specd/features/{name}/STATE.md
git commit -m "docs({feature-name}): feature complete

All {N} phases executed."
```

End workflow.
</step>

<step name="action_stop">
Clean exit with resume instructions.

```
───────────────────────────────────────────────────────

Progress saved. Resume anytime with:

/specd:feature:continue {feature-name}
```

End workflow.
</step>

</process>

<success_criteria>

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
- Optional project argument: `/specd:feature:continue feature project`
- Delegates to prepare/plan/execute based on phase readiness
- One-session-at-a-time constraint documented (DEC-011)
- Direct sub-project access always works (DEC-001)

</success_criteria>
