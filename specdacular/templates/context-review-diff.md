# Context Review Display Templates

Templates for consistent display during context file review. Referenced by `specdacular/workflows/context-review.md`.

---

## Section Review Display

Shown for every section during the review walk. Includes an up-to-date assessment.

```
───────────────────────────────────────────────────────
{## or ###} {Section Title}  [{current}/{total}]
{If USER_MODIFIED: "User modified: YYYY-MM-DD"}
───────────────────────────────────────────────────────

**Assessment:** {assessment}

{section content, formatted for readability}
```

### Assessment Values

| Assessment | Icon | Meaning | How to determine |
|------------|------|---------|------------------|
| Up to date | ✅ | Section content matches current codebase state | Referenced file paths exist, no significant changes since last review |
| Potentially stale | ⚠️ | Section may not reflect current codebase | Referenced files changed recently, OR some paths don't exist |
| Changed since last review | 🔄 | Files this section documents were modified after `Last Reviewed` date | Git log shows changes to referenced files after the file's `Last Reviewed` timestamp |

### Assessment Logic

1. **Extract file paths** from the section content (anything in backticks that looks like a path)
2. **Check path existence** — if any referenced paths don't exist, mark ⚠️
3. **Check git activity** — run `git log --oneline --since="{Last Reviewed date}" -- {paths}` for referenced files
   - If commits found → 🔄 Changed since last review
   - If no commits and all paths exist → ✅ Up to date
4. **If no `Last Reviewed` date exists** — default to ⚠️ (never reviewed)
5. **If section has no file paths** — default to ✅ (cannot verify, assume ok)

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

## Variables Reference

| Variable | Source | Description |
|----------|--------|-------------|
| `{## or ###}` | Section heading level | The markdown heading prefix |
| `{Section Title}` | Section heading text | Without the `#` prefix |
| `{current}/{total}` | Section counter | Position in the review walk |
| `{assessment}` | Assessment logic above | One of: ✅ Up to date, ⚠️ Potentially stale, 🔄 Changed since last review |
| `{section content}` | File content | The section body, formatted for readability |
| `{section title}` | Current section | Used in re-map results header |
| `{current section content}` | File content | Existing section body for comparison |
| `{agent's returned content}` | Mapper agent output | New content from re-mapping |
