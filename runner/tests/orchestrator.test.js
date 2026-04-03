const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

describe('Orchestrator', () => {
  let Orchestrator, tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-orch-'));
    const tasksDir = path.join(tmpDir, 'tasks');
    fs.mkdirSync(tasksDir);

    fs.writeFileSync(path.join(tmpDir, 'config.yaml'), yaml.dump({
      server: { port: 0 },
      notifications: { telegram: { enabled: false } },
      defaults: { pipeline: 'default', failure_policy: 'skip', timeout: 5, stuck_timeout: 5, max_parallel: 1 },
    }));

    const mockAgent = path.join(__dirname, 'fixtures', 'mock-agent.js');
    fs.writeFileSync(path.join(tmpDir, 'agents.yaml'), yaml.dump({
      agents: {
        'test-agent': {
          cmd: `node ${mockAgent}`,
          input_mode: 'stdin',
          output_format: 'json_block',
          system_prompt: 'You are testing {{task.name}}',
        },
      },
    }));

    fs.writeFileSync(path.join(tmpDir, 'pipelines.yaml'), yaml.dump({
      pipelines: {
        default: {
          stages: [{ stage: 'test-stage', agent: 'test-agent', critical: true }],
        },
      },
    }));

    fs.writeFileSync(path.join(tasksDir, '001-test.yaml'), yaml.dump({
      name: 'Test task',
      status: 'ready',
      priority: 1,
      description: 'A test',
      depends_on: [],
      pipeline: 'default',
    }));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ Orchestrator } = require('../src/orchestrator'));
  });

  it('picks up a ready task and runs it', async () => {
    const orch = new Orchestrator({ configDir: tmpDir });
    await orch.init();
    await orch.runOnce();

    const state = orch.stateManager.getState();
    const task = state.tasks['001-test'];
    assert.ok(task, 'Task should be registered');
    assert.strictEqual(task.status, 'done');
    assert.strictEqual(task.stages.length, 1);
    assert.strictEqual(task.stages[0].status, 'success');
  });

  it('respects depends_on ordering', async () => {
    fs.writeFileSync(path.join(tmpDir, 'tasks', '002-dependent.yaml'), yaml.dump({
      name: 'Dependent task',
      status: 'ready',
      priority: 1,
      description: 'Depends on 001',
      depends_on: ['001-test'],
      pipeline: 'default',
    }));

    const orch = new Orchestrator({ configDir: tmpDir });
    await orch.init();
    const picked = orch.pickNextTask();
    assert.strictEqual(picked.id, '001-test');
  });

  it('skips draft tasks', async () => {
    fs.writeFileSync(path.join(tmpDir, 'tasks', '001-test.yaml'), yaml.dump({
      name: 'Draft task',
      status: 'draft',
      priority: 1,
      description: 'Not ready',
      depends_on: [],
      pipeline: 'default',
    }));

    const orch = new Orchestrator({ configDir: tmpDir });
    await orch.init();
    const picked = orch.pickNextTask();
    assert.strictEqual(picked, null);
  });
});
