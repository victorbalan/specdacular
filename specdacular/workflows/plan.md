<purpose>
Create a high-level execution roadmap from task context. Derives phases based on dependencies and writes ROADMAP.md with phase goals. Does NOT create PLAN.md files or phase directories — those are created just-in-time by phase-plan.md when each phase starts.

**Output:** ROADMAP.md, updated STATE.md, config.json
</purpose>

<philosophy>

## Small Phases

Each phase should be small and focused. One PLAN.md per phase. If a phase feels too big, split it into two phases.

## Dependencies Drive Order

Phase order follows code dependencies: types before implementations, APIs before consumers, foundations before features.

## Plans Are Self-Contained

Each PLAN.md should have enough context that the executing agent doesn't need to ask questions. Reference decisions, research, and codebase patterns.

</philosophy>

<process>

<step name="validate">
@~/.claude/specdacular/references/validate-task.md

Use basic validation with $TASK_NAME from $ARGUMENTS.

Continue to load_context.
</step>

<step name="load_context">
@~/.claude/specdacular/references/load-context.md

Load all task context including RESEARCH.md if available.

**Check for orchestrator mode:**
Read config.json. If `"orchestrator": true`:
Hand off to orchestrator workflow:
@~/.claude/specdacular/workflows/orchestrator/plan.md
End main workflow.

Continue to assess_readiness.
</step>

<step name="assess_readiness">
Check if there's enough context to plan.

**Required:**
- FEATURE.md has specific "Must Create" items
- At least some gray areas resolved in CONTEXT.md

**Recommended but not required:**
- RESEARCH.md exists (warn if missing)
- All gray areas resolved

**If not ready:**
```
Not enough context to create a plan yet.

Missing:
- {what's missing}

Recommended next:
- /specd.discuss {task-name} — Resolve gray areas
- /specd.research {task-name} — Research implementation patterns
```
End workflow.

**If ready but RESEARCH.md missing:**
```
Note: No research findings available. Plans will be based on discussion context only.
Consider running /specd.research {task-name} first for better plans.
```

Continue to derive_phases.
</step>

<step name="derive_phases">
Break the task into ordered phases based on dependencies.

**Dependency ordering principles:**
1. Types/interfaces before implementations
2. Data models before APIs
3. APIs before consumers (UI, CLI)
4. Core before extensions
5. Setup before usage

**For each phase, define:**
- Name and one-liner goal
- Files to create and modify
- Dependencies on other phases
- Success criteria

**Keep phases small:**
- 2-5 tasks per phase
- Each task creates or modifies 1-3 files
- If a phase has >5 tasks, split it

**Do NOT create phase directories or PLAN.md files.** Those are created just-in-time by `phase-plan.md` when each phase starts execution. This allows later phases to adapt based on what happened in earlier phases.

Continue to write_roadmap.
</step>

<step name="write_roadmap">
Write ROADMAP.md with phase overview.

Use template from: `~/.claude/specdacular/templates/tasks/ROADMAP.md`

Fill in all phase details, success criteria, and execution order diagram.

Continue to update_state.
</step>

<step name="update_state">
Update STATE.md and config.json.

**STATE.md:**
- Stage: planning (or execution if ready)
- Mark phases derived and plans created
- Update documents status

**config.json:**
- Set `stage` to `"execution"`
- Set `phases.total` to phase count
- Set `phases.current` to 1
- Set `phases.current_status` to `"pending"`

Continue to commit.
</step>

<step name="commit">
@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/tasks/{task-name}/ROADMAP.md .specd/tasks/{task-name}/STATE.md .specd/tasks/{task-name}/config.json`
- **$MESSAGE:** `docs({task-name}): create roadmap and phase plans` with phase summary
- **$LABEL:** `planning complete`

Continue to completion.
</step>

<step name="completion">
Present the plan.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PLANNING COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Task:** {task-name}
**Phases:** {N}

{For each phase:}
Phase {N}: {Name} — {one-liner}
└── PLAN.md ({task count} tasks)

**Execution order:**
{dependency diagram}
```

End workflow (caller handles continuation).
</step>

</process>

<success_criteria>
- Phases derived from task requirements and dependencies
- ROADMAP.md created with phase goals and scope (no PLAN.md files)
- No phase directories created (just-in-time by phase-plan.md)
- STATE.md updated
- config.json set to execution stage with phases info
- Changes committed
</success_criteria>
