# Global Daemon Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the runner from a per-project process to a global daemon that manages multiple projects, with runtime state in `~/.specd/runner/` and project config in repo.

**Architecture:** The daemon maintains a project registry (`~/.specd/runner/projects.json`). Each registered project points to a repo path where `.specd/runner/` config lives. Runtime state (status, logs) goes to `~/.specd/runner/projects/<name>/`. The orchestrator manages multiple project loops concurrently. Dashboard shows all projects.

**Tech Stack:** Node.js 18+, Express, ws, chokidar, js-yaml, commander (same deps, no additions)

---

## File Structure

```
runner/src/
  cli.js                         # MODIFY: new commands (daemon start/stop, register, status)
  daemon.js                      # CREATE: global daemon — manages project registry + orchestrators
  orchestrator.js                # MODIFY: accept paths object instead of single configDir
  paths.js                       # CREATE: resolve all paths (home dir, project dir, logs, status)
  config/
    loader.js                    # MINOR: no changes needed (already takes configDir)
    schema.js                    # MINOR: no changes needed
  state/
    manager.js                   # MINOR: no changes (already takes statusPath)
    watcher.js                   # MINOR: no changes (already takes tasksDir)
  server/
    api.js                       # MODIFY: multi-project API routes
    index.js                     # MINOR: pass projects to API router
    websocket.js                 # MINOR: no changes
  agent/
    runner.js                    # NO CHANGES
    parser.js                    # NO CHANGES
    template.js                  # NO CHANGES
  pipeline/
    resolver.js                  # NO CHANGES
    sequencer.js                 # NO CHANGES
  worktree/
    manager.js                   # NO CHANGES
  notifications/
    telegram.js                  # NO CHANGES

Home directory (~/.specd/runner/):
  projects.json                  # Project registry: name → repo path
  config.yaml                    # Personal settings (telegram, defaults)
  projects/
    <project-name>/
      status.json                # Per-project runtime state
      logs/                      # Per-project agent logs
```

---

### Task 1: Path Resolver

**Files:**
- Create: `runner/src/paths.js`
- Create: `runner/tests/paths.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/paths.test.js`:
```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const os = require('os');

describe('Paths', () => {
  let Paths;

  it('imports', () => {
    ({ Paths } = require('../src/paths'));
  });

  it('resolves home directory', () => {
    const p = new Paths();
    assert.strictEqual(p.homeDir, path.join(os.homedir(), '.specd', 'runner'));
  });

  it('resolves project registry path', () => {
    const p = new Paths();
    assert.strictEqual(p.registryPath, path.join(os.homedir(), '.specd', 'runner', 'projects.json'));
  });

  it('resolves project runtime paths', () => {
    const p = new Paths();
    const rt = p.forProject('smart-clipper');
    assert.strictEqual(rt.statusPath, path.join(os.homedir(), '.specd', 'runner', 'projects', 'smart-clipper', 'status.json'));
    assert.strictEqual(rt.logsDir, path.join(os.homedir(), '.specd', 'runner', 'projects', 'smart-clipper', 'logs'));
  });

  it('resolves project config paths from repo', () => {
    const p = new Paths();
    const cfg = p.configPaths('/Users/victor/work/smart-clipper');
    assert.strictEqual(cfg.configDir, path.join('/Users/victor/work/smart-clipper', '.specd', 'runner'));
    assert.strictEqual(cfg.tasksDir, path.join('/Users/victor/work/smart-clipper', '.specd', 'runner', 'tasks'));
  });

  it('resolves personal config path', () => {
    const p = new Paths();
    assert.strictEqual(p.personalConfigPath, path.join(os.homedir(), '.specd', 'runner', 'config.yaml'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/paths.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the path resolver**

`runner/src/paths.js`:
```js
const path = require('path');
const os = require('os');

class Paths {
  constructor(homeBase) {
    this.homeDir = homeBase || path.join(os.homedir(), '.specd', 'runner');
    this.registryPath = path.join(this.homeDir, 'projects.json');
    this.personalConfigPath = path.join(this.homeDir, 'config.yaml');
  }

  forProject(projectName) {
    const projectDir = path.join(this.homeDir, 'projects', projectName);
    return {
      projectDir,
      statusPath: path.join(projectDir, 'status.json'),
      logsDir: path.join(projectDir, 'logs'),
    };
  }

  configPaths(repoPath) {
    const configDir = path.join(repoPath, '.specd', 'runner');
    return {
      configDir,
      tasksDir: path.join(configDir, 'tasks'),
      configYaml: path.join(configDir, 'config.yaml'),
      agentsYaml: path.join(configDir, 'agents.yaml'),
      pipelinesYaml: path.join(configDir, 'pipelines.yaml'),
    };
  }

