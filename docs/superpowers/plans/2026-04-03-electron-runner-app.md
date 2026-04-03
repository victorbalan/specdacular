# Specd Runner Electron App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Electron desktop app that centralizes all runner configuration and state, replacing the current scattered `.specd/runner/` approach with a single app data directory.

**Architecture:** Electron main process embeds the orchestrator (ported from current runner). React renderer provides a full desktop UI. Express API on localhost:3700 enables Claude Code skill integration. A unified `specd` CLI dispatches to either `llm-init` (install) or `runner` (Electron app).

**Tech Stack:** Electron, React, Express, WebSocket, Node.js 18+

---

## File Structure

### New files (runner/main/ — Electron main process)

| File | Responsibility |
|------|---------------|
| `runner/main/index.js` | Electron app entry — creates window, starts orchestrator + API server |
| `runner/main/paths.js` | Path resolver — all paths point to `~/Library/Application Support/Specd/` |
| `runner/main/db.js` | Project registry — CRUD on db.json |
| `runner/main/project-manager.js` | Load/save project.json, manage per-project dirs |
| `runner/main/template-manager.js` | Global + per-project agent/pipeline template resolution |
| `runner/main/config-loader.js` | Load JSON configs from app data dir (replaces YAML loader) |
| `runner/main/orchestrator.js` | Ported orchestrator — reads from app data dir, no file watching |
| `runner/main/agent/runner.js` | Agent execution (mostly unchanged from current) |
| `runner/main/agent/parser.js` | Stream parser (unchanged from current) |
| `runner/main/agent/template.js` | Template resolver (unchanged from current) |
| `runner/main/pipeline/sequencer.js` | Stage sequencer (unchanged from current) |
| `runner/main/pipeline/resolver.js` | Pipeline resolver (unchanged from current) |
| `runner/main/state/manager.js` | State manager — writes to app data dir |
| `runner/main/worktree/manager.js` | Git worktree manager (mostly unchanged) |
| `runner/main/server/index.js` | Express + WebSocket server on localhost:3700 |
| `runner/main/server/api.js` | API routes including POST task creation |
| `runner/main/server/websocket.js` | WebSocket broadcaster (unchanged) |
| `runner/main/notifications/telegram.js` | Telegram notifier (unchanged) |
| `runner/main/ipc.js` | IPC bridge — exposes backend to renderer via Electron IPC |
| `runner/main/bootstrap.js` | First-run setup — create dirs, write default templates |
| `runner/preload.js` | Electron preload — expose IPC to renderer |

### New files (runner/renderer/ — React app)

| File | Responsibility |
|------|---------------|
| `runner/renderer/index.html` | HTML entry |
| `runner/renderer/src/main.jsx` | React root |
| `runner/renderer/src/App.jsx` | App shell — sidebar + router |
| `runner/renderer/src/pages/Dashboard.jsx` | Overview of all projects/tasks |
| `runner/renderer/src/pages/ProjectView.jsx` | Tasks for one project |
| `runner/renderer/src/pages/TaskDetail.jsx` | Logs, stages, retry/cancel |
| `runner/renderer/src/pages/Settings.jsx` | Global config, templates |
| `runner/renderer/src/pages/ProjectSettings.jsx` | Per-project overrides |
| `runner/renderer/src/components/Sidebar.jsx` | Project list navigation |
| `runner/renderer/src/components/TaskList.jsx` | Task table/cards |
| `runner/renderer/src/components/StageProgress.jsx` | Stage pipeline visualization |
| `runner/renderer/src/components/LogViewer.jsx` | Scrollable log output |
| `runner/renderer/src/hooks/useIpc.js` | Hook for Electron IPC calls |
| `runner/renderer/src/hooks/useWebSocket.js` | Hook for real-time updates |
| `runner/renderer/vite.config.js` | Vite config for renderer build |
| `runner/renderer/package.json` | React + Vite dependencies |

### Modified files

| File | Change |
|------|--------|
| `bin/specd.js` | New — unified CLI entry point replacing `bin/install.js` as bin |
| `bin/install.js` | Unchanged internally, called by `specd llm-init` |
| `package.json` | Change bin from `specdacular` to `specd`, update files array |
| `commands/specd.new-runner-task.md` | New skill for creating tasks via API |
| `commands/specd.runner-status.md` | New skill for checking runner status |

### Removed/deprecated

| File | Reason |
|------|--------|
| `runner/src/` | Replaced by `runner/main/` — old runner code |
| `runner/dashboard/` | Replaced by `runner/renderer/` |

---

## Task 1: Scaffold Electron + React project structure

**Files:**
- Create: `runner/main/index.js`
- Create: `runner/preload.js`
- Create: `runner/renderer/index.html`
- Create: `runner/renderer/src/main.jsx`
- Create: `runner/renderer/src/App.jsx`
- Create: `runner/renderer/package.json`
- Create: `runner/renderer/vite.config.js`
- Modify: `runner/package.json`

- [ ] **Step 1: Initialize runner/main/index.js — minimal Electron app**

```javascript
// runner/main/index.js
import { app, BrowserWindow } from 'electron';
import { join } from 'path';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, '..', 'renderer', 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

- [ ] **Step 2: Create preload.js**

```javascript
// runner/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('specd', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, callback) => {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
});
```

- [ ] **Step 3: Create renderer/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Specd Runner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create renderer/src/main.jsx**

```jsx
// runner/renderer/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: Create renderer/src/App.jsx — placeholder**

