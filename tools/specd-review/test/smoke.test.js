// test/smoke.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { execFileSync } from 'node:child_process';

describe('cli', () => {
  it('prints its version', () => {
    const out = execFileSync('node', ['cli.js', '--version'], {
      cwd: new URL('..', import.meta.url).pathname,
    }).toString().trim();
    a.equal(out, '0.1.0');
  });
});
