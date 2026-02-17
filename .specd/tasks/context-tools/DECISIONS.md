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

### DEC-004: USER_MODIFIED tag placement after section header

**Date:** 2026-02-17
**Status:** Active
**Context:** Need a format for USER_MODIFIED tags that doesn't affect markdown rendering
**Decision:** HTML comment `<!-- USER_MODIFIED: YYYY-MM-DD -->` placed on the line immediately after the section header
**Rationale:**
- HTML comments are invisible when rendered
- Placement after header makes it easy to detect per-section
- Date allows mapper to assess recency of user changes
**Implications:**
- Section parsing must check the line after each header for the tag
- Review workflow surfaces the tag and date to the user
- Mapper agent receives the tag context when re-mapping

### DEC-005: Walk both ## and ### levels during review

**Date:** 2026-02-17
**Status:** Active
**Context:** Context files have nested sections (## with ### children). Need to decide review granularity.
**Decision:** Walk both `##` and `###` levels individually for full granular control
**Rationale:**
- Users may want to edit a specific subsection without reviewing the whole parent
- More precise re-mapping when targeting a specific subsection
**Implications:**
- Section parser must handle both levels
- Review flow shows each `###` individually, not grouped under parent
- Re-mapping can target a single `###` section

### DEC-006: Simple date display for staleness, no thresholds

**Date:** 2026-02-17
**Status:** Active
**Context:** Need to indicate staleness of context files
**Decision:** Show "Last Reviewed: X days ago" with no judgment or threshold — user decides what's stale
**Rationale:**
- Avoids arbitrary thresholds that may not fit all projects
- Keeps implementation simple
- Can always add smarter detection later
**Implications:**
- Status command calculates days since last review/modification
- No configuration needed for thresholds
- No alerts or warnings, just information

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
| DEC-004 | 2026-02-17 | USER_MODIFIED tag placement after section header | Active |
| DEC-005 | 2026-02-17 | Walk both ## and ### levels during review | Active |
| DEC-006 | 2026-02-17 | Simple date display for staleness, no thresholds | Active |