```jsx
// runner/renderer/src/App.jsx
export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      <aside style={{ width: 240, borderRight: '1px solid #e0e0e0', padding: 16 }}>
        <h2>Specd Runner</h2>
        <p>Projects will appear here</p>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>
        <h1>Dashboard</h1>
        <p>No projects registered yet.</p>
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Create renderer/package.json**

```json
{
  "name": "@specd/renderer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 7: Create renderer/vite.config.js**

```javascript
// runner/renderer/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 8: Update runner/package.json for Electron**

```json
{
  "name": "@specd/runner",
  "version": "0.2.0",
  "description": "Specd Runner — Electron desktop app for autonomous agent orchestration",
  "main": "main/index.js",
  "scripts": {
    "start": "electron .",
    "dev": "NODE_ENV=development electron .",
    "build:renderer": "cd renderer && npm run build"
  },
  "dependencies": {
    "express": "^4.21.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "electron": "^34.0.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

Note: `chokidar` removed (no file watching), `commander` removed (CLI is in bin/specd.js), `js-yaml` removed (JSON only).

- [ ] **Step 9: Verify the app launches**

Run from `runner/`:
```bash
cd runner && npm install && npm run dev
```

Expected: Electron window opens showing "Specd Runner" sidebar and "Dashboard" main area.

- [ ] **Step 10: Commit**

```bash
git add runner/main/index.js runner/preload.js runner/renderer/ runner/package.json
git commit -m "feat(runner): scaffold Electron + React app structure"
```

---

## Task 2: Path resolver and bootstrap

**Files:**
- Create: `runner/main/paths.js`
- Create: `runner/main/bootstrap.js`
- Create: `runner/main/test/paths.test.js`
- Create: `runner/main/test/bootstrap.test.js`

- [ ] **Step 1: Write failing test for paths.js**

```javascript
// runner/main/test/paths.test.js
import { describe, it, assert } from 'node:test';
import { strict as a } from 'node:assert';
import { Paths } from '../paths.js';

describe('Paths', () => {
  it('returns app data dir based on platform', () => {
    const paths = new Paths('/tmp/test-specd');
    a.equal(paths.root, '/tmp/test-specd');
    a.equal(paths.db, '/tmp/test-specd/db.json');
    a.equal(paths.config, '/tmp/test-specd/config.json');
    a.equal(paths.templatesDir, '/tmp/test-specd/templates');
    a.equal(paths.agentTemplatesDir, '/tmp/test-specd/templates/agents');
    a.equal(paths.pipelineTemplatesDir, '/tmp/test-specd/templates/pipelines');
    a.equal(paths.projectsDir, '/tmp/test-specd/projects');
    a.equal(paths.electronDir, '/tmp/test-specd/electron');
  });

  it('returns project-specific paths', () => {
    const paths = new Paths('/tmp/test-specd');
    const pp = paths.forProject('abc123');
    a.equal(pp.dir, '/tmp/test-specd/projects/abc123');
    a.equal(pp.projectJson, '/tmp/test-specd/projects/abc123/project.json');
    a.equal(pp.statusJson, '/tmp/test-specd/projects/abc123/status.json');
    a.equal(pp.tasksDir, '/tmp/test-specd/projects/abc123/tasks');
    a.equal(pp.logsDir, '/tmp/test-specd/projects/abc123/logs');
    a.equal(pp.agentsDir, '/tmp/test-specd/projects/abc123/agents');
    a.equal(pp.pipelinesDir, '/tmp/test-specd/projects/abc123/pipelines');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test runner/main/test/paths.test.js
```

Expected: FAIL — `Cannot find module '../paths.js'`

- [ ] **Step 3: Implement paths.js**

```javascript
// runner/main/paths.js
import { join } from 'path';
import { homedir, platform } from 'os';

export class Paths {
  constructor(root) {
    this.root = root || Paths.defaultRoot();
  }

  static defaultRoot() {
    if (platform() === 'darwin') {
      return join(homedir(), 'Library', 'Application Support', 'Specd');
    }
    return join(homedir(), '.config', 'specd');
  }

  get db() { return join(this.root, 'db.json'); }
  get config() { return join(this.root, 'config.json'); }
  get templatesDir() { return join(this.root, 'templates'); }
  get agentTemplatesDir() { return join(this.root, 'templates', 'agents'); }
  get pipelineTemplatesDir() { return join(this.root, 'templates', 'pipelines'); }
  get projectsDir() { return join(this.root, 'projects'); }
  get electronDir() { return join(this.root, 'electron'); }

  forProject(projectId) {
    const dir = join(this.root, 'projects', projectId);
    return {
      dir,
      projectJson: join(dir, 'project.json'),
      statusJson: join(dir, 'status.json'),
      tasksDir: join(dir, 'tasks'),
      logsDir: join(dir, 'logs'),
      agentsDir: join(dir, 'agents'),
      pipelinesDir: join(dir, 'pipelines'),
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test runner/main/test/paths.test.js
```

Expected: PASS

- [ ] **Step 5: Write failing test for bootstrap.js**

```javascript
// runner/main/test/bootstrap.test.js
import { describe, it, before, after } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { bootstrap } from '../bootstrap.js';
import { Paths } from '../paths.js';

describe('bootstrap', () => {
  let tempDir;
  let paths;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specd-test-'));
    paths = new Paths(tempDir);
  });

  after(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates all required directories and default files', async () => {
    await bootstrap(paths);

    a.ok(existsSync(paths.templatesDir));
    a.ok(existsSync(paths.agentTemplatesDir));
    a.ok(existsSync(paths.pipelineTemplatesDir));
    a.ok(existsSync(paths.projectsDir));

    a.ok(existsSync(paths.db));
    const db = JSON.parse(readFileSync(paths.db, 'utf-8'));
    a.deepEqual(db, { projects: [] });

    a.ok(existsSync(paths.config));
    const config = JSON.parse(readFileSync(paths.config, 'utf-8'));
    a.equal(config.server.port, 3700);

    // Default agent templates exist
    a.ok(existsSync(join(paths.agentTemplatesDir, 'claude-planner.json')));
    a.ok(existsSync(join(paths.agentTemplatesDir, 'claude-implementer.json')));
    a.ok(existsSync(join(paths.agentTemplatesDir, 'claude-reviewer.json')));

    // Default pipeline template exists
    a.ok(existsSync(join(paths.pipelineTemplatesDir, 'default.json')));
  });

  it('does not overwrite existing files on second run', async () => {
    const config = JSON.parse(readFileSync(paths.config, 'utf-8'));
    config.server.port = 9999;
    const { writeFileSync } = await import('fs');
    writeFileSync(paths.config, JSON.stringify(config));

    await bootstrap(paths);

    const reloaded = JSON.parse(readFileSync(paths.config, 'utf-8'));
    a.equal(reloaded.server.port, 9999);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
node --test runner/main/test/bootstrap.test.js
```

Expected: FAIL — `Cannot find module '../bootstrap.js'`

- [ ] **Step 7: Implement bootstrap.js**

```javascript
// runner/main/bootstrap.js
import { mkdirSync, writeFileSync, existsSync } from 'fs';

const DEFAULT_CONFIG = {
  server: { port: 3700 },
  notifications: { telegram: { enabled: false } },
  defaults: {
    pipeline: 'default',
    failure_policy: 'skip',
    timeout: 3600,
    stuck_timeout: 1800,
    max_parallel: 1,
  },
};

const DEFAULT_AGENTS = {
  'claude-planner': {
    cmd: 'claude -p --dangerously-skip-permissions',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: 'You are a feature planner working on: {{task.name}} ({{task.id}})\nPipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})\n\nResearch the codebase thoroughly, then create a detailed implementation plan.\n\nEmit progress:\n```specd-status\n{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"...","percent":0}\n```\n\nWhen done:\n```specd-result\n{"status":"success","summary":"...","files_changed":[],"issues":[]}\n```',
  },
  'claude-implementer': {
    cmd: 'claude -p --dangerously-skip-permissions',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: 'You are an implementer working on: {{task.name}} ({{task.id}})\nPipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})\n\nImplement the plan from the previous stage. Write clean, tested code.\n\nEmit progress:\n```specd-status\n{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"...","percent":0}\n```\n\nWhen done:\n```specd-result\n{"status":"success","summary":"...","files_changed":[],"issues":[]}\n```',
  },
  'claude-reviewer': {
    cmd: 'claude -p --dangerously-skip-permissions',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: 'You are a code reviewer for: {{task.name}} ({{task.id}})\nPipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})\n\nReview the implementation from the previous stage. Check for bugs, style, tests.\n\nEmit progress:\n```specd-status\n{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"...","percent":0}\n```\n\nWhen done:\n```specd-result\n{"status":"success","summary":"...","files_changed":[],"issues":[]}\n```',
  },
};

const DEFAULT_PIPELINE = {
  name: 'default',
  stages: [
    { stage: 'plan', agent: 'claude-planner', critical: true },
    { stage: 'implement', agent: 'claude-implementer', critical: true },
    { stage: 'review', agent: 'claude-reviewer', on_fail: 'retry', max_retries: 2 },
  ],
};

function writeIfMissing(filePath, data) {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

export async function bootstrap(paths) {
  // Create directories
  mkdirSync(paths.agentTemplatesDir, { recursive: true });
  mkdirSync(paths.pipelineTemplatesDir, { recursive: true });
  mkdirSync(paths.projectsDir, { recursive: true });

  // Write default files
  writeIfMissing(paths.db, { projects: [] });
  writeIfMissing(paths.config, DEFAULT_CONFIG);

  // Write default agent templates
  for (const [name, agent] of Object.entries(DEFAULT_AGENTS)) {
    writeIfMissing(`${paths.agentTemplatesDir}/${name}.json`, agent);
  }

  // Write default pipeline template
  writeIfMissing(`${paths.pipelineTemplatesDir}/default.json`, DEFAULT_PIPELINE);
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
node --test runner/main/test/bootstrap.test.js
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add runner/main/paths.js runner/main/bootstrap.js runner/main/test/
git commit -m "feat(runner): add path resolver and bootstrap for app data directory"
```

---

## Task 3: Project registry (db.js)

**Files:**
- Create: `runner/main/db.js`
- Create: `runner/main/test/db.test.js`

- [ ] **Step 1: Write failing test**

```javascript
// runner/main/test/db.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test runner/main/test/db.test.js
```

Expected: FAIL — `Cannot find module '../db.js'`

- [ ] **Step 3: Implement db.js**

```javascript
// runner/main/db.js
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test runner/main/test/db.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add runner/main/db.js runner/main/test/db.test.js
git commit -m "feat(runner): add project registry (db.js)"
```

---

## Task 4: Template manager

**Files:**
- Create: `runner/main/template-manager.js`
- Create: `runner/main/test/template-manager.test.js`

- [ ] **Step 1: Write failing test**

```javascript
// runner/main/test/template-manager.test.js
import { describe, it, before, after } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { TemplateManager } from '../template-manager.js';
import { Paths } from '../paths.js';

describe('TemplateManager', () => {
  let tempDir;
  let paths;
  let tm;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specd-tm-test-'));
    paths = new Paths(tempDir);

    // Create global templates
    mkdirSync(paths.agentTemplatesDir, { recursive: true });
    mkdirSync(paths.pipelineTemplatesDir, { recursive: true });

    writeFileSync(
      join(paths.agentTemplatesDir, 'claude-planner.json'),
      JSON.stringify({ cmd: 'claude -p', system_prompt: 'global planner' })
    );
    writeFileSync(
      join(paths.pipelineTemplatesDir, 'default.json'),
      JSON.stringify({ name: 'default', stages: [{ stage: 'plan', agent: 'claude-planner' }] })
    );

    // Create per-project override
    const projectAgentsDir = join(paths.projectsDir, 'proj1', 'agents');
    mkdirSync(projectAgentsDir, { recursive: true });
    writeFileSync(
      join(projectAgentsDir, 'claude-planner.json'),
      JSON.stringify({ cmd: 'claude -p --model opus', system_prompt: 'custom planner' })
    );

    tm = new TemplateManager(paths);
  });

  after(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads global agents', () => {
    const agents = tm.getAgents();
    a.equal(agents['claude-planner'].system_prompt, 'global planner');
  });

  it('loads global pipelines', () => {
    const pipelines = tm.getPipelines();
    a.equal(pipelines['default'].stages.length, 1);
  });

  it('returns per-project agent override when present', () => {
    const agents = tm.getAgents('proj1');
    a.equal(agents['claude-planner'].system_prompt, 'custom planner');
    a.equal(agents['claude-planner'].cmd, 'claude -p --model opus');
  });

  it('falls back to global when no per-project override', () => {
    const agents = tm.getAgents('proj-no-overrides');
    a.equal(agents['claude-planner'].system_prompt, 'global planner');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test runner/main/test/template-manager.test.js
```

Expected: FAIL — `Cannot find module '../template-manager.js'`

- [ ] **Step 3: Implement template-manager.js**

```javascript
// runner/main/template-manager.js
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

export class TemplateManager {
  constructor(paths) {
    this.paths = paths;
  }

  getAgents(projectId) {
    const global = this._loadDir(this.paths.agentTemplatesDir);
    if (!projectId) return global;

    const projectAgentsDir = join(this.paths.projectsDir, projectId, 'agents');
    if (!existsSync(projectAgentsDir)) return global;

    const overrides = this._loadDir(projectAgentsDir);
    return { ...global, ...overrides };
  }

  getPipelines(projectId) {
    const global = this._loadDir(this.paths.pipelineTemplatesDir);
    if (!projectId) return global;

    const projectPipelinesDir = join(this.paths.projectsDir, projectId, 'pipelines');
    if (!existsSync(projectPipelinesDir)) return global;

    const overrides = this._loadDir(projectPipelinesDir);
    return { ...global, ...overrides };
  }

  _loadDir(dir) {
    if (!existsSync(dir)) return {};
    const result = {};
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const name = basename(file, '.json');
      result[name] = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
    }
    return result;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test runner/main/test/template-manager.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add runner/main/template-manager.js runner/main/test/template-manager.test.js
git commit -m "feat(runner): add template manager with global + per-project overrides"
```

---

## Task 5: State manager (ported to app data dir)

**Files:**
- Create: `runner/main/state/manager.js`
- Create: `runner/main/test/state-manager.test.js`

- [ ] **Step 1: Write failing test**

```javascript
// runner/main/test/state-manager.test.js
import { describe, it, before, after, beforeEach } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { StateManager } from '../state/manager.js';

describe('StateManager', () => {
  let tempDir;
  let statusPath;
  let sm;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specd-state-test-'));
  });

  beforeEach(() => {
    statusPath = join(tempDir, `status-${Date.now()}.json`);
    sm = new StateManager(statusPath);
  });

  after(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('registers a task', () => {
    sm.registerTask('task-001', { name: 'Add dark mode', pipeline: 'default' });
    const state = sm.getState();
    a.equal(state.tasks['task-001'].name, 'Add dark mode');
    a.equal(state.tasks['task-001'].status, 'queued');
  });

  it('updates task status', () => {
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    sm.updateTaskStatus('task-001', 'in_progress');
    a.equal(sm.getState().tasks['task-001'].status, 'in_progress');
  });

  it('tracks stages', () => {
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    sm.startStage('task-001', { stage: 'plan', agent: 'claude-planner' });
    const task = sm.getState().tasks['task-001'];
    a.equal(task.current_stage, 'plan');
    a.equal(task.stages.length, 1);
    a.equal(task.stages[0].status, 'running');
  });

  it('completes stages with duration', () => {
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    sm.startStage('task-001', { stage: 'plan', agent: 'claude-planner' });
    sm.completeStage('task-001', 'success', 'Planned it');
    const stage = sm.getState().tasks['task-001'].stages[0];
    a.equal(stage.status, 'success');
    a.equal(stage.summary, 'Planned it');
    a.ok(stage.duration >= 0);
  });

  it('persists to disk', () => {
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    sm.persist();
    const data = JSON.parse(readFileSync(statusPath, 'utf-8'));
    a.ok(data.tasks['task-001']);
  });

  it('emits change events', () => {
    const events = [];
    sm.on('change', (e) => events.push(e));
    sm.registerTask('task-001', { name: 'Test', pipeline: 'default' });
    a.equal(events.length, 1);
    a.equal(events[0].type, 'task_registered');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test runner/main/test/state-manager.test.js
```

Expected: FAIL — `Cannot find module '../state/manager.js'`

- [ ] **Step 3: Implement state/manager.js**

```javascript
// runner/main/state/manager.js
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { EventEmitter } from 'events';

export class StateManager extends EventEmitter {
  constructor(statusPath) {
    super();
    this.statusPath = statusPath;
    this.state = existsSync(statusPath)
      ? JSON.parse(readFileSync(statusPath, 'utf-8'))
      : { started_at: new Date().toISOString(), tasks: {} };
  }

  getState() {
    return this.state;
  }

  registerTask(taskId, { name, pipeline }) {
    this.state.tasks[taskId] = {
      name,
      status: 'queued',
      current_stage: null,
      pipeline,
      pr_url: null,
      stages: [],
    };
    this._emit('task_registered', { taskId, name });
  }

  updateTaskStatus(taskId, status) {
    this.state.tasks[taskId].status = status;
    this._emit('task_status_changed', { taskId, status });
  }

  startStage(taskId, { stage, agent }) {
    const task = this.state.tasks[taskId];
    task.current_stage = stage;
    task.stages.push({
      stage,
      agent,
      status: 'running',
      started_at: new Date().toISOString(),
      duration: null,
      summary: null,
      live_progress: null,
    });
    this._emit('stage_started', { taskId, stage, agent });
  }

  updateLiveProgress(taskId, progress) {
    const task = this.state.tasks[taskId];
    const currentStage = task.stages[task.stages.length - 1];
    if (currentStage) {
      currentStage.live_progress = progress;
      currentStage.last_output_at = new Date().toISOString();
    }
    this._emit('live_progress', { taskId, progress });
  }

  completeStage(taskId, status, summary) {
    const task = this.state.tasks[taskId];
    const currentStage = task.stages[task.stages.length - 1];
    if (currentStage) {
      currentStage.status = status;
      currentStage.summary = summary;
      const started = new Date(currentStage.started_at);
      currentStage.duration = Math.round((Date.now() - started.getTime()) / 1000);
    }
    this._emit('stage_completed', { taskId, stage: currentStage?.stage, status, summary });
  }

  setPrUrl(taskId, prUrl) {
    this.state.tasks[taskId].pr_url = prUrl;
    this._emit('pr_created', { taskId, prUrl });
  }

  persist() {
    writeFileSync(this.statusPath, JSON.stringify(this.state, null, 2));
  }

  _emit(type, data) {
    this.emit('change', { type, ...data });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test runner/main/test/state-manager.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add runner/main/state/manager.js runner/main/test/state-manager.test.js
git commit -m "feat(runner): port state manager to app data directory"
```

---

## Task 6: Port agent runner, parser, template resolver

These are mostly unchanged from the current runner. Port them to the new location and convert from CommonJS/YAML to ESM/JSON.

**Files:**
- Create: `runner/main/agent/runner.js`
- Create: `runner/main/agent/parser.js`
- Create: `runner/main/agent/template.js`
- Create: `runner/main/test/agent-parser.test.js`

- [ ] **Step 1: Write failing test for parser**

```javascript
// runner/main/test/agent-parser.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { StreamParser } from '../agent/parser.js';

describe('StreamParser', () => {
  it('parses specd-status blocks', () => {
    const parser = new StreamParser();
    const statuses = [];
    parser.on('status', (s) => statuses.push(s));

    parser.feed('some output');
    parser.feed('```specd-status');
    parser.feed('{"progress":"Working","percent":50}');
    parser.feed('```');

    a.equal(statuses.length, 1);
    a.equal(statuses[0].progress, 'Working');
    a.equal(statuses[0].percent, 50);
  });

  it('parses specd-result blocks', () => {
    const parser = new StreamParser();
    const results = [];
    parser.on('result', (r) => results.push(r));

    parser.feed('```specd-result');
    parser.feed('{"status":"success","summary":"Done"}');
    parser.feed('```');

    a.equal(results.length, 1);
    a.equal(results[0].status, 'success');
  });

  it('emits output for non-block lines', () => {
    const parser = new StreamParser();
    const lines = [];
    parser.on('output', (l) => lines.push(l));

    parser.feed('hello world');

    a.equal(lines.length, 1);
    a.equal(lines[0], 'hello world');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test runner/main/test/agent-parser.test.js
```

Expected: FAIL — `Cannot find module '../agent/parser.js'`

- [ ] **Step 3: Implement agent/parser.js**

```javascript
// runner/main/agent/parser.js
import { EventEmitter } from 'events';

export class StreamParser extends EventEmitter {
  constructor() {
    super();
    this.inBlock = null;
    this.blockLines = [];
  }

  feed(line) {
    if (line.startsWith('```specd-status')) {
      this.inBlock = 'status';
      this.blockLines = [];
      return;
    }
    if (line.startsWith('```specd-result')) {
      this.inBlock = 'result';
      this.blockLines = [];
      return;
    }
    if (line === '```' && this.inBlock) {
      const content = this.blockLines.join('\n');
      try {
        const parsed = JSON.parse(content);
        this.emit(this.inBlock, parsed);
      } catch (err) {
        this.emit('error', err);
      }
      this.inBlock = null;
      this.blockLines = [];
      return;
    }
    if (this.inBlock) {
      this.blockLines.push(line);
    } else {
      this.emit('output', line);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test runner/main/test/agent-parser.test.js
```

Expected: PASS

- [ ] **Step 5: Implement agent/template.js**

```javascript
// runner/main/agent/template.js
export function resolveTemplate(template, variables) {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = path.trim().split('.').reduce((obj, key) => obj?.[key], variables);
    return value !== undefined ? String(value) : match;
  });
}

export function buildTemplateContext(task, stage, pipeline, paths) {
  return {
    task: { id: task.id, name: task.name, spec: task.spec || '' },
    stage: { name: stage.stage, index: stage.index, total: stage.total },
    pipeline: { name: pipeline.name },
    status_file: paths?.statusJson || '',
    log_dir: paths?.logsDir || '',
  };
}
```

- [ ] **Step 6: Implement agent/runner.js**

```javascript
// runner/main/agent/runner.js
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { createWriteStream } from 'fs';
import { StreamParser } from './parser.js';

export class AgentRunner extends EventEmitter {
  constructor({ cmd, input_mode, output_format, system_prompt, timeout, stuck_timeout }) {
    super();
    this.cmd = cmd;
    this.inputMode = input_mode || 'stdin';
    this.outputFormat = output_format || 'stream_json';
    this.systemPrompt = system_prompt || '';
    this.timeout = (timeout || 3600) * 1000;
    this.stuckTimeout = (stuck_timeout || 1800) * 1000;
  }

  async run(prompt, { cwd, logPath } = {}) {
    return new Promise((resolve, reject) => {
      const fullPrompt = this.systemPrompt ? `${this.systemPrompt}\n\n${prompt}` : prompt;
      const args = this.cmd.split(' ').slice(1);
      const bin = this.cmd.split(' ')[0];

      const proc = spawn(bin, args, {
        cwd,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      const logStream = logPath ? createWriteStream(logPath, { flags: 'a' }) : null;
      let lastOutputAt = Date.now();
      let result = null;

      const parser = new StreamParser();
      parser.on('status', (s) => {
        lastOutputAt = Date.now();
        this.emit('status', s);
      });
      parser.on('result', (r) => {
        lastOutputAt = Date.now();
        result = r;
        this.emit('result', r);
      });
      parser.on('output', (line) => {
        lastOutputAt = Date.now();
        this.emit('output', line);
      });

      const handleLine = (line) => {
        if (logStream) logStream.write(line + '\n');

        if (this.outputFormat === 'stream_json') {
          try {
            const event = JSON.parse(line);
            if (event.type === 'assistant' && event.message?.content) {
              for (const block of event.message.content) {
                if (block.type === 'text') {
                  for (const textLine of block.text.split('\n')) {
                    parser.feed(textLine);
                  }
                }
              }
            } else if (event.type === 'result' && event.result) {
              for (const block of event.result) {
                if (block.type === 'text') {
                  for (const textLine of block.text.split('\n')) {
                    parser.feed(textLine);
                  }
                }
              }
            }
          } catch {
            parser.feed(line);
          }
        } else {
          parser.feed(line);
        }
      };

      let stdout = '';
      proc.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
        const lines = stdout.split('\n');
        stdout = lines.pop();
        for (const line of lines) {
          if (line.trim()) handleLine(line.trim());
        }
      });

      proc.stderr.on('data', (chunk) => {
        if (logStream) logStream.write(`[stderr] ${chunk}`);
      });

      if (this.inputMode === 'stdin') {
        proc.stdin.write(fullPrompt);
        proc.stdin.end();
      }

      // Global timeout
      const globalTimer = setTimeout(() => {
        proc.kill('SIGTERM');
        setTimeout(() => proc.kill('SIGKILL'), 5000);
      }, this.timeout);

      // Stuck detection
      const stuckCheck = setInterval(() => {
        if (Date.now() - lastOutputAt > this.stuckTimeout) {
          this.emit('error', new Error('Agent stuck — no output'));
          proc.kill('SIGTERM');
          setTimeout(() => proc.kill('SIGKILL'), 5000);
        }
      }, 30000);

      proc.on('close', (code) => {
        clearTimeout(globalTimer);
        clearInterval(stuckCheck);
        if (logStream) logStream.end();
        if (stdout.trim()) handleLine(stdout.trim());

        if (result) {
          resolve(result);
        } else if (code === 0) {
          resolve({ status: 'success', summary: 'Agent completed without explicit result' });
        } else {
          resolve({ status: 'failure', summary: `Agent exited with code ${code}` });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(globalTimer);
        clearInterval(stuckCheck);
        if (logStream) logStream.end();
        reject(err);
      });
    });
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add runner/main/agent/
git commit -m "feat(runner): port agent runner, parser, and template resolver"
```

---

## Task 7: Port pipeline sequencer and resolver

**Files:**
- Create: `runner/main/pipeline/sequencer.js`
- Create: `runner/main/pipeline/resolver.js`

- [ ] **Step 1: Implement pipeline/resolver.js**

```javascript
// runner/main/pipeline/resolver.js
export function resolvePipeline(pipelineName, pipelines, stageOverrides, defaults) {
  const pipeline = pipelines[pipelineName];
  if (!pipeline) throw new Error(`Pipeline not found: ${pipelineName}`);

  const stages = pipeline.stages.map((stage, index) => {
    const override = stageOverrides?.[stage.stage] || {};
    return {
      ...stage,
      ...override,
      timeout: stage.timeout || defaults?.timeout || 3600,
      on_fail: stage.on_fail || defaults?.failure_policy || 'skip',
      max_retries: stage.max_retries || 0,
      index: index + 1,
      total: pipeline.stages.length,
    };
  });

  return { name: pipelineName, stages };
}
```

- [ ] **Step 2: Implement pipeline/sequencer.js**

```javascript
// runner/main/pipeline/sequencer.js
export class StageSequencer {
  constructor({ stages, createRunner, onStageStart, onStageComplete }) {
    this.stages = stages;
    this.createRunner = createRunner;
    this.onStageStart = onStageStart;
    this.onStageComplete = onStageComplete;
  }

  async run() {
    const results = [];

    for (const stage of this.stages) {
      const maxAttempts = 1 + (stage.max_retries || 0);
      let stageResult = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const runner = this.createRunner(stage);
        await this.onStageStart(stage, attempt);

        try {
          stageResult = await runner.run('');
        } catch (err) {
          stageResult = { status: 'failure', summary: err.message };
        }

        await this.onStageComplete(stage, stageResult, attempt);

        if (stageResult.status === 'success') break;
        if (stageResult.status === 'failure' && stage.on_fail !== 'retry') break;
      }

      results.push({ stage: stage.stage, ...stageResult });

      if (stageResult.status !== 'success' && stage.critical) {
        return { status: 'failure', results, failedStage: stage.stage };
      }
    }

    return { status: 'success', results };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add runner/main/pipeline/
git commit -m "feat(runner): port pipeline sequencer and resolver"
```

---

## Task 8: Port orchestrator

**Files:**
- Create: `runner/main/orchestrator.js`
- Create: `runner/main/worktree/manager.js`

- [ ] **Step 1: Implement worktree/manager.js**

```javascript
// runner/main/worktree/manager.js
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { tmpdir } from 'os';

export class WorktreeManager {
  constructor(repoDir) {
    this.repoDir = repoDir;
    this.worktreesDir = join(tmpdir(), 'specd-worktrees', basename(repoDir));
    this.active = new Map();
  }

  create(taskId) {
    const branch = `specd/${taskId}`;
    const worktreePath = join(this.worktreesDir, taskId);

    mkdirSync(this.worktreesDir, { recursive: true });

    // Create branch from current HEAD
    try {
      execSync(`git branch ${branch}`, { cwd: this.repoDir, stdio: 'pipe' });
    } catch {
      // Branch may already exist
    }

    execSync(`git worktree add "${worktreePath}" ${branch}`, {
      cwd: this.repoDir,
      stdio: 'pipe',
    });

    this.active.set(taskId, worktreePath);
    return worktreePath;
  }

  remove(taskId, deleteBranch = false) {
    const worktreePath = this.active.get(taskId);
    if (!worktreePath) return;

    execSync(`git worktree remove "${worktreePath}" --force`, {
      cwd: this.repoDir,
      stdio: 'pipe',
    });

    if (deleteBranch) {
      try {
        execSync(`git branch -D specd/${taskId}`, { cwd: this.repoDir, stdio: 'pipe' });
      } catch {
        // Branch may not exist
      }
    }

    this.active.delete(taskId);
  }

  hasChanges(taskId) {
    const worktreePath = this.active.get(taskId);
    if (!worktreePath) return false;

    try {
      const base = execSync('git merge-base HEAD main', { cwd: worktreePath, encoding: 'utf-8' }).trim();
      const head = execSync('git rev-parse HEAD', { cwd: worktreePath, encoding: 'utf-8' }).trim();
      return base !== head;
    } catch {
      return false;
    }
  }

  createPR(taskId, taskName, summary) {
    const worktreePath = this.active.get(taskId);
    if (!worktreePath) return null;

    const branch = `specd/${taskId}`;

    try {
      execSync(`git push -u origin ${branch}`, { cwd: worktreePath, stdio: 'pipe' });
      const prUrl = execSync(
        `gh pr create --title "${taskName}" --body "${summary}" --head ${branch}`,
        { cwd: worktreePath, encoding: 'utf-8' }
      ).trim();
      return prUrl;
    } catch (err) {
      console.error(`PR creation failed for ${taskId}:`, err.message);
      return null;
    }
  }

  getPath(taskId) {
    return this.active.get(taskId) || null;
  }

  listActive() {
    return [...this.active.keys()];
  }
}
```

- [ ] **Step 2: Implement orchestrator.js**

```javascript
// runner/main/orchestrator.js
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import { StateManager } from './state/manager.js';
import { TemplateManager } from './template-manager.js';
import { AgentRunner } from './agent/runner.js';
import { StageSequencer } from './pipeline/sequencer.js';
import { resolvePipeline } from './pipeline/resolver.js';
import { resolveTemplate, buildTemplateContext } from './agent/template.js';
import { WorktreeManager } from './worktree/manager.js';

export class Orchestrator extends EventEmitter {
  constructor({ projectId, paths, config }) {
    super();
    this.projectId = projectId;
    this.paths = paths;
    this.config = config;
    this.projectPaths = paths.forProject(projectId);
    this.stateManager = new StateManager(this.projectPaths.statusJson);
    this.templateManager = new TemplateManager(paths);
    this.running = false;
    this.runningTasks = new Set();
    this.worktreeManager = null;
  }

  init() {
    // Ensure project dirs exist
    mkdirSync(this.projectPaths.tasksDir, { recursive: true });
    mkdirSync(this.projectPaths.logsDir, { recursive: true });

    // Load project config
    const projectJson = JSON.parse(readFileSync(this.projectPaths.projectJson, 'utf-8'));
    this.projectPath = projectJson.path;

    // Init worktree manager if parallel
    const maxParallel = this.config.defaults?.max_parallel || 1;
    if (maxParallel > 1 && existsSync(join(this.projectPath, '.git'))) {
      this.worktreeManager = new WorktreeManager(this.projectPath);
    }

    // Forward state events
    this.stateManager.on('change', (event) => {
      this.emit('change', { ...event, project: this.projectId });
    });
  }

  getTasks() {
    const tasksDir = this.projectPaths.tasksDir;
    if (!existsSync(tasksDir)) return [];
    return readdirSync(tasksDir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(readFileSync(join(tasksDir, f), 'utf-8')));
  }

  getTask(taskId) {
    const taskPath = join(this.projectPaths.tasksDir, `${taskId}.json`);
    if (!existsSync(taskPath)) return null;
    return JSON.parse(readFileSync(taskPath, 'utf-8'));
  }

  createTask(task) {
    mkdirSync(this.projectPaths.tasksDir, { recursive: true });
    const taskPath = join(this.projectPaths.tasksDir, `${task.id}.json`);
    writeFileSync(taskPath, JSON.stringify(task, null, 2));
    return task;
  }

  updateTask(taskId, updates) {
    const task = this.getTask(taskId);
    if (!task) return null;
    const updated = { ...task, ...updates };
    const taskPath = join(this.projectPaths.tasksDir, `${taskId}.json`);
    writeFileSync(taskPath, JSON.stringify(updated, null, 2));
    return updated;
  }

  pickNextTask() {
    const tasks = this.getTasks();
    const completedIds = new Set(
      Object.entries(this.stateManager.getState().tasks)
        .filter(([, t]) => t.status === 'done')
        .map(([id]) => id)
    );

    return tasks
      .filter(t => t.status === 'ready' && !this.runningTasks.has(t.id))
      .filter(t => (t.depends_on || []).every(dep => completedIds.has(dep)))
      .sort((a, b) => (a.priority || 99) - (b.priority || 99))[0] || null;
  }

  async runTask(task) {
    const agents = this.templateManager.getAgents(this.projectId);
    const pipelines = this.templateManager.getPipelines(this.projectId);
    const pipelineName = task.pipeline || this.config.defaults?.pipeline || 'default';
    const pipeline = resolvePipeline(pipelineName, pipelines, task.stage_overrides, this.config.defaults);

    this.runningTasks.add(task.id);
    this.stateManager.registerTask(task.id, { name: task.name, pipeline: pipelineName });
    this.stateManager.updateTaskStatus(task.id, 'in_progress');
    this.updateTask(task.id, { status: 'in_progress' });

    // Determine working directory
    const workingDir = task.working_dir || '.';
    let cwd = join(this.projectPath, workingDir);
    let worktreePath = null;

    if (this.worktreeManager && existsSync(join(cwd, '.git'))) {
      worktreePath = this.worktreeManager.create(task.id);
      cwd = worktreePath;
    }

    const logPath = join(this.projectPaths.logsDir, `${task.id}.log`);

    const sequencer = new StageSequencer({
      stages: pipeline.stages,
      createRunner: (stage) => {
        const agentDef = agents[stage.agent];
        if (!agentDef) throw new Error(`Agent not found: ${stage.agent}`);

        const context = buildTemplateContext(task, stage, pipeline, this.projectPaths);
        const resolvedPrompt = resolveTemplate(agentDef.system_prompt || '', context);

        const runner = new AgentRunner({
          ...agentDef,
          system_prompt: resolvedPrompt,
          timeout: stage.timeout,
          stuck_timeout: this.config.defaults?.stuck_timeout,
        });

        runner.on('status', (s) => this.stateManager.updateLiveProgress(task.id, s));
        runner.on('output', () => this.stateManager.persist());

        return { run: () => runner.run(task.spec || task.description || task.name, { cwd, logPath }) };
      },
      onStageStart: async (stage, attempt) => {
        this.stateManager.startStage(task.id, { stage: stage.stage, agent: stage.agent });
        this.stateManager.persist();
      },
      onStageComplete: async (stage, result, attempt) => {
        this.stateManager.completeStage(task.id, result.status, result.summary);
        this.stateManager.persist();
      },
    });

    const result = await sequencer.run();

    const finalStatus = result.status === 'success' ? 'done' : 'failed';
    this.stateManager.updateTaskStatus(task.id, finalStatus);
    this.stateManager.persist();
    this.updateTask(task.id, { status: finalStatus });

    // Create PR if worktree has changes
    if (worktreePath && this.worktreeManager.hasChanges(task.id)) {
      const summary = result.results.map(r => `- ${r.stage}: ${r.summary}`).join('\n');
      const prUrl = this.worktreeManager.createPR(task.id, task.name, summary);
      if (prUrl) this.stateManager.setPrUrl(task.id, prUrl);
      this.stateManager.persist();
    }

    // Cleanup worktree
    if (worktreePath) {
      this.worktreeManager.remove(task.id);
    }

    this.runningTasks.delete(task.id);
    return result;
  }

  async startLoop(interval = 5000) {
    this.running = true;

    while (this.running) {
      const maxParallel = this.config.defaults?.max_parallel || 1;
      const available = maxParallel - this.runningTasks.size;

      for (let i = 0; i < available; i++) {
        const task = this.pickNextTask();
        if (!task) break;
        // Fire and forget — runs in parallel
        this.runTask(task).catch(err => {
          console.error(`Task ${task.id} failed:`, err);
        });
      }

      await new Promise(r => setTimeout(r, interval));
    }
  }

  stop() {
    this.running = false;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add runner/main/orchestrator.js runner/main/worktree/manager.js
git commit -m "feat(runner): port orchestrator and worktree manager"
```

---

## Task 9: API server with task creation endpoint

**Files:**
- Create: `runner/main/server/index.js`
- Create: `runner/main/server/api.js`
- Create: `runner/main/server/websocket.js`

- [ ] **Step 1: Implement server/websocket.js**

```javascript
// runner/main/server/websocket.js
import { WebSocketServer } from 'ws';

export class WsBroadcaster {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
    });
  }

  broadcast(event) {
    const data = JSON.stringify(event);
    for (const client of this.wss.clients) {
      if (client.readyState === 1) {
        client.send(data);
      }
    }
  }

  close() {
    this.wss.close();
  }
}
```

- [ ] **Step 2: Implement server/api.js**

```javascript
// runner/main/server/api.js
import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';

export function createApiRouter(getContext) {
  const router = Router();

  // List projects
  router.get('/projects', (req, res) => {
    const { db, orchestrators } = getContext();
    const projects = db.list().map(p => {
      const orch = orchestrators.get(p.id);
      const tasks = orch ? orch.getTasks() : [];
      return {
        ...p,
        taskCounts: {
          total: tasks.length,
          ready: tasks.filter(t => t.status === 'ready').length,
          running: tasks.filter(t => t.status === 'in_progress').length,
          done: tasks.filter(t => t.status === 'done').length,
          failed: tasks.filter(t => t.status === 'failed').length,
        },
      };
    });
    res.json(projects);
  });

  // Global status
  router.get('/status', (req, res) => {
    const { orchestrators } = getContext();
    const status = {};
    for (const [id, orch] of orchestrators) {
      status[id] = orch.stateManager.getState();
    }
    res.json(status);
  });

  // Project status
  router.get('/projects/:id/status', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });
    res.json(orch.stateManager.getState());
  });

  // List tasks
  router.get('/projects/:id/tasks', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });
    res.json(orch.getTasks());
  });

  // Get task
  router.get('/projects/:id/tasks/:taskId', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });
    const task = orch.getTask(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });

  // Create task
  router.post('/projects/:id/tasks', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const task = {
      id: req.body.id || `task-${randomUUID().slice(0, 6)}`,
      name: req.body.name,
      description: req.body.description || '',
      project_id: req.params.id,
      working_dir: req.body.working_dir || '.',
      pipeline: req.body.pipeline || 'default',
      status: req.body.status || 'ready',
      priority: req.body.priority || 10,
      depends_on: req.body.depends_on || [],
      spec: req.body.spec || '',
      created_at: new Date().toISOString(),
    };

    orch.createTask(task);
    res.status(201).json(task);
  });

  // Retry task
  router.post('/projects/:id/tasks/:taskId/retry', (req, res) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(req.params.id);
    if (!orch) return res.status(404).json({ error: 'Project not found' });

    const task = orch.updateTask(req.params.taskId, { status: 'ready' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });

  // Task logs
  router.get('/projects/:id/tasks/:taskId/logs', (req, res) => {
    const { paths } = getContext();
    const logPath = `${paths.forProject(req.params.id).logsDir}/${req.params.taskId}.log`;
    if (!existsSync(logPath)) return res.status(404).json({ error: 'Log not found' });

    const content = readFileSync(logPath, 'utf-8');
    const lines = content.split('\n');
    const tail = parseInt(req.query.tail) || 200;
    res.json({ lines: lines.slice(-tail) });
  });

  // Find project by path (for skill auto-detection)
  router.get('/projects/by-path', (req, res) => {
    const { db } = getContext();
    const folderPath = req.query.path;
    if (!folderPath) return res.status(400).json({ error: 'path query param required' });
    const project = db.findByPath(folderPath);
    if (!project) return res.status(404).json({ error: 'No project matches this path' });
    res.json(project);
  });

  return router;
}
```

- [ ] **Step 3: Implement server/index.js**

```javascript
// runner/main/server/index.js
import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createApiRouter } from './api.js';
import { WsBroadcaster } from './websocket.js';

