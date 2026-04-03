const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('WorktreeManager', () => {
  let WorktreeManager, repoDir;

  beforeEach(() => {
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-wt-'));
    execSync('git init && git commit --allow-empty -m "init"', { cwd: repoDir });
  });

  afterEach(() => {
    try {
      execSync('git worktree prune', { cwd: repoDir });
    } catch (e) { /* ignore */ }
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ WorktreeManager } = require('../../src/worktree/manager'));
  });

  it('creates a worktree for a task', async () => {
    const wm = new WorktreeManager(repoDir);
    const worktreePath = await wm.create('001-auth');

    assert.ok(fs.existsSync(worktreePath));
    assert.ok(worktreePath.includes('001-auth'));

    const result = execSync('git rev-parse --is-inside-work-tree', { cwd: worktreePath }).toString().trim();
    assert.strictEqual(result, 'true');

    await wm.remove('001-auth');
  });

  it('removes a worktree for a task', async () => {
    const wm = new WorktreeManager(repoDir);
    const worktreePath = await wm.create('001-auth');
    assert.ok(fs.existsSync(worktreePath));

    await wm.remove('001-auth');
    assert.ok(!fs.existsSync(worktreePath));
  });

  it('returns the worktree path for a task', async () => {
    const wm = new WorktreeManager(repoDir);
    const created = await wm.create('002-billing');
    const got = wm.getPath('002-billing');
    assert.strictEqual(created, got);

    await wm.remove('002-billing');
  });

  it('lists active worktrees', async () => {
    const wm = new WorktreeManager(repoDir);
    await wm.create('001-auth');
    await wm.create('002-billing');

    const active = wm.listActive();
    assert.strictEqual(active.length, 2);
    assert.ok(active.includes('001-auth'));
    assert.ok(active.includes('002-billing'));

    await wm.remove('001-auth');
    await wm.remove('002-billing');
  });
});
