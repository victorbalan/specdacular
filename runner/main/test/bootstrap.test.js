import { describe, it, before, after } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { bootstrap } from '../bootstrap.js';
import { Paths } from '../paths.js';

describe('bootstrap', () => {
  let tempDir;
  let paths;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specd-test-'));
    paths = new Paths(tempDir);
  });

  after(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates all required directories and default files', async () => {
    await bootstrap(paths);

    a.ok(existsSync(paths.templatesDir));
    a.ok(existsSync(paths.agentTemplatesDir));
    a.ok(existsSync(paths.pipelineTemplatesDir));
    a.ok(existsSync(paths.projectsDir));

    a.ok(existsSync(paths.db));
    const db = JSON.parse(readFileSync(paths.db, 'utf-8'));
    a.deepEqual(db, { projects: [] });

    a.ok(existsSync(paths.config));
    const config = JSON.parse(readFileSync(paths.config, 'utf-8'));
    a.equal(config.server.port, 3700);

    // Default agent templates exist
    a.ok(existsSync(join(paths.agentTemplatesDir, 'claude-planner.json')));
    a.ok(existsSync(join(paths.agentTemplatesDir, 'claude-implementer.json')));
    a.ok(existsSync(join(paths.agentTemplatesDir, 'claude-reviewer.json')));

    // Default pipeline template exists
    a.ok(existsSync(join(paths.pipelineTemplatesDir, 'default.json')));

    // Brainstorm agents
    a.ok(existsSync(join(paths.agentTemplatesDir, 'claude-researcher.json')));
    a.ok(existsSync(join(paths.agentTemplatesDir, 'claude-brainstormer.json')));

    // Brainstorm pipeline
    a.ok(existsSync(join(paths.pipelineTemplatesDir, 'brainstorm.json')));
  });

  it('does not overwrite existing files on second run', async () => {
    const config = JSON.parse(readFileSync(paths.config, 'utf-8'));
    config.server.port = 9999;
    const { writeFileSync } = await import('fs');
    writeFileSync(paths.config, JSON.stringify(config));

    await bootstrap(paths);

    const reloaded = JSON.parse(readFileSync(paths.config, 'utf-8'));
    a.equal(reloaded.server.port, 9999);
  });
});
