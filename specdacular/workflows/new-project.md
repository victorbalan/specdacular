<purpose>
Bootstrap a new project from idea to structured plan. Standalone workflow — no brain/pipeline integration. Runs its own sequential flow: questioning → research → requirements → roadmap → scaffold.

After scaffolding, sub-projects use `/specd.new` and `/specd.continue` for their individual task lifecycles.

**Output:** `.specd/tasks/project/PROJECT.md` (Phase 1), research files (Phase 2), REQUIREMENTS.md + ROADMAP.md (Phase 3), scaffolded sub-projects (Phase 4)
</purpose>

<philosophy>

## Collaborative, Not Interrogative

Follow the thread. When the user mentions something interesting, explore it. Don't march through a checklist of questions. Build understanding through natural dialogue.

## Vision First, Details Later

The questioning stage captures the big picture — what, why, who, constraints. Technical details (stack, libraries, architecture) come from research agents later.

## Opinionated Research

Research agents don't list options — they recommend. "Use X because Y" is more useful than "you could use X, Y, or Z."

## Greenfield Assumptions

There's no codebase to learn from. All context comes from the user's vision and domain research. This is fundamentally different from `/specd.new`.

</philosophy>

<process>

<step name="validate">
Get project name and validate.

**If $ARGUMENTS provided:**
Use as project name. This is a label for the project, not a task name.

**If no arguments:**
Ask: "What's the name of this project?"

**Check if project already exists:**
```bash
[ -d ".specd/tasks/project" ] && echo "exists"
```

**If project exists:**
Use AskUserQuestion:
- header: "Project Exists"
- question: "A project has already been initialized. What would you like to do?"
- options:
  - "Start fresh" — Delete existing and reinitialize
  - "View existing" — Show current PROJECT.md

**If "Start fresh":**
```bash
rm -rf .specd/tasks/project
```

**If "View existing":**
Read and display `.specd/tasks/project/PROJECT.md`. End workflow.

**If new project:**
Continue to questioning.
</step>

<step name="questioning">
Collaborative conversation to understand the project vision.

**Opening:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 NEW PROJECT: {project-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tell me about this project. What are you building and why?
```

Wait for response.

**Follow the thread:**
Based on their response, explore:
- What's the core value? ("When you say X, tell me more about...")
- Who uses it? ("Who's the primary user? What's their workflow?")
- What does it need to do? ("What are the must-have capabilities for v1?")
- Any known technical constraints? ("Any preferences for stack, hosting, team size?")
- What's out of scope? ("What should we explicitly NOT build?")
- Sub-projects? ("Does this feel like one app or multiple services?")

**Record decisions inline:**
When the user makes a clear choice, note it for DECISIONS.md later.

**After 4-6 exchanges, summarize:**
```
Here's what I'm hearing:

**Vision:** {one-liner}
**Problem:** {what it solves}
**Users:** {who and how}
**Key goals:**
- {goal 1}
- {goal 2}
- {goal 3}

**Constraints:** {known constraints}
**Sub-projects:** {identified or "TBD from research"}

Does that capture it? Anything to add or correct?
```

**When to move on:**
- User confirms the summary
- You have enough for a meaningful PROJECT.md
- Technical details can wait for research

Continue to write_project.
</step>

<step name="write_project">
Create the project task directory and write initial documents.

**Create directory:**
```bash
mkdir -p .specd/tasks/project
```

**Write PROJECT.md:**
Use template at `~/.claude/specdacular/templates/tasks/PROJECT.md`
Fill in from the questioning conversation.

**Write CONTEXT.md:**
Use template at `~/.claude/specdacular/templates/tasks/CONTEXT.md`
- Discussion summary from questioning
- Any resolved questions
- Open questions that research should address
- Gray areas (if any)

**Write DECISIONS.md:**
Use template at `~/.claude/specdacular/templates/tasks/DECISIONS.md`
Record any decisions made during questioning using:
@~/.claude/specdacular/references/record-decision.md

**Write config.json:**
```json
{
  "task_name": "project",
  "project_name": "{project-name}",
  "created": "{date}",
  "stage": "questioning",
  "type": "project"
}
```

Continue to commit.
</step>

<step name="commit">
Commit the project initialization.

@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/tasks/project/`
- **$MESSAGE:** `docs(project): initialize project — {project-name}` with brief vision summary
- **$LABEL:** `project initialization`

Continue to research_stub.
</step>

<step name="research_stub">
Research stage — not yet implemented.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PROJECT INITIALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Project:** {project-name}

## Created

- `.specd/tasks/project/PROJECT.md` — Project vision and goals
- `.specd/tasks/project/CONTEXT.md` — Discussion context
- `.specd/tasks/project/DECISIONS.md` — {N} decisions recorded
- `.specd/tasks/project/config.json` — Project configuration

## What's Next

Research, requirements, roadmap, and scaffolding stages are coming soon.
For now, you have a solid PROJECT.md capturing your vision.
```

End workflow.
</step>

<!-- Future stages (Phase 2-4) will replace these stubs -->

<step name="research">
<!-- Phase 2: Spawn 4 parallel research agents for stack, features, architecture, pitfalls -->
Not yet implemented. See Phase 2 in ROADMAP.md.
</step>

<step name="requirements">
<!-- Phase 3: Multi-select scoping from research → REQUIREMENTS.md -->
Not yet implemented. See Phase 3 in ROADMAP.md.
</step>

<step name="roadmap">
<!-- Phase 3: Generate ROADMAP.md from requirements -->
Not yet implemented. See Phase 3 in ROADMAP.md.
</step>

<step name="scaffold">
<!-- Phase 4: Create orchestrator config, sub-project dirs, seed setup tasks -->
Not yet implemented. See Phase 4 in ROADMAP.md.
</step>

</process>

<success_criteria>
- Questioning produces PROJECT.md with clear vision, goals, users, constraints
- Project directory created at `.specd/tasks/project/`
- CONTEXT.md and DECISIONS.md initialized from discussion
- All files committed to git
- Clean exit with next steps indicated
</success_criteria>
