# Orchestrator Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a config-driven autonomous agent orchestrator that wraps any CLI agent through configurable pipelines with real-time progress tracking, web dashboard, and Telegram notifications.

**Architecture:** Long-running Node.js daemon that reads YAML configs, watches a tasks directory, spawns CLI agents as subprocesses, parses structured output blocks for real-time progress, serves a React dashboard via Express + WebSocket, and sends Telegram notifications. Fully local, multi-instance via `--port`.

**Tech Stack:** Node.js 18+, Express, ws, React, Tailwind CSS, chokidar, js-yaml, commander

---

## File Structure

```
runner/                              # New top-level directory (separate from existing specdacular/)
  package.json                       # Runner package with dependencies
  src/
    cli.js                           # CLI entry point: start, status commands
    orchestrator.js                  # Main daemon: pick up tasks, run pipelines, loop
    config/
      loader.js                      # Load & validate config.yaml, agents.yaml, pipelines.yaml
      schema.js                      # Config validation (required fields, types)
    agent/
      runner.js                      # Spawn CLI subprocess, pipe prompt, manage lifecycle
      parser.js                      # Parse specd-status and specd-result blocks from stdout
      template.js                    # Replace {{variables}} in system prompt templates
    state/
      manager.js                     # Read/write status.json, EventEmitter for state changes
      watcher.js                     # Watch tasks/ dir for new/changed task files
    pipeline/
      resolver.js                    # Resolve named pipeline + stage_overrides from config
      sequencer.js                   # Walk stages, retry logic, failure policies, timeouts
    server/
      index.js                       # Express server + WebSocket setup
      api.js                         # REST API routes
      websocket.js                   # WebSocket event broadcasting
    notifications/
      telegram.js                    # Telegram Bot API notifications
    worktree/
      manager.js                     # Git worktree create/cleanup for parallel tasks
  dashboard/
    package.json                     # React app dependencies
    vite.config.js                   # Vite config for building
    index.html                       # Entry HTML
    src/
      main.jsx                       # React entry point
      App.jsx                        # Main app layout + WebSocket connection
      components/
        TaskCard.jsx                 # Task card with status, progress, actions
        StageTimeline.jsx            # Pipeline stage visualization
        LogViewer.jsx                # Scrolling log output viewer
      hooks/
        useWebSocket.js              # WebSocket hook for live updates
  tests/
    config/
      loader.test.js                 # Config loading tests
    agent/
      parser.test.js                 # Block parsing tests
      template.test.js               # Template variable tests
      runner.test.js                 # Agent subprocess tests
    state/
      manager.test.js                # State management tests
    pipeline/
      resolver.test.js               # Pipeline resolution tests
      sequencer.test.js              # Stage sequencer tests
    orchestrator.test.js             # Integration: full loop test
    fixtures/
      config.yaml                    # Test config
      agents.yaml                    # Test agents
      pipelines.yaml                 # Test pipelines
      tasks/
        001-test-task.yaml           # Test task
      mock-agent.js                  # Mock CLI agent that emits specd blocks
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `runner/package.json`
- Create: `runner/src/cli.js`

- [ ] **Step 1: Create runner/package.json**

```json
{
  "name": "@specdacular/runner",
  "version": "0.1.0",
  "description": "Config-driven autonomous agent orchestrator",
  "main": "src/cli.js",
  "bin": {
    "specd-runner": "src/cli.js"
  },
  "scripts": {
    "start": "node src/cli.js start",
    "test": "node --test tests/**/*.test.js",
    "build:dashboard": "cd dashboard && npm run build"
  },
  "dependencies": {
    "chokidar": "^4.0.0",
    "commander": "^12.0.0",
    "express": "^4.21.0",
    "js-yaml": "^4.1.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {},
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 2: Create minimal CLI entry point**

```js
#!/usr/bin/env node
// runner/src/cli.js

const { Command } = require('commander');
const path = require('path');

const program = new Command();

program
  .name('specd-runner')
  .description('Config-driven autonomous agent orchestrator')
  .version('0.1.0');

program
  .command('start')
  .description('Start the orchestrator daemon')
  .option('-p, --port <port>', 'Dashboard port', '3700')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action(async (opts) => {
    const projectDir = path.resolve(opts.dir);
    const configDir = path.join(projectDir, '.specd', 'runner');
    console.log(`Starting orchestrator on port ${opts.port}...`);
    console.log(`Config dir: ${configDir}`);
    // Orchestrator wired in Task 10
  });

program
  .command('status')
  .description('Show current run status')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action(async (opts) => {
    const projectDir = path.resolve(opts.dir);
    const statusPath = path.join(projectDir, '.specd', 'runner', 'status.json');
    // Status display wired in Task 10
    console.log(`Reading status from ${statusPath}`);
  });

program.parse();
```

- [ ] **Step 3: Install dependencies**

Run: `cd runner && npm install`
Expected: `node_modules/` created, no errors

- [ ] **Step 4: Verify CLI runs**

Run: `cd runner && node src/cli.js --help`
Expected: Shows help with `start` and `status` commands

- [ ] **Step 5: Commit**

```bash
git add runner/package.json runner/src/cli.js
git commit -m "feat(runner): scaffold project with CLI entry point"
```

---

### Task 2: Config Loader

**Files:**
- Create: `runner/src/config/loader.js`
- Create: `runner/src/config/schema.js`
- Create: `runner/tests/config/loader.test.js`
- Create: `runner/tests/fixtures/config.yaml`
- Create: `runner/tests/fixtures/agents.yaml`
- Create: `runner/tests/fixtures/pipelines.yaml`
- Create: `runner/tests/fixtures/tasks/001-test-task.yaml`

- [ ] **Step 1: Create test fixtures**

`runner/tests/fixtures/config.yaml`:
```yaml
server:
  port: 3700

notifications:
  telegram:
    enabled: false

defaults:
  pipeline: default
  failure_policy: skip
  timeout: 3600
  stuck_timeout: 1800
```

`runner/tests/fixtures/agents.yaml`:
```yaml
agents:
  test-agent:
    cmd: "echo"
    prompt_flag: ""
    output_format: json_block
    system_prompt: |
      You are working on: {{task.name}} ({{task.id}})
      Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})
```

`runner/tests/fixtures/pipelines.yaml`:
```yaml
pipelines:
  default:
    stages:
      - stage: plan
        agent: test-agent
        critical: true
      - stage: implement
        agent: test-agent
        critical: true
      - stage: test
        cmd: "npm test"
        on_fail: retry
        max_retries: 3
  bug-fix:
    stages:
      - stage: investigate
        agent: test-agent
        critical: true
      - stage: fix
        agent: test-agent
        critical: true
```

`runner/tests/fixtures/tasks/001-test-task.yaml`:
```yaml
name: "Test task"
status: ready
priority: 1
description: "A test task for unit tests"
depends_on: []
pipeline: default
```

- [ ] **Step 2: Write the failing test**

`runner/tests/config/loader.test.js`:
```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const fixturesDir = path.join(__dirname, '..', 'fixtures');

describe('ConfigLoader', () => {
  let loadConfig;

  it('should load before importing', () => {
    // Defer import so we can catch module errors
    const { ConfigLoader } = require('../../src/config/loader');
    loadConfig = ConfigLoader;
  });

  it('loads config.yaml', async () => {
    const loader = new loadConfig(fixturesDir);
    const config = await loader.loadConfig();
    assert.strictEqual(config.server.port, 3700);
    assert.strictEqual(config.defaults.timeout, 3600);
    assert.strictEqual(config.defaults.stuck_timeout, 1800);
    assert.strictEqual(config.defaults.pipeline, 'default');
  });

  it('loads agents.yaml', async () => {
    const loader = new loadConfig(fixturesDir);
    const agents = await loader.loadAgents();
    assert.ok(agents['test-agent']);
    assert.strictEqual(agents['test-agent'].cmd, 'echo');
    assert.ok(agents['test-agent'].system_prompt.includes('{{task.name}}'));
  });

  it('loads pipelines.yaml', async () => {
    const loader = new loadConfig(fixturesDir);
    const pipelines = await loader.loadPipelines();
    assert.ok(pipelines['default']);
    assert.ok(pipelines['bug-fix']);
    assert.strictEqual(pipelines['default'].stages.length, 3);
    assert.strictEqual(pipelines['default'].stages[0].stage, 'plan');
  });

  it('loads task files from tasks/', async () => {
    const loader = new loadConfig(fixturesDir);
    const tasks = await loader.loadTasks();
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].id, '001-test-task');
    assert.strictEqual(tasks[0].name, 'Test task');
    assert.strictEqual(tasks[0].status, 'ready');
    assert.strictEqual(tasks[0].pipeline, 'default');
  });

  it('loadAll returns complete config', async () => {
    const loader = new loadConfig(fixturesDir);
    const all = await loader.loadAll();
    assert.ok(all.config);
    assert.ok(all.agents);
    assert.ok(all.pipelines);
    assert.ok(all.tasks);
  });

  it('resolves env vars in config values', async () => {
    process.env.TEST_TOKEN = 'my-token';
    const loader = new loadConfig(fixturesDir);
    const result = loader.resolveEnvVars('${TEST_TOKEN}');
    assert.strictEqual(result, 'my-token');
    delete process.env.TEST_TOKEN;
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd runner && node --test tests/config/loader.test.js`
Expected: FAIL — module not found

- [ ] **Step 4: Write the config loader**

`runner/src/config/schema.js`:
```js
// runner/src/config/schema.js

const REQUIRED_AGENT_FIELDS = ['cmd', 'output_format'];
const VALID_OUTPUT_FORMATS = ['json_block', 'exit_code'];
const VALID_TASK_STATUSES = ['draft', 'ready', 'in_progress', 'done', 'failed'];
const VALID_FAILURE_POLICIES = ['skip', 'retry', 'block'];

function validateConfig(config) {
  const errors = [];
  if (!config.defaults) errors.push('Missing "defaults" section');
  if (config.defaults && !config.defaults.pipeline) errors.push('Missing "defaults.pipeline"');
  return errors;
}

function validateAgent(name, agent) {
  const errors = [];
  for (const field of REQUIRED_AGENT_FIELDS) {
    if (!agent[field]) errors.push(`Agent "${name}": missing "${field}"`);
  }
  if (agent.output_format && !VALID_OUTPUT_FORMATS.includes(agent.output_format)) {
    errors.push(`Agent "${name}": invalid output_format "${agent.output_format}"`);
  }
  return errors;
}

function validatePipeline(name, pipeline) {
  const errors = [];
  if (!pipeline.stages || !Array.isArray(pipeline.stages)) {
    errors.push(`Pipeline "${name}": missing or invalid "stages"`);
    return errors;
  }
  for (const stage of pipeline.stages) {
    if (!stage.stage) errors.push(`Pipeline "${name}": stage missing "stage" name`);
    if (!stage.agent && !stage.cmd) errors.push(`Pipeline "${name}": stage "${stage.stage}" needs "agent" or "cmd"`);
  }
  return errors;
}

function validateTask(id, task) {
  const errors = [];
  if (!task.name) errors.push(`Task "${id}": missing "name"`);
  if (!task.status) errors.push(`Task "${id}": missing "status"`);
  if (task.status && !VALID_TASK_STATUSES.includes(task.status)) {
    errors.push(`Task "${id}": invalid status "${task.status}"`);
  }
  return errors;
}

module.exports = { validateConfig, validateAgent, validatePipeline, validateTask,
  VALID_TASK_STATUSES, VALID_OUTPUT_FORMATS, VALID_FAILURE_POLICIES };
```

`runner/src/config/loader.js`:
```js
// runner/src/config/loader.js

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { validateConfig, validateAgent, validatePipeline, validateTask } = require('./schema');

class ConfigLoader {
  constructor(configDir) {
    this.configDir = configDir;
  }

  readYaml(filename) {
    const filePath = path.join(this.configDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  }

  resolveEnvVars(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/\$\{(\w+)\}/g, (_, name) => process.env[name] || '');
  }

  resolveEnvVarsDeep(obj) {
    if (typeof obj === 'string') return this.resolveEnvVars(obj);
    if (Array.isArray(obj)) return obj.map(v => this.resolveEnvVarsDeep(v));
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, val] of Object.entries(obj)) {
        result[key] = this.resolveEnvVarsDeep(val);
      }
      return result;
    }
    return obj;
  }

  async loadConfig() {
    const raw = this.readYaml('config.yaml');
    const config = this.resolveEnvVarsDeep(raw);
    const errors = validateConfig(config);
    if (errors.length > 0) throw new Error(`Config validation failed:\n${errors.join('\n')}`);
    return config;
  }

  async loadAgents() {
    const raw = this.readYaml('agents.yaml');
    const agents = raw.agents || {};
    const errors = [];
    for (const [name, agent] of Object.entries(agents)) {
      errors.push(...validateAgent(name, agent));
    }
    if (errors.length > 0) throw new Error(`Agent validation failed:\n${errors.join('\n')}`);
    return agents;
  }

  async loadPipelines() {
    const raw = this.readYaml('pipelines.yaml');
    const pipelines = raw.pipelines || {};
    const errors = [];
    for (const [name, pipeline] of Object.entries(pipelines)) {
      errors.push(...validatePipeline(name, pipeline));
    }
    if (errors.length > 0) throw new Error(`Pipeline validation failed:\n${errors.join('\n')}`);
    return pipelines;
  }

  async loadTasks() {
    const tasksDir = path.join(this.configDir, 'tasks');
    if (!fs.existsSync(tasksDir)) return [];

    const files = fs.readdirSync(tasksDir)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .sort();

    const tasks = [];
    const errors = [];

    for (const file of files) {
      const id = path.basename(file, path.extname(file));
      const raw = yaml.load(fs.readFileSync(path.join(tasksDir, file), 'utf8'));
      const task = { id, ...raw };
      errors.push(...validateTask(id, task));
      tasks.push(task);
    }

    if (errors.length > 0) throw new Error(`Task validation failed:\n${errors.join('\n')}`);
    return tasks;
  }

  async loadAll() {
    const [config, agents, pipelines, tasks] = await Promise.all([
      this.loadConfig(),
      this.loadAgents(),
      this.loadPipelines(),
      this.loadTasks(),
    ]);
    return { config, agents, pipelines, tasks };
  }
}

module.exports = { ConfigLoader };
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd runner && node --test tests/config/loader.test.js`
Expected: All 6 tests PASS

- [ ] **Step 6: Commit**

```bash
git add runner/src/config/ runner/tests/config/ runner/tests/fixtures/
git commit -m "feat(runner): config loader with YAML parsing and validation"
```

---

### Task 3: Template Engine

**Files:**
- Create: `runner/src/agent/template.js`
- Create: `runner/tests/agent/template.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/agent/template.test.js`:
```js
const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('TemplateEngine', () => {
  let resolveTemplate;

  it('imports', () => {
    ({ resolveTemplate } = require('../../src/agent/template'));
  });

  it('replaces simple variables', () => {
    const result = resolveTemplate('Hello {{task.name}}!', { task: { name: 'Auth' } });
    assert.strictEqual(result, 'Hello Auth!');
  });

  it('replaces multiple variables', () => {
    const tpl = '{{task.id}} - {{stage.name}} ({{stage.index}}/{{stage.total}})';
    const vars = {
      task: { id: '001-auth' },
      stage: { name: 'implement', index: 2, total: 5 },
    };
    assert.strictEqual(resolveTemplate(tpl, vars), '001-auth - implement (2/5)');
  });

  it('leaves unknown variables as-is', () => {
    const result = resolveTemplate('{{unknown.var}}', {});
    assert.strictEqual(result, '{{unknown.var}}');
  });

  it('handles nested objects', () => {
    const result = resolveTemplate('{{task.name}}', { task: { name: 'Test' } });
    assert.strictEqual(result, 'Test');
  });

  it('builds context from task, stage, pipeline, and paths', () => {
    const { buildTemplateContext } = require('../../src/agent/template');
    const ctx = buildTemplateContext(
      { id: '001-auth', name: 'Add auth', spec: 'spec content' },
      { name: 'implement', index: 2, total: 5 },
      { name: 'default' },
      { statusFile: '/path/status.json', logDir: '/path/logs' }
    );
    assert.strictEqual(ctx.task.id, '001-auth');
    assert.strictEqual(ctx.stage.name, 'implement');
    assert.strictEqual(ctx.pipeline.name, 'default');
    assert.strictEqual(ctx.status_file, '/path/status.json');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/agent/template.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the template engine**

`runner/src/agent/template.js`:
```js
// runner/src/agent/template.js

function resolveTemplate(template, variables) {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const parts = path.split('.');
    let value = variables;
    for (const part of parts) {
      if (value == null || typeof value !== 'object') return match;
      value = value[part];
    }
    return value != null ? String(value) : match;
  });
}

