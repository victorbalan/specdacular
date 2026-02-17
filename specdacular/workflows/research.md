<purpose>
Research implementation patterns for a task. Spawns three parallel agents to investigate codebase integration, external patterns, and pitfalls. Synthesizes findings into RESEARCH.md.

**Output:** `.specd/tasks/{task-name}/RESEARCH.md`, updated DECISIONS.md
</purpose>

<philosophy>

## Three Dimensions

Research covers three complementary angles:
1. **Codebase Integration** — How this fits with existing code
2. **Implementation Patterns** — Standard approaches and libraries
3. **Pitfalls** — What commonly goes wrong

## Confidence Over Quantity

Mark findings with confidence levels. A few HIGH-confidence findings are more valuable than many LOW-confidence ones.

## Decisions From Research

When research reveals clear choices (library X over Y, pattern A over B), record them as decisions immediately.

</philosophy>

<process>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use basic validation with $TASK_NAME from $ARGUMENTS.

Continue to load_context.
</step>

<step name="load_context">
@~/.claude/specdacular/references/load-context.md

Load all task context. Extract:
- Task description and requirements (from FEATURE.md)
- Active decisions/constraints (from DECISIONS.md)
- Technology stack (from codebase docs if available)
- Files to create/modify (from FEATURE.md)

**Check if RESEARCH.md already exists:**
```bash
[ -f ".specd/tasks/$TASK_NAME/RESEARCH.md" ] && echo "existing"
```

**If exists:**
Use AskUserQuestion:
- header: "Research Exists"
- question: "Research already exists. What would you like to do?"
- options:
  - "Re-run research" — Generate fresh findings
  - "View existing" — Show current RESEARCH.md
  - "Skip" — Use existing research

Continue to spawn_agents.
</step>

<step name="spawn_agents">
@~/.claude/specdacular/references/spawn-research-agents.md

Prepare variables:
- `$TASK_NAME` — from arguments
- `$TASK_CONTEXT` — summary from FEATURE.md
- `$CONSTRAINTS` — active decisions from DECISIONS.md
- `$TECH_STACK` — from codebase docs (or "unknown")
- `$FILES_TO_CREATE` — from FEATURE.md "Must Create"
- `$FILES_TO_MODIFY` — from FEATURE.md "Must Integrate With"

Spawn all three agents with `run_in_background: true`.

Continue to collect_results.
</step>

<step name="collect_results">
Wait for all three agents to complete.

Read each agent's output. If an agent failed, note it but continue with available results.

```
Research agents complete:
- Codebase Integration: {✓ | ✗}
- Implementation Patterns: {✓ | ✗}
- Pitfalls: {✓ | ✗}
```

Continue to synthesize.
</step>

<step name="synthesize">
@~/.claude/specdacular/references/synthesize-research.md

Combine agent outputs into `.specd/tasks/$TASK_NAME/RESEARCH.md`.

Continue to record_decisions.
</step>

<step name="record_decisions">
@~/.claude/specdacular/references/record-decision.md

If research revealed clear technology/library/pattern choices, record them as decisions.

Continue to update_state.
</step>

<step name="update_state">
Update STATE.md and config.json.

**STATE.md:**
- Mark research as conducted
- Mark RESEARCH.md as created
- Update decisions count

**config.json:**
- Update `decisions_count`

Continue to commit.
</step>

<step name="commit">
@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/tasks/{task-name}/RESEARCH.md .specd/tasks/{task-name}/DECISIONS.md .specd/tasks/{task-name}/STATE.md .specd/tasks/{task-name}/config.json`
- **$MESSAGE:** `docs({task-name}): research complete` with key findings summary
- **$LABEL:** `research findings`

Continue to completion.
</step>

<step name="completion">
Present research summary.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RESEARCH COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Task:** {task-name}

**Key recommendation:** {one-liner from RESEARCH.md}

**Findings:**
- Codebase: {brief summary}
- Patterns: {brief summary}
- Pitfalls: {brief summary}

**Confidence:** {overall level}
**New decisions:** {count}
```

End workflow (caller handles continuation).
</step>

</process>

<success_criteria>
- Three research agents spawned and completed
- RESEARCH.md synthesized from agent findings
- Confidence levels assigned
- Research-driven decisions recorded in DECISIONS.md
- STATE.md updated
- Changes committed
</success_criteria>
