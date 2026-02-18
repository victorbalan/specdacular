# Context Section Display Template

Template for displaying a single section of a codebase context file to the user during review. Referenced by `specdacular/workflows/context-review.md`.

---

## Section Display

```
================================================================
{If ### subsection: "## {Parent Title} > "}{## or ###} {Section Title}  [{current}/{total}]{If tagged: "  · {USER_MODIFIED|AUTO_GENERATED}: YYYY-MM-DD"}
================================================================

{exact section content from the file — verbatim, no modifications, no strikethrough, no interpretation}

────────────────────────────────────────
{assessment icon} {assessment label} — {brief explanation}
================================================================
```

**Header:** `=` separator, section heading with position counter, `=` separator. For `###` subsections, prefix with the parent `##` heading and ` > ` to show context.

**Middle — Raw content:** The exact text from the file in a code fence. Do NOT interpret the content — no strikethrough on missing paths, no added formatting. Show it verbatim.

**Bottom — Assessment:** The agent's analysis with icon, label, and brief explanation. Closed with `=` separator.

**Empty parent sections** (## with no content, only ### children) are NOT displayed as reviewable sections. Their heading is shown as a prefix on child sections instead.

---

## Assessment Logic

Based on the section's tag and its date:

- **No tag** → ⚠️ Untagged — never reviewed or generated
- **Tag date older than 14 days** → ⚠️ Potentially stale
- **Tag date within 14 days** → ✅ Recently reviewed

---

## User Actions

After displaying the section, prompt the user with:

| Action | Description |
|--------|-------------|
| Confirm | Section is correct, move to next |
| Edit | User describes what to change |
| Remove | Delete this section (warns about children) |
| Re-map | Spawn mapper agent, show diff |
| Done for now | Skip remaining sections |
