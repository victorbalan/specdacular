# Research: {task-name}

**Researched:** {YYYY-MM-DD}
**Confidence:** {HIGH/MEDIUM/LOW}

## Summary

{2-3 paragraphs synthesizing all research findings}

**Key recommendation:** {One-liner actionable guidance for the planner}

---

## Codebase Integration

### Import Dependencies

| Module | Provides | Path |
|--------|----------|------|
| {module} | {what it provides} | `{path}` |

### Patterns to Follow

**{Pattern name}**
Follow pattern in `{existing file path}`:
- {Key aspect 1}
- {Key aspect 2}

### File Structure

Where new files should go:

```
src/
├── {path}/           # {purpose}
│   ├── {file}.ts     # {what it does}
│   └── {file}.tsx    # {what it does}
```

### Reusable Code

- **Types:** `@{path}` — {what types}
- **Utilities:** `@{path}` — {what utilities}

### Integration Points

| Connect To | Via | Purpose |
|------------|-----|---------|
| {system} | {how} | {why} |

---

## Implementation Patterns

### Standard Approach
{Recommended approach with rationale}

### Libraries

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| {lib} | {ver}+ | {purpose} | {HIGH/MEDIUM} |

### Code Patterns

```{language}
// Source: {Context7 / docs URL}
{verified code example}
```

### Don't Hand-Roll

| Problem | Use Instead | Why |
|---------|-------------|-----|
| {problem} | {library/utility} | {edge cases it handles} |

---

## Pitfalls

### Critical
- **{Pitfall}** — {description}, Prevention: {steps}

### Moderate
- **{Pitfall}** — {description}, Prevention: {steps}

### Warnings

| When Implementing | Watch Out For | Prevention |
|-------------------|---------------|------------|
| {task/file} | {pitfall} | {how to avoid} |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase integration | {level} | {reason} |
| Implementation approach | {level} | {reason} |
| Pitfalls | {level} | {reason} |

## Open Questions

1. **{Question}** — {what's unclear}, Recommendation: {how to handle}

## Sources

### Codebase
- `{path}` — {what was learned}

### External
- {Context7 queries, docs URLs}

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| DEC-XXX: {title} | {brief rationale} |
