<purpose>
Research implementation patterns for a specific phase before executing it.

Uses three parallel research tracks tailored to the phase:
1. **Codebase Integration** - How phase deliverables integrate with existing code
2. **Phase-Type Patterns** - Patterns specific to this phase type (API, UI, etc.)
3. **Phase-Type Pitfalls** - What goes wrong with this type of work

Output: `plans/phase-{NN}/RESEARCH.md` that execute-plan consumes.
</purpose>

<philosophy>

## Phase-Focused Research

Don't research the whole feature again. Focus narrowly on what THIS phase creates/modifies. If phase 1 creates types, research type patterns. If phase 2 creates APIs, research API patterns.

## Builds on Feature Research

If feature-level RESEARCH.md exists, don't duplicate it. Reference it and add phase-specific details.

## Codebase First

The most valuable research is understanding how this phase's files integrate with existing code. External patterns matter, but integration patterns matter more.

## Decisions Get Recorded

Any choice made during research goes into DECISIONS.md with phase context.

</philosophy>

<phase_type_research>

## Types/Schema Phase Research
- Existing type patterns in codebase
- TypeScript/schema best practices
- Type relationships and composition
- Validation library patterns (zod, etc.)

## API/Data Phase Research
- Existing API patterns in codebase
- REST/GraphQL conventions
- Error handling patterns
- Auth integration patterns
- Pagination patterns

## Business Logic Phase Research
- Existing service patterns
- Error handling approaches
- Transaction patterns
- Testing patterns for logic

## UI/Components Phase Research
- Existing component patterns
- State management approach
- Form handling patterns
- Loading/error state patterns
- Accessibility patterns

## Integration Phase Research
- Existing integration patterns
- Provider/context patterns
- Initialization patterns
- Entry point conventions

</phase_type_research>

<process>

<step name="validate">
Validate feature exists and phase exists.

**Parse arguments:**
Split $ARGUMENTS into feature-name and phase-number.

```bash
# Check feature exists
[ -d ".specd/features/$FEATURE_NAME" ] || { echo "Feature not found"; exit 1; }

# Check ROADMAP.md exists
[ -f ".specd/features/$FEATURE_NAME/ROADMAP.md" ] || { echo "No roadmap"; exit 1; }

# Check phase directory exists
PHASE_DIR=".specd/features/$FEATURE_NAME/plans/phase-$(printf '%02d' $PHASE_NUMBER)"
[ -d "$PHASE_DIR" ] || { echo "Phase not found"; exit 1; }

# Check if RESEARCH.md already exists
[ -f "$PHASE_DIR/RESEARCH.md" ] && echo "existing"
```

**If RESEARCH.md exists:**
Use AskUserQuestion:
- header: "Research Exists"
- question: "Phase research already exists. What would you like to do?"
- options:
  - "Update research" — Re-run research, incorporate new findings
  - "View existing" — Show current RESEARCH.md
  - "Continue anyway" — Skip research, use existing

Continue to load_context.
</step>

<step name="load_context">
Load all context needed for phase research.

**Read feature context:**
- `FEATURE.md` — Overall feature requirements
- `DECISIONS.md` — All decisions so far
- `ROADMAP.md` — Phase overview
- `RESEARCH.md` — Feature-level research if exists

**Read phase context:**
- All plan files in `plans/phase-{NN}/`
- `plans/phase-{NN}/CONTEXT.md` if exists (from discuss-phase)
- Previous phases' RESEARCH.md files for continuity

**Read codebase context:**
- `PATTERNS.md` — Code patterns to follow
- `STRUCTURE.md` — Where files go
- `MAP.md` — System overview

**Extract from ROADMAP.md:**
- Phase title and goal
- Phase type (Types, API, UI, Integration, Business Logic)
- Files to be created/modified

**Determine phase type** from ROADMAP.md or infer from files:
- `.ts` types files → Types/Schema
- `route.ts`, `api/` → API/Data
- `.tsx` components → UI/Components
- `service`, `util` → Business Logic
- `provider`, `setup` → Integration

Continue to present_research_plan.
</step>

<step name="present_research_plan">
Present research plan to user.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RESEARCH PHASE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}
**Phase:** {N} — {Phase Title}
**Type:** {Phase Type}

## Phase Deliverables

Files to create:
- {file 1}
- {file 2}

Files to modify:
- {file 3}

## Research Dimensions

I'll research these areas for this {Phase Type} phase:

1. **Codebase Integration** — How these files fit with existing code
   - Existing patterns for {phase type}
   - Files to import from
   - Integration points

2. **{Phase Type} Patterns** — Standard approaches
   - Best practices for {phase type}
   - Library patterns
   - Code examples

3. **{Phase Type} Pitfalls** — What goes wrong
   - Common mistakes
   - Performance issues
   - Integration gotchas

Estimated: 3 parallel research agents

[Start research] / [Adjust scope]
```

Use AskUserQuestion:
- header: "Research"
- question: "Start phase research?"
- options:
  - "Start research" — Spawn agents
  - "Adjust scope" — Modify research dimensions

Continue to spawn_agents.
</step>

<step name="spawn_agents">
Spawn three parallel research agents.

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

Continue to record_decisions.
</step>

<step name="record_decisions">
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
Commit the phase research.

```bash
git add ".specd/features/{feature}/plans/phase-{NN}/RESEARCH.md"
git add ".specd/features/{feature}/DECISIONS.md"

git commit -m "docs({feature}): research phase {N} - {phase title}

Research dimensions:
- Codebase integration
- {Phase type} patterns
- {Phase type} pitfalls

Key findings:
- {one-liner from summary}"
```

Continue to completion.
</step>

<step name="completion">
Present summary and next options.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE RESEARCH COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}
**Phase:** {N} — {Phase Title}
**Confidence:** {overall level}

## Key Findings

- {Finding 1}
- {Finding 2}
- {Finding 3}

## Files Created

- `plans/phase-{NN}/RESEARCH.md`
- Updated `DECISIONS.md` with {N} new decisions

───────────────────────────────────────────────────────

## What's Next

**/specd:execute-plan {feature}** — Execute this phase (will load phase research)

**/specd:discuss-phase {feature} {N}** — Discuss this phase further

<sub>/clear first — fresh context window for execution</sub>
```

End workflow.
</step>

</process>

<success_criteria>
- Feature and phase validated
- Phase context loaded (goals, files, type)
- Research agents spawned in parallel
- Results synthesized into phase RESEARCH.md
- Decisions recorded in DECISIONS.md
- Committed to git
- User knows next step is execute-plan
</success_criteria>
