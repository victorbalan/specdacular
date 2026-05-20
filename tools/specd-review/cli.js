#!/usr/bin/env node
import { Command } from 'commander';
import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stdout } from 'node:process';
import { loadConfig, defaultGlobalDir } from './src/config.js';
import { assertCleanTree, resolveBase, getDiff, commitRound, checkoutPR } from './src/git.js';
import { runAgent } from './src/agent-runner.js';
import { runReview } from './src/orchestrator.js';
import { createPlainView } from './src/ui/plain-view.js';
import { createInkView } from './src/ui/ink-view.js';
import { writeReport } from './src/report.js';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG = 'max_rounds: 5\n';

// Seeds a global dir with config.yml + bundled agent files. Exported for tests.
export function runInit(globalDir) {
  mkdirSync(join(globalDir, 'agents'), { recursive: true });
  const cfg = join(globalDir, 'config.yml');
  if (!existsSync(cfg)) writeFileSync(cfg, DEFAULT_CONFIG);
  cpSync(join(here, 'agents'), join(globalDir, 'agents'), { recursive: true });
}

// Adapter: bridges agent-runner.js to the orchestrator's `runner` interface.
function makeRunner(cwd, view) {
  return {
    async runReviewer(agent, { diff, round, base }) {
      const res = await runAgent(agent, { diff, round, base }, {
        cwd,
        onStatus: (s) => view.updateAgent?.(agent.name, { status: s, done: false }),
      });
      const count = res.result?.findings?.length || 0;
      view.updateAgent?.(agent.name, { done: true, findingCount: count, skipped: !res.result });
      return { agent: agent.name, output: res.result };
    },
    async runFixer(agent, { diff, findings, feedback, round }) {
      const res = await runAgent(agent, {
        diff, round,
        findings: JSON.stringify(findings, null, 2),
        user_feedback: feedback || '(none)',
      }, { cwd });
      return { changed: !!res.result };
    },
  };
}

async function review(prNumber, opts) {
  const cwd = process.cwd();
  if (prNumber) checkoutPR(cwd, prNumber);
  await assertCleanTree(cwd);

  const config = loadConfig({
    globalDir: opts.config || defaultGlobalDir(),
    projectDir: join(cwd, '.specd-review'),
    cliAgents: opts.agents ? opts.agents.split(',') : null,
  });
  if (opts.maxRounds) config.maxRounds = Number(opts.maxRounds);

  const base = await resolveBase(cwd);
  const interactive = !!opts.interactive;
  const view = (interactive && stdout.isTTY) ? createInkView() : createPlainView();

  const result = await runReview({
    config, base, cwd, interactive, ui: view,
    git: { getDiff, commitRound },
    runner: makeRunner(cwd, view),
  });

  const reportPath = join(cwd, 'specd-review-report.md');
  writeReport(reportPath, result);
  await view.showResult({ outcome: result.outcome, reportPath });

  const blockingRemain = result.outcome === 'exhausted' || result.outcome === 'fixer-stalled';
  process.exit(blockingRemain ? 1 : 0);
}

const program = new Command();
program.name('specd-review').description('Iterative multi-agent code review CLI').version('0.1.0');

program.command('init')
  .description('Seed ~/.specd-review/ with default config and agents')
  .action(() => {
    runInit(defaultGlobalDir());
    stdout.write(`Seeded ${defaultGlobalDir()}\n`);
  });

program.argument('[pr]', 'GitHub PR number to review (omit to review the current branch)')
  .option('-i, --interactive', 'pause at the findings gate for human input')
  .option('--agents <list>', 'comma-separated agent selection override')
  .option('--max-rounds <n>', 'override max_rounds')
  .option('--config <dir>', 'alternate global config directory')
  .action((pr, opts) => review(pr, opts));

if (process.argv[1] && process.argv[1].endsWith('cli.js')) {
  program.parse();
}
