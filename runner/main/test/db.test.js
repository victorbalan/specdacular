import { describe, it, before, after, beforeEach } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ProjectDB } from '../db.js';

describe('ProjectDB', () => {
  let tempDir;
  let dbPath;
  let db;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specd-db-test-'));
    dbPath = join(tempDir, 'db.json');
  });

  beforeEach(() => {
    writeFileSync(dbPath, JSON.stringify({ projects: [] }));
    db = new ProjectDB(dbPath);
  });

  after(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('registers a project', () => {
    const project = db.register('my-project', '/Users/victor/work/my-project');
    a.equal(project.name, 'my-project');
    a.equal(project.path, '/Users/victor/work/my-project');
    a.equal(project.active, true);
    a.ok(project.id);
    a.ok(project.registeredAt);
  });

  it('lists projects', () => {
    db.register('proj-a', '/a');
    db.register('proj-b', '/b');
    const list = db.list();
    a.equal(list.length, 2);
  });

  it('gets a project by id', () => {
    const project = db.register('my-project', '/path');
    const found = db.get(project.id);
    a.equal(found.name, 'my-project');
  });

  it('finds a project by path', () => {
    db.register('my-project', '/Users/victor/work/my-project');
    const found = db.findByPath('/Users/victor/work/my-project');
    a.equal(found.name, 'my-project');
  });

  it('finds a project by subdirectory path', () => {
    db.register('my-project', '/Users/victor/work');
    const found = db.findByPath('/Users/victor/work/repo-a');
    a.equal(found.name, 'my-project');
  });

  it('unregisters a project', () => {
    const project = db.register('my-project', '/path');
    db.unregister(project.id);
    a.equal(db.list().length, 0);
  });

  it('persists to disk', () => {
    db.register('my-project', '/path');
    const db2 = new ProjectDB(dbPath);
    a.equal(db2.list().length, 1);
  });
});
