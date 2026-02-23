<purpose>
Guide the user to add new content to a codebase context file (.specd/codebase/*.md). Identifies the correct file and section, checks for duplicates, confirms placement, and writes the content with a USER_MODIFIED tag.

Output: Updated context file with new content added to the correct section.
</purpose>

<philosophy>

## Guide, Don't Assume

The agent suggests where content should go, but the user confirms before anything is written. Never auto-place content.

## Check for Duplicates

Before adding, search existing context files for similar content. Avoid creating duplicate documentation.

## Minimal Touch

Add the content where it belongs. Don't reorganize surrounding sections or rewrite adjacent content.

</philosophy>

<critical_rules>

## Date Format

Always write dates as `YYYY-MM-DD`. Never write times. Never write month names.

## USER_MODIFIED Tag Format

Exact format: `<!-- USER_MODIFIED: YYYY-MM-DD -->`

Placement: On its own line immediately after the section heading. No blank line between heading and tag.

If the section already has a USER_MODIFIED tag, update the date. Never add a second tag.

## Timestamp Lines

After writing content, update the document-level `Last Modified:` timestamp. If it doesn't exist, add it after `Generated:` or `**Analysis Date:**`.

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

Run /specd.codebase.map to generate codebase documentation.
```
End workflow.

Continue to gather_input.
</step>

<step name="gather_input">
Ask what the user wants to add.

```
What do you want to add to the codebase context?

Describe the information — I'll figure out which file and section it belongs in.
```

Wait for user response.

Continue to identify_target.
</step>

<step name="identify_target">
Determine where the content belongs.

**Step 1: Check for duplicates**

Search all context files for key terms from the user's description:

Use Grep to search `.specd/codebase/*.md` for the main keywords/concepts from the user's input.

**If similar content found:**
```
Similar content already exists:

**{file}** → {## Section}
{relevant excerpt, 2-3 lines}
```

Use AskUserQuestion:
- header: "Duplicate?"
- question: "Similar content exists. What would you like to do?"
- options:
  - "Add anyway" — Add as new content in the best location
  - "Update existing" — Modify the existing section instead
  - "Cancel" — Don't add anything

If "Update existing": Switch to edit mode — show the existing section and ask what to change. Apply edit, add USER_MODIFIED tag. Continue to update_timestamps.

If "Cancel": End workflow.

**Step 2: Identify best file**

Based on the content type, determine the target file:
- **MAP.md** — Entry points, modules, functions, integrations, data flow
- **PATTERNS.md** — Code patterns, conventions, examples to follow
- **STRUCTURE.md** — Directory layout, where to put new files, naming conventions
- **CONCERNS.md** — Gotchas, anti-patterns, tech debt, fragile areas, warnings

**Step 3: Identify best section**

Read the target file. Determine which existing section the content fits under. If no existing section is appropriate, propose creating a new section.

Continue to confirm_placement.
</step>

<step name="confirm_placement">
Show the user where content will be placed and get confirmation.

```
I'll add this to:

**File:** {file}
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
  - "Different section" — Show me other options
  - "Cancel" — Don't add

**If "Different section":**
Show all sections across all 4 files as options:

```
Available sections:

MAP.md:
  ## Entry Points
  ## Core Modules
  ...

PATTERNS.md:
  ## Workflow/Command Pattern
  ...

STRUCTURE.md:
  ## Directory Layout
  ...

CONCERNS.md:
  ## Gotchas
  ## Anti-patterns
  ...
```

Use AskUserQuestion to let user pick from available sections, or type a custom section name.

**If "Cancel":** End workflow.

Continue to write_content.
</step>

<step name="write_content">
Insert content at the chosen location.

1. **If adding to existing section:**
   - Append the new content at the end of the section (before the next heading)
   - Add or update `<!-- USER_MODIFIED: {today} -->` after the section heading

2. **If creating new section:**
   - Add the new `##` or `###` heading at an appropriate location in the file
   - Add `<!-- USER_MODIFIED: {today} -->` on the line after the heading
   - Add the content below

Use the Edit tool to make the changes.

Continue to update_timestamps.
</step>

<step name="update_timestamps">
Update the document-level timestamps.

1. Read the first 5 lines of the file
2. Set `Last Modified: {today}`
3. If the line doesn't exist, add it after `Generated:` or `**Analysis Date:**`

Continue to commit.
</step>

<step name="commit">
@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/codebase/{file}`
- **$MESSAGE:** `docs: add to {file} — {brief description of what was added}`
- **$LABEL:** `context addition`

Continue to completion.
</step>

<step name="completion">
Show what was added.

```
───────────────────────────────────────────────────────
Content added to: {file}
───────────────────────────────────────────────────────

**Section:** {section heading}
**Tagged:** USER_MODIFIED: {today}
**Last Modified:** updated to {today}

{Brief summary of what was added}
```

End workflow.
</step>

</process>

<success_criteria>
- User describes what to add
- Duplicate check performed across all context files
- Target file and section identified
- User confirms placement before writing
- Content written with USER_MODIFIED tag
- Last Modified timestamp updated
- Changes committed
- Summary shown
</success_criteria>
