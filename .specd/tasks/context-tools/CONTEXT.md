# Context: context-tools

**Last Updated:** 2026-02-17
**Sessions:** 1

## Discussion Summary

User wants to add context management commands to specd's toolbox. Three operations: review (guided section-by-section walkthrough with edit/remove/re-map), add (guided placement of new content), and status (dashboard with staleness). Key design decisions include USER_MODIFIED tagging for manual edits, inline timestamps in context files, and targeted single-section re-mapping that respects user modifications.

---

## Resolved Questions

### Where do timestamps live?

**Question:** Should timestamps be in a separate metadata file or inline in context files?

**Resolution:** Inline in context files, extending the existing `Generated:` pattern.

**Details:**
- Each file already has a `Generated: YYYY-MM-DD` line
- Add `Last Reviewed:` and `Last Modified:` lines alongside it
- No separate config file needed

**Related Decisions:** DEC-001

### How does manual editing interact with re-mapping?

**Question:** When a user manually edits a section, what happens if they later re-run the mapper for that section?

**Resolution:** Manual edits get a `USER_MODIFIED` tag. When re-mapping, the mapper receives the user's modifications as context to consider. User sees the diff and chooses: accept new, keep current, or manually edit further.

**Details:**
- USER_MODIFIED tag format: `<!-- USER_MODIFIED: YYYY-MM-DD -->`
- Mapper agent prompt includes the user-modified content and timestamp
- Diff is shown to user before any replacement
- User has final say on all changes

**Related Decisions:** DEC-002

### Where do these commands live?

**Question:** Standalone commands or part of toolbox?

**Resolution:** Part of the toolbox (`/specd:toolbox`), not standalone `/specd:context:*` commands.

**Details:**
- Added as new options in the toolbox menu
- Three operations: Context Review, Context Add, Context Status
- Workflows live in `specdacular/workflows/context-*.md`

**Related Decisions:** DEC-003

---

## Deferred Questions

### Section parsing strategy

**Reason:** Implementation detail — depends on how context files are structured (headers, content blocks)
**Default for now:** Parse by `##` headers as section boundaries
**Revisit when:** During planning/implementation

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-17 | Operations, USER_MODIFIED flow, timestamps, toolbox integration | FEATURE.md created, 3 decisions recorded |

---

## Gray Areas Remaining

- [ ] Exact USER_MODIFIED tag format and placement within sections — needs to work with markdown rendering
- [ ] How to handle nested sections (### under ##) during review — walk through individually or group?
- [ ] Staleness threshold — what counts as "stale"? Days since last review? Configurable?

---

## Quick Reference

- **Task:** `.specd/tasks/context-tools/FEATURE.md`
- **Decisions:** `.specd/tasks/context-tools/DECISIONS.md`
- **Research:** `.specd/tasks/context-tools/RESEARCH.md` (if exists)
