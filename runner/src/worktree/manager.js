const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class WorktreeManager {
  constructor(repoDir, worktreesDir) {
    this.repoDir = repoDir;
    // Store worktrees OUTSIDE the repo to avoid conflicts
    // Default: /tmp/specd-worktrees/<repo-name>/
    const repoName = path.basename(repoDir);
    this.worktreesDir = worktreesDir || path.join(os.tmpdir(), 'specd-worktrees', repoName);
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

  /**
   * Check if the worktree branch has commits ahead of its base.
   */
  hasChanges(taskId) {
    const worktreePath = this.active.get(taskId);
    if (!worktreePath) return false;
    const branchName = `specd/${taskId}`;
    try {
      // Count commits on this branch that aren't on the base
      const base = execSync('git rev-parse HEAD', { cwd: this.repoDir, stdio: 'pipe' }).toString().trim();
      const count = execSync(`git rev-list --count ${base}..${branchName}`, { cwd: this.repoDir, stdio: 'pipe' }).toString().trim();
      return parseInt(count) > 0;
    } catch (e) {
      // Fallback: check if there are any uncommitted changes
      try {
        const status = execSync('git status --porcelain', { cwd: worktreePath, stdio: 'pipe' }).toString().trim();
        return status.length > 0;
      } catch (e2) {
        return false;
      }
    }
  }

  /**
   * Push the worktree branch and create a PR via gh CLI.
   * Returns the PR URL or null if no changes / gh not available.
   */
  async createPR(taskId, taskName, summary) {
    const branchName = `specd/${taskId}`;
    const worktreePath = this.active.get(taskId);
    if (!worktreePath) return null;

    // Check if there are actual commits to PR
    if (!this.hasChanges(taskId)) {
      console.log(`[${taskId}] No changes to create PR for`);
      return null;
    }

    try {
      // Push the branch
      console.log(`[${taskId}] Pushing branch ${branchName}...`);
      execSync(`git push -u origin "${branchName}"`, {
        cwd: worktreePath,
        stdio: 'pipe',
      });

      // Detect base branch
      let baseBranch = 'main';
      try {
        const remote = execSync('git remote show origin', { cwd: this.repoDir, stdio: 'pipe' }).toString();
        const match = remote.match(/HEAD branch:\s*(\S+)/);
        if (match) baseBranch = match[1];
      } catch (e) { /* default to main */ }

      // Create PR via gh
      console.log(`[${taskId}] Creating PR...`);
      const title = taskName.length > 70 ? taskName.substring(0, 67) + '...' : taskName;
      const body = `## Summary\n\n${summary || 'Automated implementation by Specdacular Runner.'}\n\n## Task\n\n\`${taskId}\`\n\n---\n_Created by specd-runner_`;

      const prUrl = execSync(
        `gh pr create --base "${baseBranch}" --head "${branchName}" --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}"`,
        { cwd: worktreePath, stdio: 'pipe' }
      ).toString().trim();

      console.log(`[${taskId}] PR created: ${prUrl}`);
      return prUrl;
    } catch (e) {
      console.error(`[${taskId}] Failed to create PR: ${e.message}`);
      // Try to get more info from stderr
      if (e.stderr) console.error(`  ${e.stderr.toString().trim()}`);
      return null;
    }
  }

  getPath(taskId) {
    return this.active.get(taskId) || null;
  }

  listActive() {
    return Array.from(this.active.keys());
  }
}

module.exports = { WorktreeManager };
