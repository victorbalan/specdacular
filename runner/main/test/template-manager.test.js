import { describe, it, before, after } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { TemplateManager } from '../template-manager.js';
import { Paths } from '../paths.js';

describe('TemplateManager', () => {
  let tempDir;
  let paths;
  let tm;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specd-tm-test-'));
    paths = new Paths(tempDir);

    // Create global templates
    mkdirSync(paths.agentTemplatesDir, { recursive: true });
    mkdirSync(paths.pipelineTemplatesDir, { recursive: true });

    writeFileSync(
      join(paths.agentTemplatesDir, 'claude-planner.json'),
      JSON.stringify({ cmd: 'claude -p', system_prompt: 'global planner' })
    );
    writeFileSync(
      join(paths.pipelineTemplatesDir, 'default.json'),
      JSON.stringify({ name: 'default', stages: [{ stage: 'plan', agent: 'claude-planner' }] })
    );

    // Create per-project override
    const projectAgentsDir = join(paths.projectsDir, 'proj1', 'agents');
    mkdirSync(projectAgentsDir, { recursive: true });
    writeFileSync(
      join(projectAgentsDir, 'claude-planner.json'),
      JSON.stringify({ cmd: 'claude -p --model opus', system_prompt: 'custom planner' })
    );

    tm = new TemplateManager(paths);
  });

  after(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads global agents', () => {
    const agents = tm.getAgents();
    a.equal(agents['claude-planner'].system_prompt, 'global planner');
  });

  it('loads global pipelines', () => {
    const pipelines = tm.getPipelines();
    a.equal(pipelines['default'].stages.length, 1);
  });

  it('returns per-project agent override when present', () => {
    const agents = tm.getAgents('proj1');
    a.equal(agents['claude-planner'].system_prompt, 'custom planner');
    a.equal(agents['claude-planner'].cmd, 'claude -p --model opus');
  });

  it('falls back to global when no per-project override', () => {
    const agents = tm.getAgents('proj-no-overrides');
    a.equal(agents['claude-planner'].system_prompt, 'global planner');
  });
});
