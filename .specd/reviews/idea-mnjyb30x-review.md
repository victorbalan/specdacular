# Code Review: Kanban Board Refactor (idea-mnjyb30x)

**Reviewer:** Claude Code (superpowers:code-reviewer)  
**Date:** 2026-04-04 (review #2)  
**Commits:** aaf9111..058854a (3 commits)  
**Files changed:** `runner/renderer/src/components/KanbanBoard.jsx`  
**Plan:** `docs/superpowers/plans/2026-04-04-kanban-board-refactor.md`  
**Spec:** `docs/superpowers/specs/2026-04-04-kanban-board-refactor-design.md`

## Status: failure

## Summary

The implementation correctly consolidates the kanban board from 7 columns to 4 and adds sub-state badges to cards. Code quality is good and the change is well-scoped to a single file. However, a critical bug from the prior review remains unfixed: the `queued` status was dropped from the column mapping, making tasks in that state invisible.

## Strengths

- Clean, minimal diff -- only touches what the spec requires
- `addButton` property on column config is cleaner than hardcoded key check
- `STATUS_PRIORITY` with nullish coalescing (`?? 99`) is a safe, extensible sort approach
- Sub-state badge styling is consistent with existing project name badge pattern
- All preserved behaviors verified: add button, ACTION_MAP buttons, auto-execute badge, delete button, PR link, TaskDetailOverlay click-through

## Issues

### CRITICAL: `queued` status dropped from column mapping (unfixed from review #1)

**File:** `KanbanBoard.jsx:7` (COLUMNS), `KanbanBoard.jsx:12-20` (SUB_STATE_LABELS), `KanbanBoard.jsx:22-27` (STATUS_PRIORITY)

The old COLUMNS had `statuses: ['ready', 'queued']` for the Ready column. The new definition only has `['review', 'ready']` -- `queued` is gone entirely. The backend actively assigns `queued` status:

- `runner/main/state/manager.js:20` -- sets `status: 'queued'` when registering tasks
- `runner/renderer/src/components/TaskDetailOverlay.jsx:353` -- has badge for `queued`
- `runner/renderer/src/components/TaskList.jsx:1-2` -- maps `queued` in STATUS_ICONS and STATUS_COLORS
- `runner/tests/state/manager.test.js:35` -- tests assert `queued` status

**Impact:** Tasks with `status === 'queued'` are invisible on the board. They appear in no column.

**Required fix (3 lines):**
1. Line 7: `statuses: ['review', 'ready', 'queued']`
2. Add to SUB_STATE_LABELS: `queued: { label: 'Queued', color: colors.warning },`
3. Add to STATUS_PRIORITY: `queued: 2`

**Root cause:** The spec and plan both omitted `queued` from the status inventory table. The old code had it but neither design doc captured it.

### IMPORTANT: Spec and plan omit `queued` status

Both `docs/superpowers/specs/2026-04-04-kanban-board-refactor-design.md` (line 19, "Current State" table) and the plan should list `queued` alongside `ready` to prevent re-introduction of this bug.

### MINOR: Redundant "Idea" badge in Backlog column

**File:** `KanbanBoard.jsx:12`

Backlog only contains `idea` status. Every card shows an "Idea" badge, but the spec table shows `--` for Backlog badges (line 29). This is cosmetic -- the badge is redundant since the column name already conveys this. Could be fixed by not rendering SUB_STATE_LABELS for single-status columns, or by removing the `idea` entry from SUB_STATE_LABELS.

### MINOR: Secondary sort by creation date missing

**File:** `KanbanBoard.jsx:57`

The spec says: "sorted by status priority, then by creation date." Only status priority sort is implemented. This works if backend returns tasks in creation order and V8's `.sort()` is stable (it is), but the spec requirement isn't explicitly met.

### MINOR: `isIdeasCol` variable name is stale

**File:** `KanbanBoard.jsx:58`

Column is now "Backlog", not "Ideas". Variable should be `hasAddButton` or similar.

## Assessment

| Severity | Count | Issues |
|----------|-------|--------|
| Critical | 1 | `queued` status invisible on board |
| Important | 1 | Spec/plan docs missing `queued` |
| Minor | 3 | Redundant badge, missing secondary sort, stale variable name |

**Verdict:** The critical `queued` bug must be fixed before merge. The 3-line fix is straightforward. Minor issues can be addressed optionally.
