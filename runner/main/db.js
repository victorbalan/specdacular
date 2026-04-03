import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

export class ProjectDB {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.data = JSON.parse(readFileSync(dbPath, 'utf-8'));
  }

  register(name, folderPath) {
    const project = {
      id: randomUUID().slice(0, 8),
      name,
      path: folderPath,
      active: true,
      registeredAt: new Date().toISOString(),
    };
    this.data.projects.push(project);
    this._save();
    return project;
  }

  unregister(id) {
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this._save();
  }

  get(id) {
    return this.data.projects.find(p => p.id === id) || null;
  }

  findByPath(folderPath) {
    return this.data.projects.find(p =>
      folderPath === p.path || folderPath.startsWith(p.path + '/')
    ) || null;
  }

  list() {
    return this.data.projects;
  }

  _save() {
    writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
  }
}
