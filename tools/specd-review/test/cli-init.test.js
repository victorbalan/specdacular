import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runInit } from '../cli.js';

let dest;
beforeEach(() => { dest = mkdtempSync(join(tmpdir(), 'sr-init-')); });
afterEach(() => rmSync(dest, { recursive: true, force: true }));

describe('runInit', () => {
  it('seeds config.yml and the four default agent files', () => {
    runInit(dest);
    a.ok(existsSync(join(dest, 'config.yml')));
    for (const name of ['claude-correctness', 'codex-security', 'codex-perf', 'claude-fixer']) {
      a.ok(existsSync(join(dest, 'agents', `${name}.yml`)), `${name} missing`);
    }
  });

  it('does not overwrite an existing config.yml', () => {
    runInit(dest);
    writeFileSync(join(dest, 'config.yml'), 'max_rounds: 99\n');
    runInit(dest);
    a.equal(readFileSync(join(dest, 'config.yml'), 'utf8'), 'max_rounds: 99\n');
  });
});
