<purpose>
Guided section-by-section review of a codebase context file (.specd/codebase/*.md). Walks through each section at both ## and ### levels, letting the user confirm, edit, remove, or re-map each section.

Edits are tagged with `<!-- USER_MODIFIED: YYYY-MM-DD -->`. Re-mapping spawns a targeted agent for just that section and shows a semantic diff.

Output: Updated context file with reviewed/edited sections and updated timestamps.
</purpose>

<philosophy>

## User Controls Everything

Every change requires explicit user approval. Never auto-edit, auto-remove, or auto-accept re-mapped content.

## Readable Display

Sections are displayed cleanly with visual separators. Don't dump raw markdown — format it for readability.

## Escape Hatches

Reviewing a file with 15 sections shouldn't mean 15 mandatory prompts. Offer "confirm all remaining" to avoid fatigue.

## Safety First

Create a git checkpoint before any destructive operations. Warn about child sections before removing a parent.

</philosophy>

<critical_rules>

## Date Format

Always write dates as `YYYY-MM-DD`. Never write times. Never write month names.

## USER_MODIFIED Tag Format

Exact format: `<!-- USER_MODIFIED: YYYY-MM-DD -->`

Placement: On its own line immediately after the section heading. No blank line between heading and tag.

```markdown
## Section Title
<!-- USER_MODIFIED: 2026-02-17 -->

Content here...
```

Never place the tag on the same line as the heading. Never add more than one tag per section. If a tag already exists, replace it.

## Section Boundaries

- A `##` section runs from its heading until the next `##` heading or end of file
- A `###` section runs from its heading until the next `###`, `##`, or end of file
- Ignore `#` (document title) — it is not a reviewable section
- Code fences (```) do NOT start new sections even if they contain `#` characters
- `<!-- USER_MODIFIED: ... -->` tags inside fenced code blocks are NOT real tags — only detect tags outside code fences

## Timestamp Lines

Document-level timestamps live near the top of the file (lines 2-4), after the `# Title`:

```markdown
# Document Title
Generated: 2026-02-04
Last Reviewed: 2026-02-17
Last Modified: 2026-02-17
```

If `Last Reviewed:` or `Last Modified:` lines don't exist yet, add them after the `Generated:` line (or `**Analysis Date:**` line for CONCERNS.md).

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

Continue to git_checkpoint.
</step>

<step name="git_checkpoint">
Create a git checkpoint before any changes.

@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/codebase/{selected file}`
- **$MESSAGE:** `docs: pre-review checkpoint for {file}`
- **$LABEL:** `pre-review checkpoint`

Note: If there are no changes to commit (file is clean), skip the commit silently.

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
   - Whether a `<!-- USER_MODIFIED: YYYY-MM-DD -->` tag exists on the line after the heading
   - The USER_MODIFIED date if present
   - The section content (everything from after the heading/tag until the next heading of same or higher level)
4. Count total sections
5. For `##` sections, count their `###` children

```
Found {N} sections in {file} ({X} top-level, {Y} subsections)
```

Continue to walk_sections.
</step>

<step name="walk_sections">
Walk through each section in document order. For each section:

**Display the section:**
```
───────────────────────────────────────────────────────
{## or ###} {Section Title}  [{current}/{total}]
{If USER_MODIFIED: "User modified: YYYY-MM-DD"}
───────────────────────────────────────────────────────

{section content, formatted for readability}
```

**Use AskUserQuestion:**
- header: "{current}/{total}"
- question: "What would you like to do with this section?"
- options:
  - "Confirm" — Section is correct, move to next
  - "Edit" — Tell me what to change
  - "Remove" — Delete this section
  - "Re-map" — Re-run the mapper for this section and compare
  - "Confirm all remaining" — Mark all remaining sections as reviewed

**If Confirm:**
Move to next section.

**If Confirm all remaining:**
Skip all remaining sections. Continue to update_timestamps.

**If Edit:**
Ask: "What should I change in this section?"

Wait for user response. Apply the edit using the Edit tool.

Add or update `<!-- USER_MODIFIED: {today} -->` on the line immediately after the section heading. If a tag already exists, replace it with today's date.

Mark that modifications were made in this session.

Move to next section.

**If Remove:**
Check if this is a `##` section with `###` children.

If it has children, warn:
```
Removing "## {title}" will also remove {N} subsections:
- ### {child 1}
- ### {child 2}
...

This is reversible via git (checkpoint was created at session start).
```

Use AskUserQuestion:
- header: "Confirm remove"
- question: "Remove this section and its subsections?"
- options:
  - "Yes, remove" — Delete the section
  - "Cancel" — Keep the section

If confirmed: Remove the section (and children if ##) from the file using the Edit tool. Mark modifications made. Adjust remaining section count.

If cancelled: Move to next section.

**If Re-map:**
Spawn a targeted re-mapping agent.

Use the Task tool:
```
subagent_type: "general-purpose"
model: "sonnet"
description: "Re-map section: {section title}"
```

**Prompt for the agent:**
```
You are re-mapping a SINGLE SECTION of a codebase context document.

<section_to_remap>
Document: .specd/codebase/{file}
Section heading: {exact heading text}
Heading level: {## or ###}
</section_to_remap>

<current_content>
{paste the exact current section content, excluding the heading line}
</current_content>

{If USER_MODIFIED tag exists:}
<user_modifications>
This section was manually modified by the user on {date}.
The user's version should be considered — they may have added domain knowledge
that isn't in the codebase. Preserve user additions that are still accurate.
</user_modifications>

<scope_constraint>
Re-map ONLY content relevant to the heading "{section title}".
Do NOT cover topics from these other sections: {list other section headings in the file}
Explore the codebase to verify current state of what this section documents.
Verify all file paths mentioned still exist.
</scope_constraint>

<output>
Return ONLY the replacement section content.
Do NOT include the heading line itself.
Do NOT write to any file.
Do NOT wrap in code fences or add explanation.
Return raw markdown content.
</output>
```

**After agent returns:**

Present a semantic diff:

```
───────────────────────────────────────────────────────
Re-mapping results for: {section title}
───────────────────────────────────────────────────────

Note: AI regeneration may use different phrasing.
Focus on factual differences, not wording changes.

**Current content:**
```
{current section content}
```

**Re-mapped content:**
```
{agent's returned content}
```

**Key differences:**
- {summarize what's actually new, removed, or factually changed}
```

Use AskUserQuestion:
- header: "Re-map"
- question: "How do you want to handle the re-mapped content?"
- options:
  - "Accept new" — Replace with re-mapped content (removes USER_MODIFIED tag)
  - "Keep current" — Keep existing content unchanged
  - "Edit manually" — Tell me what to change

If "Accept new": Replace section content with agent's output. Remove any USER_MODIFIED tag (content is now machine-generated). Mark modifications made.

If "Keep current": Move to next section.

If "Edit manually": Ask user what to change. Apply edit. Add/update USER_MODIFIED tag. Mark modifications made.

Move to next section.

Continue to update_timestamps after all sections processed (or "confirm all remaining" selected).
</step>

<step name="update_timestamps">
Update the file's document-level timestamps.

**Always set:**
- `Last Reviewed: {today}` — because the user reviewed the file

**If any modifications were made (edit, remove, re-map accepted):**
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
- **$MESSAGE:** `docs: review {file}` with brief summary of changes (N sections confirmed, N edited, N removed, N re-mapped)
- **$LABEL:** `context review`

Continue to completion.
</step>

<step name="completion">
Show review summary.

```
───────────────────────────────────────────────────────
Review complete: {file}
───────────────────────────────────────────────────────

Sections reviewed: {total}
- Confirmed: {N}
- Edited: {N} (USER_MODIFIED tags added)
- Removed: {N}
- Re-mapped: {N}
- Skipped (confirm all): {N}

Timestamps updated:
- Last Reviewed: {today}
{If modified:} - Last Modified: {today}
```

End workflow.
</step>

</process>

<success_criteria>
- User selects a context file to review
- Git checkpoint created before changes
- Each section displayed readably with heading and content
- User can confirm, edit, remove, or re-map each section
- Edits add USER_MODIFIED tag with date
- Removes warn about child sections
- Re-map spawns targeted agent and shows semantic diff
- "Confirm all remaining" escape hatch available
- Timestamps updated after review
- Changes committed
- Summary shown
</success_criteria>
