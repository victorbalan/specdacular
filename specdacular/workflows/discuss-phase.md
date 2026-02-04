<purpose>
Discuss a specific phase before executing it. Enables just-in-time clarification focused on the phase's scope.

**Key behaviors:**
- Phase-specific gray areas based on phase type (Types, API, UI, Integration, etc.)
- Builds on feature-level context but focuses narrowly
- Output lives alongside phase plans for easy reference during execution

**Output:** `plans/phase-{NN}/CONTEXT.md` with resolved questions, updated DECISIONS.md
</purpose>

<philosophy>

## Just-in-Time Clarification

Don't try to clarify everything upfront. Discuss each phase right before executing it, when the context is freshest and questions are most concrete.

## Phase-Type Specific

Different phase types have different gray areas. A Types phase has different concerns than a UI phase. Tailor questions to what's actually being built.

## Focused Context

Unlike feature-level discussion which covers everything, phase discussion is narrow. Only discuss what's relevant to THIS phase's deliverables.

</philosophy>

<phase_type_gray_areas>

## Types/Schema Phase
- Data model completeness — Are all fields defined?
- Naming conventions — Consistent with codebase?
- Relationships — How do types relate to each other?
- Validation rules — What constraints apply?
- Nullable fields — What can be undefined/null?

## API/Data Phase
- Endpoint design — REST conventions, URL structure
- Error responses — Format, status codes, messages
- Pagination approach — Cursor vs offset, page size
- Auth requirements — What auth is needed?
- Rate limiting — Any throttling needed?

## Business Logic Phase
- Edge cases — What unusual inputs can occur?
- Validation rules — What makes data valid/invalid?
- Error handling — How to handle failures?
- Transaction boundaries — What operations are atomic?

## UI/Components Phase
- Component hierarchy — How do components nest?
- State management — Local vs global state
- Loading states — What to show while loading?
- Error states — How to display errors?
- Accessibility — ARIA, keyboard navigation

## Integration Phase
- Wiring points — Where does this connect?
- Initialization order — What depends on what?
- Dependency injection — How are deps provided?
- Entry points — Where is this invoked from?

</phase_type_gray_areas>

<process>

<step name="validate">
Validate feature exists and phase exists.

**Parse arguments:**
Split $ARGUMENTS into feature-name and phase-number.
- First word: feature-name
- Second word: phase-number (numeric, e.g., "1", "2")

```bash
# Check feature exists
[ -d ".specd/features/$FEATURE_NAME" ] || { echo "Feature not found"; exit 1; }

# Check ROADMAP.md exists
[ -f ".specd/features/$FEATURE_NAME/ROADMAP.md" ] || { echo "No roadmap"; exit 1; }

# Check phase directory exists
PHASE_DIR=".specd/features/$FEATURE_NAME/plans/phase-$(printf '%02d' $PHASE_NUMBER)"
[ -d "$PHASE_DIR" ] || { echo "Phase not found"; exit 1; }
```

**If feature not found:**
```
Feature '{name}' not found.

Run /specd:new-feature {name} to create it.
```

**If phase not found:**
```
Phase {N} not found for feature '{name}'.

Available phases in ROADMAP.md:
{list phases from ROADMAP.md}
```

Continue to load_context.
</step>

<step name="load_context">
Load all context needed for phase discussion.

**Read feature context:**
- `FEATURE.md` — Overall feature requirements
- `CONTEXT.md` — Feature-level resolutions (already discussed)
- `DECISIONS.md` — All decisions so far
- `ROADMAP.md` — Phase overview, understand this phase's role

**Read phase context:**
- All plan files in `plans/phase-{NN}/`
- Existing `plans/phase-{NN}/CONTEXT.md` if it exists (prior phase discussion)
- Existing `plans/phase-{NN}/RESEARCH.md` if it exists

**Extract from ROADMAP.md:**
- Phase title and goal
- Phase type (Types, API, UI, Integration, Business Logic, etc.)
- Files to be created/modified
- Dependencies on other phases

**Extract from plan files:**
- Specific tasks
- Files and changes
- Verification criteria

Continue to show_phase_state.
</step>

<step name="show_phase_state">
Present phase context to user.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DISCUSS PHASE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}
**Phase:** {N} — {Phase Title}
**Type:** {Phase Type}

## Phase Goal

{Goal from ROADMAP.md}

## Deliverables

Files to create:
- {file 1}
- {file 2}

Files to modify:
- {file 3}

## Plans in This Phase

- {plan 1 title}
- {plan 2 title}

{If phase CONTEXT.md exists:}
## Previously Discussed

{Summary from existing phase CONTEXT.md}

{If feature CONTEXT.md has relevant resolutions:}
## Relevant Feature Decisions

