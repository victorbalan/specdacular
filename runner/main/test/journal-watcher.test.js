// runner/main/test/journal-watcher.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { JournalWatcher } from '../engine/progress/journal-watcher.js';
import { inferProgress } from '../engine/progress/inference.js';

describe('JournalWatcher', () => {
  let tmpDir, journalPath;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'specd-journal-'));
    mkdirSync(join(tmpDir, '.specd'), { recursive: true });
    journalPath = join(tmpDir, '.specd', 'journal.json');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads journal entries when file exists', () => {
    const entries = [
      { type: 'progress', message: 'Starting', percent: 10 },
      { type: 'decision', decision: 'Use OAuth2', reason: 'Security' },
    ];
    writeFileSync(journalPath, JSON.stringify(entries));

    const watcher = new JournalWatcher(tmpDir);
    const result = watcher.read();
    a.equal(result.length, 2);
    a.equal(result[0].message, 'Starting');
    a.equal(result[1].decision, 'Use OAuth2');
  });

  it('returns empty array when journal does not exist', () => {
    const watcher = new JournalWatcher(tmpDir + '/nonexistent');
    const result = watcher.read();
    a.deepEqual(result, []);
  });

  it('returns new entries since last read', () => {
    writeFileSync(journalPath, JSON.stringify([
      { type: 'progress', message: 'Step 1', percent: 10 },
    ]));

    const watcher = new JournalWatcher(tmpDir);
    watcher.read(); // consume first entry

    writeFileSync(journalPath, JSON.stringify([
      { type: 'progress', message: 'Step 1', percent: 10 },
      { type: 'progress', message: 'Step 2', percent: 50 },
    ]));

    const newEntries = watcher.readNew();
    a.equal(newEntries.length, 1);
    a.equal(newEntries[0].message, 'Step 2');
  });
});

describe('inferProgress', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'specd-infer-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns active/idle status for non-git directory', () => {
    const status = inferProgress(tmpDir, Date.now());
    a.ok(status.message);
    a.equal(status.type, 'inference');
  });
});
