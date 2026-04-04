# Resumable Pipeline Execution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the app restarts, tasks that were mid-pipeline resume from where they left off — completed stages are skipped, running stages are re-run, agents see their prior commits in the worktree.

**Architecture:** The StageSequencer accepts a list of already-completed stages and skips them. The orchestrator's init logic checks status.json for partial progress and resumes instead of resetting. Graceful shutdown signals agents before killing them. The AgentRunner exposes the child process for cleanup.

**Tech Stack:** Node.js, Electron

---

## File Structure

### Modified files

| File | Change |
|------|--------|
| `runner/main/state/manager.js` | Add `getCompletedStages(taskId)` helper |
| `runner/main/pipeline/sequencer.js` | Accept `completedStages`, skip them in `run()` |
| `runner/main/agent/runner.js` | Expose child process for graceful shutdown |
| `runner/main/orchestrator.js` | Resume logic in `init()`, track active agent processes, `killRunningAgents()` method, pass `last_pipeline` on tasks |
| `runner/main/index.js` | Graceful shutdown handler |

---

## Task 1: Add `getCompletedStages` to StateManager

**Files:**
- Modify: `runner/main/state/manager.js`
- Modify: `runner/main/test/state-manager.test.js`

- [ ] **Step 1: Write failing test**

Add to `runner/main/test/state-manager.test.js`:

```javascript
  it('returns completed stages', () => {
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    sm.startStage('task-001', { stage: 'plan', agent: 'claude-planner' });
    sm.completeStage('task-001', 'success', 'Planned it');
    sm.startStage('task-001', { stage: 'implement', agent: 'claude-implementer' });
    sm.completeStage('task-001', 'success', 'Built it');
    sm.startStage('task-001', { stage: 'review', agent: 'claude-reviewer' });

    const completed = sm.getCompletedStages('task-001');
    a.equal(completed.length, 2);
    a.equal(completed[0].stage, 'plan');
    a.equal(completed[0].summary, 'Planned it');
    a.equal(completed[1].stage, 'implement');
    // The running 'review' stage should NOT be in completed
  });

  it('returns empty array for unknown task', () => {
    a.deepEqual(sm.getCompletedStages('nonexistent'), []);
  });
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test runner/main/test/state-manager.test.js
```

Expected: FAIL — `sm.getCompletedStages is not a function`

- [ ] **Step 3: Implement `getCompletedStages`**

Add to `runner/main/state/manager.js` before the `persist()` method:

```javascript
  getCompletedStages(taskId) {
    const task = this.state.tasks?.[taskId];
    if (!task) return [];
    return task.stages.filter(s => s.status === 'success');
  }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test runner/main/test/state-manager.test.js
```

Expected: PASS (all 8 tests)

- [ ] **Step 5: Commit**

```bash
git add runner/main/state/manager.js runner/main/test/state-manager.test.js
git commit -m "feat(runner): add getCompletedStages to StateManager"
```

---

## Task 2: Make StageSequencer skip completed stages

**Files:**
- Modify: `runner/main/pipeline/sequencer.js`

- [ ] **Step 1: Update constructor to accept `completedStages`**

Replace `runner/main/pipeline/sequencer.js`:

```javascript
// runner/main/pipeline/sequencer.js
import { createLogger } from '../logger.js';

const log = createLogger('pipeline', '\x1b[33m');

export class StageSequencer {
  constructor({ stages, completedStages, createRunner, onStageStart, onStageComplete }) {
    this.stages = stages;
    this.completedStages = completedStages || [];
    this.createRunner = createRunner;
    this.onStageStart = onStageStart;
    this.onStageComplete = onStageComplete;
  }

  async run() {
    const results = [];
    let previousOutput = '';

    for (const stage of this.stages) {
      // Check if this stage was already completed (resume case)
      const completed = this.completedStages.find(s => s.stage === stage.stage && s.status === 'success');
      if (completed) {
        log.info(`stage "${stage.stage}" — skipping (already completed)`);
        results.push({ stage: stage.stage, status: 'success', summary: completed.summary });
        previousOutput = completed.summary || '';
        continue;
      }

      const maxAttempts = 1 + (stage.max_retries || 0);
      let stageResult = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        log.info(`stage "${stage.stage}" (agent: ${stage.agent}) attempt ${attempt}/${maxAttempts}`);
        const runner = this.createRunner(stage, previousOutput);
        await this.onStageStart(stage, attempt);

        try {
          stageResult = await runner.run('');
        } catch (err) {
          stageResult = { status: 'failure', summary: err.message };
        }

        await this.onStageComplete(stage, stageResult, attempt);

        if (stageResult.status === 'success') break;
        if (stageResult.status === 'failure' && stage.on_fail !== 'retry') break;
      }

      log.info(`stage "${stage.stage}" → ${stageResult.status}`);
      results.push({ stage: stage.stage, ...stageResult });
      previousOutput = stageResult?.summary || '';

      if (stageResult.status !== 'success' && stage.critical) {
        log.error(`critical stage "${stage.stage}" failed — aborting pipeline`);
        return { status: 'failure', results, failedStage: stage.stage };
      }
    }

    log.info(`pipeline complete — all stages passed`);
    return { status: 'success', results };
  }
}
```

