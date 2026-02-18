---
task: context-tools
phase: 2
depends_on: [1]
creates:
  - specdacular/workflows/context-review.md
  - specdacular/workflows/context-add.md
modifies: []
---

# Phase 2: Context Review and Context Add Workflows

## Objective

Create the `context:review` workflow (guided section-by-section review with edit/remove/re-map) and the `context:add` workflow (guided addition of new content). These are the core interactive workflows.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Workflow structure pattern, AskUserQuestion pattern
- `@specdacular/workflows/discuss.md` — Example of interactive conversation workflow
- `@specdacular/workflows/map-codebase.md` — Agent spawning pattern for re-mapping
- `@specdacular/references/commit-docs.md` — Commit pattern
- `@agents/specd-codebase-mapper.md` — Mapper agent definition (for re-mapping prompt context)

**Relevant Decisions:**
- DEC-001: Inline timestamps — update `Last Reviewed:` and `Last Modified:` on operations
- DEC-002: USER_MODIFIED tagging with mapper awareness
- DEC-004: Tag placement: `<!-- USER_MODIFIED: YYYY-MM-DD -->` on line after section header
- DEC-005: Walk both ## and ### levels during review
- DEC-007: Semantic diff summaries over raw line diffs for re-mapping
- DEC-008: Git checkpoint before destructive review actions
- DEC-009: Targeted re-mapping via inline Task prompt, not new agent
- DEC-010: Context workflows skip task validation

