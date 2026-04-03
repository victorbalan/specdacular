const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class WorktreeManager {
  constructor(repoDir, worktreesDir) {
    this.repoDir = repoDir;
    this.worktreesDir = worktreesDir || path.join(repoDir, '.specd', 'runner', 'worktrees');
    this.active = new Map();
  }

  async create(taskId) {
    const branchName = `specd/${taskId}`;
    const worktreePath = path.join(this.worktreesDir, taskId);

    try {
      execSync(`git branch "${branchName}"`, { cwd: this.repoDir, stdio: 'pipe' });
    } catch (e) {
      if (!e.stderr?.toString().includes('already exists')) throw e;
    }

    if (!fs.existsSync(this.worktreesDir)) {
      fs.mkdirSync(this.worktreesDir, { recursive: true });
    }

    execSync(`git worktree add "${worktreePath}" "${branchName}"`, {
      cwd: this.repoDir,
      stdio: 'pipe',
    });

    this.active.set(taskId, worktreePath);
    return worktreePath;
  }

  async remove(taskId) {
    const worktreePath = this.active.get(taskId);
    if (!worktreePath) return;

    try {
      execSync(`git worktree remove "${worktreePath}" --force`, {
        cwd: this.repoDir,
        stdio: 'pipe',
      });
    } catch (e) {
      execSync('git worktree prune', { cwd: this.repoDir, stdio: 'pipe' });
    }

    const branchName = `specd/${taskId}`;
    try {
      execSync(`git branch -D "${branchName}"`, { cwd: this.repoDir, stdio: 'pipe' });
    } catch (e) { /* branch may have been merged/deleted */ }

    this.active.delete(taskId);
  }

  getPath(taskId) {
    return this.active.get(taskId) || null;
  }

  listActive() {
    return Array.from(this.active.keys());
  }
}

module.exports = { WorktreeManager };
