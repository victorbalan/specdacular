# Context Section Display Template

Template for displaying a single section of a codebase context file to the user during review. Referenced by `specdacular/workflows/context-review.md`.

---

## Section Display

Display each section as a single-column table with three rows.

| **{## or ###} {Section Title}** [{current}/{total}] {If USER_MODIFIED: "· User modified: YYYY-MM-DD"} |
|:-------------------------------------------------------------------------------------------------------|
| `{exact section content from the file — no modifications, no strikethrough, no interpretation}` |
| {assessment icon} {assessment label} — {brief explanation: which paths missing, which files changed} |

**Row 1 — Header:** Section heading, position counter, and user-modified date if tagged.

**Row 2 — Raw content:** The exact text from the file wrapped in backticks. Do NOT interpret the content — no strikethrough on missing paths, no added formatting, no modifications. Show it verbatim.

**Row 3 — Assessment:** The agent's analysis with icon, label, and brief explanation.

---

## Assessment Logic

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

---

## User Actions

After displaying the section, prompt the user with:

| Action | Description |
|--------|-------------|
| Confirm | Section is correct, move to next |
| Edit | User describes what to change |
| Remove | Delete this section (warns about children) |
| Re-map | Spawn mapper agent, show diff |
| Approve all remaining | Skip remaining sections |
