// runner/main/test/orchestrator.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Orchestrator } from '../engine/orchestrator.js';
import { Paths } from '../paths.js';

describe('Orchestrator', () => {
  let tmpDir, paths, config;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'specd-orch-'));
    paths = new Paths(tmpDir);

    // Create directories
    mkdirSync(paths.agentTemplatesDir, { recursive: true });
    mkdirSync(paths.pipelineTemplatesDir, { recursive: true });

    const projectDir = join(tmpDir, 'projects', 'testproject');
    mkdirSync(join(projectDir, 'tasks'), { recursive: true });
    mkdirSync(join(projectDir, 'logs'), { recursive: true });
    writeFileSync(join(projectDir, 'project.json'), JSON.stringify({
      name: 'testproject',
      path: '/tmp/fake-repo',
    }));

    // Agent template — use echo as a mock agent
    writeFileSync(join(paths.agentTemplatesDir, 'mock-agent.json'), JSON.stringify({
      cmd: 'echo',
      input_mode: 'stdin',
      output_format: 'plain',
      system_prompt: '',
      timeout: 10,
      stuck_timeout: 10,
    }));

    // Pipeline template
    writeFileSync(join(paths.pipelineTemplatesDir, 'default.json'), JSON.stringify({
      name: 'default',
      stages: [
        { stage: 'test-stage', agent: 'mock-agent', critical: true },
      ],
    }));

    config = {
      server: { port: 0 },
      defaults: { pipeline: 'default', failure_policy: 'skip', timeout: 10, stuck_timeout: 10, max_parallel: 1 },
    };
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('initializes and loads tasks', () => {
    const orch = new Orchestrator({ projectId: 'testproject', paths, config });
    orch.init();
    a.deepEqual(orch.getTasks(), []);
  });

  it('creates a task', () => {
    const orch = new Orchestrator({ projectId: 'testproject', paths, config });
    orch.init();
    const task = orch.createIdea('Test task', 'A description');
    a.ok(task.id.startsWith('idea-'));
    a.equal(task.name, 'Test task');
    a.equal(task.status, 'idea');
  });

  it('picks ready tasks respecting priority', () => {
    const orch = new Orchestrator({ projectId: 'testproject', paths, config });
    orch.init();

    orch.createTask({ id: 'low', name: 'Low', status: 'ready', priority: 10, depends_on: [] });
    orch.createTask({ id: 'high', name: 'High', status: 'ready', priority: 1, depends_on: [] });

    const picked = orch.pickNextTask();
    a.equal(picked.id, 'high');
  });

  it('respects task dependencies', () => {
    const orch = new Orchestrator({ projectId: 'testproject', paths, config });
    orch.init();

    orch.createTask({ id: 'first', name: 'First', status: 'ready', priority: 10, depends_on: [] });
    orch.createTask({ id: 'second', name: 'Second', status: 'ready', priority: 1, depends_on: ['first'] });

    const picked = orch.pickNextTask();
    a.equal(picked.id, 'first');
  });
});
