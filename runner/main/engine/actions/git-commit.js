import { execSync } from 'child_process';
import { createLogger } from '../../logger.js';

const log = createLogger('git-commit', '\x1b[33m');

export const gitCommitAction = {
  name: 'git-commit',

  async execute(context) {
    const cwd = context._runtime?.cwd || context._runtime?.repoDir;
    if (!cwd) return;

    const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
    if (!status) {
      log.info('no changes to commit');
      return;
    }

    const stageName = context._runtime?.currentStage || 'unknown';
    const message = `feat(${context.task.id}): complete stage "${stageName}"`;

    execSync('git add -A', { cwd, stdio: 'pipe' });
    execSync(`git commit -m "${message}"`, { cwd, stdio: 'pipe' });

    const commitHash = execSync('git rev-parse --short HEAD', { cwd, encoding: 'utf-8' }).trim();
    context.git = context.git || {};
    context.git.commits = context.git.commits || [];
    context.git.commits.push(commitHash);

    log.info(`committed ${commitHash}: ${message}`);
  },
};