export function createServer(getContext) {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter(getContext));

  const httpServer = createHttpServer(app);
  const broadcaster = new WsBroadcaster(httpServer);

  return {
    start(port) {
      return new Promise((resolve) => {
        httpServer.listen(port, () => {
          console.log(`Specd API server on http://localhost:${port}`);
          resolve();
        });
      });
    },
    stop() {
      broadcaster.close();
      httpServer.close();
    },
    broadcaster,
    wireOrchestrator(orch) {
      orch.on('change', (event) => broadcaster.broadcast(event));
    },
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add runner/main/server/
git commit -m "feat(runner): add API server with task creation and WebSocket"
```

---

## Task 10: IPC bridge and wire up Electron main process

**Files:**
- Create: `runner/main/ipc.js`
- Modify: `runner/main/index.js`

- [ ] **Step 1: Implement ipc.js**

```javascript
// runner/main/ipc.js
import { ipcMain } from 'electron';

export function setupIpc(getContext) {
  ipcMain.handle('get-projects', () => {
    const { db, orchestrators } = getContext();
    return db.list().map(p => {
      const orch = orchestrators.get(p.id);
      const tasks = orch ? orch.getTasks() : [];
      return {
        ...p,
        taskCounts: {
          total: tasks.length,
          ready: tasks.filter(t => t.status === 'ready').length,
          running: tasks.filter(t => t.status === 'in_progress').length,
          done: tasks.filter(t => t.status === 'done').length,
          failed: tasks.filter(t => t.status === 'failed').length,
        },
      };
    });
  });

  ipcMain.handle('get-project-status', (event, projectId) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.stateManager.getState();
  });

  ipcMain.handle('get-tasks', (event, projectId) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return [];
    return orch.getTasks();
  });

  ipcMain.handle('get-task', (event, projectId, taskId) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.getTask(taskId);
  });

  ipcMain.handle('create-task', (event, projectId, taskData) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.createTask(taskData);
  });

  ipcMain.handle('retry-task', (event, projectId, taskId) => {
    const { orchestrators } = getContext();
    const orch = orchestrators.get(projectId);
    if (!orch) return null;
    return orch.updateTask(taskId, { status: 'ready' });
  });

  ipcMain.handle('get-task-logs', (event, projectId, taskId) => {
    const { paths } = getContext();
    const { readFileSync, existsSync } = require('fs');
    const logPath = `${paths.forProject(projectId).logsDir}/${taskId}.log`;
    if (!existsSync(logPath)) return { lines: [] };
    const content = readFileSync(logPath, 'utf-8');
    return { lines: content.split('\n').slice(-200) };
  });

  ipcMain.handle('get-config', () => {
    const { config } = getContext();
    return config;
  });
}
```

- [ ] **Step 2: Update runner/main/index.js — wire everything together**

```javascript
// runner/main/index.js
import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { readFileSync } from 'fs';
import { Paths } from './paths.js';
import { bootstrap } from './bootstrap.js';
import { ProjectDB } from './db.js';
import { Orchestrator } from './orchestrator.js';
import { createServer } from './server/index.js';
import { setupIpc } from './ipc.js';

