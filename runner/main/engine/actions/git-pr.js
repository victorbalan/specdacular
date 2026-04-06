import { execFileSync } from 'child_process';
import { createLogger } from '../../logger.js';

const log = createLogger('git-pr', '\x1b[33m');

export const gitPrAction = {
  name: 'git-pr',

  async execute(context, config) {
    const cwd = context._runtime?.cwd || context._runtime?.repoDir;
    const branch = context.git?.branch;
    if (!cwd || !branch) return;

    const draft = config?.draft !== false;
    const title = context.task.name;
    const body = Object.entries(context.stages || {})
      .filter(([, s]) => s.status === 'success')
      .map(([name, s]) => `### ${name}\n${s.output || 'Completed'}`)
      .join('\n\n');

    try {
      execFileSync('git', ['push', '-u', 'origin', branch], { cwd, stdio: 'pipe' });

      try {
        const existing = execFileSync('gh', ['pr', 'view', '--json', 'url', '-q', '.url'], {
          cwd, encoding: 'utf-8',
        }).trim();
        if (existing) {
          log.info(`PR already exists: ${existing}`);
          context.git.pr_url = existing;
          return;
        }
      } catch {
        // No existing PR
      }

      const args = ['pr', 'create', '--title', title, '--body', body, '--head', branch];
      if (draft) args.push('--draft');
      const prUrl = execFileSync('gh', args, { cwd, encoding: 'utf-8' }).trim();
      context.git.pr_url = prUrl;
      log.info(`created PR: ${prUrl}`);
    } catch (err) {
      log.error(`PR creation failed: ${err.message}`);
    }
  },
};
