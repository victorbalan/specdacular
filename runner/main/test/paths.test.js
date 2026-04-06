import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { Paths } from '../paths.js';

describe('Paths', () => {
  it('returns app data dir based on platform', () => {
    const paths = new Paths('/tmp/test-specd');
    a.equal(paths.root, '/tmp/test-specd');
    a.equal(paths.db, '/tmp/test-specd/db.json');
    a.equal(paths.config, '/tmp/test-specd/config.json');
    a.equal(paths.templatesDir, '/tmp/test-specd/templates');
    a.equal(paths.agentTemplatesDir, '/tmp/test-specd/templates/agents');
    a.equal(paths.pipelineTemplatesDir, '/tmp/test-specd/templates/pipelines');
    a.equal(paths.projectsDir, '/tmp/test-specd/projects');
    a.equal(paths.electronDir, '/tmp/test-specd/electron');
  });

  it('returns project-specific paths', () => {
    const paths = new Paths('/tmp/test-specd');
    const pp = paths.forProject('abc123');
    a.equal(pp.dir, '/tmp/test-specd/projects/abc123');
    a.equal(pp.projectJson, '/tmp/test-specd/projects/abc123/project.json');
    a.equal(pp.statusJson, '/tmp/test-specd/projects/abc123/status.json');
    a.equal(pp.tasksDir, '/tmp/test-specd/projects/abc123/tasks');
    a.equal(pp.logsDir, '/tmp/test-specd/projects/abc123/logs');
  });
});
