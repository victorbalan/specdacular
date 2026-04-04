import { describe, it, before, after, beforeEach } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { StateManager } from '../state/manager.js';

describe('StateManager', () => {
  let tempDir;
  let statusPath;
  let sm;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specd-state-test-'));
  });

  beforeEach(() => {
    statusPath = join(tempDir, `status-${Date.now()}.json`);
    sm = new StateManager(statusPath);
  });

  after(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('registers a task', () => {
    sm.registerTask('task-001', { name: 'Add dark mode', pipeline: 'default' });
    const state = sm.getState();
    a.equal(state.tasks['task-001'].name, 'Add dark mode');
    a.equal(state.tasks['task-001'].status, 'queued');
  });

  it('updates task status', () => {
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    sm.updateTaskStatus('task-001', 'in_progress');
    a.equal(sm.getState().tasks['task-001'].status, 'in_progress');
  });

  it('tracks stages', () => {
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    sm.startStage('task-001', { stage: 'plan', agent: 'claude-planner' });
    const task = sm.getState().tasks['task-001'];
    a.equal(task.current_stage, 'plan');
    a.equal(task.stages.length, 1);
    a.equal(task.stages[0].status, 'running');
  });

  it('completes stages with duration', () => {
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    sm.startStage('task-001', { stage: 'plan', agent: 'claude-planner' });
    sm.completeStage('task-001', 'success', 'Planned it');
    const stage = sm.getState().tasks['task-001'].stages[0];
    a.equal(stage.status, 'success');
    a.equal(stage.summary, 'Planned it');
    a.ok(stage.duration >= 0);
  });

  it('persists to disk', () => {
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    sm.persist();
    const data = JSON.parse(readFileSync(statusPath, 'utf-8'));
    a.ok(data.tasks['task-001']);
  });

  it('emits change events', () => {
    const events = [];
    sm.on('change', (e) => events.push(e));
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    a.equal(events.length, 1);
    a.equal(events[0].type, 'task_registered');
  });

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
  });

  it('returns empty array for unknown task', () => {
    a.deepEqual(sm.getCompletedStages('nonexistent'), []);
  });
});
