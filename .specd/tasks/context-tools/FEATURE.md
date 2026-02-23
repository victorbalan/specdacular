# Task: context-tools

## What This Is

Add context management commands (`context:review`, `context:add`, `context:status`) to the specd toolbox, allowing users to manually review, edit, and extend the `.specd/codebase/` documentation files with staleness tracking and USER_MODIFIED tagging.

## Technical Requirements

### Must Create

- [ ] `specdacular/workflows/context-review.md` — Guided section-by-section review workflow with edit/remove/re-map options
- [ ] `specdacular/workflows/context-add.md` — Guided workflow to add new content to the right file and section
- [ ] `specdacular/workflows/context-status.md` — Dashboard showing all context files with timestamps and staleness

### Must Integrate With

- `commands/specd.toolbox.md` — Add Context Review, Context Add, Context Status as new menu options
- `.specd/codebase/*.md` (MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md) — Read, parse sections, edit in place
- `agents/specd-codebase-mapper.md` — Spawn for targeted single-section re-mapping
- `specdacular/workflows/map-codebase.md` — Reuse mapper agent pattern for targeted re-runs

### Constraints

- **Inline timestamps** — Last reviewed/modified dates stored in each context file (extend existing `Generated:` line), not in a separate metadata file
- **USER_MODIFIED tags** — Manual edits must be tagged with `<!-- USER_MODIFIED: YYYY-MM-DD -->` so re-mapping can respect them
- **Targeted re-mapping** — Re-run mapper for a single section, not the whole file. Pass USER_MODIFIED context to the mapper agent so it considers user changes
- **Zero dependencies** — No new npm packages or external tools. Pure workflow/command changes
- **Toolbox integration** — These are toolbox operations, not standalone `/specd.context:*` commands

---

## Success Criteria

- [ ] `/specd.toolbox` shows Context Review, Context Add, Context Status as options
- [ ] `context:review` walks through a selected file section by section with readable display
- [ ] User can confirm, manually edit (adds USER_MODIFIED tag), or remove any section
- [ ] User can re-run mapper for a single section and see diff against current content
- [ ] Re-mapping respects USER_MODIFIED sections by passing them as context to the mapper agent
- [ ] `context:add` identifies the correct file/section and places new content with USER_MODIFIED tag
- [ ] `context:status` shows all 4 files with last reviewed, last modified, and staleness indicator
- [ ] Timestamps update inline in context files on review/modification

---

## Out of Scope

- [X] Full codebase re-mapping — Already handled by `/specd.codebase.map`
- [X] Automatic staleness detection/alerts — Just show timestamps, don't nag
- [X] Version history of context files — Git handles this
- [X] New standalone commands — Everything goes through toolbox

---

## Initial Context

### User Need
Users want manual control over the AI-generated codebase documentation. Map-codebase is automatic but sometimes sections need correction, removal, or additions that only the user knows about.

### Integration Points
- Toolbox menu (`commands/specd.toolbox.md`) — new options added
- Codebase mapper agent (`agents/specd-codebase-mapper.md`) — spawned for targeted re-mapping
- Context files (`.specd/codebase/*.md`) — read/write with section parsing

### Key Constraints
- USER_MODIFIED tags must survive re-mapping (mapper receives them as context)
- Section-level granularity for both review and re-mapping
- Timestamps are inline in markdown, not in separate config
