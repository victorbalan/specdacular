<purpose>
Continue/deepen task discussion. Targets gray areas, records decisions, and builds understanding.

**Output:** Updated CONTEXT.md, DECISIONS.md, STATE.md
</purpose>

<philosophy>

## Follow the Thread

Don't march through gray areas like a checklist. Pick the most important one, explore it, and let the conversation branch naturally.

## Four Questions Then Check

For each gray area: ask 4 focused questions, then summarize what was resolved. If clear, mark resolved. If not, continue probing.

## Decisions Get Recorded

Any decision made gets a DEC-{NNN} entry immediately — not at the end.

</philosophy>

<process>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use basic validation with $TASK_NAME from $ARGUMENTS.

Continue to load_context.
</step>

<step name="load_context">
@~/.claude/specdacular/references/load-context.md

Load required files + optional RESEARCH.md.

**Parse:**
- Extract gray areas remaining from CONTEXT.md
- Extract active decisions from DECISIONS.md
- Count discussion sessions from STATE.md

Continue to show_state.
</step>

<step name="show_state">
Display what's established and what needs discussion.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DISCUSSION: {task-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Session:** {N+1}
**Decisions so far:** {count}

**Gray areas to explore:**
{numbered list of gray areas from CONTEXT.md}
```

Continue to identify_focus.
</step>

<step name="identify_focus">
Pick the most impactful gray area to start with.

Choose based on:
1. Dependencies — does resolving this unblock other areas?
2. Risk — is this the area most likely to cause problems later?
3. User interest — did the user hint at wanting to discuss something specific?

```
Let's start with: {gray area}

{Opening question that explores this area}
```

Continue to probe_area.
</step>

<step name="probe_area">
Explore the gray area through conversation.

**Question pattern (not rigid — follow the thread):**
1. Open-ended question to understand the space
2. Clarifying question based on response
3. Edge case or constraint question
4. Confirmation of understanding

**After 4 questions, check:**
```
So for {gray area}, it sounds like:
- {Summary point 1}
- {Summary point 2}

Is that right, or should we dig deeper?
```

**If resolved:** Record any decisions, mark gray area as resolved. Move to next gray area or wrap up.

**If not resolved:** Continue probing, or defer with explicit reasoning.

Continue to record_decisions.
</step>

<step name="record_decisions">
Record any new decisions from this discussion.

@~/.claude/specdacular/references/record-decision.md

For each decision identified during the discussion, add to DECISIONS.md.

Continue to update_context.
</step>

<step name="update_context">
Update CONTEXT.md with session results.

**Add resolved questions:**
For each gray area that was resolved, add to the "Resolved Questions" section with question, resolution, and details.

**Update gray areas:**
Remove resolved items from "Gray Areas Remaining."

**Add discussion history entry:**
```markdown
| {today} | {topics covered} | {what was resolved} |
```

Continue to update_state.
</step>

<step name="update_state">
Update STATE.md and config.json.

**STATE.md:**
- Increment discussion session in table
- Update gray areas checkboxes
- Update documents status

**config.json:**
- Increment `discussion_sessions`
- Update `decisions_count`

Continue to commit.
</step>

<step name="commit">
@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/tasks/{task-name}/CONTEXT.md .specd/tasks/{task-name}/DECISIONS.md .specd/tasks/{task-name}/STATE.md .specd/tasks/{task-name}/config.json`
- **$MESSAGE:** `docs({task-name}): discussion session {N}` with summary of resolved areas
- **$LABEL:** `discussion updates`

Continue to completion.
</step>

<step name="completion">
Present session summary.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DISCUSSION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Session {N}:** {summary of what was discussed}

**Resolved:** {count} gray areas
**New decisions:** {count}
**Remaining gray areas:** {count}
```

End workflow (caller handles continuation).
</step>

</process>

<success_criteria>
- Gray areas explored through conversation
- New decisions recorded in DECISIONS.md
- CONTEXT.md updated with resolutions
- STATE.md reflects updated progress
- Changes committed
</success_criteria>
