const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('ProjectRegistry', () => {
  let ProjectRegistry, tmpDir, registryPath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-reg-'));
    registryPath = path.join(tmpDir, 'projects.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ ProjectRegistry } = require('../src/registry'));
  });

  it('starts with empty registry', () => {
    const reg = new ProjectRegistry(registryPath);
    assert.deepStrictEqual(reg.list(), []);
  });

  it('registers a project', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    const projects = reg.list();
    assert.strictEqual(projects.length, 1);
    assert.strictEqual(projects[0].name, 'smart-clipper');
    assert.strictEqual(projects[0].repoPath, '/Users/victor/work/smart-clipper');
  });

  it('persists to disk', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');

    const reg2 = new ProjectRegistry(registryPath);
    const projects = reg2.list();
    assert.strictEqual(projects.length, 1);
    assert.strictEqual(projects[0].name, 'smart-clipper');
  });

  it('unregisters a project', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    reg.register('other', '/Users/victor/work/other');
    reg.unregister('smart-clipper');
    assert.strictEqual(reg.list().length, 1);
    assert.strictEqual(reg.list()[0].name, 'other');
  });

  it('gets a project by name', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    const project = reg.get('smart-clipper');
    assert.strictEqual(project.repoPath, '/Users/victor/work/smart-clipper');
  });

  it('returns null for unknown project', () => {
    const reg = new ProjectRegistry(registryPath);
    assert.strictEqual(reg.get('nonexistent'), null);
  });

  it('derives name from repo path if not given', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register(null, '/Users/victor/work/smart-clipper');
    assert.strictEqual(reg.list()[0].name, 'smart-clipper');
  });

  it('does not duplicate registrations', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    assert.strictEqual(reg.list().length, 1);
  });
});
