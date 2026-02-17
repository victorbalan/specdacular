<purpose>
Collect user feedback on review findings and create fix plans in decimal phases. Extracted from review.md — revise handles the "what to fix" conversation while review handles pure inspection.

**Output:** Fix plan in decimal phase directory (e.g., phase-01.1/PLAN.md), updated ROADMAP.md, config.json signaling for brain routing.
</purpose>

<philosophy>

## Fix Plans, Not Inline Fixes

When the user reports issues, create proper PLAN.md files in decimal phases. These get executed through the same execute workflow.

## Clear Signal to Brain

After creating a fix plan, signal the brain by setting `phases.current_status: "pending"` so the brain routes back to execute for the current phase.

</philosophy>

<process>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use extended validation. Check phases and ROADMAP exist.

Continue to load_context.
</step>

<step name="load_context">
@~/.claude/specdacular/references/load-context.md

Load all context including the current phase's PLAN.md and review findings.

**Read phase info:**
```bash
PHASE_NUM=$(cat $TASK_DIR/config.json | grep -o '"current": [0-9]*' | grep -o '[0-9]*')
PHASE_DIR="$TASK_DIR/phases/phase-$(printf '%02d' $PHASE_NUM)"
cat "$PHASE_DIR/PLAN.md"
```

Continue to collect_feedback.
</step>

<step name="collect_feedback">
Gather specific feedback from user.

```
Tell me what needs fixing. You can describe:
- Bugs or incorrect behavior
- Approach you'd prefer changed
- Missing functionality
- Code quality issues

Describe as many issues as you want — I'll create a fix plan for all of them.
```

Wait for user response. Follow up to understand each issue clearly.

Continue to create_fix_plan.
</step>

<step name="create_fix_plan">
Create a fix plan in a decimal phase.

**Determine fix phase number:**
```bash
CURRENT=$(printf '%02d' $PHASE_NUM)
ls -d $TASK_DIR/phases/phase-$CURRENT.* 2>/dev/null | sort -V | tail -1
```
- If no decimal phases → create `phase-{N}.1/`
- If `phase-{N}.1/` exists → create `phase-{N}.2/`, etc.

**Create fix phase directory and PLAN.md:**
```bash
mkdir -p $TASK_DIR/phases/phase-{N.M}/
```

Write `PLAN.md` using standard plan format:
- Objective: Address review feedback for Phase {N}
- Tasks: One per issue reported, with clear fix description and verification

**Update ROADMAP.md:**
Add fix phase entry after the parent phase.

Continue to signal_outcome.
</step>

<step name="signal_outcome">
Signal the brain that a fix plan was created and needs execution.

**Update config.json:**
- Set `phases.current_status` to `"pending"` — this tells the brain to route back to execute for the current phase (which will pick up the decimal fix phase)

Continue to commit.
</step>

<step name="commit">
@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** fix plan directory + ROADMAP.md + config.json
- **$MESSAGE:** `docs({task-name}): create fix plan phase-{N.M}`
- **$LABEL:** `fix plan`

Continue to completion.
</step>

<step name="completion">
Present what was created.

```
Fix plan created: phase-{N.M}
{count} tasks to address review feedback.
```

End workflow (caller handles continuation).
</step>

</process>

<success_criteria>
- User feedback collected with clear understanding of issues
- Fix plan created in decimal phase directory
- ROADMAP.md updated with fix phase
- config.json signals brain to route back to execute
- Changes committed
</success_criteria>