function buildTemplateContext(task, stage, pipeline, paths) {
  return {
    task: {
      id: task.id,
      name: task.name,
      spec: task.spec || task.description || '',
    },
    stage: {
      name: stage.name,
      index: stage.index,
      total: stage.total,
    },
    pipeline: {
      name: pipeline.name,
    },
    status_file: paths.statusFile,
    log_dir: paths.logDir,
  };
}

module.exports = { resolveTemplate, buildTemplateContext };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/agent/template.test.js`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/agent/template.js runner/tests/agent/template.test.js
git commit -m "feat(runner): template engine for system prompt variables"
```

---

### Task 4: Stream Parser

**Files:**
- Create: `runner/src/agent/parser.js`
- Create: `runner/tests/agent/parser.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/agent/parser.test.js`:
```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { Readable } = require('stream');

describe('StreamParser', () => {
  let StreamParser;

  it('imports', () => {
    ({ StreamParser } = require('../../src/agent/parser'));
  });

  it('parses specd-status blocks', async () => {
    const input = `Some output text
\`\`\`specd-status
{
  "task_id": "001-auth",
  "stage": "implement",
  "progress": "writing middleware",
  "percent": 40,
  "files_touched": ["src/auth.ts"]
}
\`\`\`
More output text`;

    const stream = Readable.from([input]);
    const parser = new StreamParser(stream);
    const statuses = [];
    parser.on('status', (s) => statuses.push(s));
    await parser.start();
    assert.strictEqual(statuses.length, 1);
    assert.strictEqual(statuses[0].progress, 'writing middleware');
    assert.strictEqual(statuses[0].percent, 40);
  });

  it('parses specd-result blocks', async () => {
    const input = `Working on stuff...
\`\`\`specd-result
{
  "status": "success",
  "summary": "implemented auth",
  "files_changed": ["src/auth.ts"],
  "issues": [],
  "next_suggestions": []
}
\`\`\``;

    const stream = Readable.from([input]);
    const parser = new StreamParser(stream);
    let result = null;
    parser.on('result', (r) => { result = r; });
    await parser.start();
    assert.ok(result);
    assert.strictEqual(result.status, 'success');
    assert.strictEqual(result.summary, 'implemented auth');
  });

  it('emits output events for non-block lines', async () => {
    const input = 'line 1\nline 2\n';
    const stream = Readable.from([input]);
    const parser = new StreamParser(stream);
    const lines = [];
    parser.on('output', (line) => lines.push(line));
    await parser.start();
    assert.ok(lines.length >= 1);
  });

  it('handles multiple status blocks in one stream', async () => {
    const input = `start
\`\`\`specd-status
{"task_id":"x","stage":"a","progress":"step 1","percent":25,"files_touched":[]}
\`\`\`
middle
\`\`\`specd-status
{"task_id":"x","stage":"a","progress":"step 2","percent":75,"files_touched":["f.js"]}
\`\`\`
end`;

    const stream = Readable.from([input]);
    const parser = new StreamParser(stream);
    const statuses = [];
    parser.on('status', (s) => statuses.push(s));
    await parser.start();
    assert.strictEqual(statuses.length, 2);
    assert.strictEqual(statuses[0].percent, 25);
    assert.strictEqual(statuses[1].percent, 75);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/agent/parser.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the stream parser**

`runner/src/agent/parser.js`:
```js
// runner/src/agent/parser.js

const { EventEmitter } = require('events');
const readline = require('readline');

class StreamParser extends EventEmitter {
  constructor(stream) {
    super();
    this.stream = stream;
    this.buffer = [];
    this.insideBlock = null; // 'specd-status' | 'specd-result' | null
  }

  start() {
    return new Promise((resolve) => {
      const rl = readline.createInterface({ input: this.stream });

      rl.on('line', (line) => {
        const trimmed = line.trim();

        // Detect block start
        if (!this.insideBlock) {
          const match = trimmed.match(/^```(specd-status|specd-result)\s*$/);
          if (match) {
            this.insideBlock = match[1];
            this.buffer = [];
            return;
          }
          this.emit('output', line);
          return;
        }

        // Detect block end
        if (trimmed === '```') {
          const json = this.buffer.join('\n');
          try {
            const parsed = JSON.parse(json);
            if (this.insideBlock === 'specd-status') {
              this.emit('status', parsed);
            } else {
              this.emit('result', parsed);
            }
          } catch (e) {
            this.emit('error', new Error(`Failed to parse ${this.insideBlock} block: ${e.message}`));
          }
          this.insideBlock = null;
          this.buffer = [];
          return;
        }

        // Inside a block — accumulate
        this.buffer.push(line);
      });

      rl.on('close', () => {
        this.emit('end');
        resolve();
      });
    });
  }
}

