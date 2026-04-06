// runner/main/test/integration.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Orchestrator } from '../engine/orchestrator.js';
import { Paths } from '../paths.js';

describe('Integration: task → pipeline → completion', () => {
  let tmpDir, paths, config;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'specd-int-'));
    paths = new Paths(tmpDir);

    mkdirSync(paths.agentTemplatesDir, { recursive: true });
    mkdirSync(paths.pipelineTemplatesDir, { recursive: true });

    const projectDir = join(tmpDir, 'projects', 'testproject');
    mkdirSync(join(projectDir, 'tasks'), { recursive: true });
    mkdirSync(join(projectDir, 'logs'), { recursive: true });
    writeFileSync(join(projectDir, 'project.json'), JSON.stringify({
      name: 'testproject',
      path: tmpDir,
    }));

    // Mock agent: just echoes and exits
    writeFileSync(join(paths.agentTemplatesDir, 'echo-agent.json'), JSON.stringify({
      cmd: 'echo "done"',
      input_mode: 'stdin',
      output_format: 'plain',
      system_prompt: '',
      timeout: 10,
      stuck_timeout: 10,
    }));

    // Pipeline with two stages, no git actions (no real repo)
    writeFileSync(join(paths.pipelineTemplatesDir, 'test.json'), JSON.stringify({
      name: 'test',
      stages: [
        { stage: 'first', agent: 'echo-agent', critical: true },
        { stage: 'second', agent: 'echo-agent', critical: true },
      ],
    }));

    config = {
      server: { port: 0 },
      defaults: { pipeline: 'test', failure_policy: 'skip', timeout: 10, stuck_timeout: 10, max_parallel: 1 },
    };
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('runs a task through a two-stage pipeline', async () => {
    const orch = new Orchestrator({ projectId: 'testproject', paths, config });
    orch.init();

    const task = {
      id: 'test-task-1',
      name: 'Integration test',
      description: 'Test the full flow',
      project_id: 'testproject',
      pipeline: 'test',
      status: 'ready',
      priority: 1,
      depends_on: [],
      spec: '',
      feedback: '',
      created_at: new Date().toISOString(),
    };
    orch.createTask(task);

    const result = await orch.runTask(task);
    a.equal(result.status, 'success');
    a.equal(result.results.length, 2);

    // Task should be marked done
    const updated = orch.getTask('test-task-1');
    a.equal(updated.status, 'done');

    // State should reflect completion
    const state = orch.stateManager.getState();
    a.equal(state.tasks['test-task-1'].status, 'done');
  });
});
