<purpose>
Initialize a new feature folder and start the first discussion. Creates structure, asks initial questions, and writes technical requirements.

**Core flow:**
```
new-feature → (discuss ↔ research)* → plan-feature
```

The user controls the rhythm after initialization. This command is just the entry point.

**Output:** `.specd/features/{feature-name}/` folder with FEATURE.md, CONTEXT.md, DECISIONS.md, STATE.md, config.json
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
  - "Resume" — Continue with existing feature (suggest /specd:discuss-feature)
  - "Reset" — Delete and start fresh
  - "Different name" — Use a different name

**If new feature:**
Continue to codebase_context.
</step>

<step name="codebase_context">
Look for codebase documentation.

**Check for existing config:**
```bash
cat .specd/config.json 2>/dev/null
```

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
- Further details can be discussed later with /specd:discuss-feature

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

```bash
git add .specd/features/{feature-name}/
git commit -m "docs({feature-name}): initialize feature

Creates feature structure with:
- FEATURE.md: Technical requirements
- CONTEXT.md: Discussion context
- DECISIONS.md: Decision log ({N} decisions)
- STATE.md: Progress tracking
- config.json: Configuration"
```

Continue to completion.
</step>

<step name="completion">
Present what was created and next options.

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
- `.specd/features/{feature-name}/STATE.md` — Progress tracking
- `.specd/features/{feature-name}/config.json` — Configuration

## Summary

{2-3 sentence summary of what this feature does}

{If gray areas remain:}
**Open areas to discuss:**
- {Gray area 1}
- {Gray area 2}

───────────────────────────────────────────────────────

## What's Next

You control the rhythm. Options:

**/specd:discuss-feature {feature-name}** — Dive deeper into specific areas
  {Suggested if gray areas remain}

**/specd:research-feature {feature-name}** — Research implementation approach
  {Suggested if technology choices are unclear}

**/specd:plan-feature {feature-name}** — Create executable task plans
  {Only when discussion + research are sufficient}

Or just **keep talking** — this conversation continues naturally.
```

End workflow.
</step>

</process>

<success_criteria>
- Feature folder created at `.specd/features/{name}/`
- FEATURE.md has specific technical requirements (files to create, integrations)
- CONTEXT.md captures the discussion state
- DECISIONS.md initialized (with any decisions made)
- STATE.md tracks current stage
- config.json created
- Committed to git
- User presented with clear next options
</success_criteria>
