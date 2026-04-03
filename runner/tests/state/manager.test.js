const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('StateManager', () => {
  let StateManager, tmpDir, statusPath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-test-'));
    statusPath = path.join(tmpDir, 'status.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ StateManager } = require('../../src/state/manager'));
  });

  it('initializes with empty state', () => {
    const sm = new StateManager(statusPath);
    const state = sm.getState();
    assert.ok(state.started_at);
    assert.deepStrictEqual(state.tasks, {});
  });

  it('registers a task', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    const state = sm.getState();
    assert.strictEqual(state.tasks['001-auth'].name, 'Add auth');
    assert.strictEqual(state.tasks['001-auth'].status, 'queued');
  });

  it('updates task status', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.updateTaskStatus('001-auth', 'in_progress');
    assert.strictEqual(sm.getState().tasks['001-auth'].status, 'in_progress');
  });

  it('starts a stage', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.startStage('001-auth', { stage: 'plan', agent: 'claude' });
    const task = sm.getState().tasks['001-auth'];
    assert.strictEqual(task.current_stage, 'plan');
    assert.strictEqual(task.stages.length, 1);
    assert.strictEqual(task.stages[0].status, 'running');
  });

  it('updates live progress', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.startStage('001-auth', { stage: 'implement', agent: 'claude' });
    sm.updateLiveProgress('001-auth', {
      progress: 'writing middleware',
      percent: 40,
      files_touched: ['src/auth.ts'],
    });
    const stage = sm.getState().tasks['001-auth'].stages[0];
    assert.strictEqual(stage.live_progress.progress, 'writing middleware');
    assert.strictEqual(stage.live_progress.percent, 40);
    assert.ok(stage.last_output_at);
  });

  it('completes a stage', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.startStage('001-auth', { stage: 'plan', agent: 'claude' });
    sm.completeStage('001-auth', 'success', 'Created plan');
    const stage = sm.getState().tasks['001-auth'].stages[0];
    assert.strictEqual(stage.status, 'success');
    assert.strictEqual(stage.summary, 'Created plan');
    assert.ok(stage.duration >= 0);
  });

  it('persists to disk', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.persist();
    const raw = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    assert.ok(raw.tasks['001-auth']);
  });

  it('emits events on state changes', () => {
    const sm = new StateManager(statusPath);
    const events = [];
    sm.on('change', (e) => events.push(e));
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.updateTaskStatus('001-auth', 'in_progress');
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events[0].type, 'task_registered');
    assert.strictEqual(events[1].type, 'task_status_changed');
  });
});
