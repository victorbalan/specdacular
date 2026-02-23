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
**Context:** Initially considered `/specd.context:*` standalone commands
**Decision:** Add as operations in `/specd.toolbox` menu instead
**Rationale:**
- Keeps command namespace clean
- Consistent with existing toolbox pattern for advanced operations
- Reduces number of top-level commands
**Implications:**
- `commands/specd.toolbox.md` must be updated with new menu options
- Workflows still live in separate files (`context-review.md`, `context-add.md`, `context-status.md`)
- No new command files needed in `commands/specd.`

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

### DEC-007: Semantic diff summaries over raw line diffs

**Date:** 2026-02-17
**Status:** Active
**Context:** Research found that LLM-regenerated content causes "style drift" — phrasing changes even when facts are identical, making raw diffs misleading
**Decision:** Show both current and re-mapped content in readable fenced blocks, with a semantic "Key differences" summary focusing on factual changes (added/removed/changed information)
**Rationale:**
- Raw unified diffs create noise from phrasing differences
- Users need to compare meaning, not exact wording
- Pre-warn users about style drift
**Implications:**
- Review workflow must present side-by-side content with semantic summary
- Agent must be instructed to summarize factual differences
**References:**
- Research: style drift pitfall, diff display pattern

### DEC-008: Git checkpoint before destructive review actions

**Date:** 2026-02-17
**Status:** Active
**Context:** Research identified that section removal has no recovery path in a workflow-only system
**Decision:** Create a git commit checkpoint at the start of a review session before any destructive operations
**Rationale:**
- Provides recovery via `git checkout` if user removes wrong section
- Low cost (one commit), high safety value
- Follows existing review.md pattern of committing at boundaries
**Implications:**
- Review workflow must commit current state before starting section walk
- Commit message: `docs: pre-review checkpoint for {file}`

### DEC-009: ~~Targeted re-mapping via inline Task prompt, not new agent~~

**Date:** 2026-02-17
**Status:** Superseded by DEC-011
**Context:** Research suggested either a new `specd-section-remapper` agent or inline Task prompt for single-section re-mapping
**Decision:** Use inline Task prompt (general-purpose agent) rather than creating a new named agent
**Rationale:**
- Avoids adding a new agent file for a narrow use case
- The prompt is specific enough to work without a dedicated role definition
- Can always extract to a named agent later if reuse grows
**Implications:**
- No new agent files needed
- Task prompt in context-review.md must include section heading, current content, USER_MODIFIED context, and scope constraints

### DEC-010: Context workflows skip task validation

**Date:** 2026-02-17
**Status:** Active
**Context:** Research found that context operations work on project-level `.specd/codebase/` docs, not task-specific docs
**Decision:** Context workflows validate that `.specd/codebase/` exists instead of validating a task name
**Rationale:**
- Context files are project-scoped, not task-scoped
- Using validate-task.md would incorrectly require a task name
**Implications:**
- Context workflows use their own validation step: check `.specd/codebase/` exists
- If missing, suggest `/specd.map-codebase`

### DEC-011: Use specd-codebase-mapper agent for section re-mapping

**Date:** 2026-02-17
**Status:** Active
**Context:** DEC-009 used a general-purpose agent for re-mapping. The map-codebase workflow already has file-type-specific prompts for the specd-codebase-mapper agent. Re-mapping should use the same agent and logic for consistency.
**Decision:** Use `specd-codebase-mapper` agent with file-type-specific focus (map/patterns/structure/concerns) for section re-mapping, matching the map-codebase process.
**Rationale:**
- Same agent that created the content re-analyzes it — consistent quality
- File-type-specific focus ensures the agent knows what kind of content to produce
- Spawning a separate agent keeps context clean and matches the map-codebase pattern
**Implications:**
- Re-map action in context-review.md uses `subagent_type: "specd-codebase-mapper"` instead of `"general-purpose"`
- Must map file name to focus: MAP.md→map, PATTERNS.md→patterns, STRUCTURE.md→structure, CONCERNS.md→concerns
- Agent prompt scoped to single section with codebase exploration
- Supersedes DEC-009

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
| DEC-007 | 2026-02-17 | Semantic diff summaries over raw line diffs | Active |
| DEC-008 | 2026-02-17 | Git checkpoint before destructive review actions | Active |
| DEC-009 | 2026-02-17 | Targeted re-mapping via inline Task prompt, not new agent | Active |
| DEC-010 | 2026-02-17 | Context workflows skip task validation | Active |
| DEC-011 | 2026-02-17 | Use specd-codebase-mapper for section re-mapping | Active |
