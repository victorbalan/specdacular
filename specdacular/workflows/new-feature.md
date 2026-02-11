<purpose>
Initialize a new feature folder and start the first discussion. Creates structure, asks initial questions, and writes technical requirements.

**Core flow:**
```
new-feature → (discuss ↔ research)* → plan-feature
```

The user controls the rhythm after initialization. This command is just the entry point.

**Output:** `.specd/features/{feature-name}/` folder with FEATURE.md, CONTEXT.md, DECISIONS.md, CHANGELOG.md, STATE.md, config.json
</purpose>

<philosophy>

## Collaborative, Not Interrogative

Follow the thread. Build understanding through natural dialogue. When the user says something interesting, explore it. Don't march through a checklist.

**Bad:** "Question 1: What's the feature? Question 2: What's the scope? Question 3: ..."
**Good:** "Tell me about what you're building... [response] ...Interesting, when you say X, do you mean Y or Z?"

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

You don't need to resolve everything — that's what `discuss-feature` is for.

## Decisions Get Recorded

Any decision made during this initial discussion goes into DECISIONS.md with date and rationale.

</philosophy>

<process>

<step name="validate">
Get feature name and validate.

**If $ARGUMENTS provided:**
Use as feature name. Normalize to kebab-case (lowercase, hyphens).

**If no arguments:**
Ask: "What's the name of this feature?"

**Validate:**
- Feature name should be kebab-case
- Check if `.specd/features/{name}/` already exists

```bash
# Check if feature exists
[ -d ".specd/features/$FEATURE_NAME" ] && echo "exists"
```

**If feature exists:**
Use AskUserQuestion:
- header: "Feature Exists"
- question: "Feature '{name}' already exists. What would you like to do?"
- options:
  - "Resume" — Continue with existing feature (suggest /specd:feature:discuss)
  - "Reset" — Delete and start fresh
  - "Different name" — Use a different name

**If new feature:**
Continue to codebase_context.
</step>

<step name="codebase_context">
Look for codebase documentation and detect orchestrator mode.

**Check for existing config:**
```bash
cat .specd/config.json 2>/dev/null
```

**Check for orchestrator mode (DEC-006):**

If config exists, read `"type"` field.

**If type = "orchestrator":**
Set mode = "orchestrator".

Read system-level codebase docs:
- `.specd/codebase/PROJECTS.md` — Project registry
- `.specd/codebase/TOPOLOGY.md` — Communication patterns
- `.specd/codebase/CONTRACTS.md` — Shared interfaces
- `.specd/codebase/CONCERNS.md` — System-level concerns

Read project list from config.json `"projects"` array.

```
Orchestrator mode detected. {N} projects registered.
I'll use system-level docs to understand cross-project architecture.
```

Continue to orchestrator_discussion.

**If type = "project" or absent:**
Set mode = "project".

**If config exists with codebase_docs path:**
Use that path for codebase docs.

**If no config, check default location:**
```bash
ls .specd/codebase/*.md 2>/dev/null
```

**If codebase docs found:**
```
Found codebase documentation. I'll reference these when defining requirements.
```

Read the available docs to understand:
- Project structure (where new code goes)
- Code patterns (how things are done here)
- Architecture (how systems connect)

Continue to first_discussion.

**If no codebase docs found:**
Use AskUserQuestion:
- header: "No Codebase Docs"
- question: "I didn't find codebase documentation. How should we proceed?"
- options:
  - "Run map-codebase first" — Creates AI-optimized docs
  - "Continue without" — Proceed without codebase context
  - "Custom location" — Docs are elsewhere

**If custom location:**
Ask for path, then save to `.specd/config.json`.

Continue to first_discussion.
</step>

<step name="orchestrator_discussion">
System-level feature discussion for orchestrator mode.

**Opening:**
```
Let's talk about what you're building across the system.

What's the {feature-name} feature? What system-level behavior does it add?
```

Wait for response.

