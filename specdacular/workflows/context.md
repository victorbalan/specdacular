<purpose>
Read-only context loader. Resolves the current task, reads all task state, displays a summary, and injects behavioral guardrails. Does NOT modify any files or commit.

**Output:** Task summary displayed to user, guardrails active for session.
</purpose>

<philosophy>

## Read-Only

This workflow reads everything and writes nothing. It's safe to run at any point in a conversation.

## Re-Injectable

Users can run `/specd.context` mid-conversation to reset Claude's behavior when it drifts from specd conventions.

## Concise Summary

Show just enough to orient — stage, phase, decisions, next step. The user can dig deeper with `/specd.status` or by reading individual files.

</philosophy>

<process>

<step name="resolve_task">
@/Users/victor/.claude/specdacular/references/resolve-task.md

Resolve task name from $ARGUMENTS. Set $TASK_NAME and $TASK_DIR.

Continue to load_state.
</step>

<step name="load_state">
Read task files to build the summary.

**Read config.json:**
```bash
cat $TASK_DIR/config.json
```

Extract: stage, phases.current, phases.total, phases.current_status, decisions_count.

**Read STATE.md:**
```bash
cat $TASK_DIR/STATE.md
```

Extract: next steps section.

**Read CONTEXT.md (if exists):**
```bash
cat $TASK_DIR/CONTEXT.md 2>/dev/null
```

Extract: count of remaining gray areas.

**Read DECISIONS.md (if exists):**
```bash
cat $TASK_DIR/DECISIONS.md 2>/dev/null
```

Extract: count of active decisions.

**Read ROADMAP.md (if exists):**
```bash
cat $TASK_DIR/ROADMAP.md 2>/dev/null
```

Extract: current phase name from the phase list.

Continue to display_summary.
</step>

<step name="display_summary">
Present the task context summary.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CONTEXT: {task-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Stage:** {stage}
**Phase:** {current}/{total} — {phase name}
**Phase status:** {current_status}
**Decisions:** {count} active

**Gray areas:** {count remaining or "all resolved"}
**Next step:** {from STATE.md Next Steps section}
```

Continue to inject_guardrails.
</step>

<step name="inject_guardrails">
Inject behavioral guardrails for the session.

@/Users/victor/.claude/specdacular/guardrails/specd-rules.txt

```
───────────────────────────────────────────────────────
Guardrails loaded. Specd conventions active for this session.
───────────────────────────────────────────────────────
```

End workflow.
</step>

</process>

<success_criteria>
- Task resolved via resolve-task.md
- Task summary displayed with stage, phase, decisions, gray areas
- Guardrails injected via @reference to specd-rules.txt
- No files modified (read-only workflow)
</success_criteria>
