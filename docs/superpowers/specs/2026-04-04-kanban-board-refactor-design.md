# Kanban Board Refactor

## Summary

Consolidate the 7-column kanban board into 4 high-level columns (Backlog, Ready, In Progress, Finished) that give an overview of all tasks. Sub-states are shown as badges on individual task cards. This is a UI-only change — no backend modifications.

## Current State

The `KanbanBoard.jsx` component defines 7 columns, each mapping to a single task status:

| Column | Status |
|--------|--------|
| Ideas | `idea` |
| Planning | `planning` |
| Review | `review` |
| Queued | `ready` |
| Running | `in_progress` |
| Done | `done` |
| Failed | `failed` |

This creates a wide board where most columns are often empty, making it hard to get a quick overview.

## Design

### 4-Column Layout

| Board Column | Color | Statuses | Sub-state badges |
|---|---|---|---|
| **Backlog** | Gray (#868e96) | `idea` | — |
| **Ready** | Orange (warning) | `review`, `ready` | "Needs Review" (yellow), "Queued" (orange) |
| **In Progress** | Blue (accent) | `planning`, `in_progress` | "Planning" (purple), "Running" (blue) |
| **Finished** | Green (success) | `done`, `failed` | "Done" (green), "Failed" (red) |

### Sub-state Badge

Each task card shows a small colored badge indicating its specific status within the column. This replaces the implicit status-from-column that the 7-column layout provided.

Badge styling:
- Small pill (similar to existing project name badge)
- Color matches the original column color for that status
- Positioned in the bottom-left of the card, next to the project name badge

### Preserved Behaviors

- The "+" button stays in the Backlog column (previously Ideas)
- ACTION_MAP buttons remain on cards: "Plan" on ideas, "Approve" on review tasks, "Retry" on failed tasks
- Task click opens TaskDetailOverlay (unchanged)
- Auto-execute badge stays on relevant cards
- Delete button stays on idea cards
- PR link stays on cards with PRs
- Column header shows count badge

### Card Sorting Within Columns

Within each column, tasks are sorted by status priority (so "Needs Review" appears before "Queued" in the Ready column), then by creation date.

## Files Changed

| File | Change |
|------|--------|
| `runner/renderer/src/components/KanbanBoard.jsx` | Replace 7-column COLUMNS with 4-column layout; add sub-state badge to TaskCard |

## Out of Scope

- Backend status changes
- Drag-and-drop between columns
- Changes to the `/specd.status` CLI command
- Changes to TaskDetailOverlay, Dashboard, or ProjectView
- Changes to API response format
