const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('TaskWatcher', () => {
  let TaskWatcher, tmpDir, tasksDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-watcher-'));
    tasksDir = path.join(tmpDir, 'tasks');
    fs.mkdirSync(tasksDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ TaskWatcher } = require('../../src/state/watcher'));
  });

  it('scans existing task files', async () => {
    fs.writeFileSync(path.join(tasksDir, '001-auth.yaml'), 'name: Auth\nstatus: ready\npriority: 1\n');
    const watcher = new TaskWatcher(tasksDir);
    const tasks = await watcher.scan();
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].id, '001-auth');
    assert.strictEqual(tasks[0].status, 'ready');
    watcher.close();
  });

  it('detects new task files', async () => {
    const watcher = new TaskWatcher(tasksDir);
    const added = [];
    watcher.on('task_added', (task) => added.push(task));
    await watcher.watch();

    await new Promise(r => setTimeout(r, 200));

    fs.writeFileSync(path.join(tasksDir, '002-billing.yaml'), 'name: Billing\nstatus: ready\npriority: 1\n');

    await new Promise(r => setTimeout(r, 500));
    watcher.close();

    assert.ok(added.length >= 1);
    assert.strictEqual(added[0].id, '002-billing');
  });

  it('detects task file changes', async () => {
    fs.writeFileSync(path.join(tasksDir, '001-auth.yaml'), 'name: Auth\nstatus: draft\npriority: 1\n');
    const watcher = new TaskWatcher(tasksDir);
    const changed = [];
    watcher.on('task_changed', (task) => changed.push(task));
    await watcher.watch();

    await new Promise(r => setTimeout(r, 200));

    fs.writeFileSync(path.join(tasksDir, '001-auth.yaml'), 'name: Auth\nstatus: ready\npriority: 1\n');

    await new Promise(r => setTimeout(r, 500));
    watcher.close();

    assert.ok(changed.length >= 1);
    assert.strictEqual(changed[changed.length - 1].status, 'ready');
  });
});
