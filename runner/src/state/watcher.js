const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const chokidar = require('chokidar');

class TaskWatcher extends EventEmitter {
  constructor(tasksDir) {
    super();
    this.tasksDir = tasksDir;
    this.watcher = null;
  }

  parseTaskFile(filePath) {
    const ext = path.extname(filePath);
    if (ext !== '.yaml' && ext !== '.yml') return null;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(content);
      const id = path.basename(filePath, ext);
      return { id, ...data };
    } catch (e) {
      this.emit('error', new Error(`Failed to parse ${filePath}: ${e.message}`));
      return null;
    }
  }

  async scan() {
    if (!fs.existsSync(this.tasksDir)) return [];

    const files = fs.readdirSync(this.tasksDir)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .sort();

    return files
      .map(f => this.parseTaskFile(path.join(this.tasksDir, f)))
      .filter(Boolean);
  }

  async watch() {
    this.watcher = chokidar.watch(this.tasksDir, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    });

    this.watcher.on('add', (filePath) => {
      const task = this.parseTaskFile(filePath);
      if (task) this.emit('task_added', task);
    });

    this.watcher.on('change', (filePath) => {
      const task = this.parseTaskFile(filePath);
      if (task) this.emit('task_changed', task);
    });

    this.watcher.on('unlink', (filePath) => {
      const ext = path.extname(filePath);
      const id = path.basename(filePath, ext);
      this.emit('task_removed', { id });
    });
  }

  close() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

module.exports = { TaskWatcher };
