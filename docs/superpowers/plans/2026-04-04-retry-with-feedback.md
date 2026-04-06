# Retry with Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two retry modes for failed/done tasks — "retry from scratch" (wipe branch, restart lifecycle) and "retry with feedback" (keep branch, accumulate guidance, re-run pipeline).

**Architecture:** Two new actions (`retry-fresh`, `retry-feedback`) in the existing `advanceTask` dispatch. Template context gains `task.feedback`. State manager gains `clearTask`. UI extends the existing re-plan textarea pattern to failed/done states.

**Tech Stack:** Node.js (ES modules), React (JSX), node:test for testing

---

## File Structure

| File | Responsibility |
|------|---------------|
| `runner/main/state/manager.js` | Add `clearTask(taskId)` to remove stage history |
| `runner/main/agent/template.js` | Add `task.feedback` to template context |
| `runner/main/orchestrator.js` | Add `retry-fresh` and `retry-feedback` actions |
| `runner/main/ipc.js` | Fix `retry-task` handler to route through `advanceTask` |
| `runner/main/server/api.js` | Update retry endpoint to accept mode + feedback |
| `runner/renderer/src/components/TaskDetailOverlay.jsx` | Two retry buttons + feedback textarea for failed/done |
| `runner/renderer/src/components/KanbanBoard.jsx` | Update ACTION_MAP for failed/done |

---

### Task 1: StateManager — Add `clearTask` method

**Files:**
- Modify: `runner/main/state/manager.js:76-84` (add method before `persist()`)

- [ ] **Step 1: Add clearTask method**

In `runner/main/state/manager.js`, add the `clearTask` method after `getCompletedStages` (line 81) and before `persist` (line 82):

```js
clearTask(taskId) {
  delete this.state.tasks[taskId];
  this.persist();
  this._emit('task_cleared', { taskId });
}
```

- [ ] **Step 2: Verify the module still exports correctly**

Run: `node -e "import('./runner/main/state/manager.js').then(m => console.log(typeof m.StateManager.prototype.clearTask))"`
Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add runner/main/state/manager.js
git commit -m "feat(runner): add clearTask to StateManager for retry-fresh"
```

---

### Task 2: Template Context — Add `task.feedback`

**Files:**
- Modify: `runner/main/agent/template.js:8-17` (extend `buildTemplateContext`)

- [ ] **Step 1: Update buildTemplateContext to include feedback**

In `runner/main/agent/template.js`, change the `task` property in `buildTemplateContext` (line 10):

Replace:
```js
task: { id: task.id, name: task.name, spec: task.spec || '' },
```

With:
```js
task: { id: task.id, name: task.name, spec: task.spec || '', feedback: task.feedback || '' },
```

- [ ] **Step 2: Verify the template resolves feedback**

Run: `node -e "import('./runner/main/agent/template.js').then(m => { const ctx = m.buildTemplateContext({id:'t1',name:'Test',spec:'s',feedback:'fix the auth'},{name:'impl',index:1,total:2},{name:'default'},{statusJson:'/s',logsDir:'/l'}); console.log(ctx.task.feedback); })"`
Expected: `fix the auth`

- [ ] **Step 3: Commit**

```bash
git add runner/main/agent/template.js
git commit -m "feat(runner): expose task.feedback in agent template context"
```

---

### Task 3: Orchestrator — Add `retry-fresh` and `retry-feedback` actions

**Files:**
- Modify: `runner/main/orchestrator.js:119-167` (extend `advanceTask`)

- [ ] **Step 1: Add retry-fresh action**

In `runner/main/orchestrator.js`, replace the existing `retry` action block (lines 160-164):

```js
if (action === 'retry') {
  const newStatus = task.failed_pipeline === 'brainstorm' ? 'idea' : 'ready';
  this.updateTask(taskId, { status: newStatus, failed_pipeline: null });
  return this.getTask(taskId);
}
```

With both new actions:

```js
if (action === 'retry' || action === 'retry-fresh') {
  // Clean slate: remove worktree/branch, clear all state
  if (this.worktreeManager) {
    try { this.worktreeManager.remove(taskId, true); } catch {}
  }
  this.stateManager.clearTask(taskId);
  this.updateTask(taskId, {
    status: 'idea',
    failed_pipeline: null,
    pr_url: null,
    spec: '',
    feedback: '',
    completed_stages: null,
  });
  return this.getTask(taskId);
}