**Follow the thread:**
Based on their response, ask follow-up questions that:
- Identify which projects are affected ("Which parts of the system does this touch?")
- Explore cross-project behavior ("How would data flow between projects for this?")
- Identify contract implications ("Does this change how projects communicate?")
- Understand project responsibilities ("What does each project need to do?")

**System-level probes (follow the conversation, don't march through):**
- "Which projects does this involve?"
- "What crosses project boundaries here?"
- "Does this change any existing communication patterns?"
- "What's each project's responsibility for this feature?"
- "Are there shared data structures or APIs that need to align?"
- "What's the simplest cross-project version that would work?"

**Use system-level context from codebase docs:**
- Reference PROJECTS.md for project responsibilities
- Reference TOPOLOGY.md for existing communication patterns
- Reference CONTRACTS.md for existing shared interfaces
- Reference CONCERNS.md for system-level gotchas that might apply

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

**When to move on:**
- User confirms understanding is correct
- You have a clear project list with per-project responsibilities
- Cross-project behavior is understood

Continue to route_projects.
</step>

<step name="route_projects">
Confirm which projects are involved in this feature.

**Build project suggestion:**
From the discussion, identify involved projects. Cross-reference with:
- CONTRACTS.md — which projects have existing relationships relevant to this feature
- PROJECTS.md — project responsibilities that align with feature needs

**Present suggestion:**
```
Based on our discussion, these projects are involved:

{For each project:}
- **{project-name}** ({project-path}) — {responsibility for this feature}

{If any projects from config NOT included:}
Not involved: {project-name} — {brief reason}
```

Use AskUserQuestion:
- header: "Projects"
- question: "Are these the right projects for this feature?"
- options:
  - "Yes, looks right" — Continue with these projects
  - "I need to adjust" — Add or remove projects

**If "I need to adjust":**
Ask user which projects to add or remove. Update the list accordingly.

**Store project routing:**
Build routing data:
```json
{
  "projects": [
    {"name": "{project-name}", "path": "{project-path}", "responsibility": "{what this project does for the feature}"}
  ]
}
```

Continue to create_orchestrator_feature.
</step>

<step name="create_orchestrator_feature">
Create orchestrator-level feature folder with system-view documents.

**Create feature directory:**
```bash
mkdir -p .specd/features/{feature-name}
```

**Write FEATURE.md (system view):**
Use template at `~/.claude/specdacular/templates/features/FEATURE.md` but adapt for system level:

- **What This Is:** System-level description from orchestrator discussion
- **Must Create:** List the involved projects and what each creates (high-level)
- **Must Integrate With:** Cross-project interactions, existing contracts affected
- **Constraints:** System-level constraints (cross-project coordination, contract alignment)
- **Success Criteria:** System-level observable behaviors (not project-level details)
- **Out of Scope:** Explicit exclusions from the discussion
- **Initial Context:**
  - User Need: from discussion
  - Projects Involved: list with responsibilities
  - Cross-Project Contracts: what needs to align between projects

**Write CONTEXT.md:**
Use template at `~/.claude/specdacular/templates/features/CONTEXT.md`

Fill in:
- **Discussion Summary:** System-level discussion summary
- **Resolved Questions:** Questions answered during orchestrator discussion
- **Deferred Questions:** Things to resolve during planning
- **Gray Areas Remaining:** Open areas

**Write DECISIONS.md:**
Use template at `~/.claude/specdacular/templates/features/DECISIONS.md`
Record any decisions made during the system-level discussion.

**Write CHANGELOG.md:**
Use template at `~/.claude/specdacular/templates/features/CHANGELOG.md`
Initialize empty.

**Write STATE.md:**
Use template at `~/.claude/specdacular/templates/features/STATE.md`

Initialize with:
- Stage: discussion
- Initial discussion complete: yes
- Add "Sub-Project Features" section:

```markdown
## Sub-Project Features

| Project | Path | Feature Path | Status |
|---------|------|--------------|--------|
| {project-name} | {project-path} | {project-path}/.specd/features/{feature-name}/ | initialized |
```

**Write config.json:**
```json
{
  "feature_name": "{name}",
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
Create feature folders in each involved sub-project with translated requirements.

For each project in the routing data:

**Create feature directory:**
```bash
mkdir -p {project-path}/.specd/features/{feature-name}
```

**Write FEATURE.md (project-specific):**
Use template at `~/.claude/specdacular/templates/features/FEATURE.md`

Translate the system-level requirements into project-specific requirements:
- **What This Is:** What this project specifically does for the feature (not the system-level description)
- **Must Create:** Specific files/components this project needs to create
- **Must Integrate With:** Existing code in THIS project + cross-project interfaces it must implement
- **Constraints:** Project-specific constraints + any contract requirements from the orchestrator
- **Success Criteria:** Project-specific observable behaviors
- **Out of Scope:** What this project does NOT handle (other projects' responsibilities)
- **Initial Context:**
  - User Need: project-specific slice of the system need
  - Integration Points: what this project exposes or consumes from other projects

**IMPORTANT (DEC-001):** The sub-project FEATURE.md must read like a normal, self-contained feature requirement. No references to "orchestrator," "multi-project," or other projects by name. Cross-project requirements should be phrased as external interface requirements:
- BAD: "API project must expose /auth/login for the UI project"
- GOOD: "Must expose /auth/login endpoint that returns JWT tokens"

**Write CONTEXT.md:**
Use template at `~/.claude/specdacular/templates/features/CONTEXT.md`
- Discussion Summary: "Requirements defined as part of system-level {feature-name} feature planning."
- Resolved Questions: Any project-specific questions resolved during orchestrator discussion

**Write DECISIONS.md:**
Use template at `~/.claude/specdacular/templates/features/DECISIONS.md`
Include any project-specific decisions from orchestrator discussion.

**Write CHANGELOG.md:**
Use template at `~/.claude/specdacular/templates/features/CHANGELOG.md`
Initialize empty.

**Write STATE.md:**
Use template at `~/.claude/specdacular/templates/features/STATE.md`
Initialize with stage: discussion, initial discussion complete: yes.

**Write config.json:**
```json
{
  "feature_name": "{name}",
  "created": "{date}",
  "stage": "discussion",
  "discussion_sessions": 0,
  "decisions_count": {N}
}
```

Note: `discussion_sessions: 0` because no per-project discussion happened — requirements came from orchestrator delegation.

After all projects processed, verify:
```bash
for project in {project-paths}; do
  echo "Checking $project..."
  ls "$project/.specd/features/{feature-name}/"
done
```

Continue to orchestrator_feature_commit.
</step>

<step name="orchestrator_feature_commit">
Commit orchestrator and all sub-project feature files.

```bash
# Add orchestrator feature files
git add .specd/features/{feature-name}/

# Add per-project feature files
{For each project:}
git add {project-path}/.specd/features/{feature-name}/

git commit -m "docs({feature-name}): initialize multi-project feature

Orchestrator:
- FEATURE.md: System-level requirements
- CONTEXT.md: Cross-project discussion
- DECISIONS.md: {N} decisions
- STATE.md: Sub-project tracking

Projects:
{For each project:}
- {project-name}: Project-specific requirements

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Continue to orchestrator_feature_completion.
</step>

<step name="orchestrator_feature_completion">
Present multi-project feature creation summary.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MULTI-PROJECT FEATURE INITIALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}

