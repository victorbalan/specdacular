# Workflow: New Task (Orchestrator Mode)

This workflow handles task initialization when `.specd/config.json` has `"type": "orchestrator"`.
Called from the main `new.md` workflow after orchestrator mode detection.

## Input

- `$TASK_NAME` — Validated task name (kebab-case)
- Orchestrator config already loaded

## Steps

<step name="load_system_docs">
Read system-level codebase docs:

- `.specd/codebase/PROJECTS.md` — Project registry
- `.specd/codebase/TOPOLOGY.md` — Communication patterns
- `.specd/codebase/CONTRACTS.md` — Shared interfaces
- `.specd/codebase/CONCERNS.md` — System-level concerns

Read project list from `.specd/config.json` `"projects"` array.

```
Orchestrator mode detected. {N} projects registered.
I'll use system-level docs to understand cross-project architecture.
```

Continue to orchestrator_discussion.
</step>

<step name="orchestrator_discussion">
System-level task discussion.

**Opening:**
```
Let's talk about what you're building across the system.

What's the {task-name} feature? What system-level behavior does it add?
```

Wait for response.

**Follow the thread:**
Based on their response, ask follow-up questions that:
- Identify which projects are affected
- Explore cross-project behavior
- Identify contract implications
- Understand project responsibilities

**System-level probes (follow the conversation, don't march through):**
- "Which projects does this involve?"
- "What crosses project boundaries here?"
- "Does this change any existing communication patterns?"
- "What's each project's responsibility for this?"
- "Are there shared data structures or APIs that need to align?"
- "What's the simplest cross-project version that would work?"

**Use system-level context from codebase docs:**
- Reference PROJECTS.md for project responsibilities
- Reference TOPOLOGY.md for existing communication patterns
- Reference CONTRACTS.md for existing shared interfaces
- Reference CONCERNS.md for system-level gotchas

**Check understanding:**
After 4-6 exchanges, summarize with project involvement:
```
So if I understand correctly:
- This feature [system-level behavior]
- It involves these projects:
  - {project-1}: [responsibility]
  - {project-2}: [responsibility]
- Cross-project interaction: [how projects coordinate]
- Key constraint: [constraint]

Does that capture it, or should we dig into anything more?
```

Continue to route_projects.
</step>

<step name="route_projects">
Confirm which projects are involved.

**Build project suggestion** from discussion. Cross-reference with CONTRACTS.md and PROJECTS.md.

**Present suggestion:**
```
Based on our discussion, these projects are involved:

{For each project:}
- **{project-name}** ({project-path}) — {responsibility}

{If any projects from config NOT included:}
Not involved: {project-name} — {brief reason}
```

Use AskUserQuestion:
- header: "Projects"
- question: "Are these the right projects for this task?"
- options:
  - "Yes, looks right"
  - "I need to adjust"

Continue to create_orchestrator_task.
</step>

<step name="create_orchestrator_task">
Create orchestrator-level task folder with system-view documents.

```bash
mkdir -p .specd/tasks/{task-name}
```

**Write files using templates from `~/.claude/specdacular/templates/tasks/`:**

**FEATURE.md** — System-level view:
- What This Is: System-level description
- Must Create: Involved projects and what each creates (high-level)
- Must Integrate With: Cross-project interactions, contracts affected
- Constraints: System-level constraints
- Success Criteria: System-level observable behaviors

**CONTEXT.md** — Cross-project discussion summary

**DECISIONS.md** — Any decisions from discussion

**STATE.md** — Stage: discussion, with Sub-Project Tasks table:
```markdown
## Sub-Project Tasks

| Project | Path | Task Path | Status |
|---------|------|-----------|--------|
| {project-name} | {project-path} | {project-path}/.specd/tasks/{task-name}/ | initialized |
```

**config.json:**
```json
{
  "task_name": "{name}",
  "created": "{date}",
  "stage": "discussion",
  "discussion_sessions": 1,
  "decisions_count": {N},
  "orchestrator": true,
  "projects": [
    {"name": "{project-name}", "path": "{project-path}", "responsibility": "{responsibility}"}
  ]
}
```

Continue to delegate_to_projects.
</step>

<step name="delegate_to_projects">
Create task folders in each involved sub-project with translated requirements.

For each project in the routing data:

```bash
mkdir -p {project-path}/.specd/tasks/{task-name}
```

**Write FEATURE.md (project-specific):**
Translate system-level requirements into project-specific requirements.

**IMPORTANT:** Sub-project FEATURE.md must read like a normal, self-contained requirement. No references to "orchestrator," "multi-project," or other projects by name. Cross-project requirements phrased as external interface requirements:
- BAD: "API project must expose /auth/login for the UI project"
- GOOD: "Must expose /auth/login endpoint that returns JWT tokens"

**Write CONTEXT.md, DECISIONS.md, STATE.md, config.json** using templates.

Note: `discussion_sessions: 0` because no per-project discussion happened.

Verify all projects:
```bash
for project in {project-paths}; do
  echo "Checking $project..."
  ls "$project/.specd/tasks/{task-name}/"
done
```

Continue to commit.
</step>

<step name="commit">
Commit orchestrator and all sub-project task files.

@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/tasks/{task-name}/` and `{project-path}/.specd/tasks/{task-name}/` for each project
- **$MESSAGE:** `docs({task-name}): initialize multi-project task`
- **$LABEL:** `multi-project task initialization`

Continue to completion.
</step>

<step name="completion">
Present multi-project task creation summary.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MULTI-PROJECT TASK INITIALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Task:** {task-name}

## Orchestrator (.specd/tasks/{task-name}/)

- FEATURE.md — System-level requirements
- CONTEXT.md — Cross-project discussion
- DECISIONS.md — {N} decisions recorded
- STATE.md — Sub-project tracking

## Projects

{For each project:}
**{project-name}** ({project-path}/.specd/tasks/{task-name}/)
- FEATURE.md — {brief responsibility summary}

## Summary

{2-3 sentence system-level summary}
```

Continue to continuation_offer.
</step>

<step name="continuation_offer">
Offer to continue or stop.

**If gray areas remain:**
Use AskUserQuestion:
- header: "Continue?"
- question: "Want to keep discussing the open areas, or come back later?"
- options:
  - "Keep discussing" — Dive into the gray areas now
  - "Stop for now" — Come back with `/specd:continue {task-name}`

**If Keep discussing:**
Execute the discuss workflow:
@~/.claude/specdacular/workflows/discuss.md

After discussion completes, return to this step.

**If no gray areas remain:**
Use AskUserQuestion:
- header: "Continue?"
- question: "Discussion looks solid. Want to keep going or come back later?"
- options:
  - "Continue" — Move to next step
  - "Stop for now" — Come back with `/specd:continue {task-name}`

**If Continue:**
Hand off to continue workflow:
@~/.claude/specdacular/workflows/continue.md

**If Stop for now:**
```
Progress saved. Pick up where you left off anytime:

/specd:continue {task-name}
```

End workflow.
</step>
