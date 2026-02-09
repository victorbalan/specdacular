<purpose>
Smart state machine that reads current feature state and drives the entire lifecycle. After each action, loops back and offers the next step. User can stop at any natural boundary.

**One command for the entire lifecycle:** discussion, research, planning, phase preparation, phase planning, phase execution, phase review.

**Core loop:**
```
read state → show status → determine next action → execute → loop
```

The user only needs to remember `/specd:feature:next`. The state machine figures out what to do.
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
Determine which feature to work on.

**If $ARGUMENTS provided:**
Use as feature name. Normalize to kebab-case.

```bash
[ -d ".specd/features/$ARGUMENTS" ] || { echo "not found"; exit 1; }
```

**If no arguments:**
Scan for in-progress features:

```bash
# List feature directories with config.json
for dir in .specd/features/*/config.json; do
  [ -f "$dir" ] && echo "$dir"
done
```

Read each `config.json` and filter where `stage != "complete"`.

**If no features found:**
```
No features in progress.

Start one with /specd:feature:new
```
End workflow.

**If features found:**
Use AskUserQuestion:
- header: "Feature"
- question: "Which feature would you like to work on?"
- options: List each feature with its current stage (e.g., "my-feature (discussion)", "other-feature (execution)")

Use the selected feature name.

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
**Phase status:** {prepared | planned | executing | executed}
```

Continue to determine_action.
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

**stage=planned, no phases started:**
→ Go to action_phase_prepare

**stage=planned or stage=execution, current phase prepared but not planned:**
→ Go to action_phase_plan

**stage=execution, current phase planned but not all plans executed:**
→ Go to action_phase_execute

**stage=execution, current phase all plans executed:**
→ Go to action_phase_review

**stage=execution, all phases done:**
→ Go to action_complete

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
  - "Stop for now" — Save progress, come back with /specd:feature:next

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
  - "Stop for now" — Come back with /specd:feature:next

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
  - "Stop for now" — Come back with /specd:feature:next

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
  - "Stop for now" — Come back with /specd:feature:next

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
  - "Stop for now" — Come back with /specd:feature:next

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
  - "Stop for now" — Come back with /specd:feature:next

**If Execute:**
Execute the execute-plan workflow logic:
@~/.claude/specdacular/workflows/execute-plan.md

Pass feature name as argument (it finds the next incomplete plan).

After execution completes (commit done), loop back to read_state.

**If Stop for now:**
→ Go to action_stop
</step>

<step name="action_phase_review">
Offer to review the completed phase.

```
### Phase {N} Execution Complete

All plans for Phase {N} have been executed. Review compares what was planned against what was actually built.
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Review Phase {N}?"
- options:
  - "Review" — Compare plans against actual code (recommended)
  - "Skip to next phase" — Move on to Phase {N+1}
  - "Stop for now" — Come back with /specd:feature:next

**If Review:**
Execute the review-phase workflow logic:
@~/.claude/specdacular/workflows/review-phase.md

Pass feature name and phase number as arguments.

After review completes (commit done):

**If there are more phases:**
Loop back to read_state (will pick up next phase).

**If all phases done:**
→ Go to action_complete

**If Skip to next phase:**
Loop back to read_state (will pick up next phase).

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

/specd:feature:next {feature-name}
```

End workflow.
</step>

</process>

<success_criteria>
- Feature selected (from argument or picker)
- Current state accurately read and displayed
- Correct next action determined from state
- Delegated to appropriate workflow for execution
- Looped back after action completion
- User could stop at any natural boundary
- Clean exit with resume instructions
</success_criteria>