{Decisions from feature-level that affect this phase}
```

Continue to identify_gray_areas.
</step>

<step name="identify_gray_areas">
Identify gray areas based on phase type.

**Determine phase type** from ROADMAP.md or infer from:
- "types", "schema", "models" → Types/Schema
- "api", "endpoint", "route" → API/Data
- "component", "ui", "page" → UI/Components
- "logic", "service", "util" → Business Logic
- "integration", "wiring", "setup" → Integration

**Select gray areas** from phase_type_gray_areas section based on type.

**Filter out already-resolved:**
- Check feature CONTEXT.md for resolutions that apply
- Check phase CONTEXT.md if it exists
- Remove any gray areas that are already clear

**Present:**
```
## Areas to Discuss

Based on this {Phase Type} phase, these areas could use clarity:

1. **{Gray area}** — {Why it matters for this phase}
2. **{Gray area}** — {Why it matters for this phase}
3. **{Gray area}** — {Why it matters for this phase}
4. **{Gray area}** — {Why it matters for this phase}

Which would you like to discuss? (Or describe something else)
```

Use AskUserQuestion:
- header: "Phase Discussion"
- question: "Which area would you like to discuss for this phase?"
- options: List identified gray areas (up to 4)
- Add "Something else" as final option

Continue to probe_area.
</step>

<step name="probe_area">
Probe selected gray area until clear.

**For each selected area, ask up to 4 questions:**

**Question 1:** Open-ended
"For this phase's {area}, how do you see this working?"

**Question 2:** Clarify specifics
"When you say X, do you mean Y or Z?"

**Question 3:** Edge cases
"What should happen when {edge case specific to this phase}?"

**Question 4:** Confirm
"So for phase {N}, the approach would be {summary}. Correct?"

**After 4 questions (or earlier if clear):**
```
Let me capture what we've resolved for phase {N}:

**{Area}:**
- {Key point 1}
- {Key point 2}
- {Any code pattern implied}

Does that capture it?
```

**If user confirms:** Continue to record
**If user corrects:** Adjust and confirm again
**If user wants another area:** Return to identify_gray_areas

Continue to record.
</step>

<step name="record">
Record phase discussion to CONTEXT.md and DECISIONS.md.

**Create/Update plans/phase-{NN}/CONTEXT.md:**

```markdown
# Phase {N} Context: {Phase Title}

**Feature:** {feature-name}
**Phase Type:** {type}
**Discussed:** {today}

## Phase Overview

{Brief description of what this phase accomplishes}

## Resolved Questions

### {Question title}

**Question:** {What was unclear}
**Resolution:** {The answer/decision}
**Details:**
- {Detail 1}
- {Detail 2}

{If code pattern implied:}
**Code Pattern:**
```{language}
{code example}
```

**Related Decisions:** DEC-XXX

---

{Repeat for each resolved question}

## Gray Areas Remaining

{Any areas still unclear, or "None" if all resolved}

## Implications for Plans

{How these resolutions affect the plan execution}
```

**Update DECISIONS.md:**

For any new decisions made during phase discussion:

```markdown
### DEC-{NNN}: {Title}

**Date:** {today}
**Status:** Active
**Phase:** {N} — {Phase Title}
**Context:** {What situation required this decision — from phase discussion}
**Decision:** {What was decided}
**Rationale:**
- {Why this choice}
**Implications:**
- {What this means for phase implementation}
```

Continue to commit.
</step>

<step name="commit">
Commit the phase discussion.

```bash
# Add phase CONTEXT.md
git add ".specd/features/{feature}/plans/phase-{NN}/CONTEXT.md"

# Add updated DECISIONS.md if modified
git add ".specd/features/{feature}/DECISIONS.md"

git commit -m "docs({feature}): discuss phase {N} - {phase title}

Resolved:
- {Area 1}
- {Area 2}

New decisions: {count}"
```

Continue to completion.
</step>

<step name="completion">
Present summary and next options.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE DISCUSSION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}
**Phase:** {N} — {Phase Title}

## Resolved

- **{Area 1}:** {Brief resolution}
- **{Area 2}:** {Brief resolution}

## Files Created/Updated

- `plans/phase-{NN}/CONTEXT.md`
- `DECISIONS.md` ({count} new decisions)

───────────────────────────────────────────────────────

## What's Next

**/specd:research-phase {feature} {N}** — Research implementation patterns for this phase

**/specd:execute-plan {feature}** — Execute this phase (will load phase context)

**/specd:discuss-phase {feature} {N}** — Continue discussing this phase
```

End workflow.
</step>

</process>

<success_criteria>
- Feature and phase validated
- Phase context loaded (plans, goals, type)
- Phase-type-specific gray areas identified
- User-selected areas probed (4 questions max)
- Phase CONTEXT.md created/updated
- DECISIONS.md updated with phase-specific decisions
- Committed to git
- User knows next steps (research-phase or execute-plan)
</success_criteria>
