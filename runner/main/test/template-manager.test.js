// runner/main/test/template-manager.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { TemplateManager } from '../template-manager.js';
import { Paths } from '../paths.js';

describe('TemplateManager', () => {
  let tmpDir, paths;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'specd-tm-'));
    paths = new Paths(tmpDir);
    mkdirSync(paths.agentTemplatesDir, { recursive: true });
    mkdirSync(paths.pipelineTemplatesDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads global agent templates', () => {
    writeFileSync(join(paths.agentTemplatesDir, 'test-agent.json'), JSON.stringify({
      cmd: 'echo test',
      output_format: 'plain',
    }));

    const tm = new TemplateManager(paths);
    const agents = tm.getAgents();
    a.ok(agents['test-agent']);
    a.equal(agents['test-agent'].cmd, 'echo test');
  });

  it('loads global pipeline templates', () => {
    writeFileSync(join(paths.pipelineTemplatesDir, 'test-pipeline.json'), JSON.stringify({
      name: 'test-pipeline',
      stages: [{ stage: 'test', agent: 'test-agent' }],
    }));

    const tm = new TemplateManager(paths);
    const pipelines = tm.getPipelines();
    a.ok(pipelines['test-pipeline']);
  });

  it('getAgents takes no arguments', () => {
    const tm = new TemplateManager(paths);
    const agents = tm.getAgents();
    a.ok(typeof agents === 'object');
  });

  it('returns empty object for missing directory', () => {
    const emptyPaths = new Paths(join(tmpDir, 'nonexistent'));
    const tm = new TemplateManager(emptyPaths);
    const agents = tm.getAgents();
    a.deepEqual(agents, {});
  });
});
