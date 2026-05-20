# specd-review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `specd-review`, a standalone Node.js CLI that runs an iterative multi-agent code review loop — parallel configurable reviewers, one fixer, auto and interactive modes.

**Architecture:** A `tools/specd-review/` npm package. `cli.js` parses args and selects a mode; `src/orchestrator.js` runs the round loop; each round spawns reviewer agent CLIs in parallel, merges their JSON findings, optionally pauses for human input, then runs a fixer agent and commits. Config and agents are loaded from `~/.specd-review/` (one agent per file). A live `ink` TUI shows agent progress, with a plain non-TTY fallback.

**Tech Stack:** Node.js (ESM), `node:test` runner, `commander`, `chalk`, `simple-git`, `js-yaml`, `ink` + `ink-spinner`. External CLIs on PATH: `git`, `gh`, agent CLIs (`claude`, `codex`, …).

---

## Conventions

- ESM modules (`"type": "module"`), matching `runner/`.
- Tests use `node:test` + `node:assert/strict`, mirroring `runner/main/test/*.test.js`.
- Test command from inside `tools/specd-review/`: `npm test` (runs `node --test`).
- All paths below are relative to repo root `/Users/victor/work/specdacular/`.

## Shared Data Shapes

These shapes are used across tasks. Defined here once; tasks reference them.

```js
// Agent definition (parsed from an agent yaml file)
// { name, role: 'reviewer'|'fixer', cmd, transport: 'stream_json'|'plain', systemPrompt }

// Finding
// { file, line, severity: 'blocking'|'nice-to-have', category, description, suggestion, source }
//   source = name of the reviewer agent that produced it

// Reviewer agent output (inside a ```specd-result block)
// { findings: [ {file, line, severity, category, description, suggestion} ], summary }

// RoundRecord
// { round, findings: Finding[], summaries: {agentName: string},
//   feedback: string, commit: string|null, skipped: string[] }
```

## File Structure

```
tools/specd-review/
  package.json            # Task 1
  cli.js                  # Task 11 — entry, arg parsing, init
  src/
    parser.js             # Task 2 — StreamParser (ported from runner)
    findings.js           # Task 3 — normalize, dedupe, severity-gate
    config.js             # Task 4 — load + merge config and agent files
    git.js                # Task 5 — branch/PR/diff/base/commit helpers
    agent-runner.js       # Task 6 — spawn an agent CLI, capture result
    report.js             # Task 7 — markdown report writer
    orchestrator.js       # Task 8 — the round loop
    ui/plain-view.js      # Task 9 — non-TTY view + prompts
    ui/ink-view.js        # Task 10 — interactive TUI
  agents/                 # Task 11 — default agent files seeded by `init`
    claude-correctness.yml
    codex-security.yml
    codex-perf.yml
    claude-fixer.yml
  test/
    *.test.js             # one per src module
```

---

## Task 1: Package scaffold

**Files:**
- Create: `tools/specd-review/package.json`
- Create: `tools/specd-review/cli.js`
- Create: `tools/specd-review/test/smoke.test.js`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "specd-review",
  "version": "0.1.0",
  "description": "Iterative multi-agent code review CLI",
  "type": "module",
  "bin": { "specd-review": "./cli.js" },
  "scripts": { "test": "node --test" },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^12.1.0",
    "ink": "^5.0.1",
    "ink-spinner": "^5.0.0",
    "js-yaml": "^4.1.0",
    "react": "^18.3.1",
    "simple-git": "^3.27.0"
  }
}
```

- [ ] **Step 2: Create a minimal `cli.js` stub**

```js
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();
program
  .name('specd-review')
  .description('Iterative multi-agent code review CLI')
  .version('0.1.0');

program.parse();
```

- [ ] **Step 3: Install dependencies**

Run: `cd tools/specd-review && npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Write the smoke test**

```js
// test/smoke.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { execFileSync } from 'node:child_process';

describe('cli', () => {
  it('prints its version', () => {
    const out = execFileSync('node', ['cli.js', '--version'], {
      cwd: new URL('..', import.meta.url).pathname,
    }).toString().trim();
    a.equal(out, '0.1.0');
  });
});
```

- [ ] **Step 5: Run the test**

Run: `cd tools/specd-review && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/specd-review/package.json tools/specd-review/package-lock.json tools/specd-review/cli.js tools/specd-review/test/smoke.test.js
git commit -m "feat(specd-review): package scaffold"
```

---

## Task 2: StreamParser

Port the runner's block parser. It scans lines for ```` ```specd-status ```` and ```` ```specd-result ```` fenced blocks and emits the parsed JSON.

**Files:**
- Create: `tools/specd-review/src/parser.js`
- Test: `tools/specd-review/test/parser.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/parser.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { StreamParser } from '../src/parser.js';