## Orchestrator (.specd/features/{feature-name}/)

- FEATURE.md — System-level requirements
- CONTEXT.md — Cross-project discussion
- DECISIONS.md — {N} decisions recorded
- STATE.md — Sub-project tracking

## Projects

{For each project:}
**{project-name}** ({project-path}/.specd/features/{feature-name}/)
- FEATURE.md — {brief responsibility summary}
- Responsibility: {one-liner}

## Summary

{2-3 sentence system-level summary}
```

Continue to orchestrator_continuation_offer.
</step>

<step name="orchestrator_continuation_offer">
Offer to continue or stop (same pattern as existing continuation_offer).

**If gray areas remain in orchestrator CONTEXT.md:**

Use AskUserQuestion:
- header: "Continue?"
- question: "Want to keep discussing the open areas, or come back later?"
- options:
  - "Keep discussing" — Dive into the gray areas now
  - "Stop for now" — Come back with /specd:feature:next {feature-name}

**If Keep discussing:**
Execute the discuss-feature workflow logic:
@~/.claude/specdacular/workflows/discuss-feature.md

After discussion completes, return to this step.

**If no gray areas remain:**

Use AskUserQuestion:
- header: "Continue?"
- question: "Discussion looks solid. Want to keep going or come back later?"
- options:
  - "Continue" — Move to the next step (research or planning)
  - "Stop for now" — Come back with /specd:feature:next {feature-name}

**If Continue:**
Hand off to next-feature workflow:
@~/.claude/specdacular/workflows/next-feature.md

Start from the read_state step with the current feature.

**If Stop for now:**
```
───────────────────────────────────────────────────────

