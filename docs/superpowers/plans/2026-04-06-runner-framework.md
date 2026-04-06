# Runner Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Specd Runner from a monolithic Electron app into a config-driven workflow engine with clean separation between engine core, built-in actions, and UI.

**Architecture:** Three-layer split: (1) Engine core handles task queue, pipeline sequencing, agent spawning, state persistence, and API server — no Electron dependency. (2) Built-in actions (git-worktree, git-commit, git-pr, notify) are optional modules referenced in pipeline config. (3) UI connects to engine via REST API + WebSocket, renders any pipeline config automatically.

**Tech Stack:** Node.js (ES modules), node:test, Express, ws, Electron (UI shell only)

**Spec:** `docs/superpowers/specs/2026-04-06-runner-framework-design.md`

---

## File Structure

### Engine core (`runner/main/engine/`)
- `runner/main/engine/index.js` — Engine class: boots orchestrators, starts API server, manages lifecycle
- `runner/main/engine/orchestrator.js` — Refactored orchestrator: task queue loop, pipeline dispatch, no git/PR logic
- `runner/main/engine/pipeline/sequencer.js` — Pipeline stage sequencer with snowball context
- `runner/main/engine/pipeline/resolver.js` — Resolve pipeline config + apply defaults
- `runner/main/engine/agent/runner.js` — Generic agent process spawner
- `runner/main/engine/agent/parser.js` — Stream parsers (stream_json, jsonl, plain)
- `runner/main/engine/agent/template.js` — Template variable resolution with snowball context
- `runner/main/engine/state/manager.js` — State persistence + event emission
- `runner/main/engine/context.js` — ExecutionContext class (the snowball)
- `runner/main/engine/progress/journal-watcher.js` — Watch `.specd/journal.json` for agent progress
- `runner/main/engine/progress/inference.js` — Infer progress from git/filesystem when journal is silent
- `runner/main/engine/actions/registry.js` — Action registry: load built-in + custom actions
- `runner/main/engine/actions/git-worktree.js` — Built-in: create/manage worktrees
- `runner/main/engine/actions/git-commit.js` — Built-in: commit after stage
- `runner/main/engine/actions/git-pr.js` — Built-in: create/update draft PRs
- `runner/main/engine/actions/notify.js` — Built-in: webhook/telegram notifications

### Server (`runner/main/server/`)
- `runner/main/server/index.js` — Express + WebSocket server (keep, minor updates)
- `runner/main/server/api.js` — REST routes (update for new API shape: global pipelines/agents endpoints)
- `runner/main/server/websocket.js` — WebSocket broadcaster (keep as-is)

### Shared (`runner/main/`)
- `runner/main/paths.js` — Update: remove per-project agent/pipeline overrides
- `runner/main/db.js` — Update: folder-name-based project IDs with `-2` suffix on collision
- `runner/main/bootstrap.js` — Update: new default agents/pipelines
- `runner/main/template-manager.js` — Simplify: global templates only, no per-project overrides
- `runner/main/logger.js` — Keep as-is
- `runner/main/index.js` — Electron entry: thin shell that creates Engine + BrowserWindow

### IPC (`runner/main/ipc.js`)
- Update to delegate to Engine instead of directly to orchestrators

### Tests (`runner/main/test/`)
- `runner/main/test/context.test.js` — ExecutionContext snowball tests
- `runner/main/test/agent-parser.test.js` — Update for new parser formats
- `runner/main/test/template.test.js` — Template resolution with snowball context
- `runner/main/test/sequencer.test.js` — Pipeline sequencer with context accumulation
- `runner/main/test/action-registry.test.js` — Action loading and execution
- `runner/main/test/db.test.js` — Folder-name-based project ID tests
- `runner/main/test/journal-watcher.test.js` — Journal file watching tests
- `runner/main/test/orchestrator.test.js` — Refactored orchestrator tests

---

## Task 1: ExecutionContext (The Snowball)

The foundation everything else builds on. A class that accumulates data across pipeline stages and provides template variable access.

**Files:**
- Create: `runner/main/engine/context.js`
- Create: `runner/main/test/context.test.js`

- [ ] **Step 1: Write failing tests for ExecutionContext**

```javascript
// runner/main/test/context.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { ExecutionContext } from '../engine/context.js';

describe('ExecutionContext', () => {
  it('initializes with task and pipeline info', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test', description: 'A test task' },
      pipeline: { name: 'default', total_stages: 3 },
    });
    a.equal(ctx.task.id, 'idea-abc');
    a.equal(ctx.pipeline.name, 'default');
    a.deepEqual(ctx.stages, {});
  });

  it('records stage start', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test' },
      pipeline: { name: 'default', total_stages: 2 },
    });
    ctx.startStage('plan', 'claude-planner');
    a.equal(ctx.stages.plan.status, 'running');
    a.equal(ctx.stages.plan.agent, 'claude-planner');
    a.ok(ctx.stages.plan.started_at);
  });

  it('records stage completion with output and decisions', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test' },
      pipeline: { name: 'default', total_stages: 2 },
    });
    ctx.startStage('plan', 'claude-planner');
    ctx.completeStage('plan', {
      status: 'success',
      output: 'The plan is ready',
      decisions: [{ decision: 'Use OAuth2', reason: 'Security' }],
      artifacts: ['plan.md'],
    });
    a.equal(ctx.stages.plan.status, 'success');
    a.equal(ctx.stages.plan.output, 'The plan is ready');
    a.equal(ctx.stages.plan.decisions.length, 1);
    a.equal(ctx.stages.plan.artifacts[0], 'plan.md');
    a.ok(ctx.stages.plan.duration >= 0);
  });

  it('provides all_previous_output as concatenation', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test' },
      pipeline: { name: 'default', total_stages: 3 },
    });
    ctx.startStage('gather', 'claude-researcher');
    ctx.completeStage('gather', { status: 'success', output: 'Found data' });
    ctx.startStage('analyze', 'claude-analyst');
    ctx.completeStage('analyze', { status: 'success', output: 'Analyzed data' });

    a.equal(ctx.allPreviousOutput(), 'Found data\n\nAnalyzed data');
  });

  it('serializes to JSON and restores', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test' },
      pipeline: { name: 'default', total_stages: 1 },
    });
    ctx.startStage('plan', 'claude-planner');
    ctx.completeStage('plan', { status: 'success', output: 'Done' });

    const json = ctx.toJSON();
    const restored = ExecutionContext.fromJSON(json);
    a.equal(restored.stages.plan.output, 'Done');
    a.equal(restored.task.id, 'idea-abc');
  });

  it('provides template variables for resolution', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test', description: 'A test' },
      pipeline: { name: 'default', total_stages: 2 },
    });
    ctx.startStage('gather', 'claude-researcher');
    ctx.completeStage('gather', { status: 'success', output: 'Research done' });

    const vars = ctx.templateVars({ name: 'analyze', index: 2, total: 2 });
    a.equal(vars.task.name, 'Test');
    a.equal(vars.stages.gather.output, 'Research done');
    a.equal(vars.stage.name, 'analyze');
    a.equal(vars.all_previous_output, 'Research done');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd runner && node --test main/test/context.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ExecutionContext**

```javascript
// runner/main/engine/context.js
export class ExecutionContext {
  constructor({ task, pipeline }) {
    this.task = { ...task };
    this.pipeline = { ...pipeline };
    this.stages = {};
    this.git = {};
  }

