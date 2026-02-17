# Context Section Display Template

Template for displaying a single section of a codebase context file to the user during review. Referenced by `specdacular/workflows/context-review.md`.

---

## Section Display

```
───────────────────────────────────────────────────────
{## or ###} {Section Title}  [{current}/{total}]
{If USER_MODIFIED: "User modified: YYYY-MM-DD"}
───────────────────────────────────────────────────────

**Assessment:** {assessment}

{section content, formatted for readability}
```

### Variables

| Variable | Description |
|----------|-------------|
| `{## or ###}` | The heading level prefix from the original markdown |
| `{Section Title}` | The heading text without the `#` prefix |
| `{current}/{total}` | Position in the review walk (e.g., "3/12") |
| `{assessment}` | One of the assessment values below |
| `{section content}` | The section body, rendered for readability |

### Assessment Values

| Icon | Label | Meaning |
|------|-------|---------|
| ✅ | Up to date | Referenced files exist, no changes since last review |
| ⚠️ | Potentially stale | Referenced files changed or paths missing |
| 🔄 | Changed since last review | Files documented by this section were modified after `Last Reviewed` date |

### Assessment Logic

1. **Extract file paths** from the section content (backtick-wrapped strings containing `/` or a `.` extension)
2. **Check path existence:**
   ```bash
   test -f "{path}" && echo "exists" || echo "missing"
   ```
3. **Check git activity** (if `Last Reviewed` date is available):
   ```bash
   git log --oneline --since="{Last Reviewed date}" -- {paths} 2>/dev/null | head -5
   ```
4. **Classify:**
   - Any referenced path missing → ⚠️ Potentially stale
   - Git commits found after Last Reviewed → 🔄 Changed since last review
   - All paths exist, no recent changes → ✅ Up to date
   - No `Last Reviewed` date → ⚠️ Potentially stale (never reviewed)
   - No file paths in section → ✅ Up to date (cannot verify)

### User Actions

After displaying the section, prompt the user with:

| Action | Description |
|--------|-------------|
| Confirm | Section is correct, move to next |
| Edit | User describes what to change |
| Remove | Delete this section (warns about children) |
| Re-map | Spawn mapper agent, show diff |
| Approve all remaining | Skip remaining sections |