let mainWindow;
const paths = new Paths();
const orchestrators = new Map();
let db;
let config;
let server;

function getContext() {
  return { db, config, paths, orchestrators };
}

async function initBackend() {
  await bootstrap(paths);

  db = new ProjectDB(paths.db);
  config = JSON.parse(readFileSync(paths.config, 'utf-8'));

  // Initialize orchestrators for active projects
  for (const project of db.list().filter(p => p.active)) {
    const orch = new Orchestrator({ projectId: project.id, paths, config });
    orch.init();
    orchestrators.set(project.id, orch);
  }

  // Start API server
  server = createServer(getContext);
  const port = config.server?.port || 3700;
  await server.start(port);

  // Wire orchestrators to WebSocket
  for (const orch of orchestrators.values()) {
    server.wireOrchestrator(orch);
  }

  // Start orchestrator loops
  for (const orch of orchestrators.values()) {
    orch.startLoop().catch(err => console.error('Loop error:', err));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, '..', 'renderer', 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  setupIpc(getContext);
  await initBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  for (const orch of orchestrators.values()) {
    orch.stop();
  }
  if (server) server.stop();
});
```

- [ ] **Step 3: Commit**

```bash
git add runner/main/ipc.js runner/main/index.js
git commit -m "feat(runner): wire IPC bridge and Electron main process"
```

---

## Task 11: Unified CLI entry point (bin/specd.js)

**Files:**
- Create: `bin/specd.js`
- Modify: `package.json`

- [ ] **Step 1: Implement bin/specd.js**

```javascript
#!/usr/bin/env node

