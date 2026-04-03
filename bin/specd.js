#!/usr/bin/env node

// bin/specd.js — unified CLI entry point
// Usage:
//   specd llm-init [--local]        — install commands/agents/workflows
//   specd install-runner             — install runner dependencies (express, ws, electron)
//   specd runner                     — launch Electron app
//   specd runner register <path>     — register a folder
//   specd runner unregister <id>     — remove a project
//   specd runner projects            — list projects
//   specd runner status              — show task status

import { resolve, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir, platform } from 'os';
import { execSync, spawn } from 'child_process';

const args = process.argv.slice(2);
const command = args[0];

const runnerDir = join(import.meta.dirname, '..', 'runner');

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

function isRunnerInstalled() {
  return existsSync(join(runnerDir, 'node_modules', 'express'));
}

function requireRunner() {
  if (!isRunnerInstalled()) {
    console.error('Runner dependencies not installed. Run: specd install-runner');
    process.exit(1);
  }
}

if (command === 'llm-init') {
  const installScript = join(import.meta.dirname, 'install.js');
  const isLocal = args.includes('--local');
  process.argv = ['node', installScript, isLocal ? '--local' : '--global'];
  await import(installScript);

} else if (command === 'install-runner') {
  console.log('Installing runner dependencies...');
  execSync('npm install --omit=dev', { cwd: runnerDir, stdio: 'inherit' });

  // Also install renderer deps and build
  const rendererDir = join(runnerDir, 'renderer');
  if (existsSync(join(rendererDir, 'package.json'))) {
    console.log('Installing renderer dependencies...');
    execSync('npm install', { cwd: rendererDir, stdio: 'inherit' });
    console.log('Building renderer...');
    execSync('npm run build', { cwd: rendererDir, stdio: 'inherit' });
  }

  console.log('Runner installed. Run: specd runner');

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
    requireRunner();

    const electronPath = join(runnerDir, 'node_modules', '.bin', 'electron');
    if (!existsSync(electronPath)) {
      console.error('Electron not installed. Run: specd install-runner');
      process.exit(1);
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
  console.log('  specd llm-init [--local]      Install Claude Code commands/agents');
  console.log('  specd install-runner           Install runner dependencies');
  console.log('  specd runner                   Launch the Specd Runner app');
  console.log('  specd runner register <path>   Register a project folder');
  console.log('  specd runner unregister <id>   Remove a project');
  console.log('  specd runner projects          List registered projects');
  console.log('  specd runner status            Show task status');
}