  ensureDirs(projectName) {
    const fs = require('fs');
    const rt = this.forProject(projectName);
    fs.mkdirSync(rt.logsDir, { recursive: true });
    fs.mkdirSync(path.dirname(this.registryPath), { recursive: true });
  }
}

module.exports = { Paths };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/paths.test.js`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/paths.js runner/tests/paths.test.js
git commit -m "feat(runner): path resolver for global daemon directory structure"
```

---

### Task 2: Project Registry

**Files:**
- Create: `runner/src/registry.js`
- Create: `runner/tests/registry.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/registry.test.js`:
```js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('ProjectRegistry', () => {
  let ProjectRegistry, tmpDir, registryPath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-reg-'));
    registryPath = path.join(tmpDir, 'projects.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ ProjectRegistry } = require('../src/registry'));
  });

  it('starts with empty registry', () => {
    const reg = new ProjectRegistry(registryPath);
    assert.deepStrictEqual(reg.list(), []);
  });

  it('registers a project', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    const projects = reg.list();
    assert.strictEqual(projects.length, 1);
    assert.strictEqual(projects[0].name, 'smart-clipper');
    assert.strictEqual(projects[0].repoPath, '/Users/victor/work/smart-clipper');
  });

  it('persists to disk', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    
    const reg2 = new ProjectRegistry(registryPath);
    const projects = reg2.list();
    assert.strictEqual(projects.length, 1);
    assert.strictEqual(projects[0].name, 'smart-clipper');
  });

  it('unregisters a project', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    reg.register('other', '/Users/victor/work/other');
    reg.unregister('smart-clipper');
    assert.strictEqual(reg.list().length, 1);
    assert.strictEqual(reg.list()[0].name, 'other');
  });

  it('gets a project by name', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    const project = reg.get('smart-clipper');
    assert.strictEqual(project.repoPath, '/Users/victor/work/smart-clipper');
  });

  it('returns null for unknown project', () => {
    const reg = new ProjectRegistry(registryPath);
    assert.strictEqual(reg.get('nonexistent'), null);
  });

  it('derives name from repo path if not given', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register(null, '/Users/victor/work/smart-clipper');
    assert.strictEqual(reg.list()[0].name, 'smart-clipper');
  });

  it('does not duplicate registrations', () => {
    const reg = new ProjectRegistry(registryPath);
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    reg.register('smart-clipper', '/Users/victor/work/smart-clipper');
    assert.strictEqual(reg.list().length, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/registry.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the project registry**

`runner/src/registry.js`:
```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/registry.test.js`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/registry.js runner/tests/registry.test.js
git commit -m "feat(runner): project registry for multi-project daemon"
```

---

### Task 3: Refactor Orchestrator to Accept Separated Paths

**Files:**
- Modify: `runner/src/orchestrator.js`
- Modify: `runner/tests/orchestrator.test.js`

The orchestrator currently takes a single `configDir` and derives all paths from it. Refactor it to accept a `paths` object so config comes from the repo and runtime state goes to home.

- [ ] **Step 1: Update the orchestrator constructor and init**

Replace the constructor and `init` in `runner/src/orchestrator.js`:

```js
class Orchestrator {
  constructor({ configDir, tasksDir, statusPath, logsDir, projectName }) {
    this.configDir = configDir;
    this.tasksDir = tasksDir || path.join(configDir, 'tasks');
    this.statusPath = statusPath || path.join(configDir, 'status.json');
    this.logsDir = logsDir || path.join(configDir, 'logs');
    this.projectName = projectName || 'default';

    this.config = null;
    this.agents = null;
    this.pipelines = null;
    this.tasks = [];
    this.stateManager = new StateManager(this.statusPath);
    this.taskWatcher = null;
    this.worktreeManager = null;
    this.running = false;
    this.completedTasks = new Set();
    this.runningTasks = new Set();
  }
```

No other method changes needed — they all use `this.configDir`, `this.tasksDir`, `this.statusPath`, `this.logsDir` which are already resolved.

- [ ] **Step 2: Update the test to pass the new constructor format**

In `runner/tests/orchestrator.test.js`, change:
```js
const orch = new Orchestrator(tmpDir);
```
to:
```js
const orch = new Orchestrator({ configDir: tmpDir });
```
(three places)

And change:
```js
const picked = orch.pickNextTask();
```
calls — these don't need changes since the method signature is the same.

- [ ] **Step 3: Run tests**

Run: `cd runner && node --test tests/orchestrator.test.js`
Expected: All 4 tests PASS

- [ ] **Step 4: Also update integration test**