// bin/specd.js — unified CLI entry point
// Usage:
//   specd llm-init [--local]     — install commands/agents/workflows
//   specd runner                  — launch Electron app
//   specd runner register <path>  — register a folder
//   specd runner unregister <id>  — remove a project
//   specd runner projects         — list projects
//   specd runner status           — show task status

import { resolve, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir, platform } from 'os';
import { execSync, spawn } from 'child_process';

const args = process.argv.slice(2);
const command = args[0];

function getAppDataDir() {
  if (platform() === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Specd');
  }
  return join(homedir(), '.config', 'specd');
}

function getDbPath() {
  return join(getAppDataDir(), 'db.json');
}

function loadDb() {
  const dbPath = getDbPath();
  if (!existsSync(dbPath)) return { projects: [] };
  return JSON.parse(readFileSync(dbPath, 'utf-8'));
}

function saveDb(data) {
  const dbPath = getDbPath();
  mkdirSync(join(dbPath, '..'), { recursive: true });
  writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

if (command === 'llm-init') {
  // Delegate to existing install.js
  const installScript = join(import.meta.dirname, 'install.js');
  const isLocal = args.includes('--local');
  process.argv = ['node', installScript, isLocal ? '--local' : '--global'];
  await import(installScript);
} else if (command === 'runner') {
  const subcommand = args[1];

  if (subcommand === 'register') {
    const folderPath = resolve(args[2] || '.');
    if (!existsSync(folderPath)) {
      console.error(`Path does not exist: ${folderPath}`);
      process.exit(1);
    }
    const name = args[3] || folderPath.split('/').pop();
    const db = loadDb();
    const existing = db.projects.find(p => p.path === folderPath);
    if (existing) {
      console.log(`Already registered: ${existing.name} (${existing.id})`);
      process.exit(0);
    }
    const id = Math.random().toString(36).slice(2, 10);
    db.projects.push({
      id,
      name,
      path: folderPath,
      active: true,
      registeredAt: new Date().toISOString(),
    });
    saveDb(db);
    console.log(`Registered: ${name} (${id}) → ${folderPath}`);
  } else if (subcommand === 'unregister') {
    const id = args[2];
    if (!id) { console.error('Usage: specd runner unregister <id>'); process.exit(1); }
    const db = loadDb();
    db.projects = db.projects.filter(p => p.id !== id);
    saveDb(db);
    console.log(`Unregistered: ${id}`);
  } else if (subcommand === 'projects') {
    const db = loadDb();
    if (db.projects.length === 0) {
      console.log('No projects registered. Run: specd runner register <path>');
    } else {
      for (const p of db.projects) {
        console.log(`  ${p.id}  ${p.name}  ${p.path}  ${p.active ? '●' : '○'}`);
      }
    }
  } else if (subcommand === 'status') {
    try {
      const resp = await fetch('http://localhost:3700/api/status');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const status = await resp.json();
      for (const [projectId, state] of Object.entries(status)) {
        console.log(`\n${projectId}:`);
        for (const [taskId, task] of Object.entries(state.tasks || {})) {
          const icon = { done: '✓', in_progress: '▸', failed: '✗', queued: '○' }[task.status] || '?';
          console.log(`  ${icon} ${taskId}: ${task.name} [${task.status}]`);
        }
      }
    } catch {
      console.error('Runner not running. Start it with: specd runner');
    }
  } else {
    // No subcommand — launch Electron app
    const runnerDir = join(import.meta.dirname, '..', 'runner');
    const electronPath = join(getAppDataDir(), 'electron', 'node_modules', '.bin', 'electron');

    if (!existsSync(electronPath)) {
      console.log('First run — installing Electron runtime...');
      const electronDir = join(getAppDataDir(), 'electron');
      mkdirSync(electronDir, { recursive: true });
      writeFileSync(join(electronDir, 'package.json'), JSON.stringify({ name: 'specd-electron', private: true }));
      execSync('npm install electron@latest', { cwd: electronDir, stdio: 'inherit' });
      console.log('Electron installed.');
    }

    const child = spawn(electronPath, [runnerDir], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    console.log('Specd Runner launched.');
  }
} else {
  console.log('Usage:');
  console.log('  specd llm-init [--local]     Install Claude Code commands/agents');
  console.log('  specd runner                  Launch the Specd Runner app');
  console.log('  specd runner register <path>  Register a project folder');
  console.log('  specd runner unregister <id>  Remove a project');
  console.log('  specd runner projects         List registered projects');
  console.log('  specd runner status           Show task status');
}
```

- [ ] **Step 2: Update package.json**

Change the `bin` field and `files` array:

```json
{
  "bin": {
    "specd": "bin/specd.js",
    "specdacular": "bin/install.js"
  },
  "files": [
    "bin",
    "commands",
    "agents",
    "specdacular",
    "hooks",
    "runner/main",
    "runner/renderer/dist",
    "runner/preload.js",
    "runner/package.json",
    "README.md"
  ]
}
```

Keep `specdacular` as an alias for backwards compatibility during transition.

- [ ] **Step 3: Test CLI commands**

```bash
node bin/specd.js
node bin/specd.js runner projects
node bin/specd.js runner register /tmp/test-project
node bin/specd.js runner projects
node bin/specd.js runner unregister <id-from-above>
```

Expected: Each command produces expected output.

- [ ] **Step 4: Commit**

```bash
git add bin/specd.js package.json
git commit -m "feat: add unified specd CLI entry point"
```

---

## Task 12: Telegram notifications (port)

**Files:**
- Create: `runner/main/notifications/telegram.js`

- [ ] **Step 1: Implement notifications/telegram.js**

```javascript
// runner/main/notifications/telegram.js
import { request } from 'https';

export class TelegramNotifier {
  constructor({ bot_token, chat_id, notify_on }) {
    this.botToken = bot_token;
    this.chatId = chat_id;
    this.notifyOn = new Set(notify_on || ['task_complete', 'task_failed']);
  }

  async onTaskComplete(taskId, taskName, summary) {
    if (!this.notifyOn.has('task_complete')) return;
    await this._send(`✅ *Task Complete*\n*${taskName}* (${taskId})\n${summary}`);
  }

  async onTaskFailed(taskId, taskName, stage, error) {
    if (!this.notifyOn.has('task_failed')) return;
    await this._send(`❌ *Task Failed*\n*${taskName}* (${taskId})\nStage: ${stage}\nError: ${error}`);
  }

  async onStuck(taskId, taskName, stage) {
    if (!this.notifyOn.has('task_stuck')) return;
    await this._send(`⚠️ *Agent Stuck*\n*${taskName}* (${taskId})\nStage: ${stage}`);
  }

  async onNeedsInput(taskId, taskName, stage, question) {
    if (!this.notifyOn.has('needs_input')) return;
    await this._send(`❓ *Input Needed*\n*${taskName}* (${taskId})\nStage: ${stage}\n${question}`);
  }

  _send(text) {
    return new Promise((resolve) => {
      const data = JSON.stringify({ chat_id: this.chatId, text, parse_mode: 'Markdown' });
      const req = request({
        hostname: 'api.telegram.org',
        path: `/bot${this.botToken}/sendMessage`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      }, resolve);
      req.on('error', (err) => { console.error('Telegram error:', err.message); resolve(); });
      req.write(data);
      req.end();
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add runner/main/notifications/
git commit -m "feat(runner): port Telegram notifications"
```

---

## Task 13: React UI — Sidebar and Dashboard

**Files:**
- Create: `runner/renderer/src/components/Sidebar.jsx`
- Create: `runner/renderer/src/pages/Dashboard.jsx`
- Modify: `runner/renderer/src/App.jsx`
- Create: `runner/renderer/src/hooks/useIpc.js`

- [ ] **Step 1: Implement hooks/useIpc.js**

```jsx
// runner/renderer/src/hooks/useIpc.js
import { useState, useEffect, useCallback } from 'react';

export function useIpc(channel, ...args) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await window.specd.invoke(channel, ...args);
    setData(result);
    setLoading(false);
  }, [channel, ...args]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, refresh };
}
```

- [ ] **Step 2: Implement Sidebar.jsx**

```jsx
// runner/renderer/src/components/Sidebar.jsx
export default function Sidebar({ projects, selectedId, onSelect }) {
  return (
    <aside style={{
      width: 240,
      borderRight: '1px solid #e0e0e0',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      backgroundColor: '#fafafa',
    }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Specd Runner</h2>

      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '8px 12px',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          textAlign: 'left',
          backgroundColor: selectedId === null ? '#e8e8e8' : 'transparent',
        }}
      >
        Dashboard
      </button>

      <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

      {projects?.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            textAlign: 'left',
            backgroundColor: selectedId === p.id ? '#e8e8e8' : 'transparent',
          }}
        >
          <div style={{ fontWeight: 500 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {p.taskCounts?.running || 0} running / {p.taskCounts?.total || 0} total
          </div>
        </button>
      ))}

      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button
          onClick={() => onSelect('settings')}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            backgroundColor: selectedId === 'settings' ? '#e8e8e8' : 'transparent',
          }}
        >
          Settings
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Implement Dashboard.jsx**

