# Research: {feature-name}

**Researched:** {YYYY-MM-DD}
**Feature type:** {what kind of feature}
**Confidence:** {HIGH/MEDIUM/LOW}

## Summary

{2-3 paragraphs synthesizing all research findings}

- What's the recommended approach?
- What makes this feature fit well with the existing codebase?
- What are the key risks and how to mitigate them?

**Key recommendation:** {One-liner actionable guidance for the planner}

---

## Codebase Integration

How this feature fits with existing code.

### Import Dependencies

| Module | Provides | Path |
|--------|----------|------|
| {module} | {what it provides} | `{path}` |

### Patterns to Follow

**{Pattern name}**
Follow pattern in `{existing file path}`:
- {Key aspect 1}
- {Key aspect 2}

```typescript
// Example from {path}
{code snippet showing pattern}
```

### File Structure

Where new files should go:

```
src/
├── {path}/           # {purpose}
│   ├── {file}.ts     # {what it does}
│   └── {file}.tsx    # {what it does}
└── {existing}/       # Modify: {what change}
```

### Reusable Code

**Types:**
- `@{path}` — {what types}

**Utilities:**
- `@{path}` — {what utilities}

**Components:**
- `@{path}` — {what components}

### Integration Points

| Connect To | Via | Purpose |
|------------|-----|---------|
| {system} | {how} | {why} |

---

## Implementation Approach

Standard patterns and libraries for this feature type.

### Standard Stack

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| {lib} | {ver}+ | {purpose} | {HIGH/MEDIUM} |

### Architecture Pattern

**Pattern:** {name}
**Why:** {rationale for this codebase}

```
{diagram or structure}
```

### Code Patterns

**{Pattern name}**
```typescript
// Source: {Context7 library ID / docs URL}
{verified code example}
```

**{Pattern name}**
```typescript
// Source: {Context7 library ID / docs URL}
{verified code example}
```

### Don't Hand-Roll

| Problem | Use Instead | Why |
|---------|-------------|-----|
| {problem} | {library/utility} | {edge cases it handles} |

---

## Pitfalls

What commonly goes wrong and how to prevent it.

### Critical

**{Pitfall name}**
- What goes wrong: {description}
- Why it happens: {root cause}
- Prevention: {specific steps}
- Detection: {warning signs during implementation}

### Moderate

**{Pitfall name}**
- What goes wrong: {description}
- Prevention: {specific steps}

### Task-Specific Warnings

| When Implementing | Watch Out For | Prevention |
|-------------------|---------------|------------|
| {task/file} | {pitfall} | {how to avoid} |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase integration | {level} | {why - e.g., "patterns clear from existing code"} |
| Implementation approach | {level} | {why - e.g., "verified with Context7"} |
| Pitfalls | {level} | {why - e.g., "multiple sources agree"} |

---

## Open Questions

Things that couldn't be fully resolved during research:

1. **{Question}**
   - What we know: {partial info}
   - What's unclear: {the gap}
   - Recommendation: {how planner should handle}

---

## Sources

### Codebase (from Explore)
- `{path}` — {what was learned}

### Verified External (HIGH confidence)
- Context7: {library IDs and queries}
- Official docs: {URLs}

### Community (MEDIUM confidence)
- {Verified WebSearch findings with URLs}

### For Awareness Only (LOW confidence)
- {Unverified findings - not used in recommendations}

---

## Decisions Made

Decisions recorded in DECISIONS.md during this research:

| Decision | Rationale |
|----------|-----------|
| DEC-XXX: {title} | {brief rationale} |
