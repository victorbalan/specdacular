// runner/main/worktree/manager.js
import { execSync, execFileSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { tmpdir } from 'os';

export class WorktreeManager {
  constructor(repoDir) {
    this.repoDir = repoDir;
    this.worktreesDir = join(tmpdir(), 'specd-worktrees', basename(repoDir));
    this.active = new Map();
  }

  create(taskId) {
    const branch = `specd/${taskId}`;
    const worktreePath = join(this.worktreesDir, taskId);

    mkdirSync(this.worktreesDir, { recursive: true });

    // Create branch from current HEAD
    try {
      execSync(`git branch ${branch}`, { cwd: this.repoDir, stdio: 'pipe' });
    } catch {
      // Branch may already exist
    }

    execSync(`git worktree add "${worktreePath}" ${branch}`, {
      cwd: this.repoDir,
      stdio: 'pipe',
    });

    this.active.set(taskId, worktreePath);
    return worktreePath;
  }

  remove(taskId, deleteBranch = false) {
    const worktreePath = this.active.get(taskId);
    if (!worktreePath) return;

    execSync(`git worktree remove "${worktreePath}" --force`, {
      cwd: this.repoDir,
      stdio: 'pipe',
    });

    if (deleteBranch) {
      try {
        execSync(`git branch -D specd/${taskId}`, { cwd: this.repoDir, stdio: 'pipe' });
      } catch {
        // Branch may not exist
      }
    }

    this.active.delete(taskId);
  }

  hasChanges(taskId) {
    const worktreePath = this.active.get(taskId);
    if (!worktreePath) return false;

    try {
      const base = execSync('git merge-base HEAD main', { cwd: worktreePath, encoding: 'utf-8' }).trim();
      const head = execSync('git rev-parse HEAD', { cwd: worktreePath, encoding: 'utf-8' }).trim();
      return base !== head;
    } catch {
      return false;
    }
  }

  createPR(taskId, taskName, summary) {
    const worktreePath = this.active.get(taskId);
    if (!worktreePath) return null;

    const branch = `specd/${taskId}`;

    try {
      execFileSync('git', ['push', '-u', 'origin', branch], { cwd: worktreePath, stdio: 'pipe' });
      const prUrl = execFileSync(
        'gh', ['pr', 'create', '--title', taskName, '--body', summary, '--head', branch],
        { cwd: worktreePath, encoding: 'utf-8' }
      ).trim();
      return prUrl;
    } catch (err) {
      console.error(`PR creation failed for ${taskId}:`, err.message);
      return null;
    }
  }

  getPath(taskId) {
    return this.active.get(taskId) || null;
  }

  listActive() {
    return [...this.active.keys()];
  }
}
