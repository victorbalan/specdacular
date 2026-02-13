<purpose>
Prepare a phase for execution by discussing gray areas and optionally researching implementation patterns.

**Key behaviors:**
- Discussion always happens — phase-specific gray areas based on phase type
- Research offered as optional at the end
- Builds on feature-level context but focuses narrowly on this phase
- Single command replaces the discuss-then-research two-step

**Output:** `plans/phase-{NN}/CONTEXT.md` with resolved questions, updated DECISIONS.md, optionally `plans/phase-{NN}/RESEARCH.md`
</purpose>

<philosophy>

## Just-in-Time Clarification

Don't try to clarify everything upfront. Discuss each phase right before executing it, when the context is freshest and questions are most concrete.

## Phase-Type Specific

Different phase types have different gray areas. A Types phase has different concerns than a UI phase. Tailor questions to what's actually being built.

## Focused Context

Unlike feature-level discussion which covers everything, phase discussion is narrow. Only discuss what's relevant to THIS phase's deliverables.

## Natural Flow

Discussion often reveals what needs researching. Instead of two separate commands, offer research as a natural next step after discussion.

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

Run /specd:feature:new {name} to create it.
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
Load all context needed for phase preparation.

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
 PREPARE PHASE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
- "types", "schema", "models" -> Types/Schema
- "api", "endpoint", "route" -> API/Data
- "component", "ui", "page" -> UI/Components
- "logic", "service", "util" -> Business Logic
- "integration", "wiring", "setup" -> Integration

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

**If user confirms:** Continue to record_discussion
**If user corrects:** Adjust and confirm again
**If user wants another area:** Return to identify_gray_areas

Continue to record_discussion.
</step>

<step name="record_discussion">
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

Continue to offer_research.
</step>

<step name="offer_research">
Offer research as an optional next step.

```
───────────────────────────────────────────────────────

Discussion captured. Would you like to research implementation patterns for this phase?

Research spawns 3 parallel agents to investigate:
1. **Codebase Integration** — How phase files fit with existing code
2. **{Phase Type} Patterns** — Standard approaches
3. **{Phase Type} Pitfalls** — What goes wrong

This takes a few minutes but produces targeted guidance.
```

Use AskUserQuestion:
- header: "Research?"
- question: "Research implementation patterns for this phase?"
- options:
  - "Yes, research" — Continue to spawn_agents
  - "Skip research" — Continue to commit

**If skip:** Continue to commit.
**If yes:** Continue to spawn_agents.
</step>

<step name="spawn_agents">
Spawn three parallel research agents (same as research-phase workflow).

### Agent 1: Codebase Integration (using Explore agent)

```
Task(
  prompt="Research how phase {N} of {feature-name} should integrate with the existing codebase.

<phase_context>
Phase: {N} — {Phase Title}
Type: {Phase Type}
Goal: {Phase goal from ROADMAP.md}

Files to create:
{list of files}

Files to modify:
{list of files}
</phase_context>

<locked_decisions>
{Relevant decisions from DECISIONS.md}
</locked_decisions>

<research_questions>
1. What existing files/modules will this phase's files need to import from?
2. What patterns do similar {phase type} files in this codebase follow?
3. Where exactly should new files be created?
4. What types/interfaces already exist that should be reused?
5. What utility functions or hooks can be leveraged?
</research_questions>

<output_format>
Return findings as structured markdown:

## Codebase Integration for Phase {N}

### Import Dependencies
- `path/to/file` — what it provides, why needed

### Patterns to Follow
- Pattern name: description, example file reference

### File Locations
- Exactly where each new file should go

### Reusable Code
- Types: list with paths
- Utilities: list with paths

### Integration Points
- Where this phase's code connects to existing code
</output_format>
",
  subagent_type="Explore",
  description="Phase codebase integration"
)
```

### Agent 2: Phase-Type Patterns Research

```
Task(
  prompt="First, read ~/.claude/specdacular/agents/feature-researcher.md for your role.

<research_type>
{Phase Type} patterns research for phase {N} of {feature-name}.
</research_type>

<phase_context>
Phase: {N} — {Phase Title}
Type: {Phase Type}
Goal: {Phase goal}

Files to create:
{list of files}
</phase_context>

<codebase_stack>
{From .specd/codebase/ if available}
</codebase_stack>

<research_questions>
1. What's the standard approach for {phase type} in this stack?
2. What libraries are commonly used for {phase type}?
3. What code patterns work well for {phase type}?
4. What should NOT be hand-rolled?
</research_questions>

<tool_strategy>
1. Context7 first for any library questions
2. Official docs via WebFetch for gaps
3. WebSearch for patterns (include current year)
4. Verify all findings
</tool_strategy>

<output_format>
Return findings as structured markdown with confidence levels.

## {Phase Type} Patterns

### Standard Approach
{Recommended approach with rationale}

### Libraries
| Library | Version | Purpose | Confidence |

### Code Patterns
{Code examples with sources}

### Don't Hand-Roll
| Problem | Use Instead | Why |
</output_format>
",
  subagent_type="general-purpose",
  model="sonnet",
  description="Phase type patterns"
)
```

### Agent 3: Phase-Type Pitfalls Research

