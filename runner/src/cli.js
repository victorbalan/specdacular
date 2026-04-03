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
