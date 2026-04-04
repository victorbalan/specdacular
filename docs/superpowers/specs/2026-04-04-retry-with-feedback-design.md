# Retry with Feedback

## Problem

When a task fails or produces unsatisfactory code, the only option is a blind retry that starts from scratch. Users want to:
1. Retry a task from scratch (wipe branch, start over)
2. Retry with feedback — keep the existing branch/PR, give the agent guidance on what to change, and re-run the pipeline so it adapts the code

## Scope

- Both `failed` and `done` tasks can be retried
- Two retry modes: "from scratch" and "with feedback"
- Feedback accumulates across retries (same pattern as re-plan)
- Existing worktree/branch is preserved for feedback retries
- Agents receive feedback in their template context

## Design

### New Actions in `advanceTask`

Two new actions extend the existing `advanceTask(taskId, action, feedback)` method in `orchestrator.js`:

**`retry-fresh`** — Full reset:
- Removes worktree and branch via `worktreeManager.remove(taskId, true)`
- Clears `pr_url`, `feedback`, `spec`, `completed_stages`, `failed_pipeline`
- Resets status to `idea` (restarts full lifecycle from brainstorm)
- Clears state manager stage history via `stateManager.clearTask(taskId)`

**`retry-feedback`** — Iterative retry with guidance:
- Accumulates feedback: `[task.feedback, newFeedback].filter(Boolean).join('\n\n---\n\n')`
- Keeps existing worktree/branch intact
- If `failed_pipeline === 'brainstorm'`: re-runs brainstorm pipeline with feedback
- Otherwise: re-runs execution pipeline with feedback in agent context
- Agent sees existing code on branch + feedback in `{{task.feedback}}`

### Template Context Extension

`buildTemplateContext()` in `runner/main/agent/template.js` adds `task.feedback`:

```js
task: { id: task.id, name: task.name, spec: task.spec || '', feedback: task.feedback || '' }
```

Agents can reference `{{task.feedback}}` in their system prompts. Pipeline agent templates should include a conditional section that instructs the agent to review existing code and apply feedback when `{{task.feedback}}` is non-empty.

### State Manager Changes

Add `clearTask(taskId)` to `runner/main/state/manager.js`:
- Removes the task's entry from `state.tasks`
- Persists immediately
- Used only by `retry-fresh`

### IPC Fix

The `retry-task` IPC handler currently bypasses `advanceTask` and directly sets status to `ready`. Replace it to route through `advanceTask` with `retry-fresh` action for backward compatibility.

### REST API

Update `POST /projects/:id/tasks/:taskId/retry` to accept body:
```json
{ "mode": "fresh" | "feedback", "feedback": "string" }
```
Route to `advanceTask(taskId, 'retry-fresh')` or `advanceTask(taskId, 'retry-feedback', feedback)`.

### UI Changes

**TaskDetailOverlay — Failed tasks:**

Replace the single "Retry task" button with two buttons:
- "Retry from scratch" — danger-outlined button, calls `onAdvance('retry-fresh')`
- "Retry with feedback" — warning-outlined button, opens feedback textarea (same pattern as re-plan modal)

**TaskDetailOverlay — Done tasks:**

Add the same retry section for `done` status. Identical UI to failed tasks.

**KanbanBoard ACTION_MAP:**

Add entry for `done` and update `failed`:
```js
failed: { label: 'Retry', action: 'show-detail' },
done: { label: 'Retry', action: 'show-detail' },
```

Both open the detail overlay instead of triggering a direct action. The detail overlay presents the two retry options with the feedback textarea. The `show-detail` action is handled by clicking the card (existing behavior) — the button label just signals that retry is available.

### Data Flow

```
Retry with feedback:
  UI textarea → IPC advance-task(id, 'retry-feedback', feedback)
    → orchestrator accumulates feedback on task JSON
    → re-runs appropriate pipeline (brainstorm or execution)
    → agent gets worktree with existing code + {{task.feedback}}
    → agent reads code, applies feedback, pushes to same PR

Retry from scratch:
  UI confirm → IPC advance-task(id, 'retry-fresh')
    → orchestrator removes worktree + branch
    → clears all task state (pr_url, spec, feedback, etc.)
    → resets to 'idea' status
    → task re-enters normal lifecycle from the beginning
```

## Files to Modify

| File | Change |
|------|--------|
| `runner/main/orchestrator.js` | Add `retry-fresh` and `retry-feedback` actions to `advanceTask` |
| `runner/main/agent/template.js` | Add `task.feedback` to `buildTemplateContext` |
| `runner/main/state/manager.js` | Add `clearTask(taskId)` method |
| `runner/main/ipc.js` | Fix `retry-task` to route through `advanceTask` |
| `runner/main/server/api.js` | Update retry endpoint to accept mode + feedback |
| `runner/renderer/src/components/TaskDetailOverlay.jsx` | Two retry buttons + feedback textarea for failed/done |
| `runner/renderer/src/components/KanbanBoard.jsx` | Add `done` to ACTION_MAP |

## Edge Cases

- **No worktree exists on retry-fresh**: `worktreeManager.remove()` already handles missing worktrees gracefully — just skip cleanup
- **No worktree manager** (non-git project): Both retry modes work — just skip worktree operations. Retry-fresh still resets task state. Retry-feedback still passes feedback to agent.
- **Multiple feedback rounds**: Feedback accumulates with `---` separators, same as re-plan. Agent sees full history.
- **Done task retry-feedback**: The execution pipeline re-runs. Since the branch has completed code, the agent adapts it based on feedback rather than starting over.
- **Done task retry-fresh**: Wipes everything including the PR. Task goes back to `idea`.
