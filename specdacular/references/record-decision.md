<shared name="record_decision">

## Record Decision

Add a new decision to DECISIONS.md with proper numbering and format.

**Before using this reference, you must have ready:**
- `$TASK_NAME` — the task name
- The decision details (from discussion, research, or review)

### When to Record

Record a decision when:
- Technology or library choice is made
- Architecture pattern is chosen
- Scope inclusion/exclusion is decided
- Multiple valid approaches exist and one is picked
- A constraint is discovered during discussion/research/review

### Determine Next Decision Number

Read `.specd/tasks/$TASK_NAME/DECISIONS.md` and find the highest existing DEC-{NNN} number. Increment by 1. Zero-pad to 3 digits.

### Add Decision Entry

Append to the **Active Decisions** section of DECISIONS.md:

```markdown
### DEC-{NNN}: {Decision Title}

**Date:** {YYYY-MM-DD}
**Status:** Active
**Context:** {What situation required this decision}
**Decision:** {What was decided}
**Rationale:**
- {Why this choice was made}
- {Additional reasoning}
**Implications:**
- {What this means for implementation}
- {Files or patterns affected}
**References:**
- `@{path/to/relevant/code}` (if applicable)
```

### Update Decision Log Table

Add a row to the Decision Log table at the bottom of DECISIONS.md:

```markdown
| DEC-{NNN} | {YYYY-MM-DD} | {Decision Title} | Active |
```

### Update Config

Increment `decisions_count` in `.specd/tasks/$TASK_NAME/config.json`.

### Multiple Decisions

When recording multiple decisions in one session, number them sequentially and add all to the log table.

</shared>
