# Decisions: {feature-name}

**Feature:** {feature-name}
**Created:** {YYYY-MM-DD}
**Last Updated:** {YYYY-MM-DD}

---

## Active Decisions

{Decisions currently in effect. These guide implementation.}

### DEC-001: {Decision Title}

**Date:** {YYYY-MM-DD}
**Status:** Active
**Context:** {What situation required this decision}
**Decision:** {What was decided}
**Rationale:**
- {Reason 1}
- {Reason 2}
- {Reason 3}
**Implications:**
- {What this means for implementation}
- {Files or patterns affected}
**References:**
- `@{path/to/relevant/code}` (if applicable)
- {Link to docs or external resource} (if applicable)

---

### DEC-002: {Decision Title}

**Date:** {YYYY-MM-DD}
**Status:** Active
**Context:** {What situation required this decision}
**Decision:** {What was decided}
**Rationale:**
- {Reason}
**Implications:**
- {What this means}
**References:**
- {References}

---

## Superseded Decisions

{Decisions that were replaced by newer decisions. Kept for history.}

### DEC-000: {Old Decision Title}

**Date:** {YYYY-MM-DD}
**Status:** Superseded by DEC-XXX
**Original Decision:** {What was originally decided}
**Why Changed:** {What new information or context led to change}

---

## Revoked Decisions

{Decisions that were explicitly cancelled without replacement.}

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | {date} | {title} | Active |
| DEC-002 | {date} | {title} | Active |

---

## Decision Template

Use this format when adding new decisions:

```markdown
### DEC-XXX: {Title}

**Date:** YYYY-MM-DD
**Status:** Active | Superseded | Revoked
**Context:** {What situation required a decision}
**Decision:** {What was decided}
**Rationale:**
- {Why - the reasoning}
**Implications:**
- {What this means for implementation}
**References:**
- {Code paths, docs, etc.}
```

---

## Guidelines

**When to create a decision:**
- Technology or library choice
- Architecture pattern choice
- Scope inclusion/exclusion
- Approach when multiple valid options exist
- Constraints discovered during discussion/research

**Decision ID format:** DEC-{NNN} (three-digit, zero-padded)

**Status transitions:**
- Active → Superseded (when replaced by new decision)
- Active → Revoked (when cancelled without replacement)
