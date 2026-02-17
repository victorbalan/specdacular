<purpose>
Display a dashboard showing the status of all codebase context files (.specd/codebase/*.md). Shows timestamps (generated, last reviewed, last modified), section counts, and USER_MODIFIED section counts for each file.

This is a read-only operation — no files are written, no commits made.

Output: Formatted dashboard displayed to user.
</purpose>

<philosophy>

## Information, Not Judgment

Show dates and counts. Let the user decide what's stale. No thresholds, no warnings, no color-coded urgency.

## Handle What Exists

Context files may have inconsistent timestamp formats (`Generated:` vs `**Analysis Date:**`). Parse both. Missing timestamps show as `—`.

</philosophy>

<process>

<step name="validate">
Check that codebase context files exist.

```bash
ls .specd/codebase/*.md 2>/dev/null
```

**If no files found:**
```
No codebase context files found.

Run /specd:map-codebase to generate codebase documentation.
```
End workflow.

**If files found:**
Continue to read_files.
</step>

<step name="read_files">
Read all context files and extract metadata.

**Context files to check:**
- `.specd/codebase/MAP.md`
- `.specd/codebase/PATTERNS.md`
- `.specd/codebase/STRUCTURE.md`
- `.specd/codebase/CONCERNS.md`

For each file that exists, read it and extract:

1. **Document-level timestamps** — Look for these patterns near the top of the file (first 5 lines):
   - `Generated: YYYY-MM-DD` or `**Analysis Date:** YYYY-MM-DD` — when the file was created/mapped
   - `Last Reviewed: YYYY-MM-DD` — when a user last reviewed via context:review
   - `Last Modified: YYYY-MM-DD` — when content was last changed (edit, add, or re-map)

2. **Section count** — Count all `##` and `###` headings in the file (excluding the `#` title). Do not count headings inside fenced code blocks (between ``` lines).

3. **USER_MODIFIED count** — Count occurrences of `<!-- USER_MODIFIED:` in the file (outside fenced code blocks).

4. **Days ago** — For each timestamp found, calculate the number of days between that date and today.

Continue to display_dashboard.
</step>

<step name="display_dashboard">
Present the collected data as a formatted dashboard.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CODEBASE CONTEXT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| File | Generated | Last Reviewed | Last Modified | Sections | User Modified |
|------|-----------|---------------|---------------|----------|---------------|
| MAP.md | {date} ({N}d ago) | {date or —} | {date or —} | {count} | {count} |
| PATTERNS.md | {date} ({N}d ago) | {date or —} | {date or —} | {count} | {count} |
| STRUCTURE.md | {date} ({N}d ago) | {date or —} | {date or —} | {count} | {count} |
| CONCERNS.md | {date} ({N}d ago) | {date or —} | {date or —} | {count} | {count} |
```

If any files are missing from `.specd/codebase/`, note them:
```
Missing: {file} — Run /specd:map-codebase to generate
```

If any USER_MODIFIED sections exist across files:
```
Note: USER_MODIFIED tags are HTML comments — view raw files to see them.
```

End workflow.
</step>

</process>

<success_criteria>
- Validates .specd/codebase/ exists
- Reads all 4 context files
- Extracts Generated, Last Reviewed, Last Modified timestamps
- Counts sections (## and ###) and USER_MODIFIED tags
- Displays formatted dashboard with days-ago calculations
- Handles missing files and missing timestamps gracefully
- No files written, no commits
</success_criteria>