  startStage(stageName, agentName) {
    this.stages[stageName] = {
      status: 'running',
      agent: agentName,
      started_at: new Date().toISOString(),
      output: '',
      decisions: [],
      artifacts: [],
      journal: [],
      duration: null,
    };
  }

  completeStage(stageName, { status, output, decisions, artifacts }) {
    const stage = this.stages[stageName];
    if (!stage) return;
    stage.status = status;
    stage.output = output || '';
    stage.decisions = decisions || [];
    stage.artifacts = artifacts || [];
    const started = new Date(stage.started_at);
    stage.duration = Math.round((Date.now() - started.getTime()) / 1000);
  }

  updateJournal(stageName, entry) {
    const stage = this.stages[stageName];
    if (!stage) return;
    stage.journal.push(entry);
  }

  allPreviousOutput() {
    return Object.values(this.stages)
      .filter(s => s.status === 'success' && s.output)
      .map(s => s.output)
      .join('\n\n');
  }

  completedStages() {
    return Object.entries(this.stages)
      .filter(([, s]) => s.status === 'success')
      .map(([name, s]) => ({ stage: name, summary: s.output, status: s.status }));
  }

  templateVars(currentStage) {
    return {
      task: this.task,
      pipeline: this.pipeline,
      stages: this.stages,
      stage: currentStage || {},
      all_previous_output: this.allPreviousOutput(),
      git: this.git,
    };
  }

  toJSON() {
    return {
      task: this.task,
      pipeline: this.pipeline,
      stages: this.stages,
      git: this.git,
    };
  }

