<purpose>
Manual review of a codebase context file (.specd/codebase/*.md). Shows a section list and lets the user pick which section to review, edit, remove, re-map, or add new content.

Edits are tagged with `<!-- USER_MODIFIED: YYYY-MM-DD -->`. Re-mapping spawns a targeted agent for just that section and shows a semantic diff.

Output: Updated context file with reviewed/edited sections and updated timestamps.
</purpose>

<philosophy>

## User Picks What To Review

Don't walk through every section automatically. Show a list of sections and let the user choose which one to look at. The user knows what needs attention.

## User Controls Everything

Every change requires explicit user approval. Never auto-edit, auto-remove, or auto-accept re-mapped content.

## Minimal Touch

Edit only what the user asks. Don't reorganize surrounding sections or rewrite adjacent content.

</philosophy>

<critical_rules>

## Date Format

Always write dates as `YYYY-MM-DD`. Never write times. Never write month names.

## Section Tags

Three tag types for tracking section state:

- `<!-- USER_MODIFIED: YYYY-MM-DD -->` — Section was manually edited by the user
- `<!-- AUTO_GENERATED: YYYY-MM-DD -->` — Section was updated via re-map agent
- `<!-- REVIEWED: YYYY-MM-DD -->` — Section was confirmed unchanged during review

Placement: On its own line immediately after the section heading. No blank line between heading and tag.

```markdown
## Section Title
<!-- USER_MODIFIED: 2026-02-17 -->

Content here...
```

Never place the tag on the same line as the heading. Never add more than one tag per section. If a tag already exists, replace it with the appropriate tag type and today's date.

## Section Boundaries

- A `##` section runs from its heading until the next `##` heading or end of file
- A `###` section runs from its heading until the next `###`, `##`, or end of file
- Ignore `#` (document title) — it is not a reviewable section
- Code fences (```) do NOT start new sections even if they contain `#` characters
- `<!-- USER_MODIFIED: ... -->` and `<!-- AUTO_GENERATED: ... -->` tags inside fenced code blocks are NOT real tags — only detect tags outside code fences

## Timestamp Lines

Document-level timestamps live near the top of the file (lines 2-4), after the `# Title`:

```markdown
# Document Title
Generated: 2026-02-04
Last Reviewed: 2026-02-17
Last Modified: 2026-02-17
```

If `Last Reviewed:` or `Last Modified:` lines don't exist yet, add them after the `Generated:` line (or `**Analysis Date:**` line for CONCERNS.md).

## After Every Action

For EVERY section acted on, you MUST add or update the tag immediately — not later, not at the end:

- **User edits a section** → `<!-- USER_MODIFIED: {today} -->`
- **Re-map accepted** → `<!-- AUTO_GENERATED: {today} -->`
- **Section confirmed unchanged** → `<!-- REVIEWED: {today} -->`

Also update the file's `Last Modified: {today}` timestamp at the top if any content changed (edit, remove, or re-map).

When returning to the section list, update `Last Reviewed: {today}` at the top of the file.

Never skip tagging. Never defer to a later step.

</critical_rules>

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

Continue to select_file.
</step>

<step name="select_file">
Let the user pick which file to review.

Read the first 5 lines of each existing context file to extract timestamps. Show last reviewed dates.

Use AskUserQuestion:
- header: "Review"
- question: "Which context file do you want to review?"
- options (only show files that exist):
  - "MAP.md" — Navigation map {Last Reviewed: date or "never reviewed"}
  - "PATTERNS.md" — Code patterns {Last Reviewed: date or "never reviewed"}
  - "STRUCTURE.md" — Directory layout {Last Reviewed: date or "never reviewed"}
  - "CONCERNS.md" — Gotchas and warnings {Last Reviewed: date or "never reviewed"}

**Set the mapper focus** based on the selected file (used by re-map action):
- `MAP.md` → `MAPPER_FOCUS = "map"`
- `PATTERNS.md` → `MAPPER_FOCUS = "patterns"`
- `STRUCTURE.md` → `MAPPER_FOCUS = "structure"`
- `CONCERNS.md` → `MAPPER_FOCUS = "concerns"`

**Extract `Last Reviewed` date** from the selected file for assessment logic. Store as `LAST_REVIEWED_DATE`. If no `Last Reviewed:` line exists, set to `null`.

Continue to parse_sections.
</step>

<step name="parse_sections">
Read the selected file and build a section list.

**Parse rules (from critical_rules):**
1. Skip the `#` title line and document-level metadata (first few lines)
2. Identify all `##` and `###` headings (outside fenced code blocks)
3. For each heading, capture:
   - Heading level (## or ###)
   - Heading text
   - Whether a tag exists on the line after the heading (USER_MODIFIED, AUTO_GENERATED, or REVIEWED)
   - The tag type and date if present
   - The section content (everything from after the heading/tag until the next heading of same or higher level)
   - Parent `##` heading (for `###` sections)
4. **Exclude empty parent sections:** If a `##` section has no content of its own (only `###` children), do NOT count it as a reviewable section. Instead, store its heading text as the parent label for its children.
5. Count only reviewable sections (sections with actual content)

Continue to show_section_list.
</step>

<step name="show_section_list">
Show the user a numbered list of all sections with their tag status, then let them pick one or add new content.

```
================================================================
{file} — {N} sections
================================================================

{For each section:}
{N}. {If ### subsection: "{Parent} > "}{heading}  {If tagged: "({tag type}: {date})" else "(unreviewed)"}
{...}

================================================================
```

Use AskUserQuestion:
- header: "{file}"
- question: "How would you like to review?"
- options:
  - "Select section" — Pick a section by number
  - "Walk all" — Go through every section in order
  - "Add new section" — Add new content to this file
  - "Done" — Finish reviewing this file

**If "Select section":**
Ask the user: "Which section number?" — the section list is already displayed above, so just ask for the number as a plain text prompt. Do NOT use AskUserQuestion (it has a 4-option limit and can't show all sections). Continue to show_section. After the action, return to show_section_list.

**If "Walk all":**
Continue to walk_sections.

**If "Add new section":**
Continue to add_content.

**If "Done":**
Continue to update_timestamps.
</step>

<step name="walk_sections">
Walk through every section in document order, one at a time.

For each section: display it using show_section (below). After the user acts on it, move to the next section automatically.

Add a "Done for now" option alongside the per-section actions. If selected, stop walking and return to show_section_list.

After all sections are walked, return to show_section_list.
</step>

<step name="show_section">
Display the selected section and let the user act on it.

**Perform an assessment** using the assessment logic from `@~/.claude/specdacular/templates/context/section-display.md`.

**Display using the section display template:**

@~/.claude/specdacular/templates/context/section-display.md

Follow the Section Display format from the template above exactly. Do not improvise a different format.

**After displaying, use AskUserQuestion:**
- header: "Section {N}"
- question: "What would you like to do with this section?"
- options:
  - "Confirm" — Section is correct, mark as reviewed
  - "Edit" — Tell me what to change
  - "Remove" — Delete this section
  - "Re-map" — Re-run the mapper for this section and compare

**If Confirm:**
Add or update `<!-- REVIEWED: {today} -->` tag. Return to show_section_list.

**If Edit:**
Ask: "What should I change in this section?"

Wait for user response. Apply the edit using the Edit tool.

Add or update `<!-- USER_MODIFIED: {today} -->` on the line immediately after the section heading.

Mark that modifications were made in this session.

Return to show_section_list.

**If Remove:**
Check if this is a `##` section with `###` children.

If it has children, warn:
```
Removing "## {title}" will also remove {N} subsections:
- ### {child 1}
- ### {child 2}
...
```

Use AskUserQuestion:
- header: "Confirm remove"
- question: "Remove this section and its subsections?"
- options:
  - "Yes, remove" — Delete the section
  - "Cancel" — Keep the section

If confirmed: Remove the section (and children if ##) from the file using the Edit tool. Mark modifications made. Re-parse sections.

If cancelled: Return to show_section_list.

**If Re-map:**
Spawn a targeted re-mapping agent using the `specd-codebase-mapper` agent with file-type-specific focus.

Use the Task tool:
```
subagent_type: "specd-codebase-mapper"
model: "sonnet"
description: "Re-map section: {section title}"
```

**Prompt for the agent:**
```
Focus: {MAPPER_FOCUS}

You are re-mapping a SINGLE SECTION of .specd/codebase/{file}.

Section heading: {exact heading text}
Heading level: {## or ###}

Current content of this section:
{paste the exact current section content, excluding the heading line}

{If USER_MODIFIED tag exists:}
This section was manually modified by the user on {date}.
Preserve user additions that are still accurate.

Other sections in this file (do NOT cover these topics):
{list other section headings in the file}

Explore the codebase to verify and update what this section documents.
Check that all file paths still exist. Add new items discovered. Remove items that no longer exist.

Return ONLY the replacement section content as raw markdown.
Do NOT include the heading line.
Do NOT write to any file.
Do NOT wrap in code fences or add explanation.
```

**After agent returns:**

Present using the Re-map Diff Display format from `@specdacular/templates/context/review-diff.md`:

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

Use AskUserQuestion:
- header: "Re-map"
- question: "How do you want to handle the re-mapped content?"
- options:
  - "Accept new" — Replace with re-mapped content
  - "Keep current" — Keep existing content unchanged
  - "Edit manually" — Tell me what to change

If "Accept new": Replace section content with agent's output. Add or update tag to `<!-- AUTO_GENERATED: {today} -->`. Mark modifications made.

If "Keep current": Return to show_section_list.

If "Edit manually": Ask user what to change. Apply edit. Add/update USER_MODIFIED tag. Mark modifications made.

Return to show_section_list.
</step>

<step name="add_content">
Add new content to the file.

Ask: "What do you want to add? Describe the information — I'll suggest where it belongs."

Wait for user response.

**Check for duplicates:**
Search the current file for key terms from the user's description using Grep.

**If similar content found:**
```
Similar content already exists in: {## Section}
{relevant excerpt, 2-3 lines}
```

Use AskUserQuestion:
- header: "Duplicate?"
- question: "Similar content exists. What would you like to do?"
- options:
  - "Add anyway" — Add as new content
  - "Update existing" — Edit the existing section instead
  - "Cancel" — Don't add

If "Update existing": Show the section, ask what to change. Apply edit, add USER_MODIFIED tag. Return to show_section_list.
If "Cancel": Return to show_section_list.

**Identify best section:**
Based on the content, determine which existing section it fits under, or propose creating a new section.

**Confirm placement:**
```
I'll add this to:

**Section:** {## Section} → {### Subsection if applicable}
{If new section: "New section: ## {proposed title}"}

**Content to add:**

{formatted content that will be written}
```

Use AskUserQuestion:
- header: "Placement"
- question: "Add content here?"
- options:
  - "Confirm" — Add it here
  - "Different section" — Show other options
  - "Cancel" — Don't add

If "Different section": Show all sections and let user pick.
If "Cancel": Return to show_section_list.

**Write content:**
1. If adding to existing section: Append content at end of section, add/update `<!-- USER_MODIFIED: {today} -->` tag.
2. If creating new section: Add heading at appropriate location, add `<!-- USER_MODIFIED: {today} -->` tag, add content.

Mark modifications made. Re-parse sections. Return to show_section_list.
</step>

<step name="update_timestamps">
Update the file's document-level timestamps.

**Always set:**
- `Last Reviewed: {today}` — because the user reviewed the file

**If any modifications were made (edit, remove, re-map accepted, content added):**
- `Last Modified: {today}`

**How to update:**
1. Read the first 5 lines of the file
2. Look for existing `Last Reviewed:` and `Last Modified:` lines
3. If they exist, update the dates using the Edit tool
4. If they don't exist, add them after the `Generated:` or `**Analysis Date:**` line

Continue to commit.
</step>

<step name="commit">
Commit changes if any were made.

**If no modifications were made (user only confirmed sections):**
Still commit the timestamp update (Last Reviewed changed).

@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/codebase/{file}`
- **$MESSAGE:** `docs: review {file}` with brief summary of changes
- **$LABEL:** `context review`

Continue to completion.
</step>

<step name="completion">
Show review summary.

```
───────────────────────────────────────────────────────
Review complete: {file}
───────────────────────────────────────────────────────

Sections: {total}
- Confirmed: {N}
- Edited: {N}
- Removed: {N}
- Re-mapped: {N}
- Added: {N}

Timestamps updated:
- Last Reviewed: {today}
{If modified:} - Last Modified: {today}
```

End workflow.
</step>

</process>

<success_criteria>
- User selects a context file to review
- Section list shown with tag status
- User picks which section to review (not auto-walked)
- User can add new content from the same flow
- Section display follows `specdacular/templates/context/section-display.md`
- Re-map diff display follows `specdacular/templates/context/review-diff.md`
- User can confirm, edit, remove, or re-map each section
- Edits add USER_MODIFIED tag with date
- Re-map accepts add AUTO_GENERATED tag with date
- Confirms add REVIEWED tag with date
- Removes warn about child sections
- Re-map spawns `specd-codebase-mapper` agent with file-type-specific focus
- Timestamps updated after review
- Changes committed
- Summary shown
</success_criteria>
