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
