<shared name="synthesize_research">

## Synthesize Research

Combine findings from three research agents into a single RESEARCH.md.

**Before using this reference, you must have ready:**
- `$TASK_NAME` — the task name
- Agent 1 output (Codebase Integration findings)
- Agent 2 output (Implementation Patterns findings)
- Agent 3 output (Pitfalls findings)

### Collect Agent Outputs

Read the output from each background agent. If an agent failed or returned empty results, note it in the confidence assessment but continue with available data.

### Write RESEARCH.md

Write to `.specd/tasks/$TASK_NAME/RESEARCH.md`:

```markdown
# Research: {task-name}

**Researched:** {YYYY-MM-DD}

## Summary

{2-3 paragraphs synthesizing all findings}

**Key recommendation:** {One-liner actionable guidance}

---

## Codebase Integration

{From Agent 1 — Explore findings}

### Import From
| Module | Provides | Path |
|--------|----------|------|

### Patterns to Follow
{Patterns with file references}

### File Locations
{Exact paths for new files}

### Reusable Code
- **Types:** {list with @paths}
- **Utilities:** {list with @paths}

### Integration Points
{Where new code connects to existing code}

---

## Implementation Patterns

{From Agent 2 — Pattern findings}

### Standard Approach
{Recommended approach with rationale}

### Libraries
| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|

### Code Patterns
{Code examples with sources}

### Don't Hand-Roll
| Problem | Use Instead | Why |
|---------|-------------|-----|

---

## Pitfalls

{From Agent 3 — Pitfalls findings}

### Critical
{List with prevention strategies}

### Moderate
{List with prevention strategies}

### Warnings
| When Implementing | Watch Out For | Prevention |
|-------------------|---------------|------------|

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase integration | {HIGH/MEDIUM/LOW} | {reason} |
| Implementation patterns | {HIGH/MEDIUM/LOW} | {reason} |
| Pitfalls | {HIGH/MEDIUM/LOW} | {reason} |

## Open Questions

{Anything that couldn't be resolved — may need discussion}

## Sources

### Codebase
- {file references explored}

### External
- {Context7 queries, docs URLs}
```

### Confidence Levels

- **HIGH** — From Context7, official docs, or verified against codebase
- **MEDIUM** — From reputable sources, verified but not tested
- **LOW** — From general search, unverified, or conflicting sources

### Extract Decisions

If research reveals clear technology/library/pattern choices, record them using `@record-decision.md`. Common research-driven decisions:
- Library selections (with version)
- Pattern choices (e.g., "use X pattern, not Y")
- Scope constraints discovered from pitfalls

</shared>