- [ ] **Step 2: Run all tests**

```bash
node --test runner/main/test/*.test.js
```

Expected: All PASS (no existing sequencer tests, but other tests should still pass).

- [ ] **Step 3: Commit**

```bash
git add runner/main/pipeline/sequencer.js
git commit -m "feat(runner): StageSequencer skips already-completed stages on resume"
```

---

## Task 3: Expose child process from AgentRunner

**Files:**
- Modify: `runner/main/agent/runner.js`

- [ ] **Step 1: Add `proc` property and `kill` method**

In `runner/main/agent/runner.js`, add a property to track the active process. After the `spawn` call (line ~30), add:

```javascript
      this.proc = proc;
```

Add a `kill()` method to the class (after the constructor, before `run()`):

```javascript
  kill() {
    if (this.proc && !this.proc.killed) {
      log.info(`  killing agent pid=${this.proc.pid}`);
      this.proc.kill('SIGTERM');
      setTimeout(() => {
        if (this.proc && !this.proc.killed) {
          this.proc.kill('SIGKILL');
        }
      }, 5000);
    }
  }
```

In the `close` handler, clear the reference:

```javascript
      proc.on('close', (code) => {
        this.proc = null;
```

- [ ] **Step 2: Run all tests**

```bash
node --test runner/main/test/*.test.js
```

Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add runner/main/agent/runner.js
git commit -m "feat(runner): expose agent process for graceful shutdown"
```

---

## Task 4: Orchestrator resume logic + agent tracking

**Files:**
- Modify: `runner/main/orchestrator.js`

- [ ] **Step 1: Add `activeRunners` tracking**

Add to the constructor (after `this.worktreeManager = null;`):

```javascript
    this.activeRunners = new Set();
```

- [ ] **Step 2: Replace reset logic in `init()` with resume logic**

Replace the "Reset stuck tasks from previous run" block in `init()`:

```javascript
    // Resume or reset tasks from previous run
    for (const task of this.getTasks()) {
      if (task.status === 'in_progress' || task.status === 'planning') {
        const completedStages = this.stateManager.getCompletedStages(task.id);
        if (completedStages.length > 0) {
          log.info(`resuming task ${task.id}: "${task.name}" (${completedStages.length} stages completed)`);
          this._resumeTask(task, completedStages);
        } else {
          const resetStatus = task.status === 'planning' ? 'idea' : 'ready';
          log.warn(`resetting task ${task.id} (no completed stages) → ${resetStatus}`);
          this.updateTask(task.id, { status: resetStatus });
        }
      }
    }
```

- [ ] **Step 3: Add `_resumeTask` method**

Add after `_createOrUpdatePR`:

```javascript
  _resumeTask(task, completedStages) {
    const pipelineName = task.last_pipeline || (task.status === 'planning' ? 'brainstorm' : 'default');

    if (pipelineName === 'brainstorm') {
      this._runBrainstormPipeline(task, completedStages).catch(err => {
        log.error(`resume brainstorm failed for ${task.id}: ${err}`);
        this.updateTask(task.id, { status: 'failed', failed_pipeline: 'brainstorm' });
        this.stateManager.updateTaskStatus(task.id, 'failed');
        this.stateManager.persist();
      });
    } else {
      // Re-queue for the orchestrator loop to pick up, but with completed stages saved
      this.updateTask(task.id, { status: 'ready', completed_stages: completedStages.map(s => ({ stage: s.stage, summary: s.summary, status: s.status })) });
    }
  }
