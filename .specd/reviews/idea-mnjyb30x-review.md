# Code Review: Kanban Board Refactor (idea-mnjyb30x)

**Reviewer:** Claude Code  
**Date:** 2026-04-04  
**Commits:** aaf9111..058854a (3 commits)  
**Files changed:** `runner/renderer/src/components/KanbanBoard.jsx`  
**Plan:** `docs/superpowers/plans/2026-04-04-kanban-board-refactor.md`  
**Spec:** `docs/superpowers/specs/2026-04-04-kanban-board-refactor-design.md`

## Status: failure

## Strengths

- Implementation faithfully follows the plan and spec for all specified changes
- Single-file scope was respected (UI-only change as promised)
- The `addButton` property on columns is cleaner and more extensible than `col.key === 'idea'`
- Nullish coalescing (`?? 99`) in sort provides safe fallback for unknown statuses
- Sub-state badge styling is consistent with existing project name badge

## Issues

### CRITICAL: `queued` status dropped from column mapping

**File:** `runner/renderer/src/components/KanbanBoard.jsx:7`

The old COLUMNS definition included `'queued'` in the Ready column:
```jsx
{ key: 'ready', label: 'Queued', color: colors.warning, statuses: ['ready', 'queued'] },
```

The new definition only has `['review', 'ready']` -- `'queued'` is gone. The backend actively sets tasks to `'queued'` status (`runner/main/state/manager.js:20`), and other UI components handle it (`TaskDetailOverlay.jsx:353`, `TaskList.jsx:1-2`).

**Impact:** Any task with `status === 'queued'` becomes invisible on the kanban board -- it appears in no column.

**Fix required:**
1. Add `'queued'` to Ready column statuses: `statuses: ['review', 'ready', 'queued']`
2. Add to `SUB_STATE_LABELS`: `queued: { label: 'Queued', color: colors.warning }`
3. Add to `STATUS_PRIORITY`: `queued: 1`

Note: This bug originates in the plan/spec themselves, which did not account for the `queued` status.

### IMPORTANT: Secondary sort by creation date not implemented

**File:** `runner/renderer/src/components/KanbanBoard.jsx:57`

The spec states: "tasks are sorted by status priority... **then by creation date.**"

The implementation only sorts by `STATUS_PRIORITY`. If the backend already returns tasks sorted by creation date and JS `.sort()` is stable (it is in V8), this works incidentally. But the spec requirement is not explicitly met. Either add a secondary sort key or document the assumption.

### MINOR: Redundant sub-state badge on Backlog column

The Backlog column only contains `idea` status. Every card shows an "Idea" badge, which is redundant since the column name already conveys this. The spec's table shows `--` for Backlog badges, implying none should appear.

### MINOR: Stale variable name `isIdeasCol`

**File:** `runner/renderer/src/components/KanbanBoard.jsx:58`

The column is now "Backlog", not "Ideas". `isIdeasCol` should be renamed to `hasAddButton` or `showAddButton`.

## Summary

| Severity | Issue |
|----------|-------|
| Critical | `queued` status dropped -- tasks become invisible |
| Important | Secondary sort by creation date not implemented per spec |
| Minor | Redundant "Idea" badge on single-status Backlog column |
| Minor | `isIdeasCol` variable name is stale |

The critical `queued` status issue must be fixed before merging. This is a data loss bug -- tasks in the `queued` state will not render on the board.
