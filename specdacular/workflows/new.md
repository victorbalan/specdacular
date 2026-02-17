<purpose>
Initialize a new task folder and start the first discussion. Creates structure, asks initial questions, and writes technical requirements.

**Core flow:**
```
new → (discuss ↔ research)* → plan
```

The user controls the rhythm after initialization. This command is just the entry point.

**Output:** `.specd/tasks/{task-name}/` folder with FEATURE.md, CONTEXT.md, DECISIONS.md, CHANGELOG.md, STATE.md, config.json
</purpose>

<philosophy>

## Collaborative, Not Interrogative

Follow the thread. Build understanding through natural dialogue. When the user says something interesting, explore it. Don't march through a checklist.

## Technical Focus

This is about technical requirements, not product specs. Focus on:
- What code needs to exist
- What existing code it integrates with
- Technical constraints

## Probe Until Initial Understanding

Keep asking until you understand:
1. What this creates (files, components, APIs)
2. What it integrates with (existing code)
3. Key constraints (technical, timeline, scope)

You don't need to resolve everything — that's what `/specd:discuss` is for.

## Decisions Get Recorded

Any decision made during this initial discussion goes into DECISIONS.md with date and rationale.

</philosophy>

<process>

<step name="validate">
Get task name and validate.

**If $ARGUMENTS provided:**
Use as task name. Normalize to kebab-case (lowercase, hyphens).

**If no arguments:**
Ask: "What's the name of this task?"

**Validate:**
- Task name should be kebab-case
- Check if `.specd/tasks/{name}/` already exists

```bash
[ -d ".specd/tasks/$TASK_NAME" ] && echo "exists"
```

**If task exists:**
Use AskUserQuestion:
- header: "Task Exists"
- question: "Task '{name}' already exists. What would you like to do?"
- options:
  - "Resume" — Continue with existing task (suggest /specd:continue)
  - "Reset" — Delete and start fresh
  - "Different name" — Use a different name

**If new task:**
Continue to codebase_context.
</step>

<step name="codebase_context">
Look for codebase documentation and detect orchestrator mode.

**Check for existing config:**
```bash
cat .specd/config.json 2>/dev/null
```

**Check for orchestrator mode:**
If config exists with `"type": "orchestrator"`:
Hand off to orchestrator workflow:
@~/.claude/specdacular/workflows/orchestrator/new.md

End main workflow.

**If type = "project" or absent:**

**Check for codebase docs:**
```bash
ls .specd/codebase/*.md 2>/dev/null
```

**If codebase docs found:**
```
Found codebase documentation. I'll reference these when defining requirements.
```
Read the available docs to understand project structure, code patterns, and architecture.

**If no codebase docs found:**
Use AskUserQuestion:
- header: "No Codebase Docs"
- question: "I didn't find codebase documentation. How should we proceed?"
- options:
  - "Run map-codebase first" — Creates AI-optimized docs
  - "Continue without" — Proceed without codebase context
  - "Custom location" — Docs are elsewhere

Continue to first_discussion.
</step>

<step name="first_discussion">
Start the conversation.

**Opening:**
```
Let's talk about what you're building.

What's the {task-name} task? Give me the quick version — what problem does it solve and roughly how?
```

Wait for response.

**Follow the thread:**
Based on their response, ask follow-up questions that:
- Clarify what they said ("When you say X, do you mean...?")
- Explore interesting aspects ("Tell me more about how that would work...")
- Identify technical implications ("So that would mean creating a...")

**Questions to answer (not in order — follow the conversation):**
1. What does this create? (new files, components, APIs, data)
2. What does it integrate with? (existing code, external services)
3. What are the key constraints? (technical, timeline, scope)
4. What's explicitly out of scope? (scope boundaries)

**Check understanding:**
After 4-6 exchanges, summarize:
```
So if I understand correctly:
- This task [does X]
- It needs to create [files/components]
- It integrates with [existing code]
- Key constraint: [constraint]

Does that capture it, or should we dig into anything more?
```