```

- [ ] **Step 4: Update `_runBrainstormPipeline` to accept and pass completedStages**

Change the method signature:

```javascript
  async _runBrainstormPipeline(task, completedStages) {
```

Pass `completedStages` to the StageSequencer constructor:

```javascript
    const sequencer = new StageSequencer({
      stages: pipeline.stages,
      completedStages: completedStages || [],
      createRunner: (stage, previousOutput) => {
```

- [ ] **Step 5: Update `runTask` to pass completedStages from task JSON**

In `runTask`, after resolving the pipeline, add:

```javascript
    const completedStages = task.completed_stages || [];
    // Clear completed_stages from task now that we're using them
    if (completedStages.length > 0) {
      log.info(`resuming task ${task.id} with ${completedStages.length} completed stages`);
      this.updateTask(task.id, { completed_stages: null });
    }
```

Pass to the sequencer:

```javascript
    const sequencer = new StageSequencer({
      stages: pipeline.stages,
      completedStages,
      createRunner: (stage, previousOutput) => {
```

- [ ] **Step 6: Track active runners in `createRunner`**

In both `runTask` and `_runBrainstormPipeline`, inside the `createRunner` callback, after creating the AgentRunner instance, add tracking. The runner variable is the AgentRunner (not the wrapper):

```javascript
        const runner = new AgentRunner({ ... });
        this.activeRunners.add(runner);

        runner.on('status', (s) => this.stateManager.updateLiveProgress(task.id, s));
        runner.on('output', () => this.stateManager.persist());

        return {
          run: () => {
            const p = runner.run(task.spec || task.description || task.name, { cwd, logPath });
            p.finally(() => this.activeRunners.delete(runner));
            return p;
          }
        };
```

Apply this pattern in both `runTask`'s `createRunner` and `_runBrainstormPipeline`'s `createRunner`.

- [ ] **Step 7: Add `killRunningAgents` method**

Add after `stop()`:

```javascript
  killRunningAgents() {
    log.info(`killing ${this.activeRunners.size} running agents`);
    for (const runner of this.activeRunners) {
      runner.kill();
    }
  }
```

- [ ] **Step 8: Save `last_pipeline` when starting pipelines**

In `_runBrainstormPipeline`, after setting status to planning:

```javascript
    this.updateTask(task.id, { status: 'planning', last_pipeline: 'brainstorm' });
```

In `runTask`, after setting status to in_progress:

```javascript
    this.updateTask(task.id, { status: 'in_progress', last_pipeline: pipelineName });
```

(Replace the existing `this.updateTask(task.id, { status: 'in_progress' })` line.)

- [ ] **Step 9: Run all tests**

```bash
node --test runner/main/test/*.test.js
```

Expected: All PASS.

- [ ] **Step 10: Commit**

```bash
git add runner/main/orchestrator.js
git commit -m "feat(runner): resume partially-completed pipelines on restart"
```

---

## Task 5: Graceful shutdown in Electron main process

**Files:**
- Modify: `runner/main/index.js`

- [ ] **Step 1: Replace the `before-quit` handler**

Replace the existing `app.on('before-quit', ...)` block:

```javascript
let isShuttingDown = false;

function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  const shutdownLog = createLogger('shutdown', '\x1b[31m');
  shutdownLog.info('shutting down...');

  // Stop orchestrator loops
  for (const orch of orchestrators.values()) {
    orch.stop();
  }

  // Kill running agents gracefully
  for (const orch of orchestrators.values()) {
    orch.killRunningAgents();
  }

  // Stop server
  if (server) server.stop();

  shutdownLog.info('waiting 5s for agents to finish...');
  setTimeout(() => {
    shutdownLog.info('exiting');
    app.exit(0);
  }, 5000);
}

app.on('before-quit', (e) => {
  if (!isShuttingDown) {
    e.preventDefault();
    gracefulShutdown();
  }
});
```

Also add the import for `createLogger` at the top of the file:

```javascript
import { createLogger } from './logger.js';
```

- [ ] **Step 2: Run all tests**

```bash
node --test runner/main/test/*.test.js
```

Expected: All PASS.

- [ ] **Step 3: Verify the app starts and stops cleanly**

```bash
cd runner && npm run dev
# Wait for it to start, then Ctrl+C
```

Expected: See `[shutdown] shutting down...`, `[shutdown] waiting 5s for agents to finish...`, `[shutdown] exiting` in terminal.

- [ ] **Step 4: Commit**

```bash
git add runner/main/index.js
git commit -m "feat(runner): graceful shutdown with agent cleanup"
```