module.exports = { StreamParser };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/agent/parser.test.js`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/agent/parser.js runner/tests/agent/parser.test.js
git commit -m "feat(runner): stream parser for specd-status and specd-result blocks"
```

---

### Task 5: State Manager

**Files:**
- Create: `runner/src/state/manager.js`
- Create: `runner/tests/state/manager.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/state/manager.test.js`:
```js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('StateManager', () => {
  let StateManager, tmpDir, statusPath;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-test-'));
    statusPath = path.join(tmpDir, 'status.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ StateManager } = require('../../src/state/manager'));
  });

  it('initializes with empty state', () => {
    const sm = new StateManager(statusPath);
    const state = sm.getState();
    assert.ok(state.started_at);
    assert.deepStrictEqual(state.tasks, {});
  });

  it('registers a task', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    const state = sm.getState();
    assert.strictEqual(state.tasks['001-auth'].name, 'Add auth');
    assert.strictEqual(state.tasks['001-auth'].status, 'queued');
  });

  it('updates task status', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.updateTaskStatus('001-auth', 'in_progress');
    assert.strictEqual(sm.getState().tasks['001-auth'].status, 'in_progress');
  });

  it('starts a stage', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.startStage('001-auth', { stage: 'plan', agent: 'claude' });
    const task = sm.getState().tasks['001-auth'];
    assert.strictEqual(task.current_stage, 'plan');
    assert.strictEqual(task.stages.length, 1);
    assert.strictEqual(task.stages[0].status, 'running');
  });

  it('updates live progress', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.startStage('001-auth', { stage: 'implement', agent: 'claude' });
    sm.updateLiveProgress('001-auth', {
      progress: 'writing middleware',
      percent: 40,
      files_touched: ['src/auth.ts'],
    });
    const stage = sm.getState().tasks['001-auth'].stages[0];
    assert.strictEqual(stage.live_progress.progress, 'writing middleware');
    assert.strictEqual(stage.live_progress.percent, 40);
    assert.ok(stage.last_output_at);
  });

  it('completes a stage', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.startStage('001-auth', { stage: 'plan', agent: 'claude' });
    sm.completeStage('001-auth', 'success', 'Created plan');
    const stage = sm.getState().tasks['001-auth'].stages[0];
    assert.strictEqual(stage.status, 'success');
    assert.strictEqual(stage.summary, 'Created plan');
    assert.ok(stage.duration >= 0);
  });

  it('persists to disk', () => {
    const sm = new StateManager(statusPath);
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.persist();
    const raw = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    assert.ok(raw.tasks['001-auth']);
  });

  it('emits events on state changes', () => {
    const sm = new StateManager(statusPath);
    const events = [];
    sm.on('change', (e) => events.push(e));
    sm.registerTask('001-auth', { name: 'Add auth', pipeline: 'default' });
    sm.updateTaskStatus('001-auth', 'in_progress');
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events[0].type, 'task_registered');
    assert.strictEqual(events[1].type, 'task_status_changed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/state/manager.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the state manager**

`runner/src/state/manager.js`:
```js
// runner/src/state/manager.js

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

class StateManager extends EventEmitter {
  constructor(statusPath) {
    super();
    this.statusPath = statusPath;
    this.state = {
      started_at: new Date().toISOString(),
      tasks: {},
    };
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
      stages: [],
    };
    this._emit('task_registered', { taskId, name });
  }

  updateTaskStatus(taskId, status) {
    this.state.tasks[taskId].status = status;
    this._emit('task_status_changed', { taskId, status });
  }

  startStage(taskId, { stage, agent }) {
    const now = new Date().toISOString();
    const task = this.state.tasks[taskId];
    task.current_stage = stage;
    task.stages.push({
      stage,
      agent: agent || null,
      status: 'running',
      started_at: now,
      last_output_at: now,
      live_progress: null,
      duration: null,
      summary: null,
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
      currentStage.live_progress = null;
    }
    this._emit('stage_completed', { taskId, stage: currentStage?.stage, status, summary });
  }

  getLastOutputTime(taskId) {
    const task = this.state.tasks[taskId];
    if (!task) return null;
    const currentStage = task.stages[task.stages.length - 1];
    return currentStage?.last_output_at ? new Date(currentStage.last_output_at) : null;
  }

  persist() {
    const dir = path.dirname(this.statusPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.statusPath, JSON.stringify(this.state, null, 2));
  }

  _emit(type, data) {
    this.emit('change', { type, ...data, timestamp: new Date().toISOString() });
  }
}

module.exports = { StateManager };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/state/manager.test.js`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/state/manager.js runner/tests/state/manager.test.js
git commit -m "feat(runner): state manager with status.json persistence and events"
```

---

### Task 6: Agent Runner

**Files:**
- Create: `runner/src/agent/runner.js`
- Create: `runner/tests/agent/runner.test.js`
- Create: `runner/tests/fixtures/mock-agent.js`

- [ ] **Step 1: Create the mock agent fixture**

This is a simple Node.js script that simulates a CLI agent outputting specd blocks:

`runner/tests/fixtures/mock-agent.js`:
```js
#!/usr/bin/env node
// Mock agent that reads prompt from args and emits specd blocks

const prompt = process.argv.slice(2).join(' ');

console.log(`Received prompt: ${prompt.substring(0, 50)}...`);
console.log('Working on it...');

// Emit a status update
console.log('```specd-status');
console.log(JSON.stringify({
  task_id: 'test',
  stage: 'test',
  progress: 'doing work',
  percent: 50,
  files_touched: ['test.js'],
}));
console.log('```');

console.log('Almost done...');

// Emit the result
console.log('```specd-result');
console.log(JSON.stringify({
  status: 'success',
  summary: 'did the work',
  files_changed: ['test.js'],
  issues: [],
  next_suggestions: [],
}));
console.log('```');
```

- [ ] **Step 2: Write the failing test**

`runner/tests/agent/runner.test.js`:
```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const mockAgentPath = path.join(__dirname, '..', 'fixtures', 'mock-agent.js');

