#!/usr/bin/env node
// Installs (or removes) the `specd-review` CLI globally.
//
//   node install.js              install
//   node install.js --uninstall  remove
//   node install.js --help       usage
//
// Unlike `npm link`, this performs a real global install: npm packs this
// package and copies it into the global prefix, so the command keeps
// working even if this repository is moved or deleted.

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { unlinkSync } from 'node:fs';

const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

const pkgDir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const wantUninstall = args.includes('--uninstall') || args.includes('-u');
const wantHelp = args.includes('--help') || args.includes('-h');

function run(cmd, cmdArgs, opts = {}) {
  execFileSync(cmd, cmdArgs, { stdio: 'inherit', ...opts });
}

if (wantHelp) {
  console.log(`
  ${cyan}specd-review installer${reset}

  ${yellow}Usage:${reset}
    node install.js              ${dim}install globally${reset}
    node install.js --uninstall  ${dim}remove the global install${reset}
    node install.js --help       ${dim}show this message${reset}
`);
  process.exit(0);
}

try {
  if (wantUninstall) {
    console.log(`\n  Removing the global ${cyan}specd-review${reset} install...\n`);
    run('npm', ['uninstall', '-g', 'specd-review']);
    console.log(`\n  ${green}Done.${reset} Config at ${dim}~/.specd-review/${reset} was left in place.\n`);
  } else {
    console.log(`\n  Installing ${cyan}specd-review${reset} globally...\n`);
    // Clear any prior install/link so npm doesn't treat it as "up to date".
    try {
      run('npm', ['uninstall', '-g', 'specd-review'], { stdio: 'ignore' });
    } catch {
      // nothing previously installed — fine
    }
    // Pack a tarball and install that: `npm install -g <dir>` symlinks a
    // local path, but a tarball install is always a real copy, so the
    // command survives the repo being moved or deleted.
    const packed = execFileSync('npm', ['pack', '--silent', pkgDir], { cwd: tmpdir() })
      .toString().trim().split('\n').filter(Boolean).pop();
    const tarball = join(tmpdir(), packed);
    try {
      run('npm', ['install', '-g', tarball]);
    } finally {
      try { unlinkSync(tarball); } catch { /* best effort */ }
    }
    // Seed ~/.specd-review/ with default config + agents (won't overwrite).
    run('node', [join(pkgDir, 'cli.js'), 'init']);
    console.log(`
  ${green}Done!${reset} The ${cyan}specd-review${reset} command is on your PATH.

  ${yellow}Next:${reset}
    cd into a git repo on a feature branch, then run:
      ${cyan}specd-review${reset}                ${dim}auto mode${reset}
      ${cyan}specd-review --interactive${reset}  ${dim}pause at the findings gate${reset}

  Needs ${cyan}claude${reset} and ${cyan}codex${reset} on PATH for a real run.
`);
  }
} catch (err) {
  console.error(`\n  ${yellow}Failed:${reset} ${err.message}\n`);
  process.exit(1);
}