```
Task(
  prompt="First, read ~/.claude/specdacular/agents/feature-researcher.md for your role.

<research_type>
Pitfalls research for {Phase Type} work in phase {N} of {feature-name}.
</research_type>

<phase_context>
Phase: {N} — {Phase Title}
Type: {Phase Type}
Goal: {Phase goal}

Files to create:
{list of files}
</phase_context>

<research_questions>
1. What do developers commonly get wrong with {phase type}?
2. What are the performance pitfalls for {phase type}?
3. What security issues should be avoided?
4. What integration mistakes happen with {phase type}?
</research_questions>

<tool_strategy>
1. WebSearch for common mistakes (include current year)
2. Look for post-mortems, issue discussions
3. Check official docs for warnings/caveats
</tool_strategy>

<output_format>
Return pitfalls as structured markdown:

## {Phase Type} Pitfalls

### Critical (causes failures/rewrites)
- Pitfall: description
  - Why it happens
  - Prevention
  - Detection

### Moderate (causes bugs/debt)
- Pitfall: description
  - Prevention

### Minor (causes friction)
- Pitfall: description
  - Prevention
</output_format>
",
  subagent_type="general-purpose",
  model="sonnet",
  description="Phase type pitfalls"
)
```

Wait for all agents to complete.

Continue to synthesize.
</step>

<step name="synthesize">
Combine agent results into single RESEARCH.md.

**Create plans/phase-{NN}/RESEARCH.md:**

```markdown
# Phase {N} Research: {Phase Title}

**Feature:** {feature-name}
**Phase Type:** {Phase Type}
**Researched:** {today}

## Summary

{2-3 paragraphs synthesizing all findings for this phase}

**Key recommendation:** {One-liner actionable guidance}

---

## Codebase Integration

{From Agent 1 — Explore findings}

### Import From
| Module | Provides | Path |
|--------|----------|------|
| ... | ... | ... |

### Patterns to Follow
{Patterns with file references}

### File Locations
```
{exact paths for new files}
```

### Reusable Code
- **Types:** {list with @paths}
- **Utilities:** {list with @paths}

### Integration Points
{Where this phase connects to existing code}

---

## {Phase Type} Patterns

{From Agent 2 — Pattern findings}

### Standard Approach
{Recommended approach with rationale}

### Libraries
| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| ... | ... | ... | HIGH/MED |

### Code Patterns
```typescript
// Pattern name - source: {Context7/docs URL}
{code example}
```

### Don't Hand-Roll
| Problem | Use Instead | Why |
|---------|-------------|-----|
| ... | ... | ... |

---

## Pitfalls

{From Agent 3 — Pitfalls findings}

### Critical
{List with prevention strategies}

### Moderate
{List with prevention strategies}

### Phase-Specific Warnings
| When Implementing | Watch Out For | Prevention |
|-------------------|---------------|------------|
| ... | ... | ... |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase integration | {level} | {reason} |
| {Phase type} patterns | {level} | {reason} |
| Pitfalls | {level} | {reason} |

## Open Questions

{Anything that couldn't be resolved}

## Sources

### Codebase (from Explore)
- {file references used}

### External (verified)
- {Context7 queries}
- {Official docs URLs}
```

Continue to record_research_decisions.
</step>

<step name="record_research_decisions">
Record any technology choices from research.

**Identify decisions from synthesis:**
- Library choices
- Pattern choices
- Approach choices

**For each new decision, add to DECISIONS.md:**

```markdown
### DEC-{NNN}: {Title}

**Date:** {today}
**Status:** Active
**Phase:** {N} — {Phase Title}
**Context:** Identified during phase research
**Decision:** {What was decided}
**Rationale:** {From research findings}
**Implications:** {What this means for implementation}
**References:** {Sources}
```

Continue to commit.
</step>

<step name="commit">
Commit the phase preparation.

@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/features/{feature}/plans/phase-{NN}/CONTEXT.md .specd/features/{feature}/plans/phase-{NN}/RESEARCH.md .specd/features/{feature}/DECISIONS.md` (skip RESEARCH.md if not created)
- **$MESSAGE:** `docs({feature}): prepare phase {N} - {phase title}` with resolved areas and decision count
- **$LABEL:** `phase preparation`

Continue to completion.
</step>

<step name="completion">
Present summary and next options.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE PREPARATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}
**Phase:** {N} — {Phase Title}

## Resolved

- **{Area 1}:** {Brief resolution}
- **{Area 2}:** {Brief resolution}

{If research:}
## Research

- Codebase integration patterns identified
- {Phase Type} patterns documented
- Pitfalls catalogued with prevention strategies

## Files Created/Updated

- `plans/phase-{NN}/CONTEXT.md`
{If research:}- `plans/phase-{NN}/RESEARCH.md`
- `DECISIONS.md` ({count} new decisions)

───────────────────────────────────────────────────────

## What's Next

{If no PLAN.md files exist for this phase:}
**/specd:phase:plan {feature} {N}** — Create detailed plans for this phase

{If PLAN.md files already exist:}
**/specd:phase:execute {feature}** — Execute this phase

<sub>/clear first — fresh context window</sub>
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
- Research completed (if user opted in)
- Committed to git
- User knows next steps (phase:plan or phase:execute)
</success_criteria>
