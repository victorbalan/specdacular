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

      console.log(`Orchestrator running. Watching ${configDir}/tasks/ for work.`);
      console.log('Press Ctrl+C to stop.\n');

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
