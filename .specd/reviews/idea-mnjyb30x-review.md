# Code Review: Kanban Board Refactor (idea-mnjyb30x)

**Reviewer:** Claude Code (superpowers:code-reviewer)  
**Date:** 2026-04-04  
**Commits:** aaf9111..058854a (3 commits)  
**Files changed:** `runner/renderer/src/components/KanbanBoard.jsx`  
**Plan:** `docs/superpowers/plans/2026-04-04-kanban-board-refactor.md`  
**Spec:** `docs/superpowers/specs/2026-04-04-kanban-board-refactor-design.md`

## Status: failure

## Strengths

- Implementation follows the plan and spec step-by-step for all specified changes
- Single-file scope respected (UI-only change as promised)
- The `addButton` property on columns is cleaner than `col.key === 'idea'`
- Nullish coalescing (`?? 99`) in sort provides safe fallback for unknown statuses
- Sub-state badge styling is consistent with existing project name badge
- All preserved behaviors intact: add button, action buttons, auto-execute, delete, PR link, TaskDetailOverlay

## Issues

### CRITICAL: `queued` status dropped from column mapping

**File:** `runner/renderer/src/components/KanbanBoard.jsx:7`

The old COLUMNS definition included `'queued'` in the Ready column:
```jsx
{ key: 'ready', label: 'Queued', color: colors.warning, statuses: ['ready', 'queued'] },
```

The new definition only maps `['review', 'ready']` -- `'queued'` is gone. The backend actively sets tasks to `'queued'` status:
- `runner/main/state/manager.js:20` - sets status to `queued` when registering tasks
- `runner/renderer/src/components/TaskDetailOverlay.jsx:353` - has a badge definition for `queued`
- `runner/renderer/src/components/TaskList.jsx:1-2` - maps `queued` in both STATUS_ICONS and STATUS_COLORS

**Impact:** Any task with `status === 'queued'` becomes invisible on the kanban board -- it appears in no column.

**Fix required in `KanbanBoard.jsx`:**
1. Add `'queued'` to Ready column statuses (line 7): `statuses: ['review', 'ready', 'queued']`
2. Add to `SUB_STATE_LABELS` (line 14): `queued: { label: 'Queued', color: colors.warning }`
3. Add to `STATUS_PRIORITY` (line 24): `queued: 2` (after `ready: 1`)

**Root cause:** This bug originates in the spec and plan, neither of which listed `queued` as a status. The old COLUMNS had it but the spec's "Current State" table missed it.

### IMPORTANT: Spec and plan docs should be updated

Both `docs/superpowers/specs/2026-04-04-kanban-board-refactor-design.md` and `docs/superpowers/plans/2026-04-04-kanban-board-refactor.md` should include `queued` alongside `ready` to prevent the same oversight if someone re-implements from the spec.

### MINOR: Secondary sort by creation date not implemented

**File:** `runner/renderer/src/components/KanbanBoard.jsx:57`

The spec states: "tasks are sorted by status priority... **then by creation date.**" The implementation only sorts by `STATUS_PRIORITY`. If the backend already returns tasks sorted by creation date and JS `.sort()` is stable (it is in V8), this works incidentally. But the spec requirement is not explicitly met.

### MINOR: Redundant sub-state badge on Backlog column

The Backlog column only contains `idea` status. Every card shows an "Idea" badge, which is redundant since the column name already conveys this. The spec's table shows `--` for Backlog badges, implying none should appear.

### MINOR: Stale variable name `isIdeasCol`

**File:** `runner/renderer/src/components/KanbanBoard.jsx:58`

The column is now "Backlog", not "Ideas". `isIdeasCol` should be renamed to `hasAddButton` or `showAddButton` for clarity.

## Summary

| Severity | Issue |
|----------|-------|
| Critical | `queued` status dropped -- tasks become invisible |
| Important | Spec/plan docs missing `queued` status |
| Minor | Secondary sort by creation date not implemented per spec |
| Minor | Redundant "Idea" badge on single-status Backlog column |
| Minor | `isIdeasCol` variable name is stale |

The critical `queued` status issue must be fixed before merging. Tasks in the `queued` state will not render on the board, which is a data visibility bug.