**From Research:**
- Section parsing: explicit boundary rules (## runs until next ##, ### runs until next ### or ##)
- Code fences do NOT start new sections even if they contain `#`
- Style drift: frame re-mapped diffs as semantic differences, pre-warn user
- Partial context: post-re-map, verify file paths still exist
- Review fatigue: offer "confirm all remaining" escape hatch
- Remove safety: count and warn about child sections before removal
- context:add: always confirm target section before writing; grep for duplicates first

---

## Tasks

### Task 1: Create context-review.md workflow

**Files:** `specdacular/workflows/context-review.md`

**Action:**
Create the review workflow with these steps:

1. **validate** — Check `.specd/codebase/` exists.

2. **select_file** — Use AskUserQuestion to let user pick which file to review (MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md). Show last reviewed date for each.

3. **git_checkpoint** — Per DEC-008, commit current state of the selected file before any changes:
   ```
   git add .specd/codebase/{FILE} && git commit -m "docs: pre-review checkpoint for {FILE}"
   ```

4. **parse_sections** — Read the file. Build section list following these rules:
   - `##` heading starts a top-level section (runs until next `##` or EOF)
   - `###` heading starts a subsection (runs until next `###`, `##`, or EOF)
   - Ignore `#` document title
   - Code fences (```) do NOT start new sections
   - For each section, note: heading level, heading text, content, has USER_MODIFIED tag (yes/date or no)

5. **walk_sections** — For each section (both ## and ### per DEC-005):

   **Display the section** in a clean, readable format:
   ```
   ──────────────────────────────────────────
   {## or ###} {Section Title}
   {If USER_MODIFIED: "User modified: YYYY-MM-DD"}
   ──────────────────────────────────────────

   {section content, formatted for readability}
   ```

   **Use AskUserQuestion** with options:
   - "Confirm" — Section is correct, move to next
   - "Edit" — Tell the agent what to change (adds USER_MODIFIED tag)
   - "Remove" — Delete this section (with child section warning per research)
   - "Re-map" — Re-run mapper for this section and show diff
   - "Confirm all remaining" — Skip rest of sections (mark all as reviewed)

   **If Edit:**
   - Ask user what to change
   - Apply the edit using Edit tool
   - Add/update `<!-- USER_MODIFIED: YYYY-MM-DD -->` after the section header
   - Continue to next section

   **If Remove:**
   - If section is `##` with `###` children, warn: "Removing will also remove {N} subsections. Confirm?"
   - If confirmed, remove the section (and children if applicable)
   - Continue to next section

   **If Re-map:**
   - Spawn a general-purpose Task agent (per DEC-009) with scoped prompt:
     - Section heading to re-map
     - Current section content
     - If USER_MODIFIED, include user's modifications and date as context for mapper
     - Scope constraint: only re-map this section, not others
     - List other section headings to NOT cover
   - When agent returns, present semantic diff (per DEC-007):
     - Show current content and re-mapped content in fenced blocks
     - Summarize key factual differences
     - Pre-warn about style drift
   - Use AskUserQuestion: "Accept new", "Keep current", "Edit manually"
   - If "Accept new", replace section content (remove USER_MODIFIED tag since it's now machine-generated)
   - If "Edit manually", let user specify changes, add USER_MODIFIED tag

6. **update_timestamps** — Update the file's header timestamps:
   - Set `Last Reviewed: YYYY-MM-DD` (always, since user reviewed)
   - Set `Last Modified: YYYY-MM-DD` (only if any edits/removes/re-maps were made)
   - If these lines don't exist yet, add them after the `Generated:` line

7. **commit** — Use commit-docs.md reference:
   - `$FILES`: `.specd/codebase/{FILE}`
   - `$MESSAGE`: `docs: review {FILE}` with summary of changes
   - `$LABEL`: `context review`

8. **completion** — Show summary: sections reviewed, edits made, sections removed, sections re-mapped.

**Verify:**
```bash
[ -f "specdacular/workflows/context-review.md" ] && echo "exists"
```

**Done when:**
- [ ] Workflow has all 8 steps with full process logic
- [ ] Section parsing handles both ## and ### levels
- [ ] USER_MODIFIED tags are detected and surfaced
- [ ] Edit adds USER_MODIFIED tag
- [ ] Remove warns about child sections
- [ ] Re-map spawns targeted agent with scoped prompt
- [ ] Diff is presented as semantic summary
- [ ] Timestamps updated after review
- [ ] Git checkpoint created before destructive operations
- [ ] "Confirm all remaining" escape hatch included

---

### Task 2: Create context-add.md workflow

**Files:** `specdacular/workflows/context-add.md`

**Action:**
Create the add workflow with these steps:

1. **validate** — Check `.specd/codebase/` exists.

2. **gather_input** — Ask user: "What do you want to add to the codebase context?" Wait for response.

3. **identify_target** — Based on user's description:
   - Read all 4 context files to understand current structure
   - Grep for key terms from the proposed addition across all files (check for duplicates per research pitfall)
   - Determine the best file and section for the new content
   - If similar content exists, show it: "Similar content exists at `{FILE}:{section}`. Add anyway, update existing, or cancel?"

4. **confirm_placement** — Show the chosen target and ask confirmation:
   ```
   I'll add this to: {FILE} → {## Section} → {### Subsection if applicable}

   Content to add:
   {formatted content}
   ```
   Use AskUserQuestion: "Confirm", "Different section", "Cancel"

   If "Different section": show list of all sections across all files for manual selection.

5. **write_content** — Insert content at the chosen location:
   - Add the content under the target section
   - Add `<!-- USER_MODIFIED: YYYY-MM-DD -->` tag after the section header (if not already present, or update existing)
   - Update `Last Modified: YYYY-MM-DD` in file header

6. **commit** — Use commit-docs.md reference:
   - `$FILES`: `.specd/codebase/{FILE}`
   - `$MESSAGE`: `docs: add to {FILE} — {brief description}`
   - `$LABEL`: `context addition`

7. **completion** — Show what was added and where.

**Verify:**
```bash
[ -f "specdacular/workflows/context-add.md" ] && echo "exists"
```

**Done when:**
- [ ] Workflow has all 7 steps
- [ ] Duplicate detection via grep before adding
- [ ] Target confirmation before writing
- [ ] USER_MODIFIED tag added to modified section
- [ ] Timestamps updated
- [ ] Committed via commit-docs.md

---

## Verification

After all tasks complete:

```bash
[ -f "specdacular/workflows/context-review.md" ] && [ -f "specdacular/workflows/context-add.md" ] && echo "phase 2 complete"
```

**Phase is complete when:**
- [ ] Both workflow files exist with full process logic
- [ ] Follow existing workflow structure patterns
- [ ] All decisions (DEC-001 through DEC-010) are reflected in the workflows

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/context-tools/CHANGELOG.md`.