In `runner/tests/integration.test.js`, change:
```js
const orch = new Orchestrator(tmpDir);
```
to:
```js
const orch = new Orchestrator({ configDir: tmpDir });
```
(three places)

- [ ] **Step 5: Run full test suite**

Run: `cd runner && npm test`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add runner/src/orchestrator.js runner/tests/orchestrator.test.js runner/tests/integration.test.js
git commit -m "refactor(runner): orchestrator accepts separated path config"
```

---

### Task 4: Global Daemon

**Files:**
- Create: `runner/src/daemon.js`
- Create: `runner/tests/daemon.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/daemon.test.js`:
```js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

describe('Daemon', () => {
  let Daemon, tmpHome, tmpProject;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-daemon-home-'));
    tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-daemon-proj-'));

    // Create project config
    const configDir = path.join(tmpProject, '.specd', 'runner', 'tasks');
    fs.mkdirSync(configDir, { recursive: true });

    const mockAgent = path.join(__dirname, 'fixtures', 'mock-agent.js');
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'config.yaml'), yaml.dump({
      server: { port: 0 },
      notifications: { telegram: { enabled: false } },
      defaults: { pipeline: 'default', failure_policy: 'skip', timeout: 5, stuck_timeout: 5, max_parallel: 1 },
    }));
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'agents.yaml'), yaml.dump({
      agents: { 'test-agent': { cmd: `node ${mockAgent}`, input_mode: 'stdin', output_format: 'json_block', system_prompt: 'test {{task.name}}' } },
    }));
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'pipelines.yaml'), yaml.dump({
      pipelines: { default: { stages: [{ stage: 'do', agent: 'test-agent', critical: true }] } },
    }));
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'tasks', '001-test.yaml'), yaml.dump({
      name: 'Test', status: 'ready', priority: 1, description: 'Test task', depends_on: [], pipeline: 'default',
    }));
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
    fs.rmSync(tmpProject, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ Daemon } = require('../src/daemon'));
  });

  it('registers a project and creates runtime dirs', () => {
    const d = new Daemon(tmpHome);
    d.registerProject('test-proj', tmpProject);

    const projects = d.listProjects();
    assert.strictEqual(projects.length, 1);
    assert.strictEqual(projects[0].name, 'test-proj');

    // Runtime dirs should exist in home
    const logsDir = path.join(tmpHome, 'projects', 'test-proj', 'logs');
    assert.ok(fs.existsSync(logsDir));
  });

  it('initializes an orchestrator for a registered project', async () => {
    const d = new Daemon(tmpHome);
    d.registerProject('test-proj', tmpProject);
    const orch = await d.initProject('test-proj');
    assert.ok(orch);
    assert.ok(orch.config);
    assert.ok(orch.agents);
  });

  it('runs a task through a registered project orchestrator', async () => {
    const d = new Daemon(tmpHome);
    d.registerProject('test-proj', tmpProject);
    const orch = await d.initProject('test-proj');
    await orch.runOnce();

    const statusPath = path.join(tmpHome, 'projects', 'test-proj', 'status.json');
    assert.ok(fs.existsSync(statusPath));
    const state = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    assert.strictEqual(state.tasks['001-test'].status, 'done');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/daemon.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the daemon**

`runner/src/daemon.js`:
```js
const fs = require('fs');
const path = require('path');
const { Paths } = require('./paths');
const { ProjectRegistry } = require('./registry');
const { Orchestrator } = require('./orchestrator');

class Daemon {
  constructor(homeBase) {
    this.paths = new Paths(homeBase);
    this.registry = new ProjectRegistry(this.paths.registryPath);
    this.orchestrators = new Map(); // projectName → Orchestrator
  }

  registerProject(name, repoPath) {
    const projectName = name || path.basename(repoPath);
    const configPaths = this.paths.configPaths(repoPath);

    // Verify project has config
    if (!fs.existsSync(configPaths.configDir)) {
      throw new Error(`No .specd/runner/ found in ${repoPath}`);
    }

    // Register in registry
    const entry = this.registry.register(projectName, repoPath);

    // Create runtime dirs
    this.paths.ensureDirs(projectName);

    console.log(`Registered project: ${projectName} → ${repoPath}`);
    return entry;
  }

  unregisterProject(name) {
    const orch = this.orchestrators.get(name);
    if (orch) {
      orch.stop();
      this.orchestrators.delete(name);
    }
    this.registry.unregister(name);
    console.log(`Unregistered project: ${name}`);
  }

  listProjects() {
    return this.registry.list();
  }

  async initProject(projectName) {
    const project = this.registry.get(projectName);
    if (!project) throw new Error(`Project "${projectName}" not registered`);

    const configPaths = this.paths.configPaths(project.repoPath);
    const runtimePaths = this.paths.forProject(projectName);

    // Ensure runtime dirs
    this.paths.ensureDirs(projectName);

    const orch = new Orchestrator({
      configDir: configPaths.configDir,
      tasksDir: configPaths.tasksDir,
      statusPath: runtimePaths.statusPath,
      logsDir: runtimePaths.logsDir,
      projectName,
    });

    await orch.init();
    this.orchestrators.set(projectName, orch);
    return orch;
  }

  async startAll() {
    const projects = this.registry.list();
    console.log(`Starting ${projects.length} project(s)...`);

    for (const project of projects) {
      try {
        const orch = await this.initProject(project.name);
        // Fire and forget — each project runs its own loop
        const promise = orch.startLoop();
        promise.catch(e => console.error(`[${project.name}] Loop error: ${e.message}`));
        console.log(`[${project.name}] Started`);
      } catch (e) {
        console.error(`[${project.name}] Failed to start: ${e.message}`);
      }
    }
  }

  stopAll() {
    for (const [name, orch] of this.orchestrators) {
      orch.stop();
      console.log(`[${name}] Stopped`);
    }
    this.orchestrators.clear();
  }

  getOrchestrator(projectName) {
    return this.orchestrators.get(projectName) || null;
  }

  getAllOrchestrators() {
    return this.orchestrators;
  }
}

module.exports = { Daemon };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/daemon.test.js`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/daemon.js runner/tests/daemon.test.js
git commit -m "feat(runner): global daemon with multi-project support"
```

---

### Task 5: Multi-Project API Routes

**Files:**
- Modify: `runner/src/server/api.js`
- Modify: `runner/src/server/index.js`

- [ ] **Step 1: Update API to support multi-project**

Replace `runner/src/server/api.js`:

```js
const express = require('express');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function createApiRouter(daemon) {
  const router = express.Router();

  // List all projects
  router.get('/projects', (req, res) => {
    const projects = daemon.listProjects().map(p => {
      const orch = daemon.getOrchestrator(p.name);
      const state = orch?.stateManager.getState();
      const taskCount = state ? Object.keys(state.tasks).length : 0;
      const running = orch ? orch.runningTasks.size : 0;
      return { ...p, taskCount, running };
    });
    res.json(projects);
  });

  // Global status — all projects, all tasks
  router.get('/status', (req, res) => {
    const result = { projects: {} };
    for (const [name, orch] of daemon.getAllOrchestrators()) {
      const state = orch.stateManager.getState();
      const taskFiles = _scanTaskFiles(orch.tasksDir);
      for (const tf of taskFiles) {
        if (!state.tasks[tf.id]) {
          state.tasks[tf.id] = {
            name: tf.name,
            status: tf.status === 'ready' ? 'queued' : tf.status,
            current_stage: null,
            pipeline: tf.pipeline || 'default',
            stages: [],
          };
        }
      }
      result.projects[name] = state;
    }
    res.json(result);
  });

  // Per-project status
  router.get('/projects/:project/status', (req, res) => {
    const orch = daemon.getOrchestrator(req.params.project);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const state = orch.stateManager.getState();
    const taskFiles = _scanTaskFiles(orch.tasksDir);
    for (const tf of taskFiles) {
      if (!state.tasks[tf.id]) {
        state.tasks[tf.id] = {
          name: tf.name,
          status: tf.status === 'ready' ? 'queued' : tf.status,
          current_stage: null,
          pipeline: tf.pipeline || 'default',
          stages: [],
        };
      }
    }
    res.json(state);
  });

  // Per-project tasks
  router.get('/projects/:project/tasks', (req, res) => {
    const orch = daemon.getOrchestrator(req.params.project);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const state = orch.stateManager.getState();
    const taskFiles = _scanTaskFiles(orch.tasksDir);
    const merged = {};
    for (const tf of taskFiles) {
      merged[tf.id] = state.tasks[tf.id] || {
        name: tf.name, status: tf.status === 'ready' ? 'queued' : tf.status,
        current_stage: null, pipeline: tf.pipeline || 'default', stages: [],
      };
    }
    for (const [id, task] of Object.entries(state.tasks)) {
      if (!merged[id]) merged[id] = task;
    }
    res.json(Object.entries(merged).map(([id, task]) => ({ id, ...task })));
  });

  // Task logs
  router.get('/projects/:project/tasks/:id/logs', (req, res) => {
    const orch = daemon.getOrchestrator(req.params.project);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const logFile = path.join(orch.logsDir, `${req.params.id}.log`);
    if (!fs.existsSync(logFile)) return res.json({ lines: [] });

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n');
    const tail = parseInt(req.query.tail) || 200;
    res.json({ lines: lines.slice(-tail) });
  });

  // Task actions
  router.post('/projects/:project/tasks/:id/retry', (req, res) => {
    const orch = daemon.getOrchestrator(req.params.project);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const taskId = req.params.id;
    const state = orch.stateManager.getState();
    const task = state.tasks[taskId];
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'failed') return res.status(400).json({ error: 'Task is not failed' });

    const taskFile = path.join(orch.tasksDir, `${taskId}.yaml`);
    if (fs.existsSync(taskFile)) {
      const data = yaml.load(fs.readFileSync(taskFile, 'utf8'));
      data.status = 'ready';
      fs.writeFileSync(taskFile, yaml.dump(data));
    }

    orch.completedTasks.delete(taskId);
    orch.stateManager.updateTaskStatus(taskId, 'queued');
    orch.stateManager.persist();
    res.json({ status: 'queued', message: `Task ${taskId} queued for retry` });
  });

  router.post('/projects/:project/tasks/:id/skip', (req, res) => {
    const orch = daemon.getOrchestrator(req.params.project);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const taskId = req.params.id;
    orch.completedTasks.add(taskId);
    orch.stateManager.updateTaskStatus(taskId, 'done');
    orch.stateManager.persist();
    res.json({ status: 'skipped', message: `Task ${taskId} marked as done` });
  });

  // Register a new project
  router.post('/projects', (req, res) => {
    const { name, repoPath } = req.body;
    if (!repoPath) return res.status(400).json({ error: 'repoPath required' });
    try {
      const entry = daemon.registerProject(name, repoPath);
      daemon.initProject(entry.name).then(orch => {
        orch.startLoop().catch(e => console.error(`[${entry.name}] Loop error: ${e.message}`));
      });
      res.json(entry);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  return router;
}

function _scanTaskFiles(tasksDir) {
  if (!fs.existsSync(tasksDir)) return [];
  return fs.readdirSync(tasksDir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort()
    .map(f => {
      try {
        const ext = path.extname(f);
        const id = path.basename(f, ext);
        const data = yaml.load(fs.readFileSync(path.join(tasksDir, f), 'utf8'));
        return { id, ...data };
      } catch (e) { return null; }
    })
    .filter(Boolean);
}

module.exports = { createApiRouter };
```

- [ ] **Step 2: Update server/index.js to accept daemon instead of orchestrator**

Replace `runner/src/server/index.js`:

```js
const express = require('express');
const http = require('http');
const path = require('path');
const { createApiRouter } = require('./api');
const { WsBroadcaster } = require('./websocket');

function createServer(daemon, port) {
  const app = express();
  app.use(express.json());

  app.use('/api', createApiRouter(daemon));

  const dashboardPath = path.join(__dirname, '..', '..', 'dashboard', 'dist');
  app.use(express.static(dashboardPath));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(dashboardPath, 'index.html'));
  });

  const server = http.createServer(app);
  const broadcaster = new WsBroadcaster(server);

  // Wire all orchestrators' state changes to WebSocket
  for (const [name, orch] of daemon.getAllOrchestrators()) {
    orch.stateManager.on('change', (event) => {
      broadcaster.broadcast({ ...event, project: name });
    });
  }

  return {
    start: () => new Promise((resolve) => {
      server.listen(port, () => {
        console.log(`Dashboard: http://localhost:${port}`);
        resolve(server);
      });
    }),
    stop: () => new Promise((resolve) => {
      broadcaster.close();
      server.close(resolve);
    }),
    app,
    server,
    broadcaster,
    // Call this when a new project is added after server start
    wireProject: (name, orch) => {
      orch.stateManager.on('change', (event) => {
        broadcaster.broadcast({ ...event, project: name });
      });
    },
  };
}

module.exports = { createServer };
```

- [ ] **Step 3: Commit**

```bash
git add runner/src/server/api.js runner/src/server/index.js
git commit -m "feat(runner): multi-project API routes and server wiring"
```

---

### Task 6: New CLI Commands

**Files:**
- Modify: `runner/src/cli.js`

- [ ] **Step 1: Rewrite the CLI**

Replace `runner/src/cli.js`:

```js
#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const { Daemon } = require('./daemon');
const { Paths } = require('./paths');
const { createServer } = require('./server/index');
const { TelegramNotifier } = require('./notifications/telegram');

const program = new Command();
const paths = new Paths();

program
  .name('specd-runner')
  .description('Config-driven autonomous agent orchestrator')
  .version('0.1.0');

// ─── specd-runner start ───────────────────────────────────────────
program
  .command('start')
  .description('Start the global daemon (API + all registered projects)')
  .option('-p, --port <port>', 'API port', '3700')
  .action(async (opts) => {
    const port = parseInt(opts.port);

    try {
      const daemon = new Daemon();

      const projects = daemon.listProjects();
      if (projects.length === 0) {
        console.log('No projects registered. Use "specd-runner register" from a project directory first.');
        process.exit(0);
      }

      // Init all projects
      for (const project of projects) {
        try {
          await daemon.initProject(project.name);
          console.log(`[${project.name}] Initialized (${project.repoPath})`);
        } catch (e) {
          console.error(`[${project.name}] Failed to init: ${e.message}`);
        }
      }

      // Set up Telegram for each project
      for (const [name, orch] of daemon.getAllOrchestrators()) {
        const telegram = new TelegramNotifier(orch.config.notifications?.telegram);
        orch.stateManager.on('change', (event) => {
          if (event.type === 'task_status_changed') {
            const state = orch.stateManager.getState();
            const task = state.tasks[event.taskId];
            if (event.status === 'done') {
              telegram.onTaskComplete(event.taskId, task?.name, 'Task completed');
            } else if (event.status === 'failed') {
              telegram.onTaskFailed(event.taskId, task?.name, task?.current_stage, 'Task failed');
            }
          }
        });
      }

      const server = createServer(daemon, port);
      await server.start();

      console.log(`\nAPI server:  http://localhost:${port}`);
      console.log(`Dashboard:   run "specd-runner ui" in another terminal`);
      console.log(`Projects:    ${projects.length} registered\n`);

      // Start all project loops
      await daemon.startAll();

      let shuttingDown = false;
      const shutdown = async () => {
        if (shuttingDown) { process.exit(1); }
        shuttingDown = true;
        console.log('\nShutting down...');
        daemon.stopAll();
        try { await server.stop(); } catch (e) { /* ignore */ }
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      // Keep alive
      await new Promise(() => {});
    } catch (err) {
      console.error(`Failed to start: ${err.message}`);
      process.exit(1);
    }
  });

// ─── specd-runner register ────────────────────────────────────────
program
  .command('register')
  .description('Register current directory as a project')
  .option('-n, --name <name>', 'Project name (defaults to directory name)')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action((opts) => {
    const repoPath = path.resolve(opts.dir);
    const configDir = path.join(repoPath, '.specd', 'runner');

    if (!fs.existsSync(configDir)) {
      console.error(`No .specd/runner/ found in ${repoPath}`);
      console.error('Create config.yaml, agents.yaml, pipelines.yaml, and tasks/ first.');
      process.exit(1);
    }

    const daemon = new Daemon();
    const entry = daemon.registerProject(opts.name || null, repoPath);
    console.log(`Registered: ${entry.name} → ${repoPath}`);
    console.log(`\nStart the daemon with: specd-runner start`);
  });

// ─── specd-runner unregister ──────────────────────────────────────
program
  .command('unregister [name]')
  .description('Unregister a project')
  .option('-d, --dir <dir>', 'Project directory (used to derive name)')
  .action((name, opts) => {
    const projectName = name || path.basename(path.resolve(opts.dir || process.cwd()));
    const daemon = new Daemon();
    daemon.unregisterProject(projectName);
    console.log(`Unregistered: ${projectName}`);
  });

// ─── specd-runner projects ────────────────────────────────────────
program
  .command('projects')
  .description('List registered projects')
  .action(() => {
    const daemon = new Daemon();
    const projects = daemon.listProjects();
    if (projects.length === 0) {
      console.log('No projects registered. Use "specd-runner register" from a project directory.');
      return;
    }
    for (const p of projects) {
      console.log(`  ${p.name} → ${p.repoPath}`);
    }
  });

// ─── specd-runner status ──────────────────────────────────────────
program
  .command('status')
  .description('Show status of all projects')
  .option('-p, --project <name>', 'Show status for a specific project')
  .action((opts) => {
    const daemon = new Daemon();
    const projects = opts.project
      ? [daemon.registry.get(opts.project)].filter(Boolean)
      : daemon.listProjects();

    if (projects.length === 0) {
      console.log('No projects registered.');
      return;
    }

    for (const project of projects) {
      const runtimePaths = paths.forProject(project.name);
      if (!fs.existsSync(runtimePaths.statusPath)) {
        console.log(`\n${project.name}: no run data`);
        continue;
      }

      const state = JSON.parse(fs.readFileSync(runtimePaths.statusPath, 'utf8'));
      const tasks = Object.entries(state.tasks || {});
      const done = tasks.filter(([_, t]) => t.status === 'done').length;
      const running = tasks.filter(([_, t]) => t.status === 'in_progress').length;
      const failed = tasks.filter(([_, t]) => t.status === 'failed').length;

      console.log(`\n${project.name} (${project.repoPath})`);
      console.log(`  ${done} done, ${running} running, ${failed} failed, ${tasks.length} total`);

      for (const [id, task] of tasks) {
        const icon = { done: '✓', in_progress: '▸', failed: '✗', queued: '○' }[task.status] || '?';
        const progress = task.stages?.find(s => s.status === 'running')?.live_progress;
        const progressStr = progress ? ` — ${progress.progress} (${progress.percent}%)` : '';
        const prStr = task.pr_url && task.pr_url !== 'none' ? ` [PR: ${task.pr_url.split('/').pop()}]` : '';
        console.log(`    ${icon} ${id}: ${task.name} [${task.status}]${progressStr}${prStr}`);
      }
    }
  });

// ─── specd-runner ui ──────────────────────────────────────────────
program
  .command('ui')
  .description('Start the dashboard UI (dev server)')
  .option('--ui-port <port>', 'Dashboard UI port', '3710')
  .option('--api-port <port>', 'API port to proxy to', '3700')
  .action(async (opts) => {
    const { spawn } = require('child_process');
    const uiPort = parseInt(opts.uiPort);
    const apiPort = parseInt(opts.apiPort);
    const dashboardDir = path.join(__dirname, '..', 'dashboard');

    if (!fs.existsSync(path.join(dashboardDir, 'package.json'))) {
      console.error(`Dashboard not found at ${dashboardDir}`);
      process.exit(1);
    }

    console.log(`Dashboard:  http://localhost:${uiPort}`);
    console.log(`Proxying:   API -> http://localhost:${apiPort}\n`);

    const vite = spawn('npx', ['vite', '--port', String(uiPort)], {
      cwd: dashboardDir,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, VITE_API_PORT: String(apiPort) },
    });

    vite.on('close', (code) => process.exit(code || 0));
    process.on('SIGINT', () => { vite.kill(); process.exit(0); });
    process.on('SIGTERM', () => { vite.kill(); process.exit(0); });
  });

program.parse();
```

- [ ] **Step 2: Verify CLI works**

Run: `cd runner && node src/cli.js --help`
Expected: Shows start, register, unregister, projects, status, ui commands

- [ ] **Step 3: Commit**

```bash
git add runner/src/cli.js
git commit -m "feat(runner): CLI with register/unregister/projects/start/status/ui commands"
```

---

### Task 7: Dashboard Multi-Project Support

**Files:**
- Modify: `runner/dashboard/src/App.jsx`
- Modify: `runner/dashboard/src/hooks/useWebSocket.js`
- Modify: `runner/dashboard/src/components/TaskCard.jsx`

- [ ] **Step 1: Update useWebSocket hook to fetch multi-project status**

Replace `runner/dashboard/src/hooks/useWebSocket.js`:

```jsx
import { useState, useEffect, useCallback, useRef } from 'react';

export function useWebSocket() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const prevJsonRef = useRef('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const result = await res.json();
      const json = JSON.stringify(result);
      if (json !== prevJsonRef.current) {
        prevJsonRef.current = json;
        setData(result);
      }
      setConnected(true);
    } catch (e) {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { data, connected };
}
```

- [ ] **Step 2: Update App.jsx for multi-project view**

Replace `runner/dashboard/src/App.jsx`:

```jsx
import { useWebSocket } from './hooks/useWebSocket';
import { TaskCard } from './components/TaskCard';

const sortOrder = { in_progress: 0, queued: 1, failed: 2, done: 3, draft: 4 };

export default function App() {
  const { data, connected } = useWebSocket();

  const projects = data?.projects ? Object.entries(data.projects) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Specdacular Runner</h1>
          <p className="text-sm text-gray-500 mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-500">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No projects registered</p>
          <p className="text-sm mt-2">Run "specd-runner register" from a project directory</p>
        </div>
      ) : (
        projects.map(([projectName, projectState]) => {
          const tasks = Object.entries(projectState.tasks || {});
          tasks.sort((a, b) => (sortOrder[a[1].status] ?? 4) - (sortOrder[b[1].status] ?? 4));

          return (
            <div key={projectName} className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-gray-300">{projectName}</h2>
              <div className="space-y-3">
                {tasks.map(([id, task]) => (
                  <TaskCard key={id} id={id} task={task} project={projectName} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update TaskCard to use project-scoped API routes**

In `runner/dashboard/src/components/TaskCard.jsx`, update `handleAction` and `LogViewer` to include project:

```jsx
  const handleAction = async (action) => {
    await fetch(`/api/projects/${project}/tasks/${id}/${action}`, { method: 'POST' });
  };
```

And update the `TaskCard` function signature:
```jsx
export function TaskCard({ id, task, project }) {
```

- [ ] **Step 4: Update LogViewer to use project-scoped route**

In `runner/dashboard/src/components/LogViewer.jsx`, update the component to accept `project` prop:

```jsx
export function LogViewer({ taskId, project }) {
```

And change the fetch URL:
```jsx
const res = await fetch(`/api/projects/${project}/tasks/${taskId}/logs?tail=500`);
```

Pass `project` from TaskCard:
```jsx
{showLogs && <LogViewer taskId={id} project={project} />}
```

- [ ] **Step 5: Rebuild dashboard**

Run: `cd runner/dashboard && npm run build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add runner/dashboard/
git commit -m "feat(runner): dashboard with multi-project view"
```

---

### Task 8: Integration Test for Global Daemon

**Files:**
- Modify: `runner/tests/integration.test.js`

- [ ] **Step 1: Update integration test to use Daemon**

Add a new test to `runner/tests/integration.test.js`:

```js
describe('Integration: global daemon', () => {
  let tmpHome, tmpProject, Daemon, createServer;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-daemon-integ-'));
    tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-proj-integ-'));

    const tasksDir = path.join(tmpProject, '.specd', 'runner', 'tasks');
    fs.mkdirSync(tasksDir, { recursive: true });

    const mockAgent = path.join(__dirname, 'fixtures', 'mock-agent.js');

    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'config.yaml'), yaml.dump({
      server: { port: 0 },
      notifications: { telegram: { enabled: false } },
      defaults: { pipeline: 'default', failure_policy: 'skip', timeout: 30, stuck_timeout: 30, max_parallel: 1 },
    }));
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'agents.yaml'), yaml.dump({
      agents: { 'mock': { cmd: `node ${mockAgent}`, input_mode: 'stdin', output_format: 'json_block', system_prompt: 'test {{task.name}}' } },
    }));
    fs.writeFileSync(path.join(tmpProject, '.specd', 'runner', 'pipelines.yaml'), yaml.dump({
      pipelines: { default: { stages: [{ stage: 'do', agent: 'mock', critical: true }] } },
    }));
    fs.writeFileSync(path.join(tasksDir, '001-test.yaml'), yaml.dump({
      name: 'Test', status: 'ready', priority: 1, description: 'Test', depends_on: [], pipeline: 'default',
    }));

    ({ Daemon } = require('../src/daemon'));
    ({ createServer } = require('../src/server/index'));
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
    fs.rmSync(tmpProject, { recursive: true, force: true });
  });

  it('registers project, runs task, serves status via API', async () => {
    const daemon = new Daemon(tmpHome);
    daemon.registerProject('test', tmpProject);
    const orch = await daemon.initProject('test');
    await orch.runOnce();

    const server = createServer(daemon, 0);
    const httpServer = await server.start();
    const port = httpServer.address().port;

    const res = await fetch(`http://localhost:${port}/api/status`);
    const data = await res.json();

    assert.ok(data.projects.test);
    assert.strictEqual(data.projects.test.tasks['001-test'].status, 'done');

    await server.stop();
  });
});
```

- [ ] **Step 2: Run integration test**

Run: `cd runner && node --test tests/integration.test.js`
Expected: All tests PASS

- [ ] **Step 3: Run full test suite**

Run: `cd runner && npm test`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add runner/tests/integration.test.js
git commit -m "test(runner): integration test for global daemon with multi-project API"
```

---

### Task 9: Migrate Smart-Clipper to Global Daemon

**Files:**
- No code changes — operational steps

- [ ] **Step 1: Register smart-clipper**

```bash
cd /Users/victor/work/smart-clipper
specd-runner register
```

Expected: `Registered: smart-clipper → /Users/victor/work/smart-clipper`

- [ ] **Step 2: Verify registration**

```bash
specd-runner projects
```

Expected: `smart-clipper → /Users/victor/work/smart-clipper`

- [ ] **Step 3: Start the daemon**

```bash
specd-runner start
```

Expected: Daemon starts, initializes smart-clipper, picks up ready tasks

- [ ] **Step 4: Clean up old runtime files from repo**

```bash
cd /Users/victor/work/smart-clipper
rm -f .specd/runner/status.json
rm -rf .specd/runner/logs/
echo "status.json" >> .specd/runner/.gitignore
echo "logs/" >> .specd/runner/.gitignore
git add .specd/runner/.gitignore
git commit -m "chore: gitignore runtime files (status.json, logs/)"
```

- [ ] **Step 5: Verify status works from anywhere**

```bash
specd-runner status
```

Expected: Shows smart-clipper project with all tasks
