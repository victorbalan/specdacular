# Kanban Board Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the 7-column kanban board into 4 columns (Backlog, Ready, In Progress, Finished) with sub-state badges on cards.

**Architecture:** UI-only refactor of `KanbanBoard.jsx`. Replace the `COLUMNS` array with 4 grouped columns, add a sub-state badge to `TaskCard`, and add intra-column sorting by status priority.

**Tech Stack:** React (JSX), inline styles, existing theme system from `../theme`

---

### Task 1: Replace COLUMNS definition with 4-column layout

**Files:**
- Modify: `runner/renderer/src/components/KanbanBoard.jsx:5-13`

- [ ] **Step 1: Replace the COLUMNS array**

Replace lines 5-13 in `KanbanBoard.jsx`:

```jsx
const COLUMNS = [
  { key: 'idea', label: 'Ideas', color: '#868e96', statuses: ['idea'] },
  { key: 'planning', label: 'Planning', color: '#cc5de8', statuses: ['planning'] },
  { key: 'review', label: 'Review', color: '#fcc419', statuses: ['review'] },
  { key: 'ready', label: 'Queued', color: colors.warning, statuses: ['ready', 'queued'] },
  { key: 'in_progress', label: 'Running', color: colors.accent, statuses: ['in_progress'] },
  { key: 'done', label: 'Done', color: colors.success, statuses: ['done'] },
  { key: 'failed', label: 'Failed', color: colors.danger, statuses: ['failed'] },
];
```

With:

```jsx
const COLUMNS = [
  { key: 'backlog', label: 'Backlog', color: '#868e96', statuses: ['idea'], addButton: true },
  { key: 'ready', label: 'Ready', color: colors.warning, statuses: ['review', 'ready'] },
  { key: 'in_progress', label: 'In Progress', color: colors.accent, statuses: ['planning', 'in_progress'] },
  { key: 'finished', label: 'Finished', color: colors.success, statuses: ['done', 'failed'] },
];

const SUB_STATE_LABELS = {
  idea: { label: 'Idea', color: '#868e96' },
  review: { label: 'Needs Review', color: '#fcc419' },
  ready: { label: 'Queued', color: colors.warning },
  planning: { label: 'Planning', color: '#cc5de8' },
  in_progress: { label: 'Running', color: colors.accent },
  done: { label: 'Done', color: colors.success },
  failed: { label: 'Failed', color: colors.danger },
};

// Sort priority within columns (lower = shown first)
const STATUS_PRIORITY = {
  idea: 0,
  review: 0, ready: 1,
  planning: 0, in_progress: 1,
  done: 0, failed: 1,
};
```

- [ ] **Step 2: Update the column "+" button logic**

In `KanbanBoard.jsx`, the current code checks `col.key === 'idea'` on line 43 to decide where the "+" button goes. Change this to use the new `addButton` property:

Replace:
```jsx
const isIdeasCol = col.key === 'idea';
```

With:
```jsx
const isIdeasCol = col.addButton;
```

- [ ] **Step 3: Add intra-column sorting**

In `KanbanBoard.jsx`, the current filter is on line 41:
```jsx
const colTasks = tasks.filter(t => col.statuses.includes(t.status));
```

Replace with:
```jsx
const colTasks = tasks
  .filter(t => col.statuses.includes(t.status))
  .sort((a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99));
```

- [ ] **Step 4: Update the grid template columns**

In `KanbanBoard.jsx` line 34, the grid currently uses `COLUMNS.length` which will now be 4. This is already dynamic, so no change needed. But verify the `minmax` value works for 4 wider columns. Change the min from 140px to 200px for better card readability:

Replace:
```jsx
gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(140px, 1fr))`,
```

With:
```jsx
gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(200px, 1fr))`,
```

- [ ] **Step 5: Verify the app renders**

Run: `cd runner && npm run dev` (or check if the renderer has a dev script)

If no dev script, verify with: `ls runner/renderer/package.json` and check the build command. The Electron app uses Vite, so the renderer should build without errors.

Run: `cd runner && npx vite build renderer`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add runner/renderer/src/components/KanbanBoard.jsx
git commit -m "feat(runner): consolidate kanban board to 4 columns"
```

---

### Task 2: Add sub-state badge to TaskCard

**Files:**
- Modify: `runner/renderer/src/components/KanbanBoard.jsx:262-356` (TaskCard component)

- [ ] **Step 1: Add sub-state badge to TaskCard**

In the `TaskCard` component (line 262), add a sub-state badge. The card's bottom row currently shows the project name badge on the left and the action button on the right (lines 319-339).

Add the sub-state badge next to the project name badge. Find this section in TaskCard:

```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <span style={{
    backgroundColor: colors.bg, borderRadius: radius.sm,
    padding: '1px 5px', fontSize: 10, fontWeight: 500, color: colors.textSecondary,
  }}>
    {task.projectName}
  </span>
```

Replace with:

```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
    <span style={{
      backgroundColor: colors.bg, borderRadius: radius.sm,
      padding: '1px 5px', fontSize: 10, fontWeight: 500, color: colors.textSecondary,
    }}>
      {task.projectName}
    </span>
    {SUB_STATE_LABELS[task.status] && (
      <span style={{
        backgroundColor: colors.bg, borderRadius: radius.sm,
        padding: '1px 5px', fontSize: 10, fontWeight: 500,
        color: SUB_STATE_LABELS[task.status].color,
      }}>
        {SUB_STATE_LABELS[task.status].label}
      </span>
    )}
  </div>
```

Also find the closing `</div>` for the action button area — the current structure has the action button as a sibling of the project name `<span>`. The action button and its wrapping `</div>` stay the same. The only change is wrapping the left side in a `<div>` with the new badge.

- [ ] **Step 2: Verify the build**

Run: `cd runner && npx vite build renderer`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add runner/renderer/src/components/KanbanBoard.jsx
git commit -m "feat(runner): add sub-state badges to kanban task cards"
```
