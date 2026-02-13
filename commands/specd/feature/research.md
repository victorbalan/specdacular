---
name: specd:feature:research
description: Research how to implement a feature - spawns parallel agents for codebase, external, and pitfalls research
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
> **Note:** Consider using `/specd:feature:continue` instead — it guides you through the entire feature lifecycle automatically, including research.

Research how to implement a feature before planning. Spawns parallel research agents to investigate:

1. **Codebase Integration** - How does this fit with existing code? (uses Claude Code Explore agent)
2. **External Patterns** - What libraries/patterns are standard for this?
3. **Pitfalls** - What commonly goes wrong?

**Output:** `.specd/features/{name}/RESEARCH.md` with prescriptive guidance for the planner.

**Why parallel agents:** Research burns context fast. Fresh context per dimension = thorough investigation. Synthesize results into single RESEARCH.md.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/research-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS

**Load feature context:**
@.specd/features/{name}/FEATURE.md
@.specd/features/{name}/DECISIONS.md
@.specd/features/{name}/CONTEXT.md (if exists)

**Load codebase context:**
@.specd/codebase/ARCHITECTURE.md
@.specd/codebase/CONVENTIONS.md
@.specd/codebase/STACK.md
</context>

<process>

## Phase 1: Validate Feature

```bash
# Check feature exists
[ -d ".specd/features/$ARGUMENTS" ] || { echo "Feature not found. Run /specd:feature:new first."; exit 1; }

# Check if RESEARCH.md exists
[ -f ".specd/features/$ARGUMENTS/RESEARCH.md" ] && echo "existing"
```

**If RESEARCH.md exists:**
Use AskUserQuestion:
- header: "Research Exists"
- question: "Research already exists for this feature. What would you like to do?"
- options:
  - "Update research" — Re-run research, incorporate new findings
  - "View existing" — Show current RESEARCH.md
  - "Continue anyway" — Skip research, use existing

## Phase 2: Load Feature Context

Read and parse:
- `FEATURE.md` - What needs to be built
- `DECISIONS.md` - Constraints already decided
- `CONTEXT.md` - Gray areas already resolved (if exists)