**When to move on:**
- User confirms understanding is correct
- You have enough for initial FEATURE.md
- Further details can be discussed later with /specd:discuss

Continue to write_feature.
</step>

<step name="write_feature">
Create task directory and write all documents.

**Create task directory:**
```bash
mkdir -p .specd/tasks/{task-name}
```

**Write FEATURE.md:**
Use template at `~/.claude/specdacular/templates/tasks/FEATURE.md`
Fill in based on conversation.

**Write CONTEXT.md:**
Use template at `~/.claude/specdacular/templates/tasks/CONTEXT.md`
Fill in discussion summary, resolved questions, deferred questions, gray areas.

**Write DECISIONS.md:**
Use template at `~/.claude/specdacular/templates/tasks/DECISIONS.md`
Record any decisions made during discussion using the format from:
@~/.claude/specdacular/references/record-decision.md

**Write CHANGELOG.md:**
Use template at `~/.claude/specdacular/templates/tasks/CHANGELOG.md`
Initialize empty.

**Write STATE.md:**
Use template at `~/.claude/specdacular/templates/tasks/STATE.md`
Initialize with stage: discussion, initial discussion complete: yes.

**Write config.json:**
```json
{
  "task_name": "{name}",
  "created": "{date}",
  "stage": "discussion",
  "discussion_sessions": 1,
  "decisions_count": {N}
}
```

Continue to commit.
</step>

<step name="commit">
Commit the task initialization.

@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/tasks/{task-name}/`
- **$MESSAGE:** `docs({task-name}): initialize task` with list of created files
- **$LABEL:** `task initialization`

Continue to completion.
</step>

<step name="completion">
Present what was created and offer to continue.

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TASK INITIALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Task:** {task-name}

## Created

- `.specd/tasks/{task-name}/FEATURE.md` — Technical requirements
- `.specd/tasks/{task-name}/CONTEXT.md` — Discussion context
- `.specd/tasks/{task-name}/DECISIONS.md` — {N} decisions recorded
- `.specd/tasks/{task-name}/CHANGELOG.md` — Implementation log (empty)
- `.specd/tasks/{task-name}/STATE.md` — Progress tracking
- `.specd/tasks/{task-name}/config.json` — Configuration

## Summary

{2-3 sentence summary of what this task does}

{If gray areas remain:}
**Open areas to discuss:**
- {Gray area 1}
- {Gray area 2}
```

Continue to continuation_offer.
</step>

<step name="continuation_offer">
Offer to continue discussing or stop.

**If gray areas remain:**
Use AskUserQuestion:
- header: "Continue?"
- question: "Want to keep discussing the open areas, or come back later?"
- options:
  - "Keep discussing" — Dive into the gray areas now
  - "Stop for now" — Come back with /specd:continue {task-name}

**If Keep discussing:**
Execute the discuss workflow logic:
@~/.claude/specdacular/workflows/discuss.md

After discussion completes, return to this step.

**If no gray areas remain:**
Use AskUserQuestion:
- header: "Continue?"
- question: "Discussion looks solid. Want to keep going or come back later?"
- options:
  - "Continue" — Move to the next step (research or planning)
  - "Stop for now" — Come back with /specd:continue {task-name}

**If Continue:**
Hand off to continue workflow:
@~/.claude/specdacular/workflows/continue.md

**If Stop for now:**
```
───────────────────────────────────────────────────────

Progress saved. Pick up where you left off anytime:

/specd:continue {task-name}
```

End workflow.
</step>

</process>

<success_criteria>
- Task folder created at `.specd/tasks/{name}/`
- FEATURE.md has specific technical requirements
- CONTEXT.md captures the discussion state
- DECISIONS.md initialized (with any decisions made)
- CHANGELOG.md initialized (empty)
- STATE.md tracks current stage
- config.json created
- Committed to git
- User presented with clear next options
</success_criteria>