if (action === 'retry-feedback') {
  const updatedFeedback = [task.feedback, feedback].filter(Boolean).join('\n\n---\n\n');
  if (task.failed_pipeline === 'brainstorm') {
    this.updateTask(taskId, { status: 'planning', feedback: updatedFeedback, failed_pipeline: null });
    this._runBrainstormPipeline({ ...task, feedback: updatedFeedback }, []).catch(err => {
      console.error(`Retry brainstorm failed for ${taskId}:`, err);
      this.updateTask(taskId, { status: 'failed', failed_pipeline: 'brainstorm' });
      this.stateManager.updateTaskStatus(taskId, 'failed');
      this.stateManager.persist();
    });
  } else {
    this.stateManager.clearTask(taskId);
    this.updateTask(taskId, { status: 'ready', feedback: updatedFeedback, failed_pipeline: null, completed_stages: null });
  }
  return this.getTask(taskId);
}
```

The `retry-feedback` action for execution failures sets status to `ready` so the orchestrator loop picks it up and re-runs `runTask`. The task's `.feedback` field is already passed to `buildTemplateContext` (from Task 2), so the agent sees it.

- [ ] **Step 2: Verify the task object carries feedback into runTask**

Check that `runTask` already passes the full task to `buildTemplateContext`. Read `runner/main/orchestrator.js` line 309 to confirm:

```js
const context = buildTemplateContext(task, stage, pipeline, this.projectPaths, previousOutput);
```

The `task` here is loaded from disk (line 329 uses `task.spec`), and now includes `task.feedback` from the update. The template context (Task 2) now exposes `{{task.feedback}}`.

- [ ] **Step 3: Commit**

```bash
git add runner/main/orchestrator.js
git commit -m "feat(runner): add retry-fresh and retry-feedback actions to advanceTask"
```

---

### Task 4: IPC — Fix `retry-task` handler

**Files:**
- Modify: `runner/main/ipc.js:56-61`

- [ ] **Step 1: Update retry-task IPC handler**

In `runner/main/ipc.js`, replace the `retry-task` handler (lines 56-61):

```js
ipcMain.handle('retry-task', (event, projectId, taskId) => {
  const { orchestrators } = getContext();
  const orch = orchestrators.get(projectId);
  if (!orch) return null;
  return orch.updateTask(taskId, { status: 'ready' });
});
```

With:

```js
ipcMain.handle('retry-task', (event, projectId, taskId) => {
  const { orchestrators } = getContext();
  const orch = orchestrators.get(projectId);
  if (!orch) return null;
  return orch.advanceTask(taskId, 'retry-fresh');
});
```

- [ ] **Step 2: Commit**

```bash
git add runner/main/ipc.js
git commit -m "fix(runner): route retry-task IPC through advanceTask"
```

---

### Task 5: REST API — Update retry endpoint

**Files:**
- Modify: `runner/main/server/api.js:104-113`

- [ ] **Step 1: Update retry endpoint to accept mode and feedback**

In `runner/main/server/api.js`, replace the retry route (lines 105-113):

```js
router.post('/projects/:id/tasks/:taskId/retry', (req, res) => {
  const { orchestrators } = getContext();
  const orch = orchestrators.get(req.params.id);
  if (!orch) return res.status(404).json({ error: 'Project not found' });

  const task = orch.updateTask(req.params.taskId, { status: 'ready' });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});