```jsx
// runner/renderer/src/pages/Dashboard.jsx
export default function Dashboard({ projects }) {
  const running = projects?.reduce((sum, p) => sum + (p.taskCounts?.running || 0), 0) || 0;
  const queued = projects?.reduce((sum, p) => sum + (p.taskCounts?.ready || 0), 0) || 0;
  const done = projects?.reduce((sum, p) => sum + (p.taskCounts?.done || 0), 0) || 0;
  const failed = projects?.reduce((sum, p) => sum + (p.taskCounts?.failed || 0), 0) || 0;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: '0 0 24px' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Running" value={running} color="#2196f3" />
        <StatCard label="Queued" value={queued} color="#ff9800" />
        <StatCard label="Done" value={done} color="#4caf50" />
        <StatCard label="Failed" value={failed} color="#f44336" />
      </div>

      <h2 style={{ margin: '0 0 16px' }}>Projects</h2>
      {(!projects || projects.length === 0) ? (
        <p style={{ color: '#888' }}>
          No projects registered. Run <code>specd runner register &lt;path&gt;</code> to add one.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {projects.map(p => (
            <div key={p.id} style={{
              padding: 16,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{p.path}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                <span>{p.taskCounts?.running || 0} running</span>
                <span>{p.taskCounts?.done || 0} done</span>
                <span>{p.taskCounts?.failed || 0} failed</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      padding: 20,
      borderRadius: 8,
      border: '1px solid #e0e0e0',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 14, color: '#666' }}>{label}</div>
    </div>
  );
}
```

