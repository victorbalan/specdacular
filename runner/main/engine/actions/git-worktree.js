import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { tmpdir } from 'os';
import { createLogger } from '../../logger.js';

const log = createLogger('git-worktree', '\x1b[33m');

export const gitWorktreeAction = {
  name: 'git-worktree',

  async execute(context) {
    const { task, _runtime } = context;
    if (!_runtime?.repoDir) {
      log.warn('no repoDir in runtime context, skipping worktree');
      return;
    }

    const repoDir = _runtime.repoDir;
    const branch = `specd/${task.id}`;
    const worktreesDir = join(tmpdir(), 'specd-worktrees', basename(repoDir));
    const worktreePath = join(worktreesDir, task.id);

    mkdirSync(worktreesDir, { recursive: true });

    // Reuse existing worktree on retry — preserves previous work
    if (existsSync(worktreePath)) {
      log.info(`reusing existing worktree at ${worktreePath}`);
      context.git = context.git || {};
      context.git.branch = branch;
      context.git.worktree = worktreePath;
      context._runtime.cwd = worktreePath;
      return;
    }

    try {
      execSync(`git branch ${branch}`, { cwd: repoDir, stdio: 'pipe' });
    } catch {
      // Branch may already exist
    }

    execSync(`git worktree add "${worktreePath}" ${branch}`, {
      cwd: repoDir,
      stdio: 'pipe',
    });

    context.git = context.git || {};
    context.git.branch = branch;
    context.git.worktree = worktreePath;
    context._runtime.cwd = worktreePath;

    log.info(`created worktree at ${worktreePath}`);
  },
};
