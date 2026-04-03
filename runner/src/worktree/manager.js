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

  async remove(taskId, deleteBranch = false) {
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

    // Only delete the branch if explicitly asked (after PR is merged)
    // Keep the branch alive so the PR sweep can still push/create PRs
    if (deleteBranch) {
      const branchName = `specd/${taskId}`;
      try {
        execSync(`git branch -D "${branchName}"`, { cwd: this.repoDir, stdio: 'pipe' });
      } catch (e) { /* branch may have been merged/deleted */ }
    }

    this.active.delete(taskId);
  }

  /**
   * Check if a branch has commits ahead of its parent.
   * Works even if the worktree is already cleaned up — uses repoDir.
   */
  hasChanges(taskId) {
    const branchName = `specd/${taskId}`;
    try {
      // Check if branch exists
      execSync(`git rev-parse --verify "${branchName}"`, { cwd: this.repoDir, stdio: 'pipe' });
      // Find the merge-base and count commits ahead
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.repoDir, stdio: 'pipe' }).toString().trim();
      const mergeBase = execSync(`git merge-base "${currentBranch}" "${branchName}"`, { cwd: this.repoDir, stdio: 'pipe' }).toString().trim();
      const count = execSync(`git rev-list --count ${mergeBase}..${branchName}`, { cwd: this.repoDir, stdio: 'pipe' }).toString().trim();
      return parseInt(count) > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * Push the branch and create a PR via gh CLI.
   * Works from repoDir — doesn't need an active worktree.
   */
  async createPR(taskId, taskName, summary) {
    const branchName = `specd/${taskId}`;

    // Check if there are actual commits to PR
    if (!this.hasChanges(taskId)) {
      console.log(`[${taskId}] No changes to create PR for`);
      return null;
    }

    try {
      // Push the branch (from repo dir, not worktree)
      console.log(`[${taskId}] Pushing branch ${branchName}...`);
      execSync(`git push -u origin "${branchName}"`, {
        cwd: this.repoDir,
        stdio: 'pipe',
      });

      // Base branch = current branch of main repo
      let baseBranch = 'main';
      try {
        baseBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.repoDir, stdio: 'pipe' }).toString().trim();
      } catch (e) { /* default to main */ }

      // Check if PR already exists for this branch
      try {
        const existing = execSync(`gh pr view "${branchName}" --json url --jq .url`, { cwd: this.repoDir, stdio: 'pipe' }).toString().trim();
        if (existing) {
          console.log(`[${taskId}] PR already exists: ${existing}`);
          return existing;
        }
      } catch (e) { /* no existing PR — create one */ }

      // Create PR via gh
      console.log(`[${taskId}] Creating PR (base: ${baseBranch})...`);
      const title = taskName.length > 70 ? taskName.substring(0, 67) + '...' : taskName;
      const body = [
        '## Summary',
        '',
        summary || 'Automated implementation by Specdacular Runner.',
        '',
        `## Task`,
        '',
        `\`${taskId}\``,
        '',
        '---',
        '_Created by specd-runner_',
      ].join('\n');

      const prUrl = execSync(
        `gh pr create --base "${baseBranch}" --head "${branchName}" --title "${title.replace(/"/g, '\\"')}" --body-file -`,
        { cwd: this.repoDir, stdio: ['pipe', 'pipe', 'pipe'], input: body }
      ).toString().trim();

      console.log(`[${taskId}] PR created: ${prUrl}`);
      return prUrl;
    } catch (e) {
      const stderr = e.stderr ? e.stderr.toString().trim() : '';
      console.error(`[${taskId}] Failed to create PR: ${e.message}`);
      if (stderr) console.error(`  ${stderr}`);

      // If PR already exists, try to get the URL
      if (stderr.includes('already exists')) {
        try {
          const url = execSync(`gh pr view "${branchName}" --json url --jq .url`, { cwd: this.repoDir, stdio: 'pipe' }).toString().trim();
          if (url) return url;
        } catch (e2) { /* give up */ }
      }
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