  static fromJSON(data) {
    const ctx = new ExecutionContext({
      task: data.task,
      pipeline: data.pipeline,
    });
    ctx.stages = data.stages || {};
    ctx.git = data.git || {};
    return ctx;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test main/test/context.test.js`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/main/engine/context.js runner/main/test/context.test.js
git commit -m "feat(runner): add ExecutionContext (snowball) class"
```

---

## Task 2: Update Template Resolution for Snowball Context

The current `template.js` has a limited `buildTemplateContext` that doesn't use the snowball. Update it to work with `ExecutionContext.templateVars()`.

**Files:**
- Modify: `runner/main/agent/template.js`
- Modify: `runner/main/test/agent-parser.test.js` (rename to `runner/main/test/template.test.js` for clarity)
- Create: `runner/main/test/template.test.js`

- [ ] **Step 1: Write failing tests for updated template resolution**

```javascript
// runner/main/test/template.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { resolveTemplate } from '../agent/template.js';

describe('resolveTemplate', () => {
  it('resolves simple variables', () => {
    const result = resolveTemplate('Hello {{name}}', { name: 'World' });
    a.equal(result, 'Hello World');
  });

  it('resolves nested variables', () => {
    const result = resolveTemplate('Task: {{task.name}}', { task: { name: 'Build thing' } });
    a.equal(result, 'Task: Build thing');
  });

  it('resolves stage output from snowball', () => {
    const vars = {
      stages: { gather: { output: 'Found 5 patterns' } },
    };
    const result = resolveTemplate('Previous: {{stages.gather.output}}', vars);
    a.equal(result, 'Previous: Found 5 patterns');
  });

  it('resolves all_previous_output', () => {
    const vars = { all_previous_output: 'stage1 output\n\nstage2 output' };
    const result = resolveTemplate('Context:\n{{all_previous_output}}', vars);
    a.equal(result, 'Context:\nstage1 output\n\nstage2 output');
  });

  it('preserves unresolved variables', () => {
    const result = resolveTemplate('{{known}} and {{unknown}}', { known: 'yes' });
    a.equal(result, 'yes and {{unknown}}');
  });

  it('handles undefined nested paths gracefully', () => {
    const result = resolveTemplate('{{stages.missing.output}}', { stages: {} });
    a.equal(result, '{{stages.missing.output}}');
  });
});
```

- [ ] **Step 2: Run tests to verify they pass (resolveTemplate already works)**

Run: `cd runner && node --test main/test/template.test.js`
Expected: All 6 tests PASS — `resolveTemplate` already handles nested paths. This confirms the existing implementation is compatible with snowball context.

- [ ] **Step 3: Commit**

```bash
git add runner/main/test/template.test.js
git commit -m "test(runner): add template resolution tests for snowball context"
```

---

## Task 3: Update Stream Parser for Multiple Output Formats

The current parser only handles `specd-status`/`specd-result` blocks. Add `jsonl` and `plain` format support.

**Files:**
- Modify: `runner/main/agent/parser.js`
- Modify: `runner/main/test/agent-parser.test.js`

- [ ] **Step 1: Write failing tests for new parsers**

```javascript
// Add to runner/main/test/agent-parser.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { StreamParser, JsonlParser, PlainParser } from '../agent/parser.js';

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

describe('JsonlParser', () => {
  it('parses status objects', () => {
    const parser = new JsonlParser();
    const statuses = [];
    parser.on('status', (s) => statuses.push(s));

    parser.feed('{"type":"status","progress":"Working","percent":50}');

    a.equal(statuses.length, 1);
    a.equal(statuses[0].progress, 'Working');
  });

  it('parses result objects', () => {
    const parser = new JsonlParser();
    const results = [];
    parser.on('result', (r) => results.push(r));

    parser.feed('{"type":"result","status":"success","summary":"Done"}');

    a.equal(results.length, 1);
    a.equal(results[0].status, 'success');
  });

  it('emits output for non-JSON lines', () => {
    const parser = new JsonlParser();
    const lines = [];
    parser.on('output', (l) => lines.push(l));

    parser.feed('not json');

    a.equal(lines.length, 1);
  });
});

describe('PlainParser', () => {
  it('emits all lines as output', () => {
    const parser = new PlainParser();
    const lines = [];
    parser.on('output', (l) => lines.push(l));

    parser.feed('line 1');
    parser.feed('line 2');

    a.equal(lines.length, 2);
  });
});
```

- [ ] **Step 2: Run tests to verify new tests fail**

Run: `cd runner && node --test main/test/agent-parser.test.js`
Expected: FAIL — `JsonlParser` and `PlainParser` not found

- [ ] **Step 3: Implement JsonlParser and PlainParser**

```javascript
// runner/main/agent/parser.js — add after existing StreamParser class
export class JsonlParser extends EventEmitter {
  feed(line) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'status') {
        this.emit('status', obj);
      } else if (obj.type === 'result') {
        this.emit('result', obj);
      } else {
        this.emit('output', line);
      }
    } catch {
      this.emit('output', line);
    }
  }
}

export class PlainParser extends EventEmitter {
  feed(line) {
    this.emit('output', line);
  }
}
```

Add `import { EventEmitter } from 'events';` at the top if not already there (it is — `StreamParser` already extends it). Make `JsonlParser` and `PlainParser` extend `EventEmitter`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test main/test/agent-parser.test.js`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/main/agent/parser.js runner/main/test/agent-parser.test.js
git commit -m "feat(runner): add jsonl and plain output format parsers"
```

---

## Task 4: Update ProjectDB for Folder-Name-Based IDs

Change project IDs from random UUIDs to folder name with `-2`, `-3` suffix on collision.

**Files:**
- Modify: `runner/main/db.js`
- Modify: `runner/main/test/db.test.js` (or create if the existing one is stale)

- [ ] **Step 1: Write failing tests**

```javascript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd runner && node --test main/test/db.test.js`
Expected: FAIL — first test expects `id === 'myproject'` but gets a UUID

- [ ] **Step 3: Update ProjectDB.register to use folder-name IDs**

```javascript
// runner/main/db.js
import { readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';

export class ProjectDB {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.data = JSON.parse(readFileSync(dbPath, 'utf-8'));
  }

  register(name, folderPath) {
    const baseName = basename(folderPath);
    const id = this._uniqueId(baseName);

    const project = {
      id,
      name,
      path: folderPath,
      active: true,
      registeredAt: new Date().toISOString(),
    };
    this.data.projects.push(project);
    this._save();
    return project;
  }

  _uniqueId(baseName) {
    const existingIds = new Set(this.data.projects.map(p => p.id));
    if (!existingIds.has(baseName)) return baseName;
    let suffix = 2;
    while (existingIds.has(`${baseName}-${suffix}`)) suffix++;
    return `${baseName}-${suffix}`;
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

Run: `cd runner && node --test main/test/db.test.js`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/main/db.js runner/main/test/db.test.js
git commit -m "feat(runner): folder-name-based project IDs with collision suffix"
```

---

## Task 5: Action Registry and Built-in Actions

Create the action system: a registry that loads built-in and custom actions, and the git-worktree, git-commit, git-pr actions extracted from the current orchestrator/worktree code.

**Files:**
- Create: `runner/main/engine/actions/registry.js`
- Create: `runner/main/engine/actions/git-worktree.js`
- Create: `runner/main/engine/actions/git-commit.js`
- Create: `runner/main/engine/actions/git-pr.js`
- Create: `runner/main/engine/actions/notify.js`
- Create: `runner/main/test/action-registry.test.js`

- [ ] **Step 1: Write failing tests for ActionRegistry**

```javascript
// runner/main/test/action-registry.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { ActionRegistry } from '../engine/actions/registry.js';

describe('ActionRegistry', () => {
  it('registers and retrieves a built-in action', () => {
    const registry = new ActionRegistry();
    const mockAction = { name: 'test', execute: async () => {} };
    registry.register('test', mockAction);
    a.equal(registry.get('test'), mockAction);
  });

  it('returns null for unknown action', () => {
    const registry = new ActionRegistry();
    a.equal(registry.get('nonexistent'), null);
  });

  it('runs an action with context', async () => {
    const registry = new ActionRegistry();
    let received = null;
    registry.register('test', {
      name: 'test',
      execute: async (ctx) => { received = ctx; },
    });
    await registry.run('test', { task: { id: 'abc' } });
    a.equal(received.task.id, 'abc');
  });

  it('runs a list of actions in order', async () => {
    const registry = new ActionRegistry();
    const order = [];
    registry.register('first', {
      name: 'first',
      execute: async () => { order.push('first'); },
    });
    registry.register('second', {
      name: 'second',
      execute: async () => { order.push('second'); },
    });
    await registry.runAll(['first', 'second'], {});
    a.deepEqual(order, ['first', 'second']);
  });

  it('skips unknown actions in runAll without throwing', async () => {
    const registry = new ActionRegistry();
    const order = [];
    registry.register('known', {
      name: 'known',
      execute: async () => { order.push('known'); },
    });
    await registry.runAll(['unknown', 'known'], {});
    a.deepEqual(order, ['known']);
  });

  it('loads built-in actions on construction', () => {
    const registry = ActionRegistry.withBuiltins();
    a.ok(registry.get('git-worktree'));
    a.ok(registry.get('git-commit'));
    a.ok(registry.get('git-pr'));
    a.ok(registry.get('notify'));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd runner && node --test main/test/action-registry.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ActionRegistry**

```javascript
// runner/main/engine/actions/registry.js
import { createLogger } from '../../logger.js';
import { gitWorktreeAction } from './git-worktree.js';
import { gitCommitAction } from './git-commit.js';
import { gitPrAction } from './git-pr.js';
import { notifyAction } from './notify.js';

const log = createLogger('actions', '\x1b[33m');

export class ActionRegistry {
  constructor() {
    this.actions = new Map();
  }

  register(name, action) {
    this.actions.set(name, action);
  }

  get(name) {
    return this.actions.get(name) || null;
  }

  async run(name, context, config) {
    const action = this.get(name);
    if (!action) {
      log.warn(`action not found: ${name}`);
      return;
    }
    log.info(`running action: ${name}`);
    await action.execute(context, config);
  }

  async runAll(names, context, actionConfigs) {
    for (const name of names) {
      const config = actionConfigs?.[name] || {};
      await this.run(name, context, config);
    }
  }

  static withBuiltins() {
    const registry = new ActionRegistry();
    registry.register('git-worktree', gitWorktreeAction);
    registry.register('git-commit', gitCommitAction);
    registry.register('git-pr', gitPrAction);
    registry.register('notify', notifyAction);
    return registry;
  }
}
```

- [ ] **Step 4: Implement git-worktree action**

Extract from existing `WorktreeManager`. The action wraps it with the standard `execute(context, config)` interface.

```javascript
// runner/main/engine/actions/git-worktree.js
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { tmpdir } from 'os';
import { createLogger } from '../../logger.js';

const log = createLogger('git-worktree', '\x1b[33m');

export const gitWorktreeAction = {
  name: 'git-worktree',

  async execute(context, config) {
    const { task, _runtime } = context;
    if (!_runtime?.repoDir) {
      log.warn('no repoDir in runtime context, skipping worktree');
      return;
    }

    const repoDir = _runtime.repoDir;
    const branch = `specd/${task.id}`;
    const worktreesDir = join(tmpdir(), 'specd-worktrees', basename(repoDir));
    const worktreePath = join(worktreesDir, task.id);

    mkdirSync(worktreesDir, { recursive: true });

    try {
      execSync(`git branch ${branch}`, { cwd: repoDir, stdio: 'pipe' });
    } catch {
      // Branch may already exist
    }

    execSync(`git worktree add "${worktreePath}" ${branch}`, {
      cwd: repoDir,
      stdio: 'pipe',
    });

    // Store worktree info in execution context
    context.git = context.git || {};
    context.git.branch = branch;
    context.git.worktree = worktreePath;
    context._runtime.cwd = worktreePath;

    log.info(`created worktree at ${worktreePath}`);
  },
};
```

- [ ] **Step 5: Implement git-commit action**

```javascript
// runner/main/engine/actions/git-commit.js
import { execSync } from 'child_process';
import { createLogger } from '../../logger.js';

const log = createLogger('git-commit', '\x1b[33m');

export const gitCommitAction = {
  name: 'git-commit',

  async execute(context) {
    const cwd = context._runtime?.cwd || context._runtime?.repoDir;
    if (!cwd) return;

    // Check for changes
    const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
    if (!status) {
      log.info('no changes to commit');
      return;
    }

    const stageName = context._runtime?.currentStage || 'unknown';
    const message = `feat(${context.task.id}): complete stage "${stageName}"`;

    execSync('git add -A', { cwd, stdio: 'pipe' });
    execSync(`git commit -m "${message}"`, { cwd, stdio: 'pipe' });

    const commitHash = execSync('git rev-parse --short HEAD', { cwd, encoding: 'utf-8' }).trim();
    context.git = context.git || {};
    context.git.commits = context.git.commits || [];
    context.git.commits.push(commitHash);

    log.info(`committed ${commitHash}: ${message}`);
  },
};
```

- [ ] **Step 6: Implement git-pr action**

```javascript
// runner/main/engine/actions/git-pr.js
import { execFileSync } from 'child_process';
import { createLogger } from '../../logger.js';

const log = createLogger('git-pr', '\x1b[33m');

export const gitPrAction = {
  name: 'git-pr',

  async execute(context, config) {
    const cwd = context._runtime?.cwd || context._runtime?.repoDir;
    const branch = context.git?.branch;
    if (!cwd || !branch) return;

    const draft = config?.draft !== false;
    const title = context.task.name;
    const body = Object.entries(context.stages)
      .filter(([, s]) => s.status === 'success')
      .map(([name, s]) => `### ${name}\n${s.output || 'Completed'}`)
      .join('\n\n');

    try {
      // Push branch
      execFileSync('git', ['push', '-u', 'origin', branch], { cwd, stdio: 'pipe' });

      // Check if PR already exists
      try {
        const existing = execFileSync('gh', ['pr', 'view', '--json', 'url', '-q', '.url'], {
          cwd, encoding: 'utf-8',
        }).trim();
        if (existing) {
          log.info(`PR already exists: ${existing}`);
          context.git.pr_url = existing;
          return;
        }
      } catch {
        // No existing PR
      }

      const args = ['pr', 'create', '--title', title, '--body', body, '--head', branch];
      if (draft) args.push('--draft');
      const prUrl = execFileSync('gh', args, { cwd, encoding: 'utf-8' }).trim();
      context.git.pr_url = prUrl;
      log.info(`created PR: ${prUrl}`);
    } catch (err) {
      log.error(`PR creation failed: ${err.message}`);
    }
  },
};
```

- [ ] **Step 7: Implement notify action (stub)**

```javascript
// runner/main/engine/actions/notify.js
import { createLogger } from '../../logger.js';

const log = createLogger('notify', '\x1b[33m');

export const notifyAction = {
  name: 'notify',

  async execute(context, config) {
    if (!config?.type) {
      log.warn('notify action: no type configured');
      return;
    }

    if (config.type === 'webhook' && config.url) {
      try {
        await fetch(config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: context.task,
            pipeline: context.pipeline,
            status: context._runtime?.finalStatus || 'unknown',
          }),
        });
        log.info(`webhook sent to ${config.url}`);
      } catch (err) {
        log.error(`webhook failed: ${err.message}`);
      }
    }
  },
};
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd runner && node --test main/test/action-registry.test.js`
Expected: All 6 tests PASS

- [ ] **Step 9: Commit**

```bash
git add runner/main/engine/actions/
git add runner/main/test/action-registry.test.js
git commit -m "feat(runner): action registry with git-worktree, git-commit, git-pr, notify"
```

---

## Task 6: Journal Watcher for Progress Reporting

Watch `.specd/journal.json` in the agent's working directory for progress updates. Falls back to inference when journal is silent.

**Files:**
- Create: `runner/main/engine/progress/journal-watcher.js`
- Create: `runner/main/engine/progress/inference.js`
- Create: `runner/main/test/journal-watcher.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
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

  it('returns idle status for empty directory', () => {
    const status = inferProgress(tmpDir, Date.now());
    a.ok(status.message.includes('idle') || status.message.includes('active'));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd runner && node --test main/test/journal-watcher.test.js`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement JournalWatcher**

```javascript
// runner/main/engine/progress/journal-watcher.js
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class JournalWatcher {
  constructor(workingDir) {
    this.journalPath = join(workingDir, '.specd', 'journal.json');
    this.lastReadCount = 0;
  }

  read() {
    if (!existsSync(this.journalPath)) return [];
    try {
      const entries = JSON.parse(readFileSync(this.journalPath, 'utf-8'));
      this.lastReadCount = entries.length;
      return entries;
    } catch {
      return [];
    }
  }

  readNew() {
    const all = this.read();
    const newEntries = all.slice(this.lastReadCount > 0 ? this.lastReadCount - all.length + (all.length - this.lastReadCount) : 0);
    // Simpler: track count, return entries after previous count
    const prev = this.lastReadCount;
    this.lastReadCount = all.length;
    return all.slice(prev);
  }

  // Fix: read() updates lastReadCount, so readNew needs a different approach
  // Let's use a cleaner implementation:
}
```

Actually, let me write this more cleanly:

```javascript
// runner/main/engine/progress/journal-watcher.js
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class JournalWatcher {
  constructor(workingDir) {
    this.journalPath = join(workingDir, '.specd', 'journal.json');
    this.seenCount = 0;
  }

  read() {
    if (!existsSync(this.journalPath)) return [];
    try {
      const entries = JSON.parse(readFileSync(this.journalPath, 'utf-8'));
      if (!Array.isArray(entries)) return [];
      this.seenCount = entries.length;
      return entries;
    } catch {
      return [];
    }
  }

  readNew() {
    if (!existsSync(this.journalPath)) return [];
    try {
      const entries = JSON.parse(readFileSync(this.journalPath, 'utf-8'));
      if (!Array.isArray(entries)) return [];
      const newEntries = entries.slice(this.seenCount);
      this.seenCount = entries.length;
      return newEntries;
    } catch {
      return [];
    }
  }
}
```

- [ ] **Step 4: Implement inferProgress**

```javascript
// runner/main/engine/progress/inference.js
import { execSync } from 'child_process';

export function inferProgress(cwd, lastOutputAt) {
  const secondsSinceOutput = Math.round((Date.now() - lastOutputAt) / 1000);

  // Check for recent git commits
  try {
    const log = execSync('git log --oneline -1 --since="5 minutes ago"', {
      cwd,
      encoding: 'utf-8',
    }).trim();
    if (log) {
      return { message: `Agent committed: ${log}`, type: 'inference' };
    }
  } catch {
    // Not a git repo or no commits
  }

  // Check for modified files
  try {
    const diff = execSync('git diff --stat', { cwd, encoding: 'utf-8' }).trim();
    if (diff) {
      const lines = diff.split('\n');
      const summary = lines[lines.length - 1];
      return { message: `Agent modified files: ${summary}`, type: 'inference' };
    }
  } catch {
    // Not a git repo
  }

  if (secondsSinceOutput < 60) {
    return { message: `Agent active (last output ${secondsSinceOutput}s ago)`, type: 'inference' };
  }

  return { message: `Agent idle for ${Math.round(secondsSinceOutput / 60)} minutes`, type: 'inference' };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd runner && node --test main/test/journal-watcher.test.js`
Expected: All 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add runner/main/engine/progress/ runner/main/test/journal-watcher.test.js
git commit -m "feat(runner): journal watcher and progress inference"
```

---

## Task 7: Refactor Orchestrator to Use Engine Components

The big refactor: rewrite the orchestrator to use ExecutionContext, ActionRegistry, and JournalWatcher. Remove all hardcoded git/PR logic — delegate to actions.

**Files:**
- Create: `runner/main/engine/orchestrator.js` (new, clean version)
- Modify: `runner/main/orchestrator.js` → delete (replaced by engine version)
- Create: `runner/main/test/orchestrator.test.js` (replace old tests)

- [ ] **Step 1: Write failing tests for the new orchestrator**

```javascript
// runner/main/test/orchestrator.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Orchestrator } from '../engine/orchestrator.js';
import { Paths } from '../paths.js';

describe('Orchestrator', () => {
  let tmpDir, paths, config;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'specd-orch-'));
    paths = new Paths(tmpDir);

    // Create directories
    mkdirSync(paths.agentTemplatesDir, { recursive: true });
    mkdirSync(paths.pipelineTemplatesDir, { recursive: true });

    const projectDir = join(tmpDir, 'projects', 'testproject');
    mkdirSync(join(projectDir, 'tasks'), { recursive: true });
    mkdirSync(join(projectDir, 'logs'), { recursive: true });
    writeFileSync(join(projectDir, 'project.json'), JSON.stringify({
      name: 'testproject',
      path: '/tmp/fake-repo',
    }));

    // Agent template — use echo as a mock agent
    writeFileSync(join(paths.agentTemplatesDir, 'mock-agent.json'), JSON.stringify({
      cmd: 'echo',
      input_mode: 'stdin',
      output_format: 'plain',
      system_prompt: '',
      timeout: 10,
      stuck_timeout: 10,
    }));

    // Pipeline template
    writeFileSync(join(paths.pipelineTemplatesDir, 'default.json'), JSON.stringify({
      name: 'default',
      stages: [
        { stage: 'test-stage', agent: 'mock-agent', critical: true },
      ],
    }));

    config = {
      server: { port: 0 },
      defaults: { pipeline: 'default', failure_policy: 'skip', timeout: 10, stuck_timeout: 10, max_parallel: 1 },
    };
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('initializes and loads tasks', () => {
    const orch = new Orchestrator({ projectId: 'testproject', paths, config });
    orch.init();
    a.deepEqual(orch.getTasks(), []);
  });

  it('creates a task', () => {
    const orch = new Orchestrator({ projectId: 'testproject', paths, config });
    orch.init();
    const task = orch.createIdea('Test task', 'A description');
    a.ok(task.id.startsWith('idea-'));
    a.equal(task.name, 'Test task');
    a.equal(task.status, 'idea');
  });

  it('picks ready tasks respecting priority', () => {
    const orch = new Orchestrator({ projectId: 'testproject', paths, config });
    orch.init();

    orch.createTask({ id: 'low', name: 'Low', status: 'ready', priority: 10, depends_on: [] });
    orch.createTask({ id: 'high', name: 'High', status: 'ready', priority: 1, depends_on: [] });

    const picked = orch.pickNextTask();
    a.equal(picked.id, 'high');
  });

  it('respects task dependencies', () => {
    const orch = new Orchestrator({ projectId: 'testproject', paths, config });
    orch.init();

    orch.createTask({ id: 'first', name: 'First', status: 'ready', priority: 10, depends_on: [] });
    orch.createTask({ id: 'second', name: 'Second', status: 'ready', priority: 1, depends_on: ['first'] });

    const picked = orch.pickNextTask();
    a.equal(picked.id, 'first');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd runner && node --test main/test/orchestrator.test.js`
Expected: FAIL — engine/orchestrator.js not found

- [ ] **Step 3: Implement the refactored orchestrator**

```javascript
// runner/main/engine/orchestrator.js
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import { StateManager } from '../state/manager.js';
import { TemplateManager } from '../template-manager.js';
import { AgentRunner } from '../agent/runner.js';
import { StageSequencer } from '../pipeline/sequencer.js';
import { resolvePipeline } from '../pipeline/resolver.js';
import { resolveTemplate } from '../agent/template.js';
import { ExecutionContext } from './context.js';
import { ActionRegistry } from './actions/registry.js';
import { JournalWatcher } from './progress/journal-watcher.js';
import { inferProgress } from './progress/inference.js';
import { createLogger } from '../logger.js';

const log = createLogger('orchestrator', '\x1b[35m');

export class Orchestrator extends EventEmitter {
  constructor({ projectId, paths, config }) {
    super();
    this.projectId = projectId;
    this.paths = paths;
    this.config = config;
    this.projectPaths = paths.forProject(projectId);
    this.stateManager = new StateManager(this.projectPaths.statusJson);
    this.templateManager = new TemplateManager(paths);
    this.actionRegistry = ActionRegistry.withBuiltins();
    this.running = false;
    this.runningTasks = new Set();
    this.activeRunners = new Set();
  }

  init() {
    log.info(`initializing project ${this.projectId}`);
    mkdirSync(this.projectPaths.tasksDir, { recursive: true });
    mkdirSync(this.projectPaths.logsDir, { recursive: true });

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

  createIdea(name, description, autoExecute) {
    log.info(`creating idea: "${name}"`);
    const id = `idea-${Date.now().toString(36)}`;
    const task = {
      id,
      name,
      description: description || '',
      project_id: this.projectId,
      pipeline: null,
      status: 'idea',
      priority: 10,
      depends_on: [],
      spec: '',
      feedback: '',
      auto_execute: !!autoExecute,
      pr_url: null,
      created_at: new Date().toISOString(),
    };
    return this.createTask(task);
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
    log.info(`running task ${task.id}: "${task.name}"`);
    const agents = this.templateManager.getAgents();
    const pipelines = this.templateManager.getPipelines();
    const pipelineName = task.pipeline || this.config.defaults?.pipeline || 'default';
    const pipeline = resolvePipeline(pipelineName, pipelines, task.stage_overrides, this.config.defaults);
    const pipelineConfig = pipelines[pipelineName] || {};

    // Build execution context
    const ctx = new ExecutionContext({
      task: { id: task.id, name: task.name, description: task.description, feedback: task.feedback, spec: task.spec },
      pipeline: { name: pipelineName, total_stages: pipeline.stages.length },
    });

    // Get project path for actions
    let repoDir = null;
    try {
      const projectJson = JSON.parse(readFileSync(this.projectPaths.projectJson, 'utf-8'));
      repoDir = projectJson.path;
    } catch {}

    ctx._runtime = { repoDir, cwd: repoDir };

    // Run pipeline-start actions (e.g., git-worktree)
    const startActions = pipelineConfig.on_start || [];
    await this.actionRegistry.runAll(startActions, ctx, pipelineConfig.actions);

    const cwd = ctx._runtime.cwd || repoDir;

    this.runningTasks.add(task.id);
    this.stateManager.registerTask(task.id, { name: task.name, pipeline: pipelineName });
    this.stateManager.updateTaskStatus(task.id, 'in_progress');
    this.updateTask(task.id, { status: 'in_progress' });

    const logPath = join(this.projectPaths.logsDir, `${task.id}.log`);

    const sequencer = new StageSequencer({
      stages: pipeline.stages,
      completedStages: ctx.completedStages(),
      createRunner: (stage, previousOutput) => {
        const agentDef = agents[stage.agent];
        if (!agentDef) throw new Error(`Agent not found: ${stage.agent}`);

        ctx.startStage(stage.stage, stage.agent);
        ctx._runtime.currentStage = stage.stage;

        const vars = ctx.templateVars({ name: stage.stage, index: stage.index, total: stage.total });
        const resolvedPrompt = resolveTemplate(agentDef.system_prompt || '', vars);

        const runner = new AgentRunner({
          ...agentDef,
          system_prompt: resolvedPrompt,
          timeout: stage.timeout,
          stuck_timeout: this.config.defaults?.stuck_timeout,
        });

        // Progress: journal watcher + inference
        const journalWatcher = cwd ? new JournalWatcher(cwd) : null;
        let lastOutputAt = Date.now();

        runner.on('status', (s) => {
          lastOutputAt = Date.now();
          this.stateManager.updateLiveProgress(task.id, s);
        });
        runner.on('output', () => {
          lastOutputAt = Date.now();
          // Check journal for new entries
          if (journalWatcher) {
            const entries = journalWatcher.readNew();
            for (const entry of entries) {
              ctx.updateJournal(stage.stage, entry);
              if (entry.type === 'progress') {
                this.stateManager.updateLiveProgress(task.id, entry);
              }
            }
          }
        });

        this.activeRunners.add(runner);
        return {
          run: () => {
            const p = runner.run(task.spec || task.description || task.name, { cwd, logPath });
            p.finally(() => this.activeRunners.delete(runner));
            return p;
          },
        };
      },
      onStageStart: async (stage) => {
        this.stateManager.startStage(task.id, { stage: stage.stage, agent: stage.agent });
        this.stateManager.persist();
      },
      onStageComplete: async (stage, result) => {
        ctx.completeStage(stage.stage, {
          status: result.status,
          output: result.summary || '',
          decisions: result.decisions || [],
          artifacts: result.files_changed || [],
        });
        this.stateManager.completeStage(task.id, result.status, result.summary);
        this.stateManager.persist();

        // Run on_stage_complete actions
        const stageActions = pipelineConfig.on_stage_complete || [];
        await this.actionRegistry.runAll(stageActions, ctx, pipelineConfig.actions);
      },
    });

    const result = await sequencer.run();
    const finalStatus = result.status === 'success' ? 'done' : 'failed';

    ctx._runtime.finalStatus = finalStatus;
    this.stateManager.updateTaskStatus(task.id, finalStatus);
    this.stateManager.persist();
    this.updateTask(task.id, { status: finalStatus, pr_url: ctx.git?.pr_url });

    // Run on_complete or on_fail actions
    const completionActions = finalStatus === 'done'
      ? (pipelineConfig.on_complete || [])
      : (pipelineConfig.on_fail || []);
    await this.actionRegistry.runAll(completionActions, ctx, pipelineConfig.actions);

    this.runningTasks.delete(task.id);
    return result;
  }

  async advanceTask(taskId, action, feedback) {
    log.info(`advance ${taskId} → ${action}`);
    const task = this.getTask(taskId);
    if (!task) return null;

    if (action === 'approve') {
      return this.updateTask(taskId, { status: 'ready' });
    }

    if (action === 'plan') {
      this.updateTask(taskId, { status: 'planning', feedback: feedback || task.feedback });
      this._runPipeline(task, 'brainstorm').catch(err => {
        log.error(`brainstorm failed for ${taskId}: ${err}`);
        this.updateTask(taskId, { status: 'failed', failed_pipeline: 'brainstorm' });
        this.stateManager.updateTaskStatus(taskId, 'failed');
        this.stateManager.persist();
      });
      return this.getTask(taskId);
    }

    if (action === 're-plan') {
      const updatedFeedback = [task.feedback, feedback].filter(Boolean).join('\n\n---\n\n');
      this.updateTask(taskId, { status: 'planning', feedback: updatedFeedback });
      this._runPipeline({ ...task, feedback: updatedFeedback }, 'brainstorm').catch(err => {
        log.error(`re-plan failed for ${taskId}: ${err}`);
        this.updateTask(taskId, { status: 'failed', failed_pipeline: 'brainstorm' });
        this.stateManager.updateTaskStatus(taskId, 'failed');
        this.stateManager.persist();
      });
      return this.getTask(taskId);
    }

    if (action === 'retry' || action === 'retry-fresh') {
      this.stateManager.clearTask(taskId);
      return this.updateTask(taskId, {
        status: 'idea',
        failed_pipeline: null,
        pr_url: null,
        spec: '',
        feedback: '',
      });
    }

    if (action === 'retry-feedback') {
      const updatedFeedback = [task.feedback, feedback].filter(Boolean).join('\n\n---\n\n');
      this.stateManager.clearTask(taskId);
      return this.updateTask(taskId, { status: 'ready', feedback: updatedFeedback, failed_pipeline: null });
    }

    return null;
  }

  async _runPipeline(task, pipelineName) {
    // Reuse runTask with overridden pipeline
    const taskWithPipeline = { ...task, pipeline: pipelineName };
    return this.runTask(taskWithPipeline);
  }

  async startLoop(interval = 5000) {
    this.running = true;
    while (this.running) {
      const maxParallel = this.config.defaults?.max_parallel || 1;
      const available = maxParallel - this.runningTasks.size;
      for (let i = 0; i < available; i++) {
        const task = this.pickNextTask();
        if (!task) break;
        this.runTask(task).catch(err => log.error(`task ${task.id} failed: ${err}`));
      }
      await new Promise(r => setTimeout(r, interval));
    }
  }

  stop() { this.running = false; }

  killRunningAgents() {
    for (const runner of this.activeRunners) runner.kill();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd runner && node --test main/test/orchestrator.test.js`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/main/engine/orchestrator.js runner/main/test/orchestrator.test.js
git commit -m "feat(runner): refactored orchestrator with ExecutionContext and actions"
```

---

## Task 8: Update TemplateManager — Global Templates Only

Remove per-project template overrides. Templates are global only, managed through the UI.

**Files:**
- Modify: `runner/main/template-manager.js`
- Modify: `runner/main/paths.js` — remove per-project agent/pipeline paths

- [ ] **Step 1: Write failing test**

```javascript
// Add to runner/main/test/template-manager.test.js (update existing)
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { TemplateManager } from '../template-manager.js';
import { Paths } from '../paths.js';

describe('TemplateManager', () => {
  let tmpDir, paths;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'specd-tm-'));
    paths = new Paths(tmpDir);
    mkdirSync(paths.agentTemplatesDir, { recursive: true });
    mkdirSync(paths.pipelineTemplatesDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads global agent templates', () => {
    writeFileSync(join(paths.agentTemplatesDir, 'test-agent.json'), JSON.stringify({
      cmd: 'echo test',
      output_format: 'plain',
    }));

    const tm = new TemplateManager(paths);
    const agents = tm.getAgents();
    a.ok(agents['test-agent']);
    a.equal(agents['test-agent'].cmd, 'echo test');
  });

  it('loads global pipeline templates', () => {
    writeFileSync(join(paths.pipelineTemplatesDir, 'test-pipeline.json'), JSON.stringify({
      name: 'test-pipeline',
      stages: [{ stage: 'test', agent: 'test-agent' }],
    }));

    const tm = new TemplateManager(paths);
    const pipelines = tm.getPipelines();
    a.ok(pipelines['test-pipeline']);
  });

  it('getAgents takes no arguments (global only)', () => {
    const tm = new TemplateManager(paths);
    // Should work without projectId
    const agents = tm.getAgents();
    a.ok(typeof agents === 'object');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd runner && node --test main/test/template-manager.test.js`

- [ ] **Step 3: Simplify TemplateManager**

```javascript
// runner/main/template-manager.js
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

export class TemplateManager {
  constructor(paths) {
    this.paths = paths;
  }

  getAgents() {
    return this._loadDir(this.paths.agentTemplatesDir);
  }

  getPipelines() {
    return this._loadDir(this.paths.pipelineTemplatesDir);
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

- [ ] **Step 4: Update Paths — remove per-project overrides**

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
  get actionsDir() { return join(this.root, 'actions'); }
  get electronDir() { return join(this.root, 'electron'); }

  forProject(projectId) {
    const dir = join(this.root, 'projects', projectId);
    return {
      dir,
      projectJson: join(dir, 'project.json'),
      statusJson: join(dir, 'status.json'),
      tasksDir: join(dir, 'tasks'),
      logsDir: join(dir, 'logs'),
    };
  }
}
```

- [ ] **Step 5: Run all tests**

Run: `cd runner && node --test main/test/template-manager.test.js`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add runner/main/template-manager.js runner/main/paths.js runner/main/test/template-manager.test.js
git commit -m "refactor(runner): global-only templates, remove per-project overrides"
```

---

## Task 9: Update API Routes for New Spec

Add global pipeline/agent endpoints and update task creation to accept pipeline selection.

**Files:**
- Modify: `runner/main/server/api.js`

- [ ] **Step 1: Update API routes**

Add to `runner/main/server/api.js`:

```javascript
// Global pipeline list
router.get('/pipelines', (req, res) => {
  const { paths } = getContext();
  const tm = new TemplateManager(paths);
  const pipelines = tm.getPipelines();
  res.json(Object.entries(pipelines).map(([name, config]) => ({
    name,
    description: config.description || '',
    stages: (config.stages || []).map(s => ({ name: s.stage, agent: s.agent })),
  })));
});

// Global agent list
router.get('/agents', (req, res) => {
  const { paths } = getContext();
  const tm = new TemplateManager(paths);
  const agents = tm.getAgents();
  res.json(Object.entries(agents).map(([name, config]) => ({
    name,
    cmd: config.cmd,
    output_format: config.output_format,
  })));
});

// Update pipeline
router.put('/pipelines/:name', (req, res) => {
  const { paths } = getContext();
  const filePath = join(paths.pipelineTemplatesDir, `${req.params.name}.json`);
  writeFileSync(filePath, JSON.stringify(req.body, null, 2));
  res.json({ status: 'ok', name: req.params.name });
});

// Update agent
router.put('/agents/:name', (req, res) => {
  const { paths } = getContext();
  const filePath = join(paths.agentTemplatesDir, `${req.params.name}.json`);
  writeFileSync(filePath, JSON.stringify(req.body, null, 2));
  res.json({ status: 'ok', name: req.params.name });
});

// Execution context for a task
router.get('/projects/:id/tasks/:taskId/context', (req, res) => {
  const { paths } = getContext();
  const contextPath = join(paths.forProject(req.params.id).dir, 'contexts', `${req.params.taskId}.json`);
  if (!existsSync(contextPath)) return res.status(404).json({ error: 'Context not found' });
  res.json(JSON.parse(readFileSync(contextPath, 'utf-8')));
});
```

Add necessary imports at the top: `import { TemplateManager } from '../template-manager.js';` and `import { writeFileSync } from 'fs';`

- [ ] **Step 2: Update task creation to require pipeline**

Update the existing `POST /projects/:id/tasks` handler — ensure `pipeline` is accepted from the request body (already is, but make it more prominent):

```javascript
// In the existing POST /projects/:id/tasks handler, update status default:
// If no pipeline specified but status is 'idea', keep as idea (needs planning)
// If pipeline specified and status is 'ready', queue directly
const task = {
  id: req.body.id || `task-${randomUUID().slice(0, 6)}`,
  name: req.body.name,
  description: req.body.description || '',
  project_id: req.params.id,
  pipeline: req.body.pipeline || null,
  status: req.body.status || 'idea',
  priority: req.body.priority || 10,
  depends_on: req.body.depends_on || [],
  spec: req.body.spec || '',
  feedback: '',
  auto_execute: !!req.body.auto_execute,
  pr_url: null,
  created_at: new Date().toISOString(),
};
```

- [ ] **Step 3: Commit**

```bash
git add runner/main/server/api.js
git commit -m "feat(runner): add global pipeline/agent API endpoints"
```

---

## Task 10: Update Electron Entry Point and IPC

Make `index.js` create the Engine (orchestrators + server), thin Electron shell. Update IPC to delegate to Engine.

**Files:**
- Modify: `runner/main/index.js`
- Modify: `runner/main/ipc.js`

- [ ] **Step 1: Update index.js to use engine orchestrator**

Replace the import of `Orchestrator` from `./orchestrator.js` to `./engine/orchestrator.js`. The rest of the initialization stays the same — the Orchestrator API is compatible.

```javascript
// runner/main/index.js — update import
import { Orchestrator } from './engine/orchestrator.js';
// (rest of the file stays the same)
```

- [ ] **Step 2: Update IPC — use updated TemplateManager (no projectId arg)**

In `runner/main/ipc.js`, update `getAgents` and `getPipelines` calls:

```javascript
// In ipc.js, update register-project handler to use engine orchestrator
import { Orchestrator } from './engine/orchestrator.js';
```

And in the `get-pipeline-files` and `get-agent-files` handlers, they already read from global dirs, so no change needed.

- [ ] **Step 3: Delete old orchestrator**

```bash
rm runner/main/orchestrator.js
```

- [ ] **Step 4: Run existing tests to check nothing is broken**

Run: `cd runner && node --test main/test/`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add runner/main/index.js runner/main/ipc.js
git rm runner/main/orchestrator.js
git commit -m "refactor(runner): wire engine orchestrator into Electron entry point"
```

---

## Task 11: Update Bootstrap with New Defaults

Update the default agent templates and pipeline definitions to reflect the new architecture. Include the journal writing instructions in agent prompts.

**Files:**
- Modify: `runner/main/bootstrap.js`

- [ ] **Step 1: Update agent system prompts to include journal instructions**

In every agent's `system_prompt`, add journal writing instruction:

```
## Progress Reporting
Write your progress and decisions to .specd/journal.json as an array of entries:
[
  { "type": "progress", "message": "what you're doing", "percent": 25 },
  { "type": "decision", "decision": "what you decided", "reason": "why" },
  { "type": "artifact", "path": "file.md", "description": "what this file is" }
]
Append to the array after each major step. The runner watches this file for real-time progress.
```

Replace the old `specd-status`/`specd-result` block instructions with journal instructions in each agent template. Keep the `specd-result` block at the end — the parser still needs it for the final result.

- [ ] **Step 2: Update pipeline defaults to include action hooks**

```javascript
const DEFAULT_PIPELINE = {
  name: 'default',
  description: 'Plan, implement, and review code changes',
  stages: [
    { stage: 'plan', agent: 'claude-superpower-planner', critical: true },
    { stage: 'implement', agent: 'claude-implementer', critical: true },
    { stage: 'review', agent: 'claude-reviewer', on_fail: 'retry', max_retries: 2 },
  ],
  on_start: ['git-worktree'],
  on_stage_complete: ['git-commit'],
  on_complete: ['git-pr'],
};
```

- [ ] **Step 3: Commit**

```bash
git add runner/main/bootstrap.js
git commit -m "feat(runner): update defaults with journal instructions and action hooks"
```

---

## Task 12: Integration Test

A lightweight integration test that verifies the full flow: create task → run pipeline with mock agent → verify context accumulates → verify actions fire.

**Files:**
- Create: `runner/main/test/integration.test.js`

- [ ] **Step 1: Write integration test**

```javascript
// runner/main/test/integration.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Orchestrator } from '../engine/orchestrator.js';
import { Paths } from '../paths.js';

describe('Integration: task → pipeline → actions', () => {
  let tmpDir, paths, config;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'specd-int-'));
    paths = new Paths(tmpDir);

    mkdirSync(paths.agentTemplatesDir, { recursive: true });
    mkdirSync(paths.pipelineTemplatesDir, { recursive: true });

    const projectDir = join(tmpDir, 'projects', 'testproject');
    mkdirSync(join(projectDir, 'tasks'), { recursive: true });
    mkdirSync(join(projectDir, 'logs'), { recursive: true });
    writeFileSync(join(projectDir, 'project.json'), JSON.stringify({
      name: 'testproject',
      path: tmpDir, // Use tmpDir as "repo" so no git errors
    }));

    // Mock agent: just echoes and exits
    writeFileSync(join(paths.agentTemplatesDir, 'echo-agent.json'), JSON.stringify({
      cmd: 'echo "done"',
      input_mode: 'stdin',
      output_format: 'plain',
      system_prompt: '',
      timeout: 10,
      stuck_timeout: 10,
    }));

    // Pipeline with two stages, no git actions (no real repo)
    writeFileSync(join(paths.pipelineTemplatesDir, 'test.json'), JSON.stringify({
      name: 'test',
      stages: [
        { stage: 'first', agent: 'echo-agent', critical: true },
        { stage: 'second', agent: 'echo-agent', critical: true },
      ],
    }));

    config = {
      server: { port: 0 },
      defaults: { pipeline: 'test', failure_policy: 'skip', timeout: 10, stuck_timeout: 10, max_parallel: 1 },
    };
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('runs a task through a two-stage pipeline', async () => {
    const orch = new Orchestrator({ projectId: 'testproject', paths, config });
    orch.init();

    const task = {
      id: 'test-task-1',
      name: 'Integration test',
      description: 'Test the full flow',
      project_id: 'testproject',
      pipeline: 'test',
      status: 'ready',
      priority: 1,
      depends_on: [],
      spec: '',
      feedback: '',
      created_at: new Date().toISOString(),
    };
    orch.createTask(task);

    const result = await orch.runTask(task);
    a.equal(result.status, 'success');
    a.equal(result.results.length, 2);

    // Task should be marked done
    const updated = orch.getTask('test-task-1');
    a.equal(updated.status, 'done');

    // State should reflect completion
    const state = orch.stateManager.getState();
    a.equal(state.tasks['test-task-1'].status, 'done');
  });
});
```

- [ ] **Step 2: Run integration test**

Run: `cd runner && node --test main/test/integration.test.js`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add runner/main/test/integration.test.js
git commit -m "test(runner): integration test for engine pipeline flow"
```

---

## Task 13: Cleanup — Remove Dead Code

Remove the old `worktree/manager.js` (functionality moved to actions), old `notifications/telegram.js` (replaced by notify action), and update any remaining imports.

**Files:**
- Delete: `runner/main/worktree/manager.js`
- Delete: `runner/main/notifications/telegram.js`
- Verify: no remaining imports of deleted files

- [ ] **Step 1: Check for remaining imports of old modules**

Run:
```bash
cd runner && grep -r "worktree/manager" main/ --include="*.js" | grep -v engine/actions
cd runner && grep -r "notifications/telegram" main/ --include="*.js" | grep -v engine/actions
```

- [ ] **Step 2: Remove dead files**

```bash
rm runner/main/worktree/manager.js
rm runner/main/notifications/telegram.js
rmdir runner/main/worktree/ 2>/dev/null || true
rmdir runner/main/notifications/ 2>/dev/null || true
```

- [ ] **Step 3: Run all tests**

Run: `cd runner && node --test main/test/`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git rm runner/main/worktree/manager.js runner/main/notifications/telegram.js
git commit -m "refactor(runner): remove dead code replaced by action system"
```

---

## Summary

| Task | What | Key Files |
|------|------|-----------|
| 1 | ExecutionContext (snowball) | `engine/context.js` |
| 2 | Template resolution for snowball | `agent/template.js` |
| 3 | Multi-format stream parsers | `agent/parser.js` |
| 4 | Folder-name project IDs | `db.js` |
| 5 | Action registry + built-in actions | `engine/actions/` |
| 6 | Journal watcher + progress inference | `engine/progress/` |
| 7 | Refactored orchestrator | `engine/orchestrator.js` |
| 8 | Global-only templates | `template-manager.js`, `paths.js` |
| 9 | Updated API routes | `server/api.js` |
| 10 | Electron entry point update | `index.js`, `ipc.js` |
| 11 | Updated bootstrap defaults | `bootstrap.js` |
| 12 | Integration test | `test/integration.test.js` |
| 13 | Dead code cleanup | Remove old files |
