const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');
const http = require('http');

describe('Integration: full orchestrator run', () => {
  let tmpDir, Orchestrator, createServer;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-integ-'));
    const tasksDir = path.join(tmpDir, 'tasks');
    fs.mkdirSync(tasksDir);

    const mockAgent = path.join(__dirname, 'fixtures', 'mock-agent.js');

    fs.writeFileSync(path.join(tmpDir, 'config.yaml'), yaml.dump({
      server: { port: 0 },
      notifications: { telegram: { enabled: false } },
      defaults: { pipeline: 'default', failure_policy: 'skip', timeout: 30, stuck_timeout: 30, max_parallel: 1 },
    }));

    fs.writeFileSync(path.join(tmpDir, 'agents.yaml'), yaml.dump({
      agents: {
        'mock-agent': {
          cmd: `node ${mockAgent}`,
          prompt_flag: '',
          output_format: 'json_block',
          system_prompt: 'Testing {{task.name}}',
        },
      },
    }));

    fs.writeFileSync(path.join(tmpDir, 'pipelines.yaml'), yaml.dump({
      pipelines: {
        default: {
          stages: [
            { stage: 'plan', agent: 'mock-agent', critical: true },
            { stage: 'implement', agent: 'mock-agent', critical: true },
          ],
        },
      },
    }));

    fs.writeFileSync(path.join(tasksDir, '001-feature.yaml'), yaml.dump({
      name: 'Test feature',
      status: 'ready',
      priority: 1,
      description: 'Build something',
      depends_on: [],
      pipeline: 'default',
    }));

    ({ Orchestrator } = require('../src/orchestrator'));
    ({ createServer } = require('../src/server/index'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('runs a task through the full pipeline and updates status.json', async () => {
    const orch = new Orchestrator({ configDir: tmpDir });
    await orch.init();
    await orch.runOnce();

    const statusPath = path.join(tmpDir, 'status.json');
    assert.ok(fs.existsSync(statusPath));

    const state = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    const task = state.tasks['001-feature'];

    assert.ok(task);
    assert.strictEqual(task.status, 'done');
    assert.strictEqual(task.stages.length, 2);
    assert.strictEqual(task.stages[0].stage, 'plan');
    assert.strictEqual(task.stages[0].status, 'success');
    assert.strictEqual(task.stages[1].stage, 'implement');
    assert.strictEqual(task.stages[1].status, 'success');
  });

  it('serves status via the REST API', async () => {
    const orch = new Orchestrator({ configDir: tmpDir });
    await orch.init();
    await orch.runOnce();

    // Wrap orchestrator in a daemon-compatible facade for createServer
    const daemonFacade = {
      getAllOrchestrators: () => new Map([['default', orch]]),
      getOrchestrator: (name) => name === 'default' ? orch : null,
      listProjects: () => [{ name: 'default', repoPath: tmpDir }],
    };

    const server = createServer(daemonFacade, 0);
    const httpServer = await server.start();
    const port = httpServer.address().port;

    const res = await fetch(`http://localhost:${port}/api/status`);
    const data = await res.json();

    assert.ok(data.projects.default);
    assert.ok(data.projects.default.tasks['001-feature']);
    assert.strictEqual(data.projects.default.tasks['001-feature'].status, 'done');

    await server.stop();
  });

  it('logs are written to disk', async () => {
    const orch = new Orchestrator({ configDir: tmpDir });
    await orch.init();
    await orch.runOnce();

    const logsDir = path.join(tmpDir, 'logs');
    assert.ok(fs.existsSync(logsDir));

    const logFiles = fs.readdirSync(logsDir);
    assert.ok(logFiles.length > 0);
  });
});

describe('Integration: global daemon', () => {
  let tmpHome, tmpProject, Daemon, createServer;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-daemon-integ-'));
    tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-proj-integ-'));

    const tasksDir = path.join(tmpProject, '.specd', 'runner', 'tasks');
    fs.mkdirSync(tasksDir, { recursive: true });

    const mockAgent = path.join(__dirname, 'fixtures', 'mock-agent.js');

    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'config.yaml'), yaml.dump({
      server: { port: 0 },
      notifications: { telegram: { enabled: false } },
      defaults: { pipeline: 'default', failure_policy: 'skip', timeout: 30, stuck_timeout: 30, max_parallel: 1 },
    }));
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'agents.yaml'), yaml.dump({
      agents: { 'mock': { cmd: `node ${mockAgent}`, input_mode: 'stdin', output_format: 'json_block', system_prompt: 'test {{task.name}}' } },
    }));
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'pipelines.yaml'), yaml.dump({
      pipelines: { default: { stages: [{ stage: 'do', agent: 'mock', critical: true }] } },
    }));
    fs.writeFileSync(path.join(tasksDir, '001-test.yaml'), yaml.dump({
      name: 'Test', status: 'ready', priority: 1, description: 'Test', depends_on: [], pipeline: 'default',
    }));

    ({ Daemon } = require('../src/daemon'));
    ({ createServer } = require('../src/server/index'));
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
    fs.rmSync(tmpProject, { recursive: true, force: true });
  });

  it('registers project, runs task, serves status via API', async () => {
    const daemon = new Daemon(tmpHome);
    daemon.registerProject('test', tmpProject);
    const orch = await daemon.initProject('test');
    await orch.runOnce();

    const server = createServer(daemon, 0);
    const httpServer = await server.start();
    const port = httpServer.address().port;

    const res = await fetch(`http://localhost:${port}/api/status`);
    const data = await res.json();

    assert.ok(data.projects.test);
    assert.strictEqual(data.projects.test.tasks['001-test'].status, 'done');

    await server.stop();
  });
});
