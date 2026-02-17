<purpose>
Continue a task's lifecycle. Reads state, determines the next action, and either prompts (interactive), auto-advances (semi-auto), or runs everything (auto).

This is the main driver — it dispatches to discuss, research, plan, execute, and review workflows based on current state.

**Modes:**
- **Interactive (default):** Prompts at each stage transition
- **--semi-auto:** Auto-runs discuss→research→plan, pauses after each phase execution + review
- **--auto:** Runs everything, only stops on review issues or task completion
</purpose>

<process>

<step name="parse_args">
Parse arguments to extract task name and mode.

**Parse $ARGUMENTS:**
- Extract task name (first argument, or only argument without --)
- Check for `--semi-auto` flag
- Check for `--auto` flag
- Default mode: interactive

```
Mode: {interactive | semi-auto | auto}
Task: {task-name}
```

Continue to validate.
</step>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use basic validation with $TASK_NAME.

Continue to load_state.
</step>

<step name="load_state">
Read current state to determine next action.

**Read:**
- `config.json` — stage, phases info
- `STATE.md` — progress checkboxes
- `CONTEXT.md` — gray areas remaining

**Determine current position:**
- stage from config.json: discussion, research, planning, execution
- phases.current_status: pending, executing, executed, completed
- Gray areas count from CONTEXT.md

Continue to determine_action.
</step>

<step name="determine_action">
Route to the appropriate action based on state.

**Routing logic:**

1. **Stage = discussion, gray areas remain:**
   → action_discuss

2. **Stage = discussion, no gray areas:**
   → action_research_or_plan

3. **Stage = research (RESEARCH.md missing):**
   → action_research

4. **Stage = planning (no phases exist):**
   → action_plan

5. **Stage = planning or execution, phases.current_status = "pending":**
   → action_execute

6. **Stage = execution, phases.current_status = "executing":**
   → action_resume_execute

7. **Stage = execution, phases.current_status = "executed":**
   → action_review

8. **Stage = execution, phases.current_status = "completed":**
   Check if more phases remain:
   - Yes → advance to next phase, → action_execute
   - No → action_complete

Continue to the determined action step.
</step>

<step name="action_discuss">
Offer or auto-run discussion.

**Interactive mode:**
```
**Current state:** Discussion in progress
**Gray areas remaining:** {count}

{list gray areas}
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Want to discuss the remaining gray areas?"
- options:
  - "Discuss" — Dive into gray areas (Recommended)
  - "Skip to research" — Move on without resolving
  - "Skip to planning" — Jump straight to planning

**Semi-auto / Auto mode:**
Auto-run discuss workflow.

Dispatch to: @~/.claude/specdacular/workflows/discuss.md

After completion, return to load_state (re-evaluate).
</step>

<step name="action_research_or_plan">
Offer or auto-run research (when discussion is complete but no research yet).

**Interactive mode:**
```
**Current state:** Discussion complete, no research yet
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Discussion looks solid. What's next?"
- options:
  - "Research" — Investigate implementation patterns (Recommended)
  - "Skip to planning" — Plan without research
  - "Discuss more" — Continue discussion

**Semi-auto / Auto mode:**
Auto-run research workflow.

Dispatch to chosen workflow. After completion, return to load_state.
</step>

<step name="action_research">
Run research.

**Interactive mode:**
Use AskUserQuestion:
- header: "Next Step"
- question: "Ready to research implementation patterns?"
- options:
  - "Research" — Run research agents (Recommended)
  - "Skip" — Proceed without research
  - "Discuss first" — Go back to discussion

**Semi-auto / Auto mode:**
Auto-run research.

Dispatch to: @~/.claude/specdacular/workflows/research.md

After completion, return to load_state.
</step>

<step name="action_plan">
Run planning.

**Interactive mode:**
```
**Current state:** Ready to plan
{If RESEARCH.md exists: "Research available — will inform planning"}
{If no RESEARCH.md: "Note: No research. Consider running /specd:research first"}
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Ready to create execution phases?"
- options:
  - "Plan" — Create phases and PLAN.md files (Recommended)
  - "Research first" — Run research before planning
  - "Discuss more" — Continue discussion

**Semi-auto / Auto mode:**
Auto-run planning.

Dispatch to: @~/.claude/specdacular/workflows/plan.md

After completion, return to load_state.
</step>

<step name="action_execute">
Execute next phase.

**Interactive mode:**
```
**Current state:** Phase {N} ready for execution
**Phase:** {name} — {goal}
**Tasks:** {count}
```

Use AskUserQuestion:
- header: "Next Step"
- question: "Ready to execute Phase {N}?"
- options:
  - "Execute" — Start phase execution (Recommended)
  - "Review plan" — Read the PLAN.md first
  - "Stop for now" — Come back later

**Semi-auto mode:**
Auto-execute. Review will pause for user after execution.

**Auto mode:**
Auto-execute. Review auto-approves if clean, stops only on issues.

Dispatch to: @~/.claude/specdacular/workflows/execute.md

Execute workflow chains to review automatically. After review completes (phase approved or stopped), return to load_state.
</step>

<step name="action_resume_execute">
Resume interrupted execution.

```
**Resuming:** Phase {N} execution was interrupted
**Phase:** {name}
```

Dispatch to: @~/.claude/specdacular/workflows/execute.md

The execute workflow handles finding incomplete tasks within the phase.

After completion, return to load_state.
</step>

<step name="action_review">
Phase executed, needs review.

**Interactive mode:**
```
**Current state:** Phase {N} executed, pending review
```

Dispatch to: @~/.claude/specdacular/workflows/review.md

After review completes, return to load_state.

**Semi-auto mode:**
Auto-trigger review. Review will prompt user for approval.

**Auto mode:**
Auto-trigger review. If clean, auto-approve. If issues found, stop for user.
</step>

<step name="action_complete">
All phases complete.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TASK COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Task:** {task-name}
**Phases completed:** {N}
**Decisions made:** {N}

All phases executed and reviewed. Task is done!
```

End workflow.
</step>

</process>

<success_criteria>
- Correctly reads state and determines next action
- Interactive mode prompts at each transition
- Semi-auto mode auto-advances through discuss→research→plan, pauses after phase execution + review
- Auto mode runs everything, stops only on review issues or completion
- Dispatches to correct workflow at each stage
- Loops back to state check after each workflow completes
- Handles all edge cases (interrupted execution, missing research, etc.)
</success_criteria>