describe('AgentRunner', () => {
  let AgentRunner;

  it('imports', () => {
    ({ AgentRunner } = require('../../src/agent/runner'));
  });

  it('runs a CLI agent and collects result', async () => {
    const agent = {
      cmd: `node ${mockAgentPath}`,
      prompt_flag: '',
      output_format: 'json_block',
    };

    const runner = new AgentRunner(agent);
    const statuses = [];
    const outputLines = [];

    runner.on('status', (s) => statuses.push(s));
    runner.on('output', (line) => outputLines.push(line));

    const result = await runner.run('test prompt');

    assert.strictEqual(result.status, 'success');
    assert.strictEqual(result.summary, 'did the work');
    assert.ok(statuses.length >= 1);
    assert.strictEqual(statuses[0].progress, 'doing work');
    assert.ok(outputLines.length >= 1);
  });

  it('returns failure when process exits non-zero', async () => {
    const agent = {
      cmd: 'node -e "process.exit(1)"',
      prompt_flag: '',
      output_format: 'json_block',
    };

    const runner = new AgentRunner(agent);
    const result = await runner.run('test');

    assert.strictEqual(result.status, 'failure');
  });

  it('respects timeout', async () => {
    const agent = {
      cmd: 'node -e "setTimeout(()=>{},60000)"',
      prompt_flag: '',
      output_format: 'json_block',
    };

    const runner = new AgentRunner(agent, { timeout: 500 });
    const result = await runner.run('test');

    assert.strictEqual(result.status, 'failure');
    assert.ok(result.summary.includes('timeout') || result.summary.includes('Timeout'));
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd runner && node --test tests/agent/runner.test.js`
Expected: FAIL — module not found

- [ ] **Step 4: Write the agent runner**

`runner/src/agent/runner.js`:
```js
// runner/src/agent/runner.js

const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { StreamParser } = require('./parser');

class AgentRunner extends EventEmitter {
  constructor(agentConfig, options = {}) {
    super();
    this.agentConfig = agentConfig;
    this.timeout = options.timeout || 3600000; // 1h default
    this.stuckTimeout = options.stuckTimeout || 1800000; // 30min default
    this.process = null;
    this.lastOutputTime = null;
    this.stuckTimer = null;
  }

  run(prompt) {
    return new Promise((resolve) => {
      const { cmd, prompt_flag } = this.agentConfig;
      const parts = cmd.split(/\s+/);
      const command = parts[0];
      const args = [...parts.slice(1)];

      if (prompt_flag) {
        args.push(prompt_flag, prompt);
      } else {
        args.push(prompt);
      }

      this.process = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });

      this.lastOutputTime = Date.now();
      let result = null;

      const parser = new StreamParser(this.process.stdout);

      parser.on('status', (status) => {
        this.lastOutputTime = Date.now();
        this._resetStuckTimer();
        this.emit('status', status);
      });

      parser.on('result', (r) => {
        this.lastOutputTime = Date.now();
        result = r;
        this.emit('result', r);
      });

      parser.on('output', (line) => {
        this.lastOutputTime = Date.now();
        this._resetStuckTimer();
        this.emit('output', line);
      });

      parser.on('error', (err) => {
        this.emit('error', err);
      });

      // Timeout timer
      const timeoutTimer = setTimeout(() => {
        this.kill();
        resolve({
          status: 'failure',
          summary: 'Timeout: stage exceeded time limit',
          files_changed: [],
          issues: ['Stage timed out'],
          next_suggestions: [],
        });
      }, this.timeout);

      // Stuck detection timer
      this._startStuckTimer(resolve);

      this.process.on('close', (code) => {
        clearTimeout(timeoutTimer);
        this._clearStuckTimer();

        if (result) {
          resolve(result);
        } else {
          resolve({
            status: code === 0 ? 'success' : 'failure',
            summary: code === 0
              ? 'Process exited successfully (no specd-result block)'
              : `Process exited with code ${code}`,
            files_changed: [],
            issues: code !== 0 ? [`Exit code: ${code}`] : [],
            next_suggestions: [],
          });
        }
      });

      parser.start();
    });
  }

  _startStuckTimer(resolve) {
    this.stuckTimer = setInterval(() => {
      const elapsed = Date.now() - this.lastOutputTime;
      if (elapsed >= this.stuckTimeout) {
        this._clearStuckTimer();
        this.kill();
        resolve({
          status: 'failure',
          summary: `Stuck: no output for ${Math.round(this.stuckTimeout / 1000)}s`,
          files_changed: [],
          issues: ['Agent appears stuck — no output'],
          next_suggestions: ['Check agent logs', 'Try reducing task complexity'],
        });
      }
    }, 5000);
  }

  _resetStuckTimer() {
    this.lastOutputTime = Date.now();
  }

  _clearStuckTimer() {
    if (this.stuckTimer) {
      clearInterval(this.stuckTimer);
      this.stuckTimer = null;
    }
  }

  kill() {
    if (this.process && !this.process.killed) {
      this.process.kill('SIGTERM');
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

module.exports = { AgentRunner };
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd runner && node --test tests/agent/runner.test.js`
Expected: All 3 tests PASS (timeout test may take ~0.5s)

- [ ] **Step 6: Commit**

```bash
git add runner/src/agent/runner.js runner/tests/agent/runner.test.js runner/tests/fixtures/mock-agent.js
git commit -m "feat(runner): agent runner with subprocess management and stuck detection"
```

---

### Task 7: Pipeline Resolver

**Files:**
- Create: `runner/src/pipeline/resolver.js`
- Create: `runner/tests/pipeline/resolver.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/pipeline/resolver.test.js`:
```js
const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('PipelineResolver', () => {
  let resolvePipeline;

  const pipelines = {
    default: {
      stages: [
        { stage: 'plan', agent: 'claude', critical: true },
        { stage: 'implement', agent: 'claude', critical: true },
        { stage: 'test', cmd: 'npm test', on_fail: 'retry', max_retries: 3 },
        { stage: 'review', agent: 'codex', on_fail: 'retry', max_retries: 2 },
      ],
    },
    'bug-fix': {
      stages: [
        { stage: 'investigate', agent: 'claude', critical: true },
        { stage: 'fix', agent: 'claude', critical: true },
      ],
    },
  };

  it('imports', () => {
    ({ resolvePipeline } = require('../../src/pipeline/resolver'));
  });

  it('resolves a named pipeline', () => {
    const result = resolvePipeline('default', pipelines, {});
    assert.strictEqual(result.stages.length, 4);
    assert.strictEqual(result.stages[0].stage, 'plan');
  });

  it('resolves a custom pipeline', () => {
    const result = resolvePipeline('bug-fix', pipelines, {});
    assert.strictEqual(result.stages.length, 2);
    assert.strictEqual(result.stages[0].stage, 'investigate');
  });

  it('throws on unknown pipeline', () => {
    assert.throws(() => resolvePipeline('nonexistent', pipelines, {}), /not found/);
  });

  it('applies stage_overrides', () => {
    const overrides = {
      test: { cmd: 'npm run test:custom', timeout: 7200 },
    };
    const result = resolvePipeline('default', pipelines, overrides);
    const testStage = result.stages.find(s => s.stage === 'test');
    assert.strictEqual(testStage.cmd, 'npm run test:custom');
    assert.strictEqual(testStage.timeout, 7200);
    // original fields preserved
    assert.strictEqual(testStage.on_fail, 'retry');
  });

  it('applies default timeout and failure_policy to stages', () => {
    const defaults = { timeout: 3600, failure_policy: 'skip' };
    const result = resolvePipeline('default', pipelines, {}, defaults);
    const planStage = result.stages.find(s => s.stage === 'plan');
    assert.strictEqual(planStage.timeout, 3600);
    // critical stages should not have failure_policy overridden
    assert.strictEqual(planStage.critical, true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/pipeline/resolver.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the pipeline resolver**

`runner/src/pipeline/resolver.js`:
```js
// runner/src/pipeline/resolver.js

function resolvePipeline(pipelineName, pipelines, stageOverrides = {}, defaults = {}) {
  const pipeline = pipelines[pipelineName];
  if (!pipeline) throw new Error(`Pipeline "${pipelineName}" not found`);

  const stages = pipeline.stages.map((stage) => {
    const resolved = { ...stage };

    // Apply defaults
    if (defaults.timeout && !resolved.timeout) {
      resolved.timeout = defaults.timeout;
    }
    if (defaults.failure_policy && !resolved.on_fail && !resolved.critical) {
      resolved.on_fail = defaults.failure_policy;
    }

    // Apply stage overrides
    const override = stageOverrides[stage.stage];
    if (override) {
      Object.assign(resolved, override);
    }

    return resolved;
  });

  return { name: pipelineName, stages };
}

module.exports = { resolvePipeline };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/pipeline/resolver.test.js`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/pipeline/resolver.js runner/tests/pipeline/resolver.test.js
git commit -m "feat(runner): pipeline resolver with stage overrides and defaults"
```

---

### Task 8: Stage Sequencer

**Files:**
- Create: `runner/src/pipeline/sequencer.js`
- Create: `runner/tests/pipeline/sequencer.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/pipeline/sequencer.test.js`:
```js
const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('StageSequencer', () => {
  let StageSequencer;

  // Minimal mock runner that resolves immediately
  function mockRunnerFactory(results) {
    let callIndex = 0;
    return () => ({
      run: async () => results[callIndex++] || { status: 'success', summary: 'ok', files_changed: [], issues: [], next_suggestions: [] },
      on: () => {},
      kill: () => {},
    });
  }

  // Minimal mock for cmd stages
  function mockCmdRunner(exitCode) {
    return {
      run: async () => ({
        status: exitCode === 0 ? 'success' : 'failure',
        summary: `exit ${exitCode}`,
        files_changed: [],
        issues: [],
        next_suggestions: [],
      }),
      on: () => {},
      kill: () => {},
    };
  }

  it('imports', () => {
    ({ StageSequencer } = require('../../src/pipeline/sequencer'));
  });

  it('runs all stages in order', async () => {
    const stages = [
      { stage: 'plan', agent: 'claude' },
      { stage: 'implement', agent: 'claude' },
    ];

    const stageLog = [];
    const seq = new StageSequencer({
      stages,
      createRunner: () => ({
        run: async () => { stageLog.push('ran'); return { status: 'success', summary: 'ok', files_changed: [], issues: [], next_suggestions: [] }; },
        on: () => {},
        kill: () => {},
      }),
      onStageStart: (s) => stageLog.push(`start:${s.stage}`),
      onStageComplete: (s) => stageLog.push(`complete:${s.stage}`),
      onProgress: () => {},
    });

    const result = await seq.run();
    assert.strictEqual(result.status, 'success');
    assert.deepStrictEqual(stageLog, ['start:plan', 'ran', 'complete:plan', 'start:implement', 'ran', 'complete:implement']);
  });

  it('retries on failure when configured', async () => {
    let attempt = 0;
    const stages = [
      { stage: 'test', agent: 'claude', on_fail: 'retry', max_retries: 2 },
    ];

    const seq = new StageSequencer({
      stages,
      createRunner: () => ({
        run: async () => {
          attempt++;
          if (attempt < 3) return { status: 'failure', summary: 'fail', files_changed: [], issues: [], next_suggestions: [] };
          return { status: 'success', summary: 'ok', files_changed: [], issues: [], next_suggestions: [] };
        },
        on: () => {},
        kill: () => {},
      }),
      onStageStart: () => {},
      onStageComplete: () => {},
      onProgress: () => {},
    });

    const result = await seq.run();
    assert.strictEqual(result.status, 'success');
    assert.strictEqual(attempt, 3); // 1 initial + 2 retries
  });

  it('stops on critical failure', async () => {
    const stages = [
      { stage: 'plan', agent: 'claude', critical: true },
      { stage: 'implement', agent: 'claude' },
    ];

    const ran = [];
    const seq = new StageSequencer({
      stages,
      createRunner: () => ({
        run: async () => { ran.push(1); return { status: 'failure', summary: 'fail', files_changed: [], issues: [], next_suggestions: [] }; },
        on: () => {},
        kill: () => {},
      }),
      onStageStart: () => {},
      onStageComplete: () => {},
      onProgress: () => {},
    });

    const result = await seq.run();
    assert.strictEqual(result.status, 'failure');
    assert.strictEqual(ran.length, 1); // only plan ran, implement skipped
  });

  it('skips non-critical failure when policy is skip', async () => {
    const stages = [
      { stage: 'lint', agent: 'claude', on_fail: 'skip' },
      { stage: 'implement', agent: 'claude' },
    ];

    const ran = [];
    const seq = new StageSequencer({
      stages,
      createRunner: (stage) => ({
        run: async () => {
          ran.push(stage.stage);
          if (stage.stage === 'lint') return { status: 'failure', summary: 'fail', files_changed: [], issues: [], next_suggestions: [] };
          return { status: 'success', summary: 'ok', files_changed: [], issues: [], next_suggestions: [] };
        },
        on: () => {},
        kill: () => {},
      }),
      onStageStart: () => {},
      onStageComplete: () => {},
      onProgress: () => {},
    });

    const result = await seq.run();
    assert.strictEqual(result.status, 'success');
    assert.deepStrictEqual(ran, ['lint', 'implement']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/pipeline/sequencer.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the stage sequencer**

`runner/src/pipeline/sequencer.js`:
```js
// runner/src/pipeline/sequencer.js

class StageSequencer {
  constructor({ stages, createRunner, onStageStart, onStageComplete, onProgress }) {
    this.stages = stages;
    this.createRunner = createRunner;
    this.onStageStart = onStageStart;
    this.onStageComplete = onStageComplete;
    this.onProgress = onProgress;
  }

  async run() {
    const results = [];

    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];
      const maxAttempts = 1 + (stage.max_retries || 0);
      let stageResult = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        this.onStageStart(stage, attempt);
        const runner = this.createRunner(stage);
        stageResult = await runner.run('');
        this.onStageComplete(stage, stageResult, attempt);

        if (stageResult.status === 'success') break;
        if (stage.on_fail !== 'retry') break;
      }

      results.push({ stage: stage.stage, result: stageResult });

      if (stageResult.status !== 'success') {
        if (stage.critical) {
          return {
            status: 'failure',
            failedStage: stage.stage,
            results,
          };
        }
        // Non-critical: skip policy — continue to next stage
      }
    }

    return { status: 'success', results };
  }
}

module.exports = { StageSequencer };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/pipeline/sequencer.test.js`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/pipeline/sequencer.js runner/tests/pipeline/sequencer.test.js
git commit -m "feat(runner): stage sequencer with retry logic and failure policies"
```

---

### Task 9: Task Watcher

**Files:**
- Create: `runner/src/state/watcher.js`
- Create: `runner/tests/state/watcher.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/state/watcher.test.js`:
```js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('TaskWatcher', () => {
  let TaskWatcher, tmpDir, tasksDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-watcher-'));
    tasksDir = path.join(tmpDir, 'tasks');
    fs.mkdirSync(tasksDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ TaskWatcher } = require('../../src/state/watcher'));
  });

  it('scans existing task files', async () => {
    fs.writeFileSync(path.join(tasksDir, '001-auth.yaml'), 'name: Auth\nstatus: ready\npriority: 1\n');
    const watcher = new TaskWatcher(tasksDir);
    const tasks = await watcher.scan();
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].id, '001-auth');
    assert.strictEqual(tasks[0].status, 'ready');
    watcher.close();
  });

  it('detects new task files', async () => {
    const watcher = new TaskWatcher(tasksDir);
    const added = [];
    watcher.on('task_added', (task) => added.push(task));
    await watcher.watch();

    // Small delay for chokidar to initialize
    await new Promise(r => setTimeout(r, 200));

    fs.writeFileSync(path.join(tasksDir, '002-billing.yaml'), 'name: Billing\nstatus: ready\npriority: 1\n');

    // Wait for event
    await new Promise(r => setTimeout(r, 500));
    watcher.close();

    assert.ok(added.length >= 1);
    assert.strictEqual(added[0].id, '002-billing');
  });

  it('detects task file changes', async () => {
    fs.writeFileSync(path.join(tasksDir, '001-auth.yaml'), 'name: Auth\nstatus: draft\npriority: 1\n');
    const watcher = new TaskWatcher(tasksDir);
    const changed = [];
    watcher.on('task_changed', (task) => changed.push(task));
    await watcher.watch();

    await new Promise(r => setTimeout(r, 200));

    fs.writeFileSync(path.join(tasksDir, '001-auth.yaml'), 'name: Auth\nstatus: ready\npriority: 1\n');

    await new Promise(r => setTimeout(r, 500));
    watcher.close();

    assert.ok(changed.length >= 1);
    assert.strictEqual(changed[changed.length - 1].status, 'ready');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/state/watcher.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the task watcher**

`runner/src/state/watcher.js`:
```js
// runner/src/state/watcher.js

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/state/watcher.test.js`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/state/watcher.js runner/tests/state/watcher.test.js
git commit -m "feat(runner): task watcher with chokidar file monitoring"
```

---

### Task 10: Worktree Manager (Parallel Isolation)

**Files:**
- Create: `runner/src/worktree/manager.js`
- Create: `runner/tests/worktree/manager.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/worktree/manager.test.js`:
```js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('WorktreeManager', () => {
  let WorktreeManager, repoDir;

  beforeEach(() => {
    // Create a temp git repo to test worktrees
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-wt-'));
    execSync('git init && git commit --allow-empty -m "init"', { cwd: repoDir });
  });

  afterEach(() => {
    // Clean up worktrees before removing the repo
    try {
      execSync('git worktree prune', { cwd: repoDir });
    } catch (e) { /* ignore */ }
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ WorktreeManager } = require('../../src/worktree/manager'));
  });

  it('creates a worktree for a task', async () => {
    const wm = new WorktreeManager(repoDir);
    const worktreePath = await wm.create('001-auth');

    assert.ok(fs.existsSync(worktreePath));
    assert.ok(worktreePath.includes('001-auth'));

    // Verify it's a valid git worktree
    const result = execSync('git rev-parse --is-inside-work-tree', { cwd: worktreePath }).toString().trim();
    assert.strictEqual(result, 'true');

    await wm.remove('001-auth');
  });

  it('removes a worktree for a task', async () => {
    const wm = new WorktreeManager(repoDir);
    const worktreePath = await wm.create('001-auth');
    assert.ok(fs.existsSync(worktreePath));

    await wm.remove('001-auth');
    // Path should be gone after remove
    assert.ok(!fs.existsSync(worktreePath));
  });

  it('returns the worktree path for a task', async () => {
    const wm = new WorktreeManager(repoDir);
    const created = await wm.create('002-billing');
    const got = wm.getPath('002-billing');
    assert.strictEqual(created, got);

    await wm.remove('002-billing');
  });

  it('lists active worktrees', async () => {
    const wm = new WorktreeManager(repoDir);
    await wm.create('001-auth');
    await wm.create('002-billing');

    const active = wm.listActive();
    assert.strictEqual(active.length, 2);
    assert.ok(active.includes('001-auth'));
    assert.ok(active.includes('002-billing'));

    await wm.remove('001-auth');
    await wm.remove('002-billing');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/worktree/manager.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the worktree manager**

`runner/src/worktree/manager.js`:
```js
// runner/src/worktree/manager.js

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class WorktreeManager {
  constructor(repoDir, worktreesDir) {
    this.repoDir = repoDir;
    this.worktreesDir = worktreesDir || path.join(repoDir, '.specd', 'runner', 'worktrees');
    this.active = new Map(); // taskId -> worktree path
  }

  async create(taskId) {
    const branchName = `specd/${taskId}`;
    const worktreePath = path.join(this.worktreesDir, taskId);

    // Create branch from current HEAD
    try {
      execSync(`git branch "${branchName}"`, { cwd: this.repoDir, stdio: 'pipe' });
    } catch (e) {
      // Branch might already exist — that's fine
      if (!e.stderr?.toString().includes('already exists')) throw e;
    }

    // Create worktree
    if (!fs.existsSync(this.worktreesDir)) {
      fs.mkdirSync(this.worktreesDir, { recursive: true });
    }

    execSync(`git worktree add "${worktreePath}" "${branchName}"`, {
      cwd: this.repoDir,
      stdio: 'pipe',
    });

    this.active.set(taskId, worktreePath);
    return worktreePath;
  }

  async remove(taskId) {
    const worktreePath = this.active.get(taskId);
    if (!worktreePath) return;

    try {
      execSync(`git worktree remove "${worktreePath}" --force`, {
        cwd: this.repoDir,
        stdio: 'pipe',
      });
    } catch (e) {
      // If worktree is already gone, clean up
      execSync('git worktree prune', { cwd: this.repoDir, stdio: 'pipe' });
    }

    // Clean up the branch
    const branchName = `specd/${taskId}`;
    try {
      execSync(`git branch -D "${branchName}"`, { cwd: this.repoDir, stdio: 'pipe' });
    } catch (e) { /* branch may have been merged/deleted */ }

    this.active.delete(taskId);
  }

  getPath(taskId) {
    return this.active.get(taskId) || null;
  }

  listActive() {
    return Array.from(this.active.keys());
  }
}

module.exports = { WorktreeManager };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/worktree/manager.test.js`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/worktree/manager.js runner/tests/worktree/manager.test.js
git commit -m "feat(runner): git worktree manager for parallel task isolation"
```

---

### Task 11: Orchestrator (Main Loop)

**Files:**
- Create: `runner/src/orchestrator.js`
- Create: `runner/tests/orchestrator.test.js`

- [ ] **Step 1: Write the failing test**

`runner/tests/orchestrator.test.js`:
```js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

describe('Orchestrator', () => {
  let Orchestrator, tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-orch-'));
    const tasksDir = path.join(tmpDir, 'tasks');
    fs.mkdirSync(tasksDir);

    // Write config files
    fs.writeFileSync(path.join(tmpDir, 'config.yaml'), yaml.dump({
      server: { port: 0 },
      notifications: { telegram: { enabled: false } },
      defaults: { pipeline: 'default', failure_policy: 'skip', timeout: 5, stuck_timeout: 5, max_parallel: 1 },
    }));

    const mockAgent = path.join(__dirname, 'fixtures', 'mock-agent.js');
    fs.writeFileSync(path.join(tmpDir, 'agents.yaml'), yaml.dump({
      agents: {
        'test-agent': {
          cmd: `node ${mockAgent}`,
          prompt_flag: '',
          output_format: 'json_block',
          system_prompt: 'You are testing {{task.name}}',
        },
      },
    }));

    fs.writeFileSync(path.join(tmpDir, 'pipelines.yaml'), yaml.dump({
      pipelines: {
        default: {
          stages: [{ stage: 'test-stage', agent: 'test-agent', critical: true }],
        },
      },
    }));

    fs.writeFileSync(path.join(tasksDir, '001-test.yaml'), yaml.dump({
      name: 'Test task',
      status: 'ready',
      priority: 1,
      description: 'A test',
      depends_on: [],
      pipeline: 'default',
    }));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('imports', () => {
    ({ Orchestrator } = require('../src/orchestrator'));
  });

  it('picks up a ready task and runs it', async () => {
    const orch = new Orchestrator(tmpDir);
    await orch.init();

    // Run one cycle (not the infinite loop)
    await orch.runOnce();

    const state = orch.stateManager.getState();
    const task = state.tasks['001-test'];
    assert.ok(task, 'Task should be registered');
    assert.strictEqual(task.status, 'done');
    assert.strictEqual(task.stages.length, 1);
    assert.strictEqual(task.stages[0].status, 'success');
  });

  it('respects depends_on ordering', async () => {
    // Add a second task that depends on the first
    fs.writeFileSync(path.join(tmpDir, 'tasks', '002-dependent.yaml'), yaml.dump({
      name: 'Dependent task',
      status: 'ready',
      priority: 1,
      description: 'Depends on 001',
      depends_on: ['001-test'],
      pipeline: 'default',
    }));

    const orch = new Orchestrator(tmpDir);
    await orch.init();

    // First cycle: should only run 001-test
    const picked = orch.pickNextTask();
    assert.strictEqual(picked.id, '001-test');
  });

  it('skips draft tasks', async () => {
    fs.writeFileSync(path.join(tmpDir, 'tasks', '001-test.yaml'), yaml.dump({
      name: 'Draft task',
      status: 'draft',
      priority: 1,
      description: 'Not ready',
      depends_on: [],
      pipeline: 'default',
    }));

    const orch = new Orchestrator(tmpDir);
    await orch.init();

    const picked = orch.pickNextTask();
    assert.strictEqual(picked, null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd runner && node --test tests/orchestrator.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the orchestrator**

`runner/src/orchestrator.js`:
```js
// runner/src/orchestrator.js

const path = require('path');
const fs = require('fs');
const { ConfigLoader } = require('./config/loader');
const { StateManager } = require('./state/manager');
const { TaskWatcher } = require('./state/watcher');
const { AgentRunner } = require('./agent/runner');
const { resolveTemplate, buildTemplateContext } = require('./agent/template');
const { resolvePipeline } = require('./pipeline/resolver');
const { StageSequencer } = require('./pipeline/sequencer');
const { WorktreeManager } = require('./worktree/manager');

class Orchestrator {
  constructor(configDir) {
    this.configDir = configDir;
    this.statusPath = path.join(configDir, 'status.json');
    this.tasksDir = path.join(configDir, 'tasks');
    this.logsDir = path.join(configDir, 'logs');

    this.config = null;
    this.agents = null;
    this.pipelines = null;
    this.tasks = [];
    this.stateManager = new StateManager(this.statusPath);
    this.taskWatcher = null;
    this.worktreeManager = null;
    this.running = false;
    this.completedTasks = new Set();
    this.runningTasks = new Set();  // track currently executing task IDs
  }

  async init() {
    const loader = new ConfigLoader(this.configDir);
    const all = await loader.loadAll();
    this.config = all.config;
    this.agents = all.agents;
    this.pipelines = all.pipelines;
    this.tasks = all.tasks;

    // Ensure logs dir exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    // Init worktree manager if parallel > 1
    const maxParallel = this.config.defaults.max_parallel || 1;
    if (maxParallel > 1) {
      // Find the git repo root (walk up from configDir)
      const repoRoot = this._findGitRoot();
      if (repoRoot) {
        this.worktreeManager = new WorktreeManager(repoRoot);
      }
    }
  }

  _findGitRoot() {
    let dir = this.configDir;
    while (dir !== path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, '.git'))) return dir;
      dir = path.dirname(dir);
    }
    return null;
  }

  pickNextTask() {
    const ready = this.tasks
      .filter(t => t.status === 'ready')
      .filter(t => !this.completedTasks.has(t.id))
      .filter(t => !this.runningTasks.has(t.id))
      .filter(t => {
        const deps = t.depends_on || [];
        return deps.every(dep => this.completedTasks.has(dep));
      })
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));

    return ready[0] || null;
  }

  pickNextTasks(count) {
    const tasks = [];
    const tempRunning = new Set(this.runningTasks);
    for (let i = 0; i < count; i++) {
      const ready = this.tasks
        .filter(t => t.status === 'ready')
        .filter(t => !this.completedTasks.has(t.id))
        .filter(t => !tempRunning.has(t.id))
        .filter(t => {
          const deps = t.depends_on || [];
          return deps.every(dep => this.completedTasks.has(dep));
        })
        .sort((a, b) => (a.priority || 99) - (b.priority || 99));
      if (ready[0]) {
        tasks.push(ready[0]);
        tempRunning.add(ready[0].id);
      }
    }
    return tasks;
  }

  async runTask(task) {
    const pipelineName = task.pipeline || this.config.defaults.pipeline;
    const pipeline = resolvePipeline(
      pipelineName,
      this.pipelines,
      task.stage_overrides || {},
      this.config.defaults
    );

    this.stateManager.registerTask(task.id, { name: task.name, pipeline: pipelineName });
    this.stateManager.updateTaskStatus(task.id, 'in_progress');
    this.stateManager.persist();

    // Read spec content
    let specContent = task.description || '';
    if (task.spec) {
      const specPath = path.resolve(path.dirname(this.configDir), task.spec);
      if (fs.existsSync(specPath)) {
        specContent = fs.readFileSync(specPath, 'utf8');
      }
    }

    const sequencer = new StageSequencer({
      stages: pipeline.stages,
      createRunner: (stage) => {
        const agentConfig = this.agents[stage.agent];
        if (!agentConfig && stage.cmd) {
          // Direct command stage
          return this._createCmdRunner(stage);
        }
        if (!agentConfig) {
          throw new Error(`Agent "${stage.agent}" not found in agents.yaml`);
        }

        const stageIndex = pipeline.stages.indexOf(stage) + 1;
        const templateContext = buildTemplateContext(
          { id: task.id, name: task.name, spec: specContent },
          { name: stage.stage, index: stageIndex, total: pipeline.stages.length },
          { name: pipelineName },
          { statusFile: this.statusPath, logDir: this.logsDir }
        );

        const systemPrompt = resolveTemplate(agentConfig.system_prompt || '', templateContext);
        const fullPrompt = `${systemPrompt}\n\n## Task Spec\n\n${specContent}\n\n## Result Contract\n\nWhen done, emit a specd-result block:\n\n\`\`\`specd-result\n{"status":"success|failure|needs_input","summary":"...","files_changed":[],"issues":[],"next_suggestions":[]}\n\`\`\``;

        const timeout = (stage.timeout || this.config.defaults.timeout) * 1000;
        const stuckTimeout = (stage.stuck_timeout || this.config.defaults.stuck_timeout) * 1000;

        const runner = new AgentRunner(agentConfig, { timeout, stuckTimeout });

        runner.on('status', (status) => {
          this.stateManager.updateLiveProgress(task.id, status);
          this.stateManager.persist();
        });

        runner.on('output', (line) => {
          this._appendLog(task.id, stage.stage, line);
        });

        // Wrap to pass prompt
        const origRun = runner.run.bind(runner);
        runner.run = () => origRun(fullPrompt);

        return runner;
      },
      onStageStart: (stage) => {
        this.stateManager.startStage(task.id, { stage: stage.stage, agent: stage.agent });
        this.stateManager.persist();
      },
      onStageComplete: (stage, result) => {
        this.stateManager.completeStage(task.id, result.status, result.summary);
        this.stateManager.persist();
      },
      onProgress: (stage, progress) => {
        this.stateManager.updateLiveProgress(task.id, progress);
        this.stateManager.persist();
      },
    });

    const result = await sequencer.run();

    const finalStatus = result.status === 'success' ? 'done' : 'failed';
    this.stateManager.updateTaskStatus(task.id, finalStatus);
    this.stateManager.persist();

    if (finalStatus === 'done') {
      this.completedTasks.add(task.id);
    }

    return result;
  }

  _createCmdRunner(stage) {
    const { spawn } = require('child_process');
    return {
      run: () => new Promise((resolve) => {
        const proc = spawn(stage.cmd, [], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        proc.stdout.on('data', (d) => { stdout += d.toString(); });
        proc.on('close', (code) => {
          resolve({
            status: code === 0 ? 'success' : 'failure',
            summary: code === 0 ? 'Command passed' : `Command failed (exit ${code})`,
            files_changed: [],
            issues: code !== 0 ? [stdout.slice(-500)] : [],
            next_suggestions: [],
          });
        });
      }),
      on: () => {},
      kill: () => {},
    };
  }

  _appendLog(taskId, stage, line) {
    const logFile = path.join(this.logsDir, `${taskId}-${stage}.log`);
    fs.appendFileSync(logFile, line + '\n');
  }

  async runOnce() {
    // Reload tasks from disk
    const loader = new ConfigLoader(this.configDir);
    this.tasks = await loader.loadTasks();

    const task = this.pickNextTask();
    if (!task) return null;
    return this.runTask(task);
  }

  async startLoop(interval = 5000) {
    this.running = true;
    const maxParallel = this.config.defaults.max_parallel || 1;
    this.taskWatcher = new TaskWatcher(this.tasksDir);

    this.taskWatcher.on('task_added', (task) => {
      console.log(`New task detected: ${task.name} (${task.id})`);
    });

    this.taskWatcher.on('task_changed', (task) => {
      console.log(`Task updated: ${task.name} (${task.id}) — status: ${task.status}`);
    });

    await this.taskWatcher.watch();

    while (this.running) {
      // Reload tasks
      const loader = new ConfigLoader(this.configDir);
      this.tasks = await loader.loadTasks();

      // How many slots are available?
      const available = maxParallel - this.runningTasks.size;
      if (available <= 0) {
        await new Promise(r => setTimeout(r, interval));
        continue;
      }

      // Pick tasks to fill available slots
      const tasks = this.pickNextTasks(available);
      if (tasks.length === 0) {
        await new Promise(r => setTimeout(r, interval));
        continue;
      }

      // Launch tasks in parallel
      const promises = tasks.map(async (task) => {
        this.runningTasks.add(task.id);

        // Create worktree if parallel mode
        let cwd = null;
        if (this.worktreeManager && maxParallel > 1) {
          try {
            cwd = await this.worktreeManager.create(task.id);
            console.log(`Worktree created for ${task.id}: ${cwd}`);
          } catch (e) {
            console.error(`Failed to create worktree for ${task.id}: ${e.message}`);
          }
        }

        try {
          await this.runTask(task, cwd);
        } finally {
          this.runningTasks.delete(task.id);
          // Clean up worktree
          if (this.worktreeManager && maxParallel > 1) {
            try {
              await this.worktreeManager.remove(task.id);
            } catch (e) {
              console.error(`Failed to remove worktree for ${task.id}: ${e.message}`);
            }
          }
        }
      });

      // Don't await all — let them run in background, check again for new slots
      Promise.allSettled(promises);
      await new Promise(r => setTimeout(r, interval));
    }
  }

  stop() {
    this.running = false;
    if (this.taskWatcher) this.taskWatcher.close();
  }
}

module.exports = { Orchestrator };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test tests/orchestrator.test.js`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/src/orchestrator.js runner/tests/orchestrator.test.js
git commit -m "feat(runner): orchestrator main loop with task picking and pipeline execution"
```

---

### Task 12: REST API + WebSocket Server

**Files:**
- Create: `runner/src/server/index.js`
- Create: `runner/src/server/api.js`
- Create: `runner/src/server/websocket.js`

- [ ] **Step 1: Write the WebSocket broadcaster**

`runner/src/server/websocket.js`:
```js
// runner/src/server/websocket.js

const { WebSocketServer } = require('ws');

class WsBroadcaster {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
    });
  }

  broadcast(event) {
    const data = JSON.stringify(event);
    for (const client of this.wss.clients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(data);
      }
    }
  }

  close() {
    this.wss.close();
  }
}

module.exports = { WsBroadcaster };
```

- [ ] **Step 2: Write the REST API routes**

`runner/src/server/api.js`:
```js
// runner/src/server/api.js

const express = require('express');
const fs = require('fs');
const path = require('path');

function createApiRouter(orchestrator) {
  const router = express.Router();

  router.get('/status', (req, res) => {
    res.json(orchestrator.stateManager.getState());
  });

  router.get('/tasks', (req, res) => {
    const state = orchestrator.stateManager.getState();
    const tasks = Object.entries(state.tasks).map(([id, task]) => ({
      id,
      ...task,
    }));
    res.json(tasks);
  });

  router.get('/tasks/:id/logs', (req, res) => {
    const taskId = req.params.id;
    const state = orchestrator.stateManager.getState();
    const task = state.tasks[taskId];

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const currentStage = task.current_stage;
    if (!currentStage) return res.json({ lines: [] });

    const logFile = path.join(orchestrator.logsDir, `${taskId}-${currentStage}.log`);
    if (!fs.existsSync(logFile)) return res.json({ lines: [] });

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(Boolean);

    // Support tail via query param
    const tail = parseInt(req.query.tail) || 100;
    res.json({ lines: lines.slice(-tail) });
  });

  router.post('/tasks/:id/retry', (req, res) => {
    const taskId = req.params.id;
    const state = orchestrator.stateManager.getState();
    const task = state.tasks[taskId];

    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'failed') return res.status(400).json({ error: 'Task is not failed' });

    // Reset the task in the YAML file
    const taskFile = path.join(orchestrator.tasksDir, `${taskId}.yaml`);
    if (fs.existsSync(taskFile)) {
      const yaml = require('js-yaml');
      const data = yaml.load(fs.readFileSync(taskFile, 'utf8'));
      data.status = 'ready';
      fs.writeFileSync(taskFile, yaml.dump(data));
    }

    // Remove from completed set so it can be picked up again
    orchestrator.completedTasks.delete(taskId);
    orchestrator.stateManager.updateTaskStatus(taskId, 'queued');
    orchestrator.stateManager.persist();

    res.json({ status: 'queued', message: `Task ${taskId} queued for retry` });
  });

  router.post('/tasks/:id/skip', (req, res) => {
    const taskId = req.params.id;
    const state = orchestrator.stateManager.getState();
    const task = state.tasks[taskId];

    if (!task) return res.status(404).json({ error: 'Task not found' });

    orchestrator.completedTasks.add(taskId);
    orchestrator.stateManager.updateTaskStatus(taskId, 'done');
    orchestrator.stateManager.persist();

    res.json({ status: 'skipped', message: `Task ${taskId} marked as done (skipped)` });
  });

  router.post('/tasks/:id/pause', (req, res) => {
    // Pause is a future feature — for now just acknowledge
    res.json({ status: 'acknowledged', message: 'Pause not yet implemented' });
  });

  return router;
}

module.exports = { createApiRouter };
```

- [ ] **Step 3: Write the server index**

`runner/src/server/index.js`:
```js
// runner/src/server/index.js

const express = require('express');
const http = require('http');
const path = require('path');
const { createApiRouter } = require('./api');
const { WsBroadcaster } = require('./websocket');

function createServer(orchestrator, port) {
  const app = express();
  app.use(express.json());

  // API routes
  app.use('/api', createApiRouter(orchestrator));

  // Serve dashboard static files
  const dashboardPath = path.join(__dirname, '..', '..', 'dashboard', 'dist');
  app.use(express.static(dashboardPath));

  // SPA fallback
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(dashboardPath, 'index.html'));
  });

  const server = http.createServer(app);
  const broadcaster = new WsBroadcaster(server);

  // Wire state changes to WebSocket
  orchestrator.stateManager.on('change', (event) => {
    broadcaster.broadcast(event);
  });

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
  };
}

module.exports = { createServer };
```

- [ ] **Step 4: Commit**

```bash
git add runner/src/server/
git commit -m "feat(runner): REST API, WebSocket broadcaster, and Express server"
```

---

### Task 13: Telegram Notifications

**Files:**
- Create: `runner/src/notifications/telegram.js`

- [ ] **Step 1: Write the Telegram notifier**

`runner/src/notifications/telegram.js`:
```js
// runner/src/notifications/telegram.js

const https = require('https');

class TelegramNotifier {
  constructor(config) {
    this.enabled = config?.enabled || false;
    this.botToken = config?.bot_token || '';
    this.chatId = config?.chat_id || '';
    this.notifyOn = new Set(config?.notify_on || []);
  }

  shouldNotify(eventType) {
    if (!this.enabled) return false;
    if (!this.botToken || !this.chatId) return false;
    return this.notifyOn.has(eventType);
  }

  async notify(eventType, message) {
    if (!this.shouldNotify(eventType)) return;

    const text = `🔧 *Specdacular Runner*\n\n${message}`;

    return this._sendMessage(text);
  }

  async onTaskComplete(taskId, taskName, summary) {
    await this.notify('task_complete',
      `✅ *Task Complete:* ${taskName}\n\n${summary}`);
  }

  async onTaskFailed(taskId, taskName, stage, error) {
    await this.notify('task_failed',
      `❌ *Task Failed:* ${taskName}\nStage: ${stage}\n\n${error}`);
  }

  async onStuck(taskId, taskName, stage) {
    await this.notify('task_failed',
      `⏳ *Task Stuck:* ${taskName}\nStage: ${stage}\nNo output for 30 minutes.`);
  }

  async onNeedsInput(taskId, taskName, stage, question) {
    await this.notify('needs_input',
      `🙋 *Input Needed:* ${taskName}\nStage: ${stage}\n\n${question}`);
  }

  _sendMessage(text) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: 'Markdown',
      });

      const options = {
        hostname: 'api.telegram.org',
        path: `/bot${this.botToken}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => { body += d; });
        res.on('end', () => resolve(JSON.parse(body)));
      });

      req.on('error', (e) => {
        console.error(`Telegram notification failed: ${e.message}`);
        resolve(null); // Don't throw — notifications are best-effort
      });

      req.write(data);
      req.end();
    });
  }
}

module.exports = { TelegramNotifier };
```

- [ ] **Step 2: Commit**

```bash
git add runner/src/notifications/telegram.js
git commit -m "feat(runner): Telegram notifications for task events"
```

---

### Task 14: Wire CLI to Orchestrator + Server

**Files:**
- Modify: `runner/src/cli.js`

- [ ] **Step 1: Update the CLI to wire everything together**

Replace `runner/src/cli.js` with:

```js
#!/usr/bin/env node
// runner/src/cli.js

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const { Orchestrator } = require('./orchestrator');
const { createServer } = require('./server/index');
const { TelegramNotifier } = require('./notifications/telegram');

const program = new Command();

program
  .name('specd-runner')
  .description('Config-driven autonomous agent orchestrator')
  .version('0.1.0');

program
  .command('start')
  .description('Start the orchestrator daemon')
  .option('-p, --port <port>', 'Dashboard port', '3700')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action(async (opts) => {
    const projectDir = path.resolve(opts.dir);
    const configDir = path.join(projectDir, '.specd', 'runner');

    if (!fs.existsSync(configDir)) {
      console.error(`Config directory not found: ${configDir}`);
      console.error('Run "specd-runner init" to create one, or ensure .specd/runner/ exists.');
      process.exit(1);
    }

    const port = parseInt(opts.port);

    try {
      const orchestrator = new Orchestrator(configDir);
      await orchestrator.init();

      // Set up Telegram notifications
      const telegram = new TelegramNotifier(orchestrator.config.notifications?.telegram);
      orchestrator.stateManager.on('change', (event) => {
        if (event.type === 'task_status_changed') {
          const state = orchestrator.stateManager.getState();
          const task = state.tasks[event.taskId];
          if (event.status === 'done') {
            telegram.onTaskComplete(event.taskId, task?.name, 'Task completed successfully');
          } else if (event.status === 'failed') {
            telegram.onTaskFailed(event.taskId, task?.name, task?.current_stage, 'Task failed');
          }
        }
      });

      // Start server
      const server = createServer(orchestrator, port);
      await server.start();

      console.log(`Orchestrator running. Watching ${configDir}/tasks/ for work.`);
      console.log('Press Ctrl+C to stop.\n');

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down...');
        orchestrator.stop();
        await server.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        orchestrator.stop();
        await server.stop();
        process.exit(0);
      });

      // Start the main loop
      await orchestrator.startLoop();
    } catch (err) {
      console.error(`Failed to start: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show current run status')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action(async (opts) => {
    const projectDir = path.resolve(opts.dir);
    const statusPath = path.join(projectDir, '.specd', 'runner', 'status.json');

    if (!fs.existsSync(statusPath)) {
      console.log('No active run found.');
      return;
    }

    const state = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    console.log(`Started: ${state.started_at}\n`);

    const tasks = Object.entries(state.tasks);
    if (tasks.length === 0) {
      console.log('No tasks registered.');
      return;
    }

    for (const [id, task] of tasks) {
      const statusIcon = { done: '✓', in_progress: '▸', failed: '✗', queued: '○' }[task.status] || '?';
      const progress = task.stages?.find(s => s.status === 'running')?.live_progress;
      const progressStr = progress ? ` — ${progress.progress} (${progress.percent}%)` : '';
      console.log(`  ${statusIcon} ${id}: ${task.name} [${task.status}]${progressStr}`);
    }
  });

program.parse();
```

- [ ] **Step 2: Verify CLI starts**

Run: `cd runner && node src/cli.js --help`
Expected: Shows help with start and status commands

- [ ] **Step 3: Commit**

```bash
git add runner/src/cli.js
git commit -m "feat(runner): wire CLI to orchestrator, server, and Telegram"
```

---

### Task 15: Dashboard — React App

**Files:**
- Create: `runner/dashboard/package.json`
- Create: `runner/dashboard/vite.config.js`
- Create: `runner/dashboard/index.html`
- Create: `runner/dashboard/src/main.jsx`
- Create: `runner/dashboard/src/App.jsx`
- Create: `runner/dashboard/src/components/TaskCard.jsx`
- Create: `runner/dashboard/src/components/StageTimeline.jsx`
- Create: `runner/dashboard/src/components/LogViewer.jsx`
- Create: `runner/dashboard/src/hooks/useWebSocket.js`

- [ ] **Step 1: Create dashboard/package.json**

```json
{
  "name": "@specdacular/dashboard",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

`runner/dashboard/vite.config.js`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3700',
      '/ws': { target: 'ws://localhost:3700', ws: true },
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 3: Create index.html**

`runner/dashboard/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Specdacular Runner</title>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen">
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 4: Create Tailwind config files**

`runner/dashboard/tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

`runner/dashboard/postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`runner/dashboard/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Create the WebSocket hook**

`runner/dashboard/src/hooks/useWebSocket.js`:
```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket() {
  const [status, setStatus] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  const fetchInitialStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  }, []);

  useEffect(() => {
    fetchInitialStatus();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3s
      setTimeout(() => fetchInitialStatus(), 3000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Refetch full status on any state change
      if (['task_registered', 'task_status_changed', 'stage_started',
           'stage_completed', 'live_progress'].includes(data.type)) {
        fetchInitialStatus();
      }
    };

    return () => ws.close();
  }, [fetchInitialStatus]);

  return { status, connected };
}
```

- [ ] **Step 6: Create StageTimeline component**

`runner/dashboard/src/components/StageTimeline.jsx`:
```jsx
const STATUS_STYLES = {
  success: { icon: '✓', color: 'text-green-400', bg: 'bg-green-400/10' },
  running: { icon: '▸', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  failure: { icon: '✗', color: 'text-red-400', bg: 'bg-red-400/10' },
  pending: { icon: '○', color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

export function StageTimeline({ stages }) {
  return (
    <div className="space-y-2 mt-3">
      {stages.map((stage, i) => {
        const style = STATUS_STYLES[stage.status] || STATUS_STYLES.pending;
        return (
          <div key={i} className={`flex items-start gap-3 px-3 py-2 rounded ${style.bg}`}>
            <span className={`${style.color} font-mono text-sm mt-0.5`}>{style.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{stage.stage}</span>
                <span className="text-xs text-gray-500">
                  {stage.agent && <span className="mr-2">{stage.agent}</span>}
                  {stage.duration != null && <span>{stage.duration}s</span>}
                </span>
              </div>
              {stage.summary && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{stage.summary}</p>
              )}
              {stage.live_progress && (
                <div className="mt-1">
                  <p className="text-xs text-yellow-300">{stage.live_progress.progress}</p>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${stage.live_progress.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7: Create LogViewer component**

`runner/dashboard/src/components/LogViewer.jsx`:
```jsx
import { useState, useEffect, useRef } from 'react';

export function LogViewer({ taskId }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    let interval;
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/logs?tail=200`);
        const data = await res.json();
        setLines(data.lines || []);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };

    fetchLogs();
    interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (loading) return <p className="text-gray-500 text-sm">Loading logs...</p>;
  if (lines.length === 0) return <p className="text-gray-500 text-sm">No logs yet.</p>;

  return (
    <div className="bg-gray-900 rounded p-3 mt-3 max-h-64 overflow-y-auto font-mono text-xs">
      {lines.map((line, i) => (
        <div key={i} className="text-gray-300 whitespace-pre-wrap">{line}</div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 8: Create TaskCard component**

`runner/dashboard/src/components/TaskCard.jsx`:
```jsx
import { useState } from 'react';
import { StageTimeline } from './StageTimeline';
import { LogViewer } from './LogViewer';

const STATUS_COLORS = {
  done: 'border-green-500/30 bg-green-500/5',
  in_progress: 'border-yellow-500/30 bg-yellow-500/5',
  failed: 'border-red-500/30 bg-red-500/5',
  queued: 'border-gray-600/30 bg-gray-600/5',
};

const STATUS_BADGES = {
  done: { text: 'Done', class: 'bg-green-500/20 text-green-400' },
  in_progress: { text: 'Running', class: 'bg-yellow-500/20 text-yellow-400' },
  failed: { text: 'Failed', class: 'bg-red-500/20 text-red-400' },
  queued: { text: 'Queued', class: 'bg-gray-500/20 text-gray-400' },
};

export function TaskCard({ id, task }) {
  const [expanded, setExpanded] = useState(task.status === 'in_progress');
  const [showLogs, setShowLogs] = useState(false);

  const color = STATUS_COLORS[task.status] || STATUS_COLORS.queued;
  const badge = STATUS_BADGES[task.status] || STATUS_BADGES.queued;

  const handleAction = async (action) => {
    await fetch(`/api/tasks/${id}/${action}`, { method: 'POST' });
  };

  return (
    <div className={`border rounded-lg p-4 ${color} transition-all`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-500 font-mono text-xs">{id}</span>
          <h3 className="font-medium">{task.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${badge.class}`}>
            {badge.text}
          </span>
          <span className="text-gray-500">{expanded ? '▾' : '▸'}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
          {task.stages && task.stages.length > 0 && (
            <StageTimeline stages={task.stages} />
          )}

          <div className="flex gap-2 mt-3">
            {task.status === 'failed' && (
              <button
                onClick={() => handleAction('retry')}
                className="text-xs px-3 py-1 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
              >
                Retry
              </button>
            )}
            {(task.status === 'failed' || task.status === 'in_progress') && (
              <button
                onClick={() => handleAction('skip')}
                className="text-xs px-3 py-1 rounded bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
              >
                Skip
              </button>
            )}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs px-3 py-1 rounded bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
            >
              {showLogs ? 'Hide Logs' : 'Show Logs'}
            </button>
          </div>

          {showLogs && <LogViewer taskId={id} />}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 9: Create App.jsx and main.jsx**

`runner/dashboard/src/App.jsx`:
```jsx
import { useWebSocket } from './hooks/useWebSocket';
import { TaskCard } from './components/TaskCard';

export default function App() {
  const { status, connected } = useWebSocket();

  const tasks = status?.tasks ? Object.entries(status.tasks) : [];

  // Sort: in_progress first, then queued, then failed, then done
  const sortOrder = { in_progress: 0, queued: 1, failed: 2, done: 3 };
  tasks.sort((a, b) => (sortOrder[a[1].status] ?? 4) - (sortOrder[b[1].status] ?? 4));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Specdacular Runner</h1>
          {status?.started_at && (
            <p className="text-sm text-gray-500 mt-1">
              Started {new Date(status.started_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-500">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No tasks yet</p>
          <p className="text-sm mt-2">Add YAML files to .specd/runner/tasks/ to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(([id, task]) => (
            <TaskCard key={id} id={id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
```

`runner/dashboard/src/main.jsx`:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 10: Install dashboard dependencies and build**

Run: `cd runner/dashboard && npm install && npm run build`
Expected: `dist/` created with built files

- [ ] **Step 11: Commit**

```bash
git add runner/dashboard/
git commit -m "feat(runner): React dashboard with task cards, stage timeline, and live logs"
```

---

### Task 16: Integration Test with Mock Agent

**Files:**
- Modify: `runner/tests/fixtures/mock-agent.js` (already created)
- Create: `runner/tests/integration.test.js`

- [ ] **Step 1: Write the integration test**

`runner/tests/integration.test.js`:
```js
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');
const http = require('http');

describe('Integration: full orchestrator run', () => {
  let tmpDir, Orchestrator, createServer;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specd-integ-'));
    const tasksDir = path.join(tmpDir, 'tasks');
    fs.mkdirSync(tasksDir);

    const mockAgent = path.join(__dirname, 'fixtures', 'mock-agent.js');

    fs.writeFileSync(path.join(tmpDir, 'config.yaml'), yaml.dump({
      server: { port: 0 },
      notifications: { telegram: { enabled: false } },
      defaults: { pipeline: 'default', failure_policy: 'skip', timeout: 30, stuck_timeout: 30 },
    }));

    fs.writeFileSync(path.join(tmpDir, 'agents.yaml'), yaml.dump({
      agents: {
        'mock-agent': {
          cmd: `node ${mockAgent}`,
          prompt_flag: '',
          output_format: 'json_block',
          system_prompt: 'Testing {{task.name}}',
        },
      },
    }));

    fs.writeFileSync(path.join(tmpDir, 'pipelines.yaml'), yaml.dump({
      pipelines: {
        default: {
          stages: [
            { stage: 'plan', agent: 'mock-agent', critical: true },
            { stage: 'implement', agent: 'mock-agent', critical: true },
          ],
        },
      },
    }));

    fs.writeFileSync(path.join(tasksDir, '001-feature.yaml'), yaml.dump({
      name: 'Test feature',
      status: 'ready',
      priority: 1,
      description: 'Build something',
      depends_on: [],
      pipeline: 'default',
    }));

    ({ Orchestrator } = require('../src/orchestrator'));
    ({ createServer } = require('../src/server/index'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('runs a task through the full pipeline and updates status.json', async () => {
    const orch = new Orchestrator(tmpDir);
    await orch.init();
    await orch.runOnce();

    // Verify status.json was written
    const statusPath = path.join(tmpDir, 'status.json');
    assert.ok(fs.existsSync(statusPath));

    const state = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    const task = state.tasks['001-feature'];

    assert.ok(task);
    assert.strictEqual(task.status, 'done');
    assert.strictEqual(task.stages.length, 2);
    assert.strictEqual(task.stages[0].stage, 'plan');
    assert.strictEqual(task.stages[0].status, 'success');
    assert.strictEqual(task.stages[1].stage, 'implement');
    assert.strictEqual(task.stages[1].status, 'success');
  });

  it('serves status via the REST API', async () => {
    const orch = new Orchestrator(tmpDir);
    await orch.init();
    await orch.runOnce();

    const server = createServer(orch, 0);
    const httpServer = await server.start();
    const port = httpServer.address().port;

    const res = await fetch(`http://localhost:${port}/api/status`);
    const data = await res.json();

    assert.ok(data.tasks['001-feature']);
    assert.strictEqual(data.tasks['001-feature'].status, 'done');

    await server.stop();
  });

  it('logs are written to disk', async () => {
    const orch = new Orchestrator(tmpDir);
    await orch.init();
    await orch.runOnce();

    const logsDir = path.join(tmpDir, 'logs');
    assert.ok(fs.existsSync(logsDir));

    const logFiles = fs.readdirSync(logsDir);
    assert.ok(logFiles.length > 0);
  });
});
```

- [ ] **Step 2: Run the integration test**

Run: `cd runner && node --test tests/integration.test.js`
Expected: All 3 tests PASS

- [ ] **Step 3: Run the full test suite**

Run: `cd runner && node --test`
Expected: All tests PASS across all test files

- [ ] **Step 4: Commit**

```bash
git add runner/tests/integration.test.js
git commit -m "test(runner): integration test with mock agent through full pipeline"
```

---

### Task 17: Make mock-agent executable and add npm test script

**Files:**
- Modify: `runner/tests/fixtures/mock-agent.js`
- Modify: `runner/package.json`

- [ ] **Step 1: Make mock-agent executable**

Run: `chmod +x runner/tests/fixtures/mock-agent.js`

- [ ] **Step 2: Run full suite to confirm everything works end-to-end**

Run: `cd runner && npm test`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add runner/
git commit -m "feat(runner): MVP complete — orchestrator, dashboard, API, notifications"
```
