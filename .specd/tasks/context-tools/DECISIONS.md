# Decisions: context-tools

**Task:** context-tools
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

---

## Active Decisions

### DEC-001: Inline timestamps in context files

**Date:** 2026-02-17
**Status:** Active
**Context:** Need to track when context files were last reviewed/modified to show staleness
**Decision:** Store timestamps inline in each context file, extending the existing `Generated:` line pattern
**Rationale:**
- Context files already have a `Generated: YYYY-MM-DD` line
- Keeps metadata co-located with content
- No need for a separate metadata file to manage
**Implications:**
- Each `.specd/codebase/*.md` file gets `Last Reviewed:` and `Last Modified:` lines
- Status command parses these lines from each file
- Review/edit operations must update these timestamps

### DEC-002: USER_MODIFIED tagging with mapper awareness

**Date:** 2026-02-17
**Status:** Active
**Context:** Users may manually edit sections, but later want to re-run the mapper for that section
**Decision:** Tag manual edits with `<!-- USER_MODIFIED: YYYY-MM-DD -->`. When re-mapping, pass the user-modified content to the mapper agent as context. Show diff and let user choose.
**Rationale:**
- Preserves user intent across re-mapping cycles
- HTML comments don't affect markdown rendering
- Mapper can intelligently merge user knowledge with fresh analysis
**Implications:**
- Mapper agent prompt must include USER_MODIFIED sections and their dates
- Review workflow must detect and surface USER_MODIFIED tags
- Diff display needed when re-mapping produces different results

### DEC-003: Toolbox integration, not standalone commands

**Date:** 2026-02-17
**Status:** Active
**Context:** Initially considered `/specd:context:*` standalone commands
**Decision:** Add as operations in `/specd:toolbox` menu instead
**Rationale:**
- Keeps command namespace clean
- Consistent with existing toolbox pattern for advanced operations
- Reduces number of top-level commands
**Implications:**
- `commands/specd/toolbox.md` must be updated with new menu options
- Workflows still live in separate files (`context-review.md`, `context-add.md`, `context-status.md`)
- No new command files needed in `commands/specd/`

---

## Superseded Decisions

---

## Revoked Decisions

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-17 | Inline timestamps in context files | Active |
| DEC-002 | 2026-02-17 | USER_MODIFIED tagging with mapper awareness | Active |
| DEC-003 | 2026-02-17 | Toolbox integration, not standalone commands | Active |