Progress saved. Pick up where you left off anytime:

/specd:feature:next {feature-name}
```

End workflow.
</step>

<step name="first_discussion">
Start the conversation.

**Opening:**
```
Let's talk about what you're building.

What's the {feature-name} feature? Give me the quick version — what problem does it solve and roughly how?
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

**Conversational probes:**
- "Walk me through how someone would use this..."
- "What existing code does this touch?"
- "What's the simplest version that would be useful?"
- "Is there anything you've already decided on how to build this?"
- "What definitely should NOT be part of this?"

**Check understanding:**
After 4-6 exchanges, summarize:
```
So if I understand correctly:
- This feature [does X]
- It needs to create [files/components]
- It integrates with [existing code]
- Key constraint: [constraint]

Does that capture it, or should we dig into anything more?
```

**When to move on:**
- User confirms understanding is correct
- You have enough for initial FEATURE.md
- Further details can be discussed later with /specd:feature:discuss

Continue to write_feature.
</step>

<step name="write_feature">
Create feature directory and FEATURE.md.

**Create feature directory:**
```bash
mkdir -p .specd/features/{feature-name}
```

**Write FEATURE.md:**
Use template at `~/.claude/specdacular/templates/features/FEATURE.md`

Fill in based on conversation:
- **What This Is:** 1-2 sentences from discussion
- **Must Create:** Files/components identified
- **Must Integrate With:** Existing code mentioned
- **Constraints:** Any constraints identified
- **Success Criteria:** Observable behaviors
- **Out of Scope:** Explicit exclusions
- **Initial Context:** Notes from discussion

Continue to write_context.
</step>

<step name="write_context">
Write CONTEXT.md with initial discussion state.

**Write CONTEXT.md:**
Use template at `~/.claude/specdacular/templates/features/CONTEXT.md`

Fill in:
- **Discussion Summary:** Brief summary of what was discussed
- **Resolved Questions:** Questions that were answered in this session
- **Deferred Questions:** Things that came up but weren't resolved
- **Gray Areas Remaining:** Areas that need more discussion

Continue to initialize_decisions.
</step>

<step name="initialize_decisions">
Initialize DECISIONS.md with any decisions made.

**Write DECISIONS.md:**
Use template at `~/.claude/specdacular/templates/features/DECISIONS.md`

If any decisions were made during discussion (technology choices, scope decisions, approach decisions), record them:

```markdown
### DEC-001: {Decision}
**Date:** {today}
**Status:** Active
**Context:** Identified during initial feature discussion
**Decision:** {What was decided}
**Rationale:**
- {Why}
**Implications:**
- {What this means}
```

If no decisions yet, leave with just the template structure.

Continue to initialize_changelog.
</step>

<step name="initialize_changelog">
Initialize CHANGELOG.md (empty, ready for implementation).

**Write CHANGELOG.md:**
Use template at `~/.claude/specdacular/templates/features/CHANGELOG.md`

Replace `{feature-name}` with actual feature name. Leave the rest as template structure — entries will be added during plan execution.

Continue to initialize_state.
</step>

<step name="initialize_state">
Create STATE.md and config.json.

**Write STATE.md:**
Use template at `~/.claude/specdacular/templates/features/STATE.md`

