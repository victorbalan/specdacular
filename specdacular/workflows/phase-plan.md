<purpose>
Create a detailed PLAN.md for the current phase. Reads the phase goal from ROADMAP.md, considers what happened in previous phases, and creates an actionable plan with tasks.

This is the phase-level counterpart to plan.md (which creates the high-level ROADMAP.md). Each phase gets its own just-in-time planning, allowing later phases to adapt based on earlier execution.

**Output:** `phases/phase-NN/PLAN.md`, updated STATE.md
</purpose>

<philosophy>

## Just-In-Time Planning

Plans are created when the phase starts, not upfront. This means the plan can account for deviations, discoveries, and changes from earlier phases.

## Small and Focused

One phase, one PLAN.md. 2-5 tasks. Each task creates or modifies 1-3 files.

## Self-Contained Plans

Each PLAN.md should have enough context that the executing agent doesn't need to ask questions. Reference decisions, research, and codebase patterns.

</philosophy>

<process>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use basic validation with $TASK_NAME.

Also check:
- ROADMAP.md must exist (source of phase goals)
- config.json must have phases.current set

Continue to load_context.
</step>

<step name="load_context">
@~/.claude/specdacular/references/load-context.md

Load all task context including RESEARCH.md if available.

**Read phase info:**
- `phases.current` from config.json → current phase number
- Phase goal from ROADMAP.md → find the "Phase {N}" section

**Read previous phase context (if not phase 1):**
- Check completed phases for deviations in CHANGELOG.md
- Read previous phase PLAN.md files to understand what was done
- Note any decisions made during earlier execution

**Read global config:**
```bash
cat .specd/config.json 2>/dev/null || echo '{}'
```
Check `auto_commit_docs` setting.

Continue to create_plan.
</step>

<step name="create_plan">
Create the phase directory and write PLAN.md.

**Create phase directory:**
```bash
PHASE_NUM=$(printf '%02d' $CURRENT_PHASE)
mkdir -p .specd/tasks/$TASK_NAME/phases/phase-$PHASE_NUM
```

**Write PLAN.md:**
Use template from: `~/.claude/specdacular/templates/tasks/PLAN.md`

Fill in based on ROADMAP.md goal and full task context:
- Objective: what the phase accomplishes (from ROADMAP.md)
- Context: reference codebase patterns, relevant decisions, research findings, previous phase outcomes
- Tasks: 2-5 tasks with clear actions, verification, and done-when criteria

**Each task should include:**
- Files affected
- Clear action description
- Verification command
- Done-when checklist

**Adapt based on previous phases:**
If earlier phases had deviations or discoveries, adjust this phase's plan accordingly. This is the key benefit of just-in-time planning.

Continue to update_state.
</step>

<step name="update_state">
Update STATE.md to note phase planning.

**STATE.md:**
- Note that phase {N} plan was created
- Update documents status

**Do NOT change config.json stage or phases.current_status.** The brain manages state transitions. Phase status stays "pending" — the brain will check for PLAN.md existence and route to execute next.

Continue to commit.
</step>

<step name="commit">
@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/tasks/{task-name}/phases/phase-{NN}/PLAN.md .specd/tasks/{task-name}/STATE.md`
- **$MESSAGE:** `docs({task-name}): plan phase {N}` with brief plan summary
- **$LABEL:** `phase planning`

Continue to completion.
</step>

<step name="completion">
Present the phase plan.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE {N} PLANNED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Task:** {task-name}
**Phase:** {N} — {phase title}
**Tasks:** {count}

{For each task:}
Task {N}: {title}
  Files: {file list}
```

End workflow (caller handles continuation).
</step>

</process>

<success_criteria>
- Phase directory created
- PLAN.md written with detailed tasks from ROADMAP.md goal
- Previous phase outcomes considered in planning
- STATE.md updated
- Changes committed
- config.json NOT modified (brain manages state)
</success_criteria>
