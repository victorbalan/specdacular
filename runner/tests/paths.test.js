const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const os = require('os');

describe('Paths', () => {
  let Paths;

  it('imports', () => {
    ({ Paths } = require('../src/paths'));
  });

  it('resolves home directory', () => {
    const p = new Paths();
    assert.strictEqual(p.homeDir, path.join(os.homedir(), '.specd', 'runner'));
  });

  it('resolves project registry path', () => {
    const p = new Paths();
    assert.strictEqual(p.registryPath, path.join(os.homedir(), '.specd', 'runner', 'projects.json'));
  });

  it('resolves project runtime paths', () => {
    const p = new Paths();
    const rt = p.forProject('smart-clipper');
    assert.strictEqual(rt.statusPath, path.join(os.homedir(), '.specd', 'runner', 'projects', 'smart-clipper', 'status.json'));
    assert.strictEqual(rt.logsDir, path.join(os.homedir(), '.specd', 'runner', 'projects', 'smart-clipper', 'logs'));
  });

  it('resolves project config paths from repo', () => {
    const p = new Paths();
    const cfg = p.configPaths('/Users/victor/work/smart-clipper');
    assert.strictEqual(cfg.configDir, path.join('/Users/victor/work/smart-clipper', '.specd', 'runner'));
    assert.strictEqual(cfg.tasksDir, path.join('/Users/victor/work/smart-clipper', '.specd', 'runner', 'tasks'));
  });

  it('resolves personal config path', () => {
    const p = new Paths();
    assert.strictEqual(p.personalConfigPath, path.join(os.homedir(), '.specd', 'runner', 'config.yaml'));
  });
});