Initialize with:
- Stage: discussion
- Initial discussion complete: yes
- Gray areas identified: based on deferred questions

**Write config.json:**
```json
{
  "feature_name": "{name}",
  "created": "{date}",
  "stage": "discussion",
  "discussion_sessions": 1,
  "decisions_count": {N}
}
```

Continue to commit.
</step>

<step name="commit">
Commit the feature initialization.

**First, check auto-commit setting. Run this command:**

```bash
cat .specd/config.json 2>/dev/null || echo '{"auto_commit_docs": true}'
```

Read the output. If `auto_commit_docs` is `false`, do NOT run the git commands below. Instead print:

```
Auto-commit disabled for docs — changes not committed.
Modified files: .specd/features/{feature-name}/
```

Then skip ahead to completion.

**Only if `auto_commit_docs` is `true` or not set (default), run:**

```bash
git add .specd/features/{feature-name}/
git commit -m "docs({feature-name}): initialize feature

Creates feature structure with:
- FEATURE.md: Technical requirements
- CONTEXT.md: Discussion context
- DECISIONS.md: Decision log ({N} decisions)
- CHANGELOG.md: Implementation log (empty)
- STATE.md: Progress tracking
- config.json: Configuration"
```

Continue to completion.
</step>

<step name="completion">
Present what was created and offer to continue.

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FEATURE INITIALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}

## Created

- `.specd/features/{feature-name}/FEATURE.md` — Technical requirements
- `.specd/features/{feature-name}/CONTEXT.md` — Discussion context
- `.specd/features/{feature-name}/DECISIONS.md` — {N} decisions recorded
- `.specd/features/{feature-name}/CHANGELOG.md` — Implementation log (empty)
- `.specd/features/{feature-name}/STATE.md` — Progress tracking
- `.specd/features/{feature-name}/config.json` — Configuration

## Summary

{2-3 sentence summary of what this feature does}

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
  - "Stop for now" — Come back with /specd:feature:next {feature-name}

**If Keep discussing:**
Execute the discuss-feature workflow logic:
@~/.claude/specdacular/workflows/discuss-feature.md

After discussion completes (commit done), return to this step (continuation_offer) — re-read CONTEXT.md to check if gray areas remain, and offer again.

**If no gray areas remain:**

Use AskUserQuestion:
- header: "Continue?"
- question: "Discussion looks solid. Want to keep going or come back later?"
- options:
  - "Continue" — Move to the next step (research or planning)
  - "Stop for now" — Come back with /specd:feature:next {feature-name}

**If Continue:**
Hand off to the next-feature workflow logic to determine next action:
@~/.claude/specdacular/workflows/next-feature.md

Start from the read_state step with the current feature.

**If Stop for now:**
```
───────────────────────────────────────────────────────

Progress saved. Pick up where you left off anytime:

/specd:feature:next {feature-name}
```

End workflow.
</step>

</process>

<success_criteria>

## Single-Project Mode
- Feature folder created at `.specd/features/{name}/`
- FEATURE.md has specific technical requirements (files to create, integrations)
- CONTEXT.md captures the discussion state
- DECISIONS.md initialized (with any decisions made)
- CHANGELOG.md initialized (empty, ready for implementation)
- STATE.md tracks current stage
- config.json created
- Committed to git
- User presented with clear next options

## Multi-Project Mode (Orchestrator)
- Orchestrator mode detected from `.specd/config.json` type field
- System-level discussion focuses on cross-project behavior
- Project routing suggests involved projects from discussion + CONTRACTS.md
- User confirms or adjusts project selection
- Orchestrator feature folder created with system-level FEATURE.md, CONTEXT.md, DECISIONS.md, STATE.md
- Orchestrator STATE.md includes Sub-Project Features table
- Orchestrator config.json includes `orchestrator: true` and `projects` array
- Each sub-project gets feature folder with project-specific requirements
- Sub-project FEATURE.md reads as normal self-contained feature (DEC-001)
- All files committed (orchestrator + all sub-projects)
- Multi-project summary presented
- User presented with clear next options

</success_criteria>
