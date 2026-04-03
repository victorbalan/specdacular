const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

describe('Daemon', () => {
  let Daemon, tmpHome, tmpProject;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-daemon-home-'));
    tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-daemon-proj-'));

    const configDir = path.join(tmpProject, '.specd', 'runner', 'tasks');
    fs.mkdirSync(configDir, { recursive: true });

    const mockAgent = path.join(__dirname, 'fixtures', 'mock-agent.js');
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'config.yaml'), yaml.dump({
      server: { port: 0 },
      notifications: { telegram: { enabled: false } },
      defaults: { pipeline: 'default', failure_policy: 'skip', timeout: 5, stuck_timeout: 5, max_parallel: 1 },
    }));
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'agents.yaml'), yaml.dump({
      agents: { 'test-agent': { cmd: `node ${mockAgent}`, input_mode: 'stdin', output_format: 'json_block', system_prompt: 'test {{task.name}}' } },
    }));
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'pipelines.yaml'), yaml.dump({
      pipelines: { default: { stages: [{ stage: 'do', agent: 'test-agent', critical: true }] } },
    }));
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'tasks', '001-test.yaml'), yaml.dump({
      name: 'Test', status: 'ready', priority: 1, description: 'Test task', depends_on: [], pipeline: 'default',
    }));
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
    fs.rmSync(tmpProject, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ Daemon } = require('../src/daemon'));
  });

  it('registers a project and creates runtime dirs', () => {
    const d = new Daemon(tmpHome);
    d.registerProject('test-proj', tmpProject);

    const projects = d.listProjects();
    assert.strictEqual(projects.length, 1);
    assert.strictEqual(projects[0].name, 'test-proj');

    const logsDir = path.join(tmpHome, 'projects', 'test-proj', 'logs');
    assert.ok(fs.existsSync(logsDir));
  });

  it('initializes an orchestrator for a registered project', async () => {
    const d = new Daemon(tmpHome);
    d.registerProject('test-proj', tmpProject);
    const orch = await d.initProject('test-proj');
    assert.ok(orch);
    assert.ok(orch.config);
    assert.ok(orch.agents);
  });

  it('runs a task through a registered project orchestrator', async () => {
    const d = new Daemon(tmpHome);
    d.registerProject('test-proj', tmpProject);
    const orch = await d.initProject('test-proj');
    await orch.runOnce();

    const statusPath = path.join(tmpHome, 'projects', 'test-proj', 'status.json');
    assert.ok(fs.existsSync(statusPath));
    const state = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    assert.strictEqual(state.tasks['001-test'].status, 'done');
  });
});