- [ ] **Step 4: Update App.jsx to use sidebar + routing**

```jsx
// runner/renderer/src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const loadProjects = useCallback(async () => {
    const result = await window.specd.invoke('get-projects');
    setProjects(result || []);
  }, []);

  useEffect(() => {
    loadProjects();
    const interval = setInterval(loadProjects, 5000);
    return () => clearInterval(interval);
  }, [loadProjects]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      <Sidebar projects={projects} selectedId={selectedId} onSelect={setSelectedId} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {selectedId === null && <Dashboard projects={projects} />}
        {selectedId === 'settings' && <div style={{ padding: 24 }}><h1>Settings</h1><p>Coming soon</p></div>}
        {selectedId && selectedId !== 'settings' && (
          <div style={{ padding: 24 }}>
            <h1>{projects.find(p => p.id === selectedId)?.name || 'Project'}</h1>
            <p>Project view coming in next task</p>
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add runner/renderer/src/
git commit -m "feat(runner): add React sidebar and dashboard UI"
```

---

## Task 14: React UI — Project View and Task Detail

**Files:**
- Create: `runner/renderer/src/pages/ProjectView.jsx`
- Create: `runner/renderer/src/pages/TaskDetail.jsx`
- Create: `runner/renderer/src/components/TaskList.jsx`
- Create: `runner/renderer/src/components/StageProgress.jsx`
- Create: `runner/renderer/src/components/LogViewer.jsx`
- Modify: `runner/renderer/src/App.jsx`

- [ ] **Step 1: Implement TaskList.jsx**

```jsx
// runner/renderer/src/components/TaskList.jsx
const STATUS_ICONS = { done: '✓', in_progress: '▸', failed: '✗', ready: '○', queued: '○', draft: '·' };
const STATUS_COLORS = { done: '#4caf50', in_progress: '#2196f3', failed: '#f44336', ready: '#ff9800', queued: '#999' };

export default function TaskList({ tasks, onSelect, selectedTaskId }) {
  if (!tasks || tasks.length === 0) {
    return <p style={{ color: '#888' }}>No tasks yet.</p>;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {tasks.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          style={{
            padding: '12px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: selectedTaskId === t.id ? '#f0f0f0' : '#fff',
          }}
        >
          <div>
            <span style={{ color: STATUS_COLORS[t.status], marginRight: 8 }}>
              {STATUS_ICONS[t.status] || '?'}
            </span>
            <span style={{ fontWeight: 500 }}>{t.name}</span>
          </div>
          <span style={{ fontSize: 12, color: '#888' }}>{t.id}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement StageProgress.jsx**

```jsx
// runner/renderer/src/components/StageProgress.jsx
const STAGE_COLORS = { success: '#4caf50', failure: '#f44336', running: '#2196f3' };

