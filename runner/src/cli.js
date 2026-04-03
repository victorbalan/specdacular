#!/usr/bin/env node

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

function resolveConfigDir(dir) {
  const projectDir = path.resolve(dir);
  const configDir = path.join(projectDir, '.specd', 'runner');
  if (!fs.existsSync(configDir)) {
    console.error(`Config directory not found: ${configDir}`);
    console.error('Ensure .specd/runner/ exists with config.yaml, agents.yaml, pipelines.yaml');
    process.exit(1);
  }
  return { projectDir, configDir };
}

function setupShutdown(orchestrator, server) {
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) {
      console.log('Force exiting...');
      process.exit(1);
    }
    shuttingDown = true;
    console.log('\nShutting down...');
    orchestrator.stop();
    try { await server.stop(); } catch (e) { /* ignore */ }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// ─── specd-runner start ───────────────────────────────────────────
// Runs the orchestrator + API. No static dashboard served.
// The dashboard is started separately with `specd-runner ui`.
program
  .command('start')
  .description('Start the orchestrator daemon + API server')
  .option('-p, --port <port>', 'API port', '3700')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action(async (opts) => {
    const { configDir } = resolveConfigDir(opts.dir);
    const port = parseInt(opts.port);

    try {
      const orchestrator = new Orchestrator(configDir);
      await orchestrator.init();

      // Telegram notifications
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

      const server = createServer(orchestrator, port);
      await server.start();

      console.log(`API server:    http://localhost:${port}`);
      console.log(`Watching:      ${configDir}/tasks/`);
      console.log(`Dashboard:     run "specd-runner ui" in another terminal\n`);
      console.log('Press Ctrl+C to stop.\n');

      setupShutdown(orchestrator, server);
      await orchestrator.startLoop();
    } catch (err) {
      console.error(`Failed to start: ${err.message}`);
      process.exit(1);
    }
  });

// ─── specd-runner ui ──────────────────────────────────────────────
// Runs the Vite dev server for the dashboard, proxying API to the runner.
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

    // Update vite proxy target dynamically
    console.log(`Dashboard:  http://localhost:${uiPort}`);
    console.log(`Proxying:   API -> http://localhost:${apiPort}\n`);

    const vite = spawn('npx', ['vite', '--port', String(uiPort)], {
      cwd: dashboardDir,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        VITE_API_PORT: String(apiPort),
      },
    });

    vite.on('close', (code) => process.exit(code || 0));
    process.on('SIGINT', () => { vite.kill(); process.exit(0); });
    process.on('SIGTERM', () => { vite.kill(); process.exit(0); });
  });

// ─── specd-runner status ──────────────────────────────────────────
program
  .command('status')
  .description('Show current run status')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action(async (opts) => {
    const { configDir } = resolveConfigDir(opts.dir);
    const statusPath = path.join(configDir, 'status.json');

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
