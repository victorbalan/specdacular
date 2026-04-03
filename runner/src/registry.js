const fs = require('fs');
const path = require('path');

class ProjectRegistry {
  constructor(registryPath) {
    this.registryPath = registryPath;
    this.projects = this._load();
  }

  _load() {
    if (!fs.existsSync(this.registryPath)) return [];
    try {
      return JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
    } catch (e) {
      return [];
    }
  }

  _save() {
    const dir = path.dirname(this.registryPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.registryPath, JSON.stringify(this.projects, null, 2));
  }

  register(name, repoPath) {
    const projectName = name || path.basename(repoPath);
    const existing = this.projects.findIndex(p => p.name === projectName);
    const entry = {
      name: projectName,
      repoPath: repoPath,
      registeredAt: new Date().toISOString(),
    };
    if (existing >= 0) {
      this.projects[existing] = entry;
    } else {
      this.projects.push(entry);
    }
    this._save();
    return entry;
  }

  unregister(name) {
    this.projects = this.projects.filter(p => p.name !== name);
    this._save();
  }

  get(name) {
    return this.projects.find(p => p.name === name) || null;
  }

  list() {
    return this.projects;
  }
}

module.exports = { ProjectRegistry };