export default function StageProgress({ stages }) {
  if (!stages || stages.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {stages.map((s, i) => (
        <div key={i} style={{
          flex: 1,
          padding: 12,
          borderRadius: 8,
          border: `2px solid ${STAGE_COLORS[s.status] || '#e0e0e0'}`,
          backgroundColor: s.status === 'running' ? '#e3f2fd' : '#fff',
        }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.stage}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{s.agent}</div>
          <div style={{ fontSize: 12, color: STAGE_COLORS[s.status] }}>{s.status}</div>
          {s.duration != null && (
            <div style={{ fontSize: 11, color: '#999' }}>{s.duration}s</div>
          )}
          {s.live_progress && (
            <div style={{ fontSize: 11, color: '#2196f3', marginTop: 4 }}>
              {s.live_progress.progress} ({s.live_progress.percent}%)
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Implement LogViewer.jsx**

```jsx
// runner/renderer/src/components/LogViewer.jsx
import { useEffect, useRef } from 'react';

export default function LogViewer({ lines }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        padding: 16,
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.5,
        maxHeight: 400,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {lines?.length > 0 ? lines.join('\n') : 'No logs yet.'}
    </div>
  );
}
```

- [ ] **Step 4: Implement ProjectView.jsx**

```jsx
// runner/renderer/src/pages/ProjectView.jsx
import { useState, useEffect, useCallback } from 'react';
import TaskList from '../components/TaskList';

export default function ProjectView({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const loadTasks = useCallback(async () => {
    const result = await window.specd.invoke('get-tasks', projectId);
    setTasks(result || []);
  }, [projectId]);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 3000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: 24 }}>
        <h2 style={{ margin: '0 0 16px' }}>Tasks</h2>
        <TaskList tasks={tasks} onSelect={setSelectedTaskId} selectedTaskId={selectedTaskId} />
      </div>
      {selectedTaskId && (
        <div style={{ width: 480, borderLeft: '1px solid #e0e0e0', overflow: 'auto' }}>
          <TaskDetailPanel projectId={projectId} taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
        </div>
      )}
    </div>
  );
}

function TaskDetailPanel({ projectId, taskId, onClose }) {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function load() {
      const s = await window.specd.invoke('get-project-status', projectId);
      setStatus(s?.tasks?.[taskId] || null);
      const l = await window.specd.invoke('get-task-logs', projectId, taskId);
      setLogs(l?.lines || []);
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [projectId, taskId]);

  const handleRetry = async () => {
    await window.specd.invoke('retry-task', projectId, taskId);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>{status?.name || taskId}</h3>
        <button onClick={onClose} style={{ border: 'none', cursor: 'pointer', fontSize: 18 }}>x</button>
      </div>

      {status && (
        <>
          <div style={{ marginBottom: 12, fontSize: 14, color: '#666' }}>
            Status: <strong>{status.status}</strong> | Pipeline: {status.pipeline}
          </div>

          {status.pr_url && (
            <div style={{ marginBottom: 12 }}>
              <a href={status.pr_url} style={{ color: '#2196f3' }}>View PR</a>
            </div>
          )}

          {status.status === 'failed' && (
            <button onClick={handleRetry} style={{
              padding: '6px 16px', marginBottom: 16, borderRadius: 6,
              border: '1px solid #f44336', color: '#f44336', backgroundColor: '#fff', cursor: 'pointer',
            }}>
              Retry
            </button>
          )}

          <h4>Stages</h4>
          {status.stages?.map((s, i) => (
            <div key={i} style={{ padding: 8, marginBottom: 4, borderRadius: 4, border: '1px solid #e0e0e0' }}>
              <strong>{s.stage}</strong> — {s.status}
              {s.summary && <div style={{ fontSize: 12, color: '#666' }}>{s.summary}</div>}
              {s.duration != null && <div style={{ fontSize: 11, color: '#999' }}>{s.duration}s</div>}
            </div>
          ))}
        </>
      )}

      <h4>Logs</h4>
      <div style={{
        backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 8,
        fontFamily: 'monospace', fontSize: 11, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap',
      }}>
        {logs.length > 0 ? logs.join('\n') : 'No logs yet.'}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update App.jsx to route to ProjectView**

Replace the placeholder project view in `App.jsx`:

```jsx
// runner/renderer/src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const loadProjects = useCallback(async () => {
    const result = await window.specd.invoke('get-projects');
    setProjects(result || []);
  }, []);

  useEffect(() => {
    loadProjects();
    const interval = setInterval(loadProjects, 5000);
    return () => clearInterval(interval);
  }, [loadProjects]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui' }}>
      <Sidebar projects={projects} selectedId={selectedId} onSelect={setSelectedId} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {selectedId === null && <Dashboard projects={projects} />}
        {selectedId === 'settings' && <div style={{ padding: 24 }}><h1>Settings</h1><p>Coming soon</p></div>}
        {selectedId && selectedId !== 'settings' && (
          <ProjectView projectId={selectedId} />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add runner/renderer/src/
git commit -m "feat(runner): add project view, task detail, and log viewer"
```

---

## Task 15: Claude Code skill — /specd.new-runner-task

**Files:**
- Create: `commands/specd.new-runner-task.md`

- [ ] **Step 1: Create the skill file**

```markdown
---
name: specd.new-runner-task
description: Create a new task in the Specd Runner app
---

<objective>
Create a task in the Specd Runner by talking to its local API. Auto-detects the project from the current working directory.
</objective>

<instructions>

## Step 1: Detect project

Use Bash to find the matching project:

```bash
curl -s "http://localhost:3700/api/projects/by-path?path=$(pwd)" 2>/dev/null
```

If the runner is not running or no project matches, tell the user:
- "The Specd Runner doesn't seem to be running. Start it with `specd runner`."
- Or: "No project registered for this directory. Register with `specd runner register <path>`."

## Step 2: Gather task details

Ask the user for:
1. **Task name** — short description (e.g., "Add dark mode support")
2. **Description/spec** — what should be built (can be multi-line)
3. **Working directory** — which subdirectory to work in (default: ".")
4. **Pipeline** — which pipeline to use (default: "default")
5. **Priority** — 1 (highest) to 99 (lowest), default 10

## Step 3: Create the task

```bash
curl -s -X POST "http://localhost:3700/api/projects/{PROJECT_ID}/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TASK_NAME",
    "description": "DESCRIPTION",
    "working_dir": "WORKING_DIR",
    "pipeline": "PIPELINE",
    "priority": PRIORITY,
    "spec": "SPEC_CONTENT"
  }'
```

## Step 4: Confirm

Show the user the created task ID and confirm it's queued for execution.

</instructions>
```

- [ ] **Step 2: Commit**

```bash
git add commands/specd.new-runner-task.md
git commit -m "feat: add /specd.new-runner-task Claude Code skill"
```

---

## Task 16: Claude Code skill — /specd.runner-status

**Files:**
- Create: `commands/specd.runner-status.md`

- [ ] **Step 1: Create the skill file**

```markdown
---
name: specd.runner-status
description: Show Specd Runner task status
---

<objective>
Fetch and display the current status of all tasks across all projects from the Specd Runner.
</objective>

<instructions>

## Step 1: Fetch status

```bash
curl -s "http://localhost:3700/api/status" 2>/dev/null
```

If the runner is not running, tell the user to start it with `specd runner`.

## Step 2: Display

Format the status as a readable table showing for each project:
- Project name
- Task list with status icons (✓ done, ▸ running, ✗ failed, ○ queued)
- Current stage and progress for running tasks

</instructions>
```

- [ ] **Step 2: Commit**

```bash
git add commands/specd.runner-status.md
git commit -m "feat: add /specd.runner-status Claude Code skill"
```

---

## Task 17: Clean up old runner code

**Files:**
- Remove: `runner/src/` (entire directory)
- Remove: `runner/dashboard/` (entire directory)

- [ ] **Step 1: Remove old runner source**

```bash
rm -rf runner/src/
rm -rf runner/dashboard/
```

- [ ] **Step 2: Verify new runner still works**

```bash
cd runner && npm install && npm run dev
```

Expected: Electron app launches with React UI.

- [ ] **Step 3: Commit**

```bash
git add -A runner/src/ runner/dashboard/
git commit -m "chore: remove old runner code (replaced by Electron app)"
```

---

## Task 18: End-to-end smoke test

- [ ] **Step 1: Bootstrap and register**

```bash
node bin/specd.js runner register /tmp/test-project test-project
node bin/specd.js runner projects
```

Expected: Shows `test-project` in the list.

- [ ] **Step 2: Launch the app**

```bash
cd runner && npm run dev
```

Expected: Electron window opens, shows Dashboard with test-project listed.

- [ ] **Step 3: Create a task via API**

```bash
curl -s -X POST "http://localhost:3700/api/projects/by-path?path=/tmp/test-project" | head -1
# Get the project ID from above, then:
curl -s -X POST "http://localhost:3700/api/projects/{ID}/tasks" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test task","description":"Just a test","status":"draft"}'
```

Expected: 201 response with task JSON.

- [ ] **Step 4: Verify task appears in UI**

Check the Electron app — navigate to test-project, verify the task shows up.

- [ ] **Step 5: Check status via CLI**

```bash
node bin/specd.js runner status
```

Expected: Shows the test task.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "test: end-to-end smoke test fixes"
```
