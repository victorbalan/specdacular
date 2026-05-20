// test/git.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import {
  assertCleanTree, resolveBase, getDiff, commitRound, hasUncommittedChanges,
} from '../src/git.js';

let repo;
const git = (...args) => execFileSync('git', args, { cwd: repo }).toString();

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'sr-git-'));
  git('init', '-b', 'main');
  git('config', 'user.email', 't@t.t');
  git('config', 'user.name', 'T');
  writeFileSync(join(repo, 'f.txt'), 'base\n');
  git('add', '.');
  git('commit', '-m', 'base');
  git('checkout', '-b', 'feature');
  writeFileSync(join(repo, 'f.txt'), 'changed\n');
  git('add', '.');
  git('commit', '-m', 'change');
});
afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe('git helpers', () => {
  it('resolveBase finds the merge-base with main', async () => {
    const base = await resolveBase(repo);
    a.equal(typeof base, 'string');
    a.ok(base.length > 0);
  });

  it('getDiff returns the branch diff against the base', async () => {
    const base = await resolveBase(repo);
    const diff = await getDiff(repo, base);
    a.match(diff, /changed/);
  });

  it('assertCleanTree passes on a clean tree and throws on a dirty one', async () => {
    await assertCleanTree(repo);
    writeFileSync(join(repo, 'f.txt'), 'dirty\n');
    await a.rejects(assertCleanTree(repo), /uncommitted/i);
  });

  it('commitRound creates a commit and returns its hash', async () => {
    writeFileSync(join(repo, 'f.txt'), 'fixed\n');
    const hash = await commitRound(repo, 1, 3);
    a.ok(hash && hash.length >= 7);
    a.match(git('log', '-1', '--pretty=%s'), /round 1.*3 issue/);
  });

  it('hasUncommittedChanges reflects whether the tree is dirty', async () => {
    a.equal(await hasUncommittedChanges(repo), false);
    writeFileSync(join(repo, 'f.txt'), 'dirty\n');
    a.equal(await hasUncommittedChanges(repo), true);
  });
});
