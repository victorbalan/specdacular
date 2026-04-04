# Resumable Pipeline Execution — Design Spec

## Overview

When the app restarts (crash, quit, update), tasks that were mid-pipeline resume from where they left off instead of starting over. Completed stages are skipped, their output is reused. Running stages are re-run — the agent sees its own commits in the worktree and picks up from there.

## How It Works

### On App Startup

The orchestrator scans each task's `status.json` for partially-completed pipelines:

1. **Task status is `in_progress` or `planning`** → check its stages in status.json
2. **Stages marked `success`** → skip them, use their saved `summary` as `previousOutput` for the next stage
3. **Stage marked `running`** → the agent died mid-stage. Re-run this stage from the beginning. The agent will see its own prior commits in the worktree and can figure out what's left.
4. **Remaining stages** → run normally as part of the pipeline

### On Shutdown

When the app receives SIGINT/SIGTERM (quit, Ctrl+C):

1. Signal all running agent processes with SIGTERM
2. Wait up to 5 seconds for agents to exit gracefully (they may commit in-progress work)
3. If still running after 5s, SIGKILL
4. Persist all state to disk via `stateManager.persist()`
5. The running stage stays marked `running` in status.json — on next startup it gets re-run

### Task Tracking

Task JSON gets a `last_pipeline` field that records which pipeline was running when the task was interrupted. This tells the orchestrator whether to resume with the `brainstorm` pipeline or the `default` pipeline.

## Changes

### `runner/main/pipeline/sequencer.js`

Add `completedStages` parameter to constructor. Before running each stage, check if it's already in the completed list. If so, skip it and use its saved summary as `previousOutput`.

```javascript
constructor({ stages, completedStages, createRunner, onStageStart, onStageComplete })
```

In the `run()` loop:
```javascript
for (const stage of this.stages) {
  const completed = this.completedStages?.find(s => s.stage === stage.stage && s.status === 'success');
  if (completed) {
    previousOutput = completed.summary || '';
    continue; // skip this stage
  }
  // ... run normally
}
```

### `runner/main/orchestrator.js`

Replace the current "reset stuck tasks" logic in `init()` with resume logic:

```javascript
for (const task of this.getTasks()) {
  if (task.status === 'in_progress' || task.status === 'planning') {
    const stateData = this.stateManager.getState().tasks?.[task.id];
    if (stateData?.stages?.length > 0) {
      // Has partial progress — resume
      this._resumeTask(task);
    } else {
      // No progress — reset
      const resetStatus = task.status === 'planning' ? 'idea' : 'ready';
      this.updateTask(task.id, { status: resetStatus });
    }
  }
}
```

New `_resumeTask(task)` method:
- Reads completed stages from status.json
- Determines which pipeline to use from `task.last_pipeline`
- Calls `runTask` or `_runBrainstormPipeline` with the completed stages passed through to the sequencer

### `runner/main/state/manager.js`

Add helper method:

```javascript
getCompletedStages(taskId) {
  const task = this.state.tasks?.[taskId];
  if (!task) return [];
  return task.stages.filter(s => s.status === 'success');
}
```

### `runner/main/index.js`

Add graceful shutdown:

```javascript
function gracefulShutdown() {
  // Stop orchestrator loops
  for (const orch of orchestrators.values()) {
    orch.stop();
  }
  
  // Kill running agents (orchestrator tracks child PIDs)
  for (const orch of orchestrators.values()) {
    orch.killRunningAgents();
  }
  
  // Wait 5s then force quit
  setTimeout(() => process.exit(0), 5000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
app.on('before-quit', gracefulShutdown);
```

### Agent Runner

The `AgentRunner` needs to expose the child process PID so the orchestrator can track and kill it on shutdown. Add a `getProcess()` method or store active processes in a set.

## What Agents See On Resume

When a stage is re-run after a crash:

1. The agent spawns in the **same worktree** (worktrees persist across restarts)
2. The worktree has **all commits from the previous run** (`git log` shows them)
3. The agent's prompt includes the **task spec/description** (same as before)
4. The agent has the **previous stage output** in `{{previous_stage_output}}` (from saved stage summaries)

The agent naturally discovers what's done by reading git history and the plan file. It picks up implementation from where the last commit left off.

## Edge Cases

- **All stages completed but task still `in_progress`**: The post-pipeline logic (PR creation, status update) didn't run. Re-run just the post-pipeline logic.
- **Worktree was cleaned up**: Can't resume. Reset to `ready` (execution) or `idea` (brainstorm) and start over.
- **Status.json is corrupt or missing**: Reset the task. Don't crash.
