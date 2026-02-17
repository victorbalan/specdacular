# Context Review Diff Template

Template for displaying re-mapping results when comparing current vs re-mapped section content. Referenced by `specdacular/workflows/context-review.md`.

---

## Re-map Diff Display

Shown after a `specd-codebase-mapper` agent returns re-mapped content for a section.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RE-MAP RESULTS: {section title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Note: AI regeneration may rephrase content even when
facts are unchanged. Focus on factual differences.

───── CURRENT ─────────────────────────────────────────

{current section content}

───── RE-MAPPED ───────────────────────────────────────

{agent's returned content}

───── KEY DIFFERENCES ─────────────────────────────────

- {factual difference 1: added/removed/changed item}
- {factual difference 2}
...

{If no factual differences: "No factual changes detected — only phrasing differences."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Key Differences Guidelines

When summarizing differences, focus on **factual changes only**:
- New file paths, functions, or integrations added
- Removed items that no longer exist in the codebase
- Changed descriptions that reflect actual behavior differences
- Updated version numbers or configuration values

**Ignore:**
- Rephrased descriptions with the same meaning
- Reordered items within a list
- Formatting differences (bullet style, heading level)
- Synonymous wording ("utilizes" vs "uses")

---

## Variables

| Variable | Description |
|----------|-------------|
| `{section title}` | The heading text of the section being re-mapped |
| `{current section content}` | Existing section body for comparison |
| `{agent's returned content}` | New content from the `specd-codebase-mapper` agent |
