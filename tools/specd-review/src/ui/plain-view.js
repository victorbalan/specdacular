import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { writeFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';

export function formatFindings(findings) {
  if (!findings.length) return chalk.green('No findings.');
  const byFile = {};
  for (const f of findings) (byFile[f.file] ||= []).push(f);
  const lines = [];
  for (const [file, fs] of Object.entries(byFile)) {
    lines.push(chalk.bold(file));
    for (const f of fs) {
      const tag = f.severity === 'blocking'
        ? chalk.red('[blocking]') : chalk.yellow('[nice-to-have]');
      const loc = f.line != null ? `:${f.line}` : '';
      lines.push(`  ${tag} ${file}${loc} (${f.category}, ${f.source})`);
      lines.push(`    ${f.description}`);
      if (f.suggestion) lines.push(chalk.dim(`    → ${f.suggestion}`));
    }
  }
  return lines.join('\n');
}

export function parseGateInput(raw) {
  const text = raw.trim();
  if (text === '') return { action: 'continue' };
  if (text === '/continue') return { action: 'continue' };
  if (text === '/accept') return { action: 'accept' };
  if (text === '/quit') return { action: 'quit' };
  if (text === '/edit') return { action: 'edit' };
  return { action: 'feedback', feedback: text };
}

export function editFindingsInEditor(findings) {
  const path = join(tmpdir(), `specd-review-findings-${Date.now()}.json`);
  writeFileSync(path, JSON.stringify(findings, null, 2));
  const editor = process.env.EDITOR || 'vi';
  execSync(`${editor} ${path}`, { stdio: 'inherit' });
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function createPlainView() {
  return {
    async showRound({ round, reviewers, base }) {
      stdout.write(chalk.cyan(`\n=== Round ${round} · base ${base.slice(0, 7)} ===\n`));
      stdout.write(chalk.dim(`reviewers: ${reviewers.map((r) => r.name).join(', ')}\n`));
    },

    async findingsGate({ round, findings }) {
      let current = findings;
      const rl = readline.createInterface({ input: stdin, output: stdout });
      try {
        for (;;) {
          stdout.write(`\n${formatFindings(current)}\n`);
          const raw = await rl.question(
            chalk.bold('\n[enter]=continue  /edit  /accept  /quit  or type feedback > '),
          );
          const parsed = parseGateInput(raw);
          if (parsed.action === 'edit') { current = editFindingsInEditor(current); continue; }
          if (parsed.action === 'continue') return { action: 'continue', findings: current, feedback: '' };
          if (parsed.action === 'feedback') {
            return { action: 'continue', findings: current, feedback: parsed.feedback };
          }
          return { action: parsed.action, findings: current, feedback: '' };
        }
      } finally {
        rl.close();
      }
    },

    async showResult({ outcome, reportPath }) {
      stdout.write(chalk.cyan(`\nOutcome: ${outcome}\n`));
      stdout.write(chalk.dim(`Report: ${reportPath}\n`));
    },
  };
}
