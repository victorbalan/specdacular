// runner/main/test/db.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ProjectDB } from '../db.js';

describe('ProjectDB', () => {
  let tmpDir, dbPath;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'specd-db-'));
    dbPath = join(tmpDir, 'db.json');
    writeFileSync(dbPath, JSON.stringify({ projects: [] }));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('uses folder name as project ID', () => {
    const db = new ProjectDB(dbPath);
    const project = db.register('myproject', '/Users/victor/work/myproject');
    a.equal(project.id, 'myproject');
  });

  it('appends -2 on first collision', () => {
    const db = new ProjectDB(dbPath);
    db.register('myproject', '/Users/victor/work/myproject');
    const second = db.register('myproject', '/Users/victor/other/myproject');
    a.equal(second.id, 'myproject-2');
  });

  it('appends -3 on second collision', () => {
    const db = new ProjectDB(dbPath);
    db.register('myproject', '/Users/victor/work/myproject');
    db.register('myproject', '/Users/victor/other/myproject');
    const third = db.register('myproject', '/home/user/myproject');
    a.equal(third.id, 'myproject-3');
  });

  it('finds project by path', () => {
    const db = new ProjectDB(dbPath);
    db.register('myproject', '/Users/victor/work/myproject');
    const found = db.findByPath('/Users/victor/work/myproject');
    a.equal(found.id, 'myproject');
  });

  it('finds project by subpath', () => {
    const db = new ProjectDB(dbPath);
    db.register('myproject', '/Users/victor/work/myproject');
    const found = db.findByPath('/Users/victor/work/myproject/src/index.js');
    a.equal(found.id, 'myproject');
  });

  it('unregisters by id', () => {
    const db = new ProjectDB(dbPath);
    db.register('myproject', '/Users/victor/work/myproject');
    db.unregister('myproject');
    a.equal(db.list().length, 0);
  });
});