describe('StreamParser', () => {
  it('emits result blocks as parsed JSON', () => {
    const p = new StreamParser();
    const results = [];
    p.on('result', (r) => results.push(r));
    p.feed('```specd-result');
    p.feed('{"summary":"ok","findings":[]}');
    p.feed('```');
    a.equal(results.length, 1);
    a.equal(results[0].summary, 'ok');
  });

  it('emits status blocks and passes other lines through as output', () => {
    const p = new StreamParser();
    const statuses = [];
    const output = [];
    p.on('status', (s) => statuses.push(s));
    p.on('output', (l) => output.push(l));
    p.feed('hello');
    p.feed('```specd-status');
    p.feed('{"progress":"Reviewing"}');
    p.feed('```');
    a.equal(output[0], 'hello');
    a.equal(statuses[0].progress, 'Reviewing');
  });

  it('ignores malformed JSON in a block', () => {
    const p = new StreamParser();
    const results = [];
    p.on('result', (r) => results.push(r));
    p.feed('```specd-result');
    p.feed('{not json');
    p.feed('```');
    a.equal(results.length, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/specd-review && node --test test/parser.test.js`
Expected: FAIL — cannot find `../src/parser.js`.

- [ ] **Step 3: Write `src/parser.js`**

```js
import { EventEmitter } from 'node:events';

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
        this.emit(this.inBlock, JSON.parse(content));
      } catch {
        // malformed JSON — ignore
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

Run: `cd tools/specd-review && node --test test/parser.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/specd-review/src/parser.js tools/specd-review/test/parser.test.js
git commit -m "feat(specd-review): stream parser for specd blocks"
```

---

## Task 3: Findings — normalize, dedupe, severity-gate

Pure functions over the Finding shape. No I/O.

**Files:**
- Create: `tools/specd-review/src/findings.js`
- Test: `tools/specd-review/test/findings.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/findings.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { normalizeFinding, mergeReviewerOutputs, severityGate } from '../src/findings.js';

describe('normalizeFinding', () => {
  it('fills defaults and stamps the source', () => {
    const f = normalizeFinding({ file: 'a.js', description: 'bug' }, 'codex-security');
    a.equal(f.file, 'a.js');
    a.equal(f.line, null);
    a.equal(f.severity, 'nice-to-have');
    a.equal(f.category, 'general');
    a.equal(f.suggestion, '');
    a.equal(f.source, 'codex-security');
  });

  it('coerces an unknown severity to nice-to-have', () => {
    const f = normalizeFinding({ file: 'a.js', description: 'x', severity: 'WARN' }, 's');
    a.equal(f.severity, 'nice-to-have');
  });

  it('keeps a valid blocking severity', () => {
    const f = normalizeFinding({ file: 'a.js', description: 'x', severity: 'blocking' }, 's');
    a.equal(f.severity, 'blocking');
  });
});

describe('mergeReviewerOutputs', () => {
  it('collects findings from all reviewers and dedupes by file+line+category', () => {
    const merged = mergeReviewerOutputs([
      { agent: 'r1', output: { summary: 's1', findings: [
        { file: 'a.js', line: 10, category: 'logic', description: 'd', severity: 'blocking' },
      ] } },
      { agent: 'r2', output: { summary: 's2', findings: [
        { file: 'a.js', line: 10, category: 'logic', description: 'dupe', severity: 'blocking' },
        { file: 'b.js', line: 2, category: 'perf', description: 'd2', severity: 'nice-to-have' },
      ] } },
    ]);
    a.equal(merged.findings.length, 2);
    a.equal(merged.summaries.r1, 's1');
    a.equal(merged.summaries.r2, 's2');
  });

  it('tolerates a reviewer with no output', () => {
    const merged = mergeReviewerOutputs([{ agent: 'r1', output: null }]);
    a.equal(merged.findings.length, 0);
    a.equal(merged.summaries.r1, '(no output)');
  });
});

describe('severityGate', () => {
  it('splits blocking from nice-to-have', () => {
    const g = severityGate([
      { severity: 'blocking' }, { severity: 'nice-to-have' }, { severity: 'blocking' },
    ]);
    a.equal(g.blocking.length, 2);
    a.equal(g.niceToHave.length, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/specd-review && node --test test/findings.test.js`
Expected: FAIL — cannot find `../src/findings.js`.

- [ ] **Step 3: Write `src/findings.js`**

```js
const VALID_SEVERITY = new Set(['blocking', 'nice-to-have']);

export function normalizeFinding(raw, source) {
  return {
    file: raw.file || '(unknown)',
    line: Number.isInteger(raw.line) ? raw.line : null,
    severity: VALID_SEVERITY.has(raw.severity) ? raw.severity : 'nice-to-have',
    category: raw.category || 'general',
    description: raw.description || '',
    suggestion: raw.suggestion || '',
    source,
  };
}

function dedupeKey(f) {
  return `${f.file}::${f.line}::${f.category}`;
}

export function mergeReviewerOutputs(reviewerOutputs) {
  const summaries = {};
  const seen = new Map();
  for (const { agent, output } of reviewerOutputs) {
    if (!output) {
      summaries[agent] = '(no output)';
      continue;
    }
    summaries[agent] = output.summary || '';
    for (const raw of output.findings || []) {
      const f = normalizeFinding(raw, agent);
      const key = dedupeKey(f);
      if (!seen.has(key)) seen.set(key, f);
    }
  }
  return { findings: [...seen.values()], summaries };
}

export function severityGate(findings) {
  return {
    blocking: findings.filter((f) => f.severity === 'blocking'),
    niceToHave: findings.filter((f) => f.severity === 'nice-to-have'),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/specd-review && node --test test/findings.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/specd-review/src/findings.js tools/specd-review/test/findings.test.js
git commit -m "feat(specd-review): findings normalize/merge/severity-gate"
```

---

## Task 4: Config & agent loading

Loads `~/.specd-review/config.yml` and `agents/*.yml`, merges a project-level `.specd-review/` over the global one, applies a CLI agent-selection override, and validates exactly one fixer.

**Files:**
- Create: `tools/specd-review/src/config.js`
- Test: `tools/specd-review/test/config.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/config.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../src/config.js';

let globalDir, projectDir;

function writeAgent(dir, name, body) {
  mkdirSync(join(dir, 'agents'), { recursive: true });
  writeFileSync(join(dir, 'agents', `${name}.yml`), body);
}

beforeEach(() => {
  globalDir = mkdtempSync(join(tmpdir(), 'sr-global-'));
  projectDir = mkdtempSync(join(tmpdir(), 'sr-project-'));
});
afterEach(() => {
  rmSync(globalDir, { recursive: true, force: true });
  rmSync(projectDir, { recursive: true, force: true });
});

describe('loadConfig', () => {
  it('loads agents and splits reviewers from the fixer', () => {
    writeFileSync(join(globalDir, 'config.yml'), 'max_rounds: 4\n');
    writeAgent(globalDir, 'rev', 'role: reviewer\ncmd: "echo"\nsystem_prompt: "r {{diff}}"\n');
    writeAgent(globalDir, 'fix', 'role: fixer\ncmd: "echo"\nsystem_prompt: "f {{findings}}"\n');
    const cfg = loadConfig({ globalDir, projectDir });
    a.equal(cfg.maxRounds, 4);
    a.equal(cfg.reviewers.length, 1);
    a.equal(cfg.reviewers[0].name, 'rev');
    a.equal(cfg.fixer.name, 'fix');
  });

  it('lets a project agent file shadow a global one of the same name', () => {
    writeAgent(globalDir, 'rev', 'role: reviewer\ncmd: "global"\nsystem_prompt: "x"\n');
    writeAgent(globalDir, 'fix', 'role: fixer\ncmd: "echo"\nsystem_prompt: "f"\n');
    writeAgent(projectDir, 'rev', 'role: reviewer\ncmd: "project"\nsystem_prompt: "x"\n');
    const cfg = loadConfig({ globalDir, projectDir });
    a.equal(cfg.reviewers[0].cmd, 'project');
  });

  it('honors a cliAgents selection override', () => {
    writeAgent(globalDir, 'a', 'role: reviewer\ncmd: "echo"\nsystem_prompt: "x"\n');
    writeAgent(globalDir, 'b', 'role: reviewer\ncmd: "echo"\nsystem_prompt: "x"\n');
    writeAgent(globalDir, 'fix', 'role: fixer\ncmd: "echo"\nsystem_prompt: "f"\n');
    const cfg = loadConfig({ globalDir, projectDir, cliAgents: ['a', 'fix'] });
    a.equal(cfg.reviewers.length, 1);
    a.equal(cfg.reviewers[0].name, 'a');
  });

  it('throws when there is not exactly one fixer', () => {
    writeAgent(globalDir, 'rev', 'role: reviewer\ncmd: "echo"\nsystem_prompt: "x"\n');
    a.throws(() => loadConfig({ globalDir, projectDir }), /exactly one fixer/i);
  });

  it('defaults max_rounds to 5 when config.yml is absent', () => {
    writeAgent(globalDir, 'rev', 'role: reviewer\ncmd: "echo"\nsystem_prompt: "x"\n');
    writeAgent(globalDir, 'fix', 'role: fixer\ncmd: "echo"\nsystem_prompt: "f"\n');
    a.equal(loadConfig({ globalDir, projectDir }).maxRounds, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/specd-review && node --test test/config.test.js`
Expected: FAIL — cannot find `../src/config.js`.

- [ ] **Step 3: Write `src/config.js`**

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import yaml from 'js-yaml';

export function defaultGlobalDir() {
  return join(homedir(), '.specd-review');
}

function parseAgentFile(path, name) {
  const raw = yaml.load(readFileSync(path, 'utf8')) || {};
  if (raw.role !== 'reviewer' && raw.role !== 'fixer') {
    throw new Error(`agent "${name}": role must be "reviewer" or "fixer"`);
  }
  if (!raw.cmd) throw new Error(`agent "${name}": missing cmd`);
  return {
    name,
    role: raw.role,
    cmd: raw.cmd,
    transport: raw.output_format === 'stream_json' ? 'stream_json' : 'plain',
    systemPrompt: raw.system_prompt || '',
  };
}

function discoverAgents(dir) {
  const agentsDir = join(dir, 'agents');
  if (!existsSync(agentsDir)) return new Map();
  const map = new Map();
  for (const file of readdirSync(agentsDir)) {
    const m = file.match(/^(.+)\.ya?ml$/);
    if (!m) continue;
    map.set(m[1], parseAgentFile(join(agentsDir, file), m[1]));
  }
  return map;
}

function loadSettings(dir) {
  const path = join(dir, 'config.yml');
  if (!existsSync(path)) return {};
  return yaml.load(readFileSync(path, 'utf8')) || {};
}

export function loadConfig({ globalDir, projectDir, cliAgents } = {}) {
  globalDir = globalDir || defaultGlobalDir();
  const globalSettings = loadSettings(globalDir);
  const projectSettings = projectDir ? loadSettings(projectDir) : {};
  const settings = { ...globalSettings, ...projectSettings };

  // Project agent files shadow global ones by name.
  const merged = new Map(discoverAgents(globalDir));
  if (projectDir) {
    for (const [name, def] of discoverAgents(projectDir)) merged.set(name, def);
  }

  let selected = [...merged.values()];
  const selection = cliAgents || settings.agents;
  if (selection && selection.length) {
    selected = selection.map((name) => {
      if (!merged.has(name)) throw new Error(`unknown agent: ${name}`);
      return merged.get(name);
    });
  }

  const reviewers = selected.filter((aDef) => aDef.role === 'reviewer');
  const fixers = selected.filter((aDef) => aDef.role === 'fixer');
  if (fixers.length !== 1) {
    throw new Error(`config must select exactly one fixer (found ${fixers.length})`);
  }

  return {
    maxRounds: Number.isInteger(settings.max_rounds) ? settings.max_rounds : 5,
    reviewers,
    fixer: fixers[0],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/specd-review && node --test test/config.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/specd-review/src/config.js tools/specd-review/test/config.test.js
git commit -m "feat(specd-review): config and agent file loading"
```

---

## Task 5: Git helpers

Wraps `simple-git` and `gh`. Resolves the review base, captures the diff, refuses a dirty tree, commits a round, and checks out a PR.

**Files:**
- Create: `tools/specd-review/src/git.js`
- Test: `tools/specd-review/test/git.test.js`

- [ ] **Step 1: Write the failing test**

The test builds a real temp git repo so the helpers exercise actual git.

```js
// test/git.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { assertCleanTree, resolveBase, getDiff, commitRound } from '../src/git.js';

let repo;
const git = (...args) => execFileSync('git', args, { cwd: repo }).toString();

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'sr-git-'));
  git('init', '-b', 'main');
  git('config', 'user.email', 't@t.t');
  git('config', 'user.name', 'T');
  writeFileSync(join(repo, 'f.txt'), 'base\n');
  git('add', '.');
  git('commit', '-m', 'base');
  git('checkout', '-b', 'feature');
  writeFileSync(join(repo, 'f.txt'), 'changed\n');
  git('add', '.');
  git('commit', '-m', 'change');
});
afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe('git helpers', () => {
  it('resolveBase finds the merge-base with main', async () => {
    const base = await resolveBase(repo);
    a.equal(typeof base, 'string');
    a.ok(base.length > 0);
  });

  it('getDiff returns the branch diff against the base', async () => {
    const base = await resolveBase(repo);
    const diff = await getDiff(repo, base);
    a.match(diff, /changed/);
  });

  it('assertCleanTree passes on a clean tree and throws on a dirty one', async () => {
    await assertCleanTree(repo);
    writeFileSync(join(repo, 'f.txt'), 'dirty\n');
    await a.rejects(assertCleanTree(repo), /uncommitted/i);
  });

  it('commitRound creates a commit and returns its hash', async () => {
    writeFileSync(join(repo, 'f.txt'), 'fixed\n');
    const hash = await commitRound(repo, 1, 3);
    a.ok(hash && hash.length >= 7);
    a.match(git('log', '-1', '--pretty=%s'), /round 1.*3 issue/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/specd-review && node --test test/git.test.js`
Expected: FAIL — cannot find `../src/git.js`.

- [ ] **Step 3: Write `src/git.js`**

```js
import { simpleGit } from 'simple-git';
import { execFileSync } from 'node:child_process';

export async function assertCleanTree(cwd) {
  const status = await simpleGit(cwd).status();
  if (!status.isClean()) {
    throw new Error(
      'Working tree has uncommitted changes. Commit or stash them before running specd-review.',
    );
  }
}

export async function resolveBase(cwd) {
  const git = simpleGit(cwd);
  const branches = await git.branch();
  const candidates = ['main', 'master'];
  const baseBranch = candidates.find((b) => branches.all.includes(b)) || 'main';
  return (await git.raw(['merge-base', 'HEAD', baseBranch])).trim();
}

export async function getDiff(cwd, base) {
  return simpleGit(cwd).diff([`${base}...HEAD`]);
}

export async function commitRound(cwd, round, issueCount) {
  const git = simpleGit(cwd);
  await git.add(['-A']);
  await git.commit(`specd-review round ${round}: ${issueCount} issue(s)`);
  return (await git.revparse(['HEAD'])).trim();
}

// PR checkout uses the gh CLI directly. Returns the checked-out branch name.
export function checkoutPR(cwd, prNumber) {
  execFileSync('gh', ['pr', 'checkout', String(prNumber)], { cwd, stdio: 'inherit' });
  return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd })
    .toString()
    .trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/specd-review && node --test test/git.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/specd-review/src/git.js tools/specd-review/test/git.test.js
git commit -m "feat(specd-review): git base/diff/commit helpers"
```

---

## Task 6: Agent runner

Spawns an agent CLI, renders its prompt template, feeds stdout through `StreamParser`, and resolves with the `specd-result` payload. Handles a `stream_json` transport (Claude-style JSONL — unwrap assistant text) and a `plain` transport (feed raw lines). One retry on no-result.

**Files:**
- Create: `tools/specd-review/src/agent-runner.js`
- Test: `tools/specd-review/test/agent-runner.test.js`

- [ ] **Step 1: Write the failing test**

The test uses a stub agent whose `cmd` is a `node -e` one-liner that prints a `specd-result` block, so no real CLI is needed.

```js
// test/agent-runner.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { renderPrompt, runAgent } from '../src/agent-runner.js';

describe('renderPrompt', () => {
  it('substitutes {{vars}} and leaves unknown ones blank', () => {
    const out = renderPrompt('a {{diff}} b {{missing}} c', { diff: 'X' });
    a.equal(out, 'a X b  c');
  });
});

describe('runAgent', () => {
  it('captures a specd-result block from a plain-transport agent', async () => {
    const block = '```specd-result\\n{"summary":"ok","findings":[]}\\n```';
    const agent = {
      name: 'stub',
      transport: 'plain',
      cmd: `node -e "console.log('${block}')"`,
      systemPrompt: 'review {{diff}}',
    };
    const res = await runAgent(agent, { diff: 'D' }, { cwd: process.cwd() });
    a.equal(res.result.summary, 'ok');
  });

  it('returns null result when the agent emits nothing parseable (after retry)', async () => {
    const agent = {
      name: 'stub',
      transport: 'plain',
      cmd: `node -e "console.log('nothing here')"`,
      systemPrompt: 'x',
    };
    const res = await runAgent(agent, {}, { cwd: process.cwd() });
    a.equal(res.result, null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/specd-review && node --test test/agent-runner.test.js`
Expected: FAIL — cannot find `../src/agent-runner.js`.

- [ ] **Step 3: Write `src/agent-runner.js`**

```js
import { spawn } from 'node:child_process';
import { StreamParser } from './parser.js';

export function renderPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : '',
  );
}

// Unwrap a Claude `--output-format stream_json` line into its text lines.
function streamJsonLines(line) {
  try {
    const event = JSON.parse(line);
    const content = event?.message?.content || event?.result;
    if (Array.isArray(content)) {
      return content
        .filter((b) => b.type === 'text')
        .flatMap((b) => b.text.split('\n'));
    }
  } catch {
    // not JSON — fall through
  }
  return [line];
}

function spawnOnce(agent, prompt, { cwd, onStatus, timeout = 1800_000 }) {
  return new Promise((resolve) => {
    const bin = agent.cmd.split(' ')[0];
    const args = agent.cmd.split(' ').slice(1);
    const proc = spawn(bin, args, { cwd, shell: true, stdio: ['pipe', 'pipe', 'pipe'] });

    const parser = new StreamParser();
    let result = null;
    const outputLines = [];
    parser.on('result', (r) => { result = r; });
    parser.on('status', (s) => onStatus && onStatus(s));
    parser.on('output', (l) => outputLines.push(l));

    const timer = setTimeout(() => proc.kill('SIGKILL'), timeout);

    let buf = '';
    proc.stdout.on('data', (chunk) => {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        const fed = agent.transport === 'stream_json' ? streamJsonLines(line) : [line];
        for (const f of fed) parser.feed(f);
      }
    });

    proc.stdin.end(prompt);
    proc.on('close', () => {
      clearTimeout(timer);
      if (buf) parser.feed(buf);
      resolve({ result, output: outputLines });
    });
    proc.on('error', () => {
      clearTimeout(timer);
      resolve({ result: null, output: outputLines });
    });
  });
}

export async function runAgent(agent, vars, opts = {}) {
  const prompt = renderPrompt(agent.systemPrompt, vars);
  let res = await spawnOnce(agent, prompt, opts);
  if (!res.result) {
    res = await spawnOnce(agent, prompt, opts); // one retry
  }
  return res;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/specd-review && node --test test/agent-runner.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/specd-review/src/agent-runner.js tools/specd-review/test/agent-runner.test.js
git commit -m "feat(specd-review): agent CLI runner with prompt templating"
```

---

## Task 7: Report writer

Writes a markdown run report from the array of `RoundRecord`s.

**Files:**
- Create: `tools/specd-review/src/report.js`
- Test: `tools/specd-review/test/report.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/report.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { renderReport } from '../src/report.js';

describe('renderReport', () => {
  it('renders rounds, findings, feedback, and the outcome', () => {
    const md = renderReport({
      base: 'abc123',
      outcome: 'converged',
      rounds: [
        {
          round: 1,
          findings: [
            { file: 'a.js', line: 4, severity: 'blocking', category: 'logic',
              description: 'off-by-one', suggestion: 'fix it', source: 'codex-perf' },
          ],
          summaries: { 'codex-perf': 'looked ok overall' },
          feedback: 'ignore style nits',
          commit: 'deadbee',
          skipped: ['claude-correctness'],
        },
      ],
    });
    a.match(md, /# specd-review report/);
    a.match(md, /Outcome.*converged/);
    a.match(md, /Round 1/);
    a.match(md, /off-by-one/);
    a.match(md, /ignore style nits/);
    a.match(md, /deadbee/);
    a.match(md, /claude-correctness/); // skipped agent noted
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/specd-review && node --test test/report.test.js`
Expected: FAIL — cannot find `../src/report.js`.

- [ ] **Step 3: Write `src/report.js`**

```js
import { writeFileSync } from 'node:fs';

function renderFinding(f) {
  const loc = f.line != null ? `${f.file}:${f.line}` : f.file;
  return [
    `- **[${f.severity}]** \`${loc}\` _(${f.category}, ${f.source})_`,
    `  - ${f.description}`,
    f.suggestion ? `  - suggestion: ${f.suggestion}` : null,
  ].filter(Boolean).join('\n');
}

function renderRound(r) {
  const lines = [`## Round ${r.round}`, ''];
  if (r.skipped && r.skipped.length) {
    lines.push(`_Skipped reviewers (no valid output): ${r.skipped.join(', ')}_`, '');
  }
  for (const [agent, summary] of Object.entries(r.summaries || {})) {
    lines.push(`**${agent}:** ${summary}`, '');
  }
  if (r.findings.length) {
    lines.push('### Findings', '', ...r.findings.map(renderFinding), '');
  } else {
    lines.push('No findings.', '');
  }
  if (r.feedback) lines.push(`### User feedback`, '', `> ${r.feedback}`, '');
  if (r.commit) lines.push(`Fix committed: \`${r.commit}\``, '');
  return lines.join('\n');
}

export function renderReport({ base, outcome, rounds }) {
  return [
    '# specd-review report',
    '',
    `- Base: \`${base}\``,
    `- Outcome: **${outcome}**`,
    `- Rounds: ${rounds.length}`,
    '',
    ...rounds.map(renderRound),
  ].join('\n');
}

export function writeReport(path, runState) {
  writeFileSync(path, renderReport(runState));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/specd-review && node --test test/report.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add tools/specd-review/src/report.js tools/specd-review/test/report.test.js
git commit -m "feat(specd-review): markdown report writer"
```

---

## Task 8: Orchestrator — the round loop

Runs the loop: parallel reviewers → merge → severity-gate → (interactive gate) → fixer → commit → repeat. The orchestrator depends on injected `runner`, `git`, and `ui` objects so it can be unit-tested with stubs.

**Files:**
- Create: `tools/specd-review/src/orchestrator.js`
- Test: `tools/specd-review/test/orchestrator.test.js`

- [ ] **Step 1: Write the failing test**

Uses stub reviewers/fixer (plain objects) and a stub git/ui so no processes spawn.

```js
// test/orchestrator.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { runReview } from '../src/orchestrator.js';

// Stub UI: auto-confirms, never edits findings, gives no feedback.
const autoUI = {
  async showRound() {},
  async findingsGate() { return { action: 'continue', findings: null, feedback: '' }; },
  async showResult() {},
};

function makeDeps({ reviewerFindingsByRound, fixerOk = true }) {
  let round = 0;
  return {
    git: {
      async getDiff() { return 'diff'; },
      async commitRound() { return `commit${round}`; },
    },
    runner: {
      async runReviewer(agent) {
        const findings = reviewerFindingsByRound[round] || [];
        return { agent: agent.name, output: { summary: 's', findings } };
      },
      async runFixer() {
        round += 1;
        return { changed: fixerOk };
      },
    },
  };
}

const reviewers = [{ name: 'r1', role: 'reviewer' }];
const fixer = { name: 'fix', role: 'fixer' };

describe('runReview', () => {
  it('converges when no blocking findings remain', async () => {
    const deps = makeDeps({
      reviewerFindingsByRound: {
        0: [{ file: 'a', line: 1, severity: 'blocking', category: 'c', description: 'd' }],
        1: [],
      },
    });
    const res = await runReview({
      config: { maxRounds: 5, reviewers, fixer }, base: 'B',
      cwd: '.', interactive: false, ui: autoUI, ...deps,
    });
    a.equal(res.outcome, 'converged');
    a.equal(res.rounds.length, 2);
  });

  it('stops at maxRounds when blocking findings persist', async () => {
    const blocking = [{ file: 'a', line: 1, severity: 'blocking', category: 'c', description: 'd' }];
    const deps = makeDeps({ reviewerFindingsByRound: { 0: blocking, 1: blocking, 2: blocking } });
    const res = await runReview({
      config: { maxRounds: 2, reviewers, fixer }, base: 'B',
      cwd: '.', interactive: false, ui: autoUI, ...deps,
    });
    a.equal(res.outcome, 'exhausted');
    a.equal(res.rounds.length, 2);
  });

  it('stops when the fixer makes no changes', async () => {
    const blocking = [{ file: 'a', line: 1, severity: 'blocking', category: 'c', description: 'd' }];
    const deps = makeDeps({ reviewerFindingsByRound: { 0: blocking }, fixerOk: false });
    const res = await runReview({
      config: { maxRounds: 5, reviewers, fixer }, base: 'B',
      cwd: '.', interactive: false, ui: autoUI, ...deps,
    });
    a.equal(res.outcome, 'fixer-stalled');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/specd-review && node --test test/orchestrator.test.js`
Expected: FAIL — cannot find `../src/orchestrator.js`.

- [ ] **Step 3: Write `src/orchestrator.js`**

```js
import { mergeReviewerOutputs, severityGate } from './findings.js';

export async function runReview({
  config, base, cwd, interactive, ui, git, runner,
}) {
  const rounds = [];
  let diff = await git.getDiff(cwd, base);

  for (let round = 1; round <= config.maxRounds; round++) {
    await ui.showRound({ round, reviewers: config.reviewers, base });

    // Reviewers in parallel; a rejected reviewer is treated as skipped.
    const settled = await Promise.allSettled(
      config.reviewers.map((agent) =>
        runner.runReviewer(agent, { diff, round, base })),
    );
    const reviewerOutputs = [];
    const skipped = [];
    settled.forEach((s, i) => {
      const name = config.reviewers[i].name;
      if (s.status === 'fulfilled' && s.value.output) reviewerOutputs.push(s.value);
      else skipped.push(name);
    });

    let { findings, summaries } = mergeReviewerOutputs(reviewerOutputs);
    let feedback = '';

    if (interactive) {
      const gate = await ui.findingsGate({ round, findings, summaries });
      if (gate.action === 'accept') {
        rounds.push({ round, findings, summaries, feedback: '', commit: null, skipped });
        return { base, outcome: 'accepted', rounds };
      }
      if (gate.action === 'quit') {
        rounds.push({ round, findings, summaries, feedback: '', commit: null, skipped });
        return { base, outcome: 'aborted', rounds };
      }
      if (gate.findings) findings = gate.findings; // user-edited
      feedback = gate.feedback || '';
    }

    const { blocking } = severityGate(findings);
    if (blocking.length === 0) {
      rounds.push({ round, findings, summaries, feedback, commit: null, skipped });
      return { base, outcome: 'converged', rounds };
    }

    const fix = await runner.runFixer(config.fixer, { diff, findings, feedback, round });
    if (!fix.changed) {
      rounds.push({ round, findings, summaries, feedback, commit: null, skipped });
      return { base, outcome: 'fixer-stalled', rounds };
    }

    const commit = await git.commitRound(cwd, round, blocking.length);
    rounds.push({ round, findings, summaries, feedback, commit, skipped });
    diff = await git.getDiff(cwd, base);
  }

  return { base, outcome: 'exhausted', rounds };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/specd-review && node --test test/orchestrator.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/specd-review/src/orchestrator.js tools/specd-review/test/orchestrator.test.js
git commit -m "feat(specd-review): round-loop orchestrator"
```

---

## Task 9: Plain (non-TTY) view

Implements the `ui` interface the orchestrator expects, for non-TTY environments: line printer + `readline` prompts. Interface: `showRound`, `findingsGate`, `showResult`.

**Files:**
- Create: `tools/specd-review/src/ui/plain-view.js`
- Test: `tools/specd-review/test/plain-view.test.js`

- [ ] **Step 1: Write the failing test**

The test exercises `formatFindings` (pure) and `parseGateInput` (pure); the interactive `findingsGate` itself is smoke-tested manually.

```js
// test/plain-view.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { formatFindings, parseGateInput } from '../src/ui/plain-view.js';

describe('formatFindings', () => {
  it('groups findings by file with severity markers', () => {
    const text = formatFindings([
      { file: 'a.js', line: 3, severity: 'blocking', category: 'logic',
        description: 'bug', suggestion: '', source: 'r1' },
      { file: 'a.js', line: 9, severity: 'nice-to-have', category: 'style',
        description: 'nit', suggestion: '', source: 'r2' },
    ]);
    a.match(text, /a\.js/);
    a.match(text, /blocking/);
    a.match(text, /bug/);
  });

  it('reports when there are no findings', () => {
    a.match(formatFindings([]), /no findings/i);
  });
});

describe('parseGateInput', () => {
  it('maps slash commands to actions', () => {
    a.deepEqual(parseGateInput('/continue'), { action: 'continue' });
    a.deepEqual(parseGateInput('/accept'), { action: 'accept' });
    a.deepEqual(parseGateInput('/quit'), { action: 'quit' });
    a.deepEqual(parseGateInput('/edit'), { action: 'edit' });
  });

  it('treats plain text as feedback', () => {
    a.deepEqual(parseGateInput('skip the nits'), { action: 'feedback', feedback: 'skip the nits' });
  });

  it('treats an empty line as continue', () => {
    a.deepEqual(parseGateInput('  '), { action: 'continue' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/specd-review && node --test test/plain-view.test.js`
Expected: FAIL — cannot find `../src/ui/plain-view.js`.

- [ ] **Step 3: Write `src/ui/plain-view.js`**

```js
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { writeFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';

export function formatFindings(findings) {
  if (!findings.length) return chalk.green('No findings.');
  const byFile = {};
  for (const f of findings) (byFile[f.file] ||= []).push(f);
  const lines = [];
  for (const [file, fs] of Object.entries(byFile)) {
    lines.push(chalk.bold(file));
    for (const f of fs) {
      const tag = f.severity === 'blocking'
        ? chalk.red('[blocking]') : chalk.yellow('[nice-to-have]');
      const loc = f.line != null ? `:${f.line}` : '';
      lines.push(`  ${tag} ${file}${loc} (${f.category}, ${f.source})`);
      lines.push(`    ${f.description}`);
      if (f.suggestion) lines.push(chalk.dim(`    → ${f.suggestion}`));
    }
  }
  return lines.join('\n');
}

export function parseGateInput(raw) {
  const text = raw.trim();
  if (text === '') return { action: 'continue' };
  if (text === '/continue') return { action: 'continue' };
  if (text === '/accept') return { action: 'accept' };
  if (text === '/quit') return { action: 'quit' };
  if (text === '/edit') return { action: 'edit' };
  return { action: 'feedback', feedback: text };
}

function editFindingsInEditor(findings) {
  const path = join(tmpdir(), `specd-review-findings-${Date.now()}.json`);
  writeFileSync(path, JSON.stringify(findings, null, 2));
  const editor = process.env.EDITOR || 'vi';
  execSync(`${editor} ${path}`, { stdio: 'inherit' });
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function createPlainView() {
  return {
    async showRound({ round, reviewers, base }) {
      stdout.write(chalk.cyan(`\n=== Round ${round} · base ${base.slice(0, 7)} ===\n`));
      stdout.write(chalk.dim(`reviewers: ${reviewers.map((r) => r.name).join(', ')}\n`));
    },

    async findingsGate({ round, findings }) {
      let current = findings;
      const rl = readline.createInterface({ input: stdin, output: stdout });
      try {
        for (;;) {
          stdout.write(`\n${formatFindings(current)}\n`);
          const raw = await rl.question(
            chalk.bold('\n[enter]=continue  /edit  /accept  /quit  or type feedback > '),
          );
          const parsed = parseGateInput(raw);
          if (parsed.action === 'edit') { current = editFindingsInEditor(current); continue; }
          if (parsed.action === 'continue') return { action: 'continue', findings: current, feedback: '' };
          if (parsed.action === 'feedback') {
            return { action: 'continue', findings: current, feedback: parsed.feedback };
          }
          return { action: parsed.action, findings: current, feedback: '' };
        }
      } finally {
        rl.close();
      }
    },

    async showResult({ outcome, reportPath }) {
      stdout.write(chalk.cyan(`\nOutcome: ${outcome}\n`));
      stdout.write(chalk.dim(`Report: ${reportPath}\n`));
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/specd-review && node --test test/plain-view.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/specd-review/src/ui/plain-view.js tools/specd-review/test/plain-view.test.js
git commit -m "feat(specd-review): plain non-TTY view"
```

---

## Task 10: Ink TUI view

Implements the same `ui` interface with a live `ink` panel: per-reviewer status lines with spinners and a persistent input box at the findings gate. Because `ink` rendering is hard to unit-test, the testable logic (`agentLineState`) is extracted as a pure function; the rendered component is smoke-tested manually.

**Files:**
- Create: `tools/specd-review/src/ui/ink-view.js`
- Test: `tools/specd-review/test/ink-view.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/ink-view.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { agentLineState } from '../src/ui/ink-view.js';

describe('agentLineState', () => {
  it('marks an agent running with its latest status text', () => {
    const s = agentLineState({ name: 'r1', status: { progress: 'reviewing' }, done: false });
    a.equal(s.icon, 'spinner');
    a.equal(s.text, 'reviewing');
  });

  it('marks a finished agent done with its finding count', () => {
    const s = agentLineState({ name: 'r1', status: null, done: true, findingCount: 3 });
    a.equal(s.icon, 'check');
    a.match(s.text, /3 finding/);
  });

  it('marks a skipped agent', () => {
    const s = agentLineState({ name: 'r1', done: true, skipped: true });
    a.equal(s.icon, 'cross');
    a.match(s.text, /skipped/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/specd-review && node --test test/ink-view.test.js`
Expected: FAIL — cannot find `../src/ui/ink-view.js`.

- [ ] **Step 3: Write `src/ui/ink-view.js`**

The pure `agentLineState` drives rendering. `createInkView` returns the same `ui` interface; it renders an `ink` app per round and resolves the gate promise on input. Reuse `formatFindings` and `parseGateInput` from `plain-view.js`. Editor-launch behavior for `/edit` matches the plain view.

```js
import React, { useState } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { formatFindings, parseGateInput } from './plain-view.js';

export function agentLineState({ name, status, done, findingCount = 0, skipped = false }) {
  if (skipped) return { name, icon: 'cross', text: 'skipped (no valid output)' };
  if (done) return { name, icon: 'check', text: `done — ${findingCount} finding(s)` };
  return { name, icon: 'spinner', text: status?.progress || 'starting…' };
}

function AgentLine({ state }) {
  const icon = state.icon === 'spinner'
    ? <Text color="cyan"><Spinner type="dots" /></Text>
    : state.icon === 'check'
      ? <Text color="green">✔</Text>
      : <Text color="red">✖</Text>;
  return (
    <Box>
      {icon}
      <Text> {state.name.padEnd(22)} </Text>
      <Text dimColor>{state.text}</Text>
    </Box>
  );
}

// RoundView renders live agent lines; resolves `onGate` when the user submits input.
function RoundView({ round, base, agentStates, findings, gateOpen, onGate }) {
  const [value, setValue] = useState('');
  const { exit } = useApp();
  useInput((input, key) => {
    if (!gateOpen) return;
    if (key.return) {
      const parsed = parseGateInput(value);
      setValue('');
      onGate(parsed);
      exit();
    } else if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
    } else if (!key.ctrl && !key.meta) {
      setValue((v) => v + input);
    }
  });
  return (
    <Box flexDirection="column">
      <Text color="cyan">specd-review · round {round} · base {base.slice(0, 7)}</Text>
      {agentStates.map((s) => <AgentLine key={s.name} state={s} />)}
      {gateOpen && (
        <Box flexDirection="column" marginTop={1}>
          <Text>{findings}</Text>
          <Text>{'─'.repeat(48)}</Text>
          <Text>{'> '}{value}</Text>
          <Text dimColor>[enter]=continue · /edit · /accept · /quit · or type feedback</Text>
        </Box>
      )}
    </Box>
  );
}

export function createInkView() {
  // Holds mutable round state shared with the live-rendered component.
  let state = null;
  let rerender = null;

  function draw() {
    if (rerender && state) rerender(<RoundView {...state} />);
  }

  return {
    async showRound({ round, reviewers, base }) {
      state = {
        round, base,
        agentStates: reviewers.map((r) =>
          agentLineState({ name: r.name, status: null, done: false })),
        findings: '', gateOpen: false, onGate: () => {},
      };
      const app = render(<RoundView {...state} />);
      rerender = app.rerender;
    },

    // Called by the runner wiring (Task 11) as each reviewer emits status / finishes.
    updateAgent(name, patch) {
      if (!state) return;
      state.agentStates = state.agentStates.map((s) =>
        s.name === name ? agentLineState({ name, ...patch }) : s);
      draw();
    },

    async findingsGate({ findings }) {
      return new Promise((resolve) => {
        let current = findings;
        const open = () => {
          state.gateOpen = true;
          state.findings = formatFindings(current);
          state.onGate = (parsed) => {
            if (parsed.action === 'edit') {
              // editor launch reuses the plain-view path; reopen after.
              current = editAndReopen(current, open);
              return;
            }
            if (parsed.action === 'feedback') {
              resolve({ action: 'continue', findings: current, feedback: parsed.feedback });
            } else {
              resolve({ action: parsed.action, findings: current, feedback: '' });
            }
          };
          draw();
        };
        open();
      });
    },

    async showResult() { /* final summary printed by cli.js after ink unmounts */ },
  };
}

// Launches $EDITOR on the findings JSON, then re-opens the gate.
function editAndReopen(findings, reopen) {
  const { writeFileSync, readFileSync } = require('node:fs');
  // editor launch identical to plain-view.editFindingsInEditor
  reopen();
  return findings;
}
```

> **Implementation note for the engineer:** `ink` is ESM-only and JSX needs a transform. Two acceptable options — (a) write `ink-view.js` without JSX using `React.createElement` directly, or (b) add a build step. Choose (a) to keep the package build-free; the JSX above is illustrative of structure. Convert each JSX element to `React.createElement(Component, props, ...children)`. Likewise replace the `require()` in `editAndReopen` with a top-level `import` of a shared `editFindingsInEditor` helper — extract that helper from `plain-view.js` into the module's exports so both views import it. Keep `agentLineState` exactly as written; that is what the test pins.

- [ ] **Step 4: Refactor — export `editFindingsInEditor` from `plain-view.js`**

Change `plain-view.js` to `export function editFindingsInEditor(findings)` (it is currently module-private) and have `ink-view.js` import it. Run the plain-view tests again to confirm nothing broke.

Run: `cd tools/specd-review && node --test test/plain-view.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Run the ink-view test**

Run: `cd tools/specd-review && node --test test/ink-view.test.js`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add tools/specd-review/src/ui/ink-view.js tools/specd-review/src/ui/plain-view.js tools/specd-review/test/ink-view.test.js
git commit -m "feat(specd-review): ink TUI view"
```

---

## Task 11: CLI wiring, default agents, and `init`

Wires everything into `cli.js`: arg parsing, preflight, the `init` subcommand, TTY detection to pick a view, the runner adapter that bridges `agent-runner.js` to the orchestrator's `runner` interface, and report writing.

**Files:**
- Modify: `tools/specd-review/cli.js`
- Create: `tools/specd-review/agents/claude-correctness.yml`
- Create: `tools/specd-review/agents/codex-security.yml`
- Create: `tools/specd-review/agents/codex-perf.yml`
- Create: `tools/specd-review/agents/claude-fixer.yml`
- Test: `tools/specd-review/test/cli-init.test.js`

- [ ] **Step 1: Create the four default agent files**

`agents/claude-correctness.yml`:
```yaml
role: reviewer
cmd: "claude -p --model opus --output-format stream_json --permission-mode plan"
output_format: stream_json
system_prompt: |
  You are a code reviewer. Review ONLY the diff below for correctness:
  logic bugs, off-by-one errors, unhandled edge cases, broken error paths.
  Do not edit files. Do not comment on style.
  Respond with exactly one fenced block:
  ```specd-result
  {"summary":"<one paragraph>","findings":[
    {"file":"<path>","line":<int|null>,"severity":"blocking|nice-to-have",
     "category":"<short>","description":"<what & why>","suggestion":"<how to fix>"}]}
  ```
  Round {{round}}, base {{base}}.

  DIFF:
  {{diff}}
```

`agents/codex-security.yml`:
```yaml
role: reviewer
cmd: "codex exec"
output_format: plain
system_prompt: |
  You are a security reviewer. Review ONLY the diff below for security
  issues and API misuse: injection, auth gaps, unsafe input handling,
  secrets, unsafe defaults. Do not edit files.
  Respond with exactly one fenced block:
  ```specd-result
  {"summary":"<one paragraph>","findings":[
    {"file":"<path>","line":<int|null>,"severity":"blocking|nice-to-have",
     "category":"<short>","description":"<what & why>","suggestion":"<how to fix>"}]}
  ```
  Round {{round}}, base {{base}}.

  DIFF:
  {{diff}}
```

`agents/codex-perf.yml`:
```yaml
role: reviewer
cmd: "codex exec"
output_format: plain
system_prompt: |
  You are a performance reviewer. Review ONLY the diff below for
  performance problems: needless work in hot paths, N+1 patterns,
  unbounded growth, blocking I/O. Do not edit files.
  Respond with exactly one fenced block:
  ```specd-result
  {"summary":"<one paragraph>","findings":[
    {"file":"<path>","line":<int|null>,"severity":"blocking|nice-to-have",
     "category":"<short>","description":"<what & why>","suggestion":"<how to fix>"}]}
  ```
  Round {{round}}, base {{base}}.

  DIFF:
  {{diff}}
```

`agents/claude-fixer.yml`:
```yaml
role: fixer
cmd: "claude -p --model opus --output-format stream_json --permission-mode acceptEdits"
output_format: stream_json
system_prompt: |
  You are a fixer. Apply minimal, correct fixes for the findings below
  by editing the working tree files directly. Fix only what is listed.
  User feedback OVERRIDES the findings list — honor it strictly:
  if feedback says skip something, skip it.
  When done, respond with exactly one fenced block:
  ```specd-result
  {"summary":"<what you changed>","findings":[]}
  ```
  Round {{round}}.

  USER FEEDBACK (higher priority than findings):
  {{user_feedback}}

  FINDINGS:
  {{findings}}
```

- [ ] **Step 2: Write the failing test for `init`**

```js
// test/cli-init.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as a } from 'node:assert';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runInit } from '../cli.js';

let dest;
beforeEach(() => { dest = mkdtempSync(join(tmpdir(), 'sr-init-')); });
afterEach(() => rmSync(dest, { recursive: true, force: true }));

describe('runInit', () => {
  it('seeds config.yml and the four default agent files', () => {
    runInit(dest);
    a.ok(existsSync(join(dest, 'config.yml')));
    for (const name of ['claude-correctness', 'codex-security', 'codex-perf', 'claude-fixer']) {
      a.ok(existsSync(join(dest, 'agents', `${name}.yml`)), `${name} missing`);
    }
  });

  it('does not overwrite an existing config.yml', () => {
    runInit(dest);
    const before = require('node:fs').readFileSync(join(dest, 'config.yml'), 'utf8');
    require('node:fs').writeFileSync(join(dest, 'config.yml'), 'max_rounds: 99\n');
    runInit(dest);
    a.notEqual(require('node:fs').readFileSync(join(dest, 'config.yml'), 'utf8'), before);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd tools/specd-review && node --test test/cli-init.test.js`
Expected: FAIL — `runInit` is not exported from `cli.js`.

- [ ] **Step 4: Write the full `cli.js`**

```js
#!/usr/bin/env node
import { Command } from 'commander';
import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stdout } from 'node:process';
import { loadConfig, defaultGlobalDir } from './src/config.js';
import { assertCleanTree, resolveBase, getDiff, commitRound, checkoutPR } from './src/git.js';
import { runAgent } from './src/agent-runner.js';
import { runReview } from './src/orchestrator.js';
import { createPlainView } from './src/ui/plain-view.js';
import { createInkView } from './src/ui/ink-view.js';
import { writeReport } from './src/report.js';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG = 'max_rounds: 5\n';

// Seeds a global dir with config.yml + bundled agent files. Exported for tests.
export function runInit(globalDir) {
  mkdirSync(join(globalDir, 'agents'), { recursive: true });
  const cfg = join(globalDir, 'config.yml');
  if (!existsSync(cfg)) writeFileSync(cfg, DEFAULT_CONFIG);
  cpSync(join(here, 'agents'), join(globalDir, 'agents'), { recursive: true });
}

// Adapter: bridges agent-runner.js to the orchestrator's `runner` interface.
function makeRunner(cwd, view) {
  return {
    async runReviewer(agent, { diff, round, base }) {
      const res = await runAgent(agent, { diff, round, base }, {
        cwd,
        onStatus: (s) => view.updateAgent?.(agent.name, { status: s, done: false }),
      });
      const count = res.result?.findings?.length || 0;
      view.updateAgent?.(agent.name, { done: true, findingCount: count, skipped: !res.result });
      return { agent: agent.name, output: res.result };
    },
    async runFixer(agent, { diff, findings, feedback, round }) {
      const res = await runAgent(agent, {
        diff, round,
        findings: JSON.stringify(findings, null, 2),
        user_feedback: feedback || '(none)',
      }, { cwd });
      return { changed: !!res.result };
    },
  };
}

async function review(prNumber, opts) {
  const cwd = process.cwd();
  if (prNumber) checkoutPR(cwd, prNumber);
  await assertCleanTree(cwd);

  const config = loadConfig({
    globalDir: opts.config || defaultGlobalDir(),
    projectDir: join(cwd, '.specd-review'),
    cliAgents: opts.agents ? opts.agents.split(',') : null,
  });
  if (opts.maxRounds) config.maxRounds = Number(opts.maxRounds);

  const base = await resolveBase(cwd);
  const interactive = !!opts.interactive;
  const view = (interactive && stdout.isTTY) ? createInkView() : createPlainView();

  const result = await runReview({
    config, base, cwd, interactive, ui: view,
    git: { getDiff, commitRound },
    runner: makeRunner(cwd, view),
  });

  const reportPath = join(cwd, 'specd-review-report.md');
  writeReport(reportPath, result);
  await view.showResult({ outcome: result.outcome, reportPath });

  const blockingRemain = result.outcome === 'exhausted' || result.outcome === 'fixer-stalled';
  process.exit(blockingRemain ? 1 : 0);
}

const program = new Command();
program.name('specd-review').description('Iterative multi-agent code review CLI').version('0.1.0');

program.command('init')
  .description('Seed ~/.specd-review/ with default config and agents')
  .action(() => {
    runInit(defaultGlobalDir());
    stdout.write(`Seeded ${defaultGlobalDir()}\n`);
  });

program.argument('[pr]', 'GitHub PR number to review (omit to review the current branch)')
  .option('-i, --interactive', 'pause at the findings gate for human input')
  .option('--agents <list>', 'comma-separated agent selection override')
  .option('--max-rounds <n>', 'override max_rounds')
  .option('--config <dir>', 'alternate global config directory')
  .action((pr, opts) => review(pr, opts));

program.parse();
```

> **Note for the engineer:** the orchestrator's `git` dependency calls `getDiff(cwd, base)` and `commitRound(cwd, round, count)` — pass the functions directly as shown. `cli.js` has both an exported `runInit` (for tests) and a CLI entry; importing `cli.js` in the test runs `program.parse()` with the test runner's argv. Guard the parse: wrap the bottom `program.parse()` in `if (process.argv[1] && process.argv[1].endsWith('cli.js')) program.parse();` so importing the module for `runInit` does not trigger CLI parsing.

- [ ] **Step 5: Add the parse guard**

Replace the final `program.parse();` line with:
```js
if (process.argv[1] && process.argv[1].endsWith('cli.js')) {
  program.parse();
}
```

- [ ] **Step 6: Run the init test**

Run: `cd tools/specd-review && node --test test/cli-init.test.js`
Expected: PASS (2 tests).

- [ ] **Step 7: Run the whole suite**

Run: `cd tools/specd-review && npm test`
Expected: PASS — all tests across all files.

- [ ] **Step 8: Manual smoke test**

```bash
cd tools/specd-review && npm link
cd /tmp && rm -rf sr-demo && mkdir sr-demo && cd sr-demo && git init -b main
echo "function add(a,b){return a-b}" > calc.js && git add . && git commit -m init
git checkout -b feature && echo "function add(a,b){return a-b} // still wrong" > calc.js
git add . && git commit -m change
specd-review init
specd-review --interactive
```
Expected: reviewers run in parallel, the findings gate appears, `/quit` exits cleanly, `specd-review-report.md` is written.

- [ ] **Step 9: Commit**

```bash
git add tools/specd-review/cli.js tools/specd-review/agents tools/specd-review/test/cli-init.test.js
git commit -m "feat(specd-review): CLI wiring, default agents, init command"
```

---

## Self-Review Notes

- **Spec coverage:** distribution/layout (Task 1), agents one-per-file + config merge + shadowing + selection + one-fixer rule (Task 4), parallel reviewers + severity-gated loop + max-rounds + interactive gate + per-round commits + failure handling (Task 8), JSON+prose findings contract (Tasks 3 & default agent prompts), interactive edit-findings + per-round feedback (Tasks 9/10), live TUI + non-TTY fallback (Tasks 9/10), `init` seeding + PR vs branch targeting + report (Task 11). All spec sections map to a task.
- **Type consistency:** the Finding shape, `runReviewer`/`runFixer`/`runReview` signatures, and the `ui` interface (`showRound`, `findingsGate`, `showResult`, plus `updateAgent` on the views) are consistent across Tasks 3, 6, 8, 9, 10, 11.
- **Known judgment call:** the ink JSX in Task 10 is illustrative; the engineer is instructed to implement build-free with `React.createElement`. `agentLineState` is the pinned, tested unit.
