#!/usr/bin/env node
// Specdacular Utility Script — deterministic workflow operations
// Called by workflow references to avoid Claude reasoning on mechanical tasks
// Node.js stdlib only. JSON output. Silent fail on errors.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Helpers ──────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] === undefined) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return obj;
}

function out(data) {
  process.stdout.write(JSON.stringify(data) + '\n');
}

function fail(msg) {
  out({ error: msg });
  process.exit(1);
}

function resolveTaskDir(args) {
  const d = args['task-dir'];
  if (!d) fail('--task-dir required');
  return d;
}

function padPhase(n) {
  return String(n).padStart(2, '0');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── Subcommands ──────────────────────────────────────

const commands = {};

// 1. commit
commands.commit = function (args) {
  const taskDir = resolveTaskDir(args);
  const type = args.type; // code | docs
  const files = args.files;
  const message = args.message;
  if (!type || !files || !message) fail('--type, --files, and --message required');

  const settingKey = type === 'code' ? 'auto_commit_code' : 'auto_commit_docs';

  // Read project-level .specd/config.json
  let autoCommit = true;
  try {
    const projectConfig = readJSON('.specd/config.json');
    if (projectConfig[settingKey] === false) autoCommit = false;
  } catch (e) {
    // No project config or can't read — default true
  }

  if (!autoCommit) {
    out({ committed: false, message: `Auto-commit disabled for ${type}` });
    return;
  }

  try {
    execSync(`git add ${files}`, { stdio: 'pipe' });
    execSync(`git commit -m ${JSON.stringify(message)}`, { stdio: 'pipe' });
    out({ committed: true, message });
  } catch (e) {
    // If nothing to commit, that's ok
    if (e.stderr && e.stderr.toString().includes('nothing to commit')) {
      out({ committed: false, message: 'nothing to commit' });
    } else {
      fail(`commit failed: ${e.message}`);
    }
  }
};

// 2. config-update
commands['config-update'] = function (args) {
  const taskDir = resolveTaskDir(args);
  const set = args.set;
  if (!set) fail('--set required (format: key=value)');

  const eqIdx = set.indexOf('=');
  if (eqIdx === -1) fail('--set format: key=value');
  const key = set.slice(0, eqIdx);
  let value = set.slice(eqIdx + 1);

  // Parse value type
  if (value === 'true') value = true;
  else if (value === 'false') value = false;
  else if (value === 'null') value = null;
  else if (/^\d+$/.test(value)) value = parseInt(value, 10);
  else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
  // else keep as string (strip quotes if present)
  else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    value = value.slice(1, -1);

  const configPath = path.join(taskDir, 'config.json');
  const config = readJSON(configPath);
  setNestedValue(config, key, value);
  writeJSON(configPath, config);
  out({ updated: true, key, value });
};

// 3. config-get
commands['config-get'] = function (args) {
  const taskDir = resolveTaskDir(args);
  const key = args.key;
  if (!key) fail('--key required');

  const configPath = path.join(taskDir, 'config.json');
  const config = readJSON(configPath);
  const value = getNestedValue(config, key);
  out({ key, value });
};

// 4. phase-info
commands['phase-info'] = function (args) {
  const taskDir = resolveTaskDir(args);
  const config = readJSON(path.join(taskDir, 'config.json'));
  const current = config.phases && config.phases.current;
  if (current == null) fail('No phases in config');

  const phaseDir = path.join(taskDir, 'phases', `phase-${padPhase(current)}`);
  const planPath = path.join(phaseDir, 'PLAN.md');
  const planExists = fs.existsSync(planPath);

  let title = '';
  let tasksCount = 0;

  // Try to get title from ROADMAP.md
  try {
    const roadmap = fs.readFileSync(path.join(taskDir, 'ROADMAP.md'), 'utf8');
    const phaseMatch = roadmap.match(new RegExp(`Phase ${current}:\\s*([^*\\n]+)`));
    if (!phaseMatch) {
      const altMatch = roadmap.match(new RegExp(`Phase ${current}[:\\s]+([^\\n]+)`));
      if (altMatch) title = altMatch[1].replace(/^[-—–*]+\s*/, '').replace(/\*+/g, '').trim();
    } else {
      title = phaseMatch[1].trim();
    }
  } catch (e) {}

  // Count tasks in PLAN.md
  if (planExists) {
    try {
      const plan = fs.readFileSync(planPath, 'utf8');
      tasksCount = (plan.match(/^###\s+Task\s+\d+/gm) || []).length;
    } catch (e) {}
  }

  out({
    phase: current,
    title,
    status: config.phases.current_status,
    plan_exists: planExists,
    tasks_count: tasksCount
  });
};

// 5. advance-phase
commands['advance-phase'] = function (args) {
  const taskDir = resolveTaskDir(args);
  const configPath = path.join(taskDir, 'config.json');
  const config = readJSON(configPath);
  config.phases.current += 1;
  config.phases.current_status = 'pending';
  delete config.phases.phase_start_commit;
  writeJSON(configPath, config);
  out({ phase: config.phases.current, status: 'pending' });
};

// 7. log-changelog
commands['log-changelog'] = function (args) {
  const taskDir = resolveTaskDir(args);
  const phase = args.phase;
  const title = args.title;
  const what = args.what;
  const why = args.why;
  const files = args.files || '';
  if (!phase || !title || !what || !why) fail('--phase, --title, --what, --why required');

  const clPath = path.join(taskDir, 'CHANGELOG.md');
  let content = '';
  try { content = fs.readFileSync(clPath, 'utf8'); } catch (e) {
    content = `# Changelog: ${path.basename(taskDir)}\n\n`;
  }

  const entry = `### ${today()} - Phase ${phase} PLAN.md\n\n**${title}**\n- **What:** ${what}\n- **Why:** ${why}\n- **Files:** \`${files}\`\n\n`;
  content += entry;
  fs.writeFileSync(clPath, content);
  out({ logged: true });
};

// 8. state-add-phase
commands['state-add-phase'] = function (args) {
  const taskDir = resolveTaskDir(args);
  const phase = args.phase;
  const tasks = args.tasks || 0;
  const deviations = args.deviations || 0;
  if (!phase) fail('--phase required');

  const statePath = path.join(taskDir, 'STATE.md');
  let state = fs.readFileSync(statePath, 'utf8');

  // Add row to Completed Phases table
  const row = `| ${phase} | ${today()} | ${tasks} | ${deviations} |`;
  state = state.replace(
    /(### Completed Phases\n\|[^\n]+\n\|[^\n]+\n)/,
    `$1${row}\n`
  );

  fs.writeFileSync(statePath, state);
  out({ updated: true });
};

// 9. next-decision-number
commands['next-decision-number'] = function (args) {
  const taskDir = resolveTaskDir(args);
  const decPath = path.join(taskDir, 'DECISIONS.md');
  let content = '';
  try { content = fs.readFileSync(decPath, 'utf8'); } catch (e) {}

  const matches = content.match(/DEC-(\d+)/g) || [];
  let max = 0;
  for (const m of matches) {
    const n = parseInt(m.replace('DEC-', ''), 10);
    if (n > max) max = n;
  }
  out({ next: `DEC-${String(max + 1).padStart(3, '0')}` });
};

// 10. record-phase-start
commands['record-phase-start'] = function (args) {
  const taskDir = resolveTaskDir(args);
  const phase = args.phase;
  if (!phase) fail('--phase required');

  const statePath = path.join(taskDir, 'STATE.md');
  let state = fs.readFileSync(statePath, 'utf8');

  // Update current phase section
  state = state.replace(
    /- Started: .*/,
    `- Started: ${today()}`
  );

  fs.writeFileSync(statePath, state);
  out({ recorded: true });
};

// 11. increment
commands.increment = function (args) {
  const taskDir = resolveTaskDir(args);
  const key = args.key;
  if (!key) fail('--key required');

  const configPath = path.join(taskDir, 'config.json');
  const config = readJSON(configPath);
  const current = getNestedValue(config, key) || 0;
  setNestedValue(config, key, current + 1);
  writeJSON(configPath, config);
  out({ key, value: current + 1 });
};

// 12. next-decimal-phase
commands['next-decimal-phase'] = function (args) {
  const taskDir = resolveTaskDir(args);
  const config = readJSON(path.join(taskDir, 'config.json'));
  const current = config.phases.current;
  const prefix = `phase-${padPhase(current)}.`;

  let maxDecimal = 0;
  try {
    const entries = fs.readdirSync(path.join(taskDir, 'phases'));
    for (const e of entries) {
      if (e.startsWith(prefix)) {
        const dec = parseInt(e.replace(prefix.replace('.', '\\.').replace(/\\\./g, '.'), '').replace(`phase-${padPhase(current)}.`, ''), 10);
        if (dec > maxDecimal) maxDecimal = dec;
      }
    }
  } catch (e) {}

  const next = maxDecimal + 1;
  const dirName = `phase-${padPhase(current)}.${next}`;
  const dirPath = path.join(taskDir, 'phases', dirName);
  fs.mkdirSync(dirPath, { recursive: true });
  out({ phase: `${current}.${next}`, dir: `phases/${dirName}` });
};

// 13. init-task
commands['init-task'] = function (args) {
  const taskDir = resolveTaskDir(args);
  const name = args.name;
  if (!name) fail('--name required');

  fs.mkdirSync(taskDir, { recursive: true });
  const config = {
    task_name: name,
    created: today(),
    stage: 'discussion',
    discussion_sessions: 0,
    decisions_count: 0
  };
  writeJSON(path.join(taskDir, 'config.json'), config);
  out({ created: true });
};

// ── Dispatch ─────────────────────────────────────────

const cmd = process.argv[2];
const args = parseArgs(process.argv.slice(3));

if (!cmd || cmd === '--help') {
  const cmds = Object.keys(commands).join(', ');
  console.error(`Usage: specd-utils <command> [options]\nCommands: ${cmds}`);
  process.exit(cmd ? 0 : 1);
}

if (!commands[cmd]) {
  fail(`Unknown command: ${cmd}`);
}

try {
  commands[cmd](args);
} catch (e) {
  fail(e.message);
}