```

With:

```js
router.post('/projects/:id/tasks/:taskId/retry', (req, res) => {
  const { orchestrators } = getContext();
  const orch = orchestrators.get(req.params.id);
  if (!orch) return res.status(404).json({ error: 'Project not found' });

  const mode = req.body.mode || 'fresh';
  const action = mode === 'feedback' ? 'retry-feedback' : 'retry-fresh';
  const result = orch.advanceTask(req.params.taskId, action, req.body.feedback);
  if (!result) return res.status(404).json({ error: 'Task not found' });
  res.json(result);
});
```

- [ ] **Step 2: Commit**

```bash
git add runner/main/server/api.js
git commit -m "feat(runner): update retry API endpoint to support mode and feedback"
```

---

### Task 6: UI — TaskDetailOverlay retry buttons and feedback textarea

**Files:**
- Modify: `runner/renderer/src/components/TaskDetailOverlay.jsx:49-51, 129-138`

- [ ] **Step 1: Add retry feedback state**

In `TaskDetailOverlay.jsx`, add state for the retry feedback UI. After line 22 (`const [replanFeedback, setReplanFeedback] = useState('');`), add:

```jsx
const [showRetryFeedback, setShowRetryFeedback] = useState(false);
const [retryFeedback, setRetryFeedback] = useState('');
```

- [ ] **Step 2: Remove the old handleRetry function**

Delete the `handleRetry` function (lines 49-51):

```jsx
const handleRetry = async () => {
  await window.specd.invoke('retry-task', task.projectId, task.id);
};
```

This is no longer needed — retry actions go through `onAdvance`.

- [ ] **Step 3: Replace the failed-state retry button**

Replace the failed-state retry button block (lines 129-138):

```jsx
{currentStatus === 'failed' && (
  <button onClick={() => onAdvance?.('retry')} style={{
    padding: '7px 16px', marginBottom: 20, borderRadius: radius.md,
    border: `1px solid ${colors.danger}`, color: colors.danger,
    backgroundColor: colors.surface, cursor: 'pointer', fontSize: 13,
    transition: 'all 0.15s ease',
  }}>
    Retry task
  </button>
)}
```

With:

```jsx
{(currentStatus === 'failed' || currentStatus === 'done') && (
  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
    <button
      onClick={() => onAdvance?.('retry-fresh')}
      style={{
        padding: '7px 16px', borderRadius: radius.md,
        border: `1px solid ${colors.danger}`, color: colors.danger,
        backgroundColor: 'transparent', cursor: 'pointer', fontSize: 13,
        transition: 'all 0.15s ease',
      }}
    >
      Retry from scratch
    </button>
    <button
      onClick={() => setShowRetryFeedback(true)}
      style={{
        padding: '7px 16px', borderRadius: radius.md,
        border: `1px solid ${colors.warning}`, color: colors.warning,
        backgroundColor: 'transparent', cursor: 'pointer', fontSize: 13,
        transition: 'all 0.15s ease',
      }}
    >
      Retry with feedback
    </button>
  </div>
)}

{showRetryFeedback && (
  <div style={{ marginBottom: 20 }}>
    <textarea
      value={retryFeedback}
      onChange={(e) => setRetryFeedback(e.target.value)}
      placeholder="What should be changed? The agent will see existing code and this feedback."
      style={{
        width: '100%', height: 80, padding: 10, marginBottom: 8,
        backgroundColor: colors.bg, color: colors.text,
        border: `1px solid ${colors.border}`, borderRadius: radius.md,
        fontSize: 13, resize: 'vertical', outline: 'none',
        fontFamily: 'inherit',
      }}
    />
    <button
      onClick={() => { onAdvance?.('retry-feedback', retryFeedback); setShowRetryFeedback(false); setRetryFeedback(''); }}
      style={{
        padding: '7px 16px', borderRadius: radius.md, border: 'none',
        backgroundColor: colors.warning, color: '#fff', cursor: 'pointer', fontSize: 13,
      }}
    >
      Retry with this feedback
    </button>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add runner/renderer/src/components/TaskDetailOverlay.jsx
git commit -m "feat(runner): add retry-from-scratch and retry-with-feedback UI"
```

---

### Task 7: UI — KanbanBoard ACTION_MAP update

**Files:**
- Modify: `runner/renderer/src/components/KanbanBoard.jsx:15-19`

- [ ] **Step 1: Update ACTION_MAP**

In `KanbanBoard.jsx`, replace the ACTION_MAP (lines 15-19):

```js
const ACTION_MAP = {
  idea: { label: 'Plan', action: 'plan' },
  review: { label: 'Approve', action: 'approve' },
  failed: { label: 'Retry', action: 'retry' },
};
```

With:

```js
const ACTION_MAP = {
  idea: { label: 'Plan', action: 'plan' },
  review: { label: 'Approve', action: 'approve' },
};
```

Remove `failed` from ACTION_MAP entirely. The retry action for failed/done tasks requires the feedback textarea in the detail overlay, so clicking the card (which opens the overlay) is the right interaction. No quick-action button on the card.

- [ ] **Step 2: Commit**

```bash
git add runner/renderer/src/components/KanbanBoard.jsx
git commit -m "feat(runner): remove quick-retry from kanban, use detail overlay instead"
```

---

### Task 8: Smoke test the full flow

- [ ] **Step 1: Verify the runner app starts without errors**

```bash
cd runner && npm start
```

Check that the Electron app launches. Open a project. Verify:
- Failed tasks show "Retry from scratch" and "Retry with feedback" buttons in the detail overlay
- Done tasks show the same buttons
- Clicking "Retry from scratch" resets the task to the Ideas column
- Clicking "Retry with feedback" shows the textarea
- Submitting feedback moves the task back to the appropriate pipeline

- [ ] **Step 2: Final commit if any adjustments needed**

```bash
git add -A
git commit -m "fix(runner): retry with feedback adjustments from smoke test"
```