Extract:
- Technical requirements (files to create, integrations needed)
- Locked decisions (don't research alternatives)
- Open questions (areas to investigate)

## Phase 3: Identify Research Dimensions

Based on feature requirements, determine what needs research:

**Always research:**
- Codebase integration patterns
- Pitfalls for this type of feature

**Conditionally research:**
- External libraries (if new dependencies needed)
- API patterns (if building APIs)
- UI patterns (if building UI components)
- Data modeling (if new models needed)

Present research plan:
```
I'll research these dimensions for {feature-name}:

1. **Codebase Integration** — How this fits with existing code
   - Integration points in current architecture
   - Patterns to follow from existing code
   - Files that will need modification

2. **External Patterns** — Standard approaches for {feature-type}
   - Libraries commonly used
   - Architecture patterns
   - Code examples

3. **Pitfalls** — What commonly goes wrong
   - Implementation mistakes
   - Integration gotchas
   - Performance traps

Estimated: 3 parallel research agents

[Start research] / [Adjust scope]
```

## Phase 4: Spawn Parallel Research Agents

### Agent 1: Codebase Integration (using Explore agent)

```
Task(
  prompt="Research how {feature-name} should integrate with the existing codebase.

<feature_context>
{FEATURE.md content}
</feature_context>

<locked_decisions>
{Relevant decisions from DECISIONS.md}
</locked_decisions>

<research_questions>
1. What existing files/modules will this feature need to import from?
2. What patterns do similar features in this codebase follow?
3. Where should new files be created based on project structure?
4. What types/interfaces already exist that this feature should use?
5. What utility functions or hooks can be reused?
</research_questions>

<output_format>
Return findings as structured markdown:

## Codebase Integration Findings

### Import Dependencies
- `path/to/file` — what it provides, why needed

### Patterns to Follow
- Pattern name: description, example file reference

### File Locations
- New files should go in: path/reason
- Existing files to modify: path/what change

### Reusable Code
- Types: list with paths
- Utilities: list with paths
- Components: list with paths

### Integration Points
- Where this connects to existing code
- What interfaces to implement
</output_format>
",
  subagent_type="Explore",
  description="Codebase integration research"
)
```

### Agent 2: External Patterns Research

```
Task(
  prompt="First, read ~/.claude/specdacular/agents/feature-researcher.md for your role.

<research_type>
External patterns research for {feature-type}.
</research_type>

<feature_context>
{FEATURE.md content}
</feature_context>

<codebase_stack>
{From .specd/codebase/STACK.md}
</codebase_stack>

<locked_decisions>
{Decisions that constrain library/pattern choices}
</locked_decisions>

<research_questions>
1. What's the standard approach for {feature-type} in {stack}?
2. What libraries are commonly used? (verify versions with Context7)
3. What architecture patterns work well?
4. What code patterns are recommended?
5. What should NOT be hand-rolled?
</research_questions>

<tool_strategy>
1. Context7 first for any library questions
2. Official docs via WebFetch for gaps
3. WebSearch for ecosystem patterns (include current year)
4. Verify all findings - no LOW confidence recommendations
</tool_strategy>

<output_format>
Return findings as structured markdown with confidence levels.
</output_format>
",
  subagent_type="general-purpose",
  model="sonnet",
  description="External patterns research"
)
```

### Agent 3: Pitfalls Research

```
Task(
  prompt="First, read ~/.claude/specdacular/agents/feature-researcher.md for your role.

<research_type>
Pitfalls research for {feature-type}.
</research_type>

<feature_context>
{FEATURE.md content}
</feature_context>

<codebase_context>
{Relevant architecture/conventions}
</codebase_context>

<research_questions>
1. What do developers commonly get wrong with {feature-type}?
2. What are the performance pitfalls?
3. What security issues should be avoided?
4. What integration mistakes happen?
5. What looks simple but is actually complex?
</research_questions>

<tool_strategy>
1. WebSearch for common mistakes (include current year)
2. Look for post-mortems, issue discussions
3. Check official docs for warnings/caveats
4. Consider edge cases specific to this stack
</tool_strategy>

<output_format>
Return pitfalls as structured markdown:

## Pitfalls for {feature-type}

### Critical (causes failures/rewrites)
- Pitfall: description
  - Why it happens: reason
  - Prevention: how to avoid
  - Detection: warning signs

### Moderate (causes bugs/debt)
- Pitfall: description
  - Prevention: how to avoid

### Minor (causes friction)
- Pitfall: description
  - Prevention: how to avoid
</output_format>
",
  subagent_type="general-purpose",
  model="sonnet",
  description="Pitfalls research"
)
```

## Phase 5: Synthesize Results

After all agents complete, synthesize into single RESEARCH.md:

```markdown
# Research: {feature-name}

**Researched:** {date}
**Feature:** {feature-type}
**Confidence:** {overall level}

## Summary

{2-3 paragraphs synthesizing all findings}

**Key recommendation:** {one-liner actionable guidance}

---

## Codebase Integration

{From Agent 1 - Explore findings}

### Import From
| Module | Provides | Path |
|--------|----------|------|
| ... | ... | ... |

### Patterns to Follow
{Patterns with file references}

### File Structure
```
src/
├── {where new files go}
└── {existing files to modify}
```

### Reusable Code
- **Types:** {list with @paths}
- **Utilities:** {list with @paths}
- **Components:** {list with @paths}

---

## Implementation Approach

{From Agent 2 - External patterns}

### Standard Stack
| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| ... | ... | ... | HIGH/MED |

### Architecture Pattern
{Recommended pattern with rationale}

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

{From Agent 3 - Pitfalls research}

### Critical
{List with prevention strategies}

### Moderate
{List with prevention strategies}

### Task-Specific Warnings
| When Implementing | Watch Out For | Prevention |
|-------------------|---------------|------------|
| ... | ... | ... |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase integration | {level} | {reason} |
| Implementation approach | {level} | {reason} |
| Pitfalls | {level} | {reason} |

## Open Questions

{Anything that couldn't be resolved - planner should be aware}

## Sources

### Codebase (from Explore)
- {file references used}

### External (verified)
- {Context7 queries}
- {Official docs URLs}

### Community (for awareness)
- {WebSearch findings - lower confidence}
```

## Phase 6: Update DECISIONS.md

Any technology choices or pattern decisions from research should be recorded:

```markdown
### DEC-XXX: {Decision from research}
**Date:** {today}
**Status:** Active
**Context:** Identified during feature research
**Decision:** {what was decided}
**Rationale:** {from research findings}
**Implications:** {what this means for implementation}
**References:** {sources}
```

## Phase 7: Commit and Complete

```bash
git add .specd/features/{name}/RESEARCH.md .specd/features/{name}/DECISIONS.md
git commit -m "docs({feature}): complete feature research

Dimensions researched:
- Codebase integration
- External patterns
- Pitfalls

Key findings:
- {one-liner from summary}"
```

Present completion:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RESEARCH COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {name}
**Confidence:** {level}

## Key Findings

{3-5 bullet points}

## Files Created

- `.specd/features/{name}/RESEARCH.md`
- Updated `DECISIONS.md` with {N} new decisions

───────────────────────────────────────────────────────

## Next Steps

/specd:feature:plan {name} — Create roadmap with phase overview

<sub>/clear first — fresh context window</sub>
```

</process>

<success_criteria>
- [ ] Feature validated (exists, has FEATURE.md)
- [ ] Feature context loaded (requirements, decisions)
- [ ] Codebase research completed (Explore agent)
- [ ] External patterns researched (with verification)
- [ ] Pitfalls catalogued (with prevention strategies)
- [ ] Results synthesized into RESEARCH.md
- [ ] Decisions recorded in DECISIONS.md
- [ ] Files committed
- [ ] User knows next step is `/specd:feature:plan`
</success_criteria>
