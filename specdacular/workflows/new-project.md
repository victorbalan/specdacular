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

Continue to research.
</step>

<step name="research">
Spawn 4 parallel research agents to investigate the project domain.

**Show banner:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RESEARCHING: {project-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Spawning 4 research agents...
```

**Prepare context:**
Read `.specd/tasks/project/PROJECT.md` and `.specd/tasks/project/CONTEXT.md`.
Build `$PROJECT_CONTEXT` combining: vision, problem, users, goals, constraints, open questions.

**Spawn 4 agents using Task tool with `run_in_background: true`:**

All agents use `subagent_type: "general-purpose"` and `model: "sonnet"`.

**Agent 1 — Stack:**
```
Task(
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "Stack research"
  run_in_background: true
  prompt: "First, read {install-path}/specdacular/agents/project-researcher.md for your role.

<focus_area>Stack</focus_area>

<project_context>
$PROJECT_CONTEXT
</project_context>

<research_questions>
1. What's the best technology stack for this type of project?
2. What frameworks and libraries are recommended for each layer?
3. What infrastructure (hosting, CI/CD, monitoring) fits best?
4. What are the key version requirements and compatibility concerns?
</research_questions>

Return findings in the Stack Research output format from your role definition."
)
```

**Agent 2 — Features:**
```
Task(
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "Features research"
  run_in_background: true
  prompt: "First, read {install-path}/specdacular/agents/project-researcher.md for your role.

<focus_area>Features</focus_area>

<project_context>
$PROJECT_CONTEXT
</project_context>

<research_questions>
1. What features are table stakes (users expect them)?
2. What features would differentiate this project?
3. What features should wait for v2+?
4. What anti-features should be explicitly avoided?
</research_questions>

Return findings in the Features Research output format from your role definition."
)
```

**Agent 3 — Architecture:**
```
Task(
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "Architecture research"
  run_in_background: true
  prompt: "First, read {install-path}/specdacular/agents/project-researcher.md for your role.

<focus_area>Architecture</focus_area>

<project_context>
$PROJECT_CONTEXT
</project_context>

<research_questions>
1. What architecture pattern fits this project (monolith, microservices, modular)?
2. What are the natural service boundaries?
3. What does the data model look like?
4. What directory structure is recommended?
</research_questions>

Return findings in the Architecture Research output format from your role definition."
)
```

**Agent 4 — Pitfalls:**
```
Task(
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "Pitfalls research"
  run_in_background: true
  prompt: "First, read {install-path}/specdacular/agents/project-researcher.md for your role.

<focus_area>Pitfalls</focus_area>

<project_context>
$PROJECT_CONTEXT
</project_context>

<research_questions>
1. What do teams commonly get wrong when building this type of project?
2. What are the performance and scalability pitfalls?
3. What security concerns are specific to this domain?
4. What architectural mistakes lead to rewrites?
</research_questions>

Return findings in the Pitfalls Research output format from your role definition."
)
```

**Wait for all agents to complete.**

```
Research agents complete:
- Stack: {✓ | ✗}
- Features: {✓ | ✗}
- Architecture: {✓ | ✗}
- Pitfalls: {✓ | ✗}
```

Continue to write_research.
</step>

<step name="write_research">
Write research findings to files and synthesize a summary.

**Create research directory:**
```bash
mkdir -p .specd/tasks/project/research
```

**Write individual research files from agent outputs:**
- `.specd/tasks/project/research/STACK.md` — Stack agent findings
- `.specd/tasks/project/research/FEATURES.md` — Features agent findings
- `.specd/tasks/project/research/ARCHITECTURE.md` — Architecture agent findings
- `.specd/tasks/project/research/PITFALLS.md` — Pitfalls agent findings

**Synthesize SUMMARY.md:**
Read all 4 files and write `.specd/tasks/project/research/SUMMARY.md` containing:

```markdown
# Research Summary: {project-name}

## Key Recommendation

{One paragraph: the single most important takeaway from research}

## Stack

{2-3 sentence summary of recommended stack}

## Features

- **Table stakes:** {count} features identified
- **Differentiators:** {count} features identified
- **v2+:** {count} features deferred

## Architecture

{2-3 sentence summary of recommended architecture}

## Pitfalls

- **Critical:** {count} — {brief list}
- **Moderate:** {count}
- **Minor:** {count}

## Confidence

| Area | Level | Notes |
|------|-------|-------|
| Stack | {level} | {brief note} |
| Features | {level} | {brief note} |
| Architecture | {level} | {brief note} |
| Pitfalls | {level} | {brief note} |

## Roadmap Implications

{How research findings should influence requirements and phasing}
```

**Update config.json:**
```json
{
  "stage": "research",
  ...
}
```

Continue to commit_research.
</step>

<step name="commit_research">
Commit research files.

@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/tasks/project/research/ .specd/tasks/project/config.json`
- **$MESSAGE:** `docs(project): research complete — {project-name}` with key findings summary
- **$LABEL:** `research findings`

Continue to research_complete.
</step>

<step name="research_complete">
Show research summary and indicate next steps.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RESEARCH COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Project:** {project-name}

**Key recommendation:** {one-liner from SUMMARY.md}

**Findings:**
- Stack: {brief summary}
- Features: {brief summary}
- Architecture: {brief summary}
- Pitfalls: {brief summary}

**Confidence:** {overall level}

## Created

- `.specd/tasks/project/research/STACK.md`
- `.specd/tasks/project/research/FEATURES.md`
- `.specd/tasks/project/research/ARCHITECTURE.md`
- `.specd/tasks/project/research/PITFALLS.md`
- `.specd/tasks/project/research/SUMMARY.md`

## What's Next

Requirements scoping and roadmap stages are coming soon.
For now, review the research files to see what the agents found.
```

End workflow.
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
- 4 research agents spawn in parallel after PROJECT.md is written
- Each agent writes its findings (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md)
- SUMMARY.md synthesized from all 4 outputs
- All files committed to git
- Clean exit with next steps indicated
</success_criteria>
