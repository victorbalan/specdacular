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

// ─── specd-runner init ────────────────────────────────────────────
program
  .command('init')
  .description('Initialize .specd/runner/ config in current project')
  .option('-d, --dir <dir>', 'Project directory', process.cwd())
  .action((opts) => {
    const repoPath = path.resolve(opts.dir);
    const configDir = path.join(repoPath, '.specd', 'runner');
    const tasksDir = path.join(configDir, 'tasks');

    if (fs.existsSync(path.join(configDir, 'config.yaml'))) {
      console.log(`Already initialized: ${configDir}`);
      console.log('Use "specd-runner register" to register this project with the daemon.');
      return;
    }

    fs.mkdirSync(tasksDir, { recursive: true });

    fs.writeFileSync(path.join(configDir, 'config.yaml'), `server:
  port: 3700

notifications:
  telegram:
    enabled: false

defaults:
  pipeline: default
  failure_policy: skip
  timeout: 3600
  stuck_timeout: 1800
  max_parallel: 1
`);

    fs.writeFileSync(path.join(configDir, 'agents.yaml'), `agents:
  claude-planner:
    cmd: "claude -p --dangerously-skip-permissions"
    input_mode: stdin
    output_format: json_block
    system_prompt: |
      You are a feature planner working on: {{task.name}} ({{task.id}})
      Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})

      Research the codebase, then create a detailed implementation plan.
      Write the plan to .specd/plans/{{task.id}}-plan.md and commit it.

      Emit progress:
      \\\`\\\`\\\`specd-status
      {"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"...","percent":0,"files_touched":[]}
      \\\`\\\`\\\`

      When done:
      \\\`\\\`\\\`specd-result
      {"status":"success","summary":"...","files_changed":[],"issues":[],"next_suggestions":[]}
      \\\`\\\`\\\`

  claude-implementer:
    cmd: "claude -p --dangerously-skip-permissions"
    input_mode: stdin
    output_format: json_block
    system_prompt: |
      You are implementing: {{task.name}} ({{task.id}})
      Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})

      Follow the plan. Write clean code. Commit your work with git.

      Emit progress and result blocks as above.

  claude-reviewer:
    cmd: "claude -p --dangerously-skip-permissions"
    input_mode: stdin
    output_format: json_block
    system_prompt: |
      You are reviewing: {{task.name}} ({{task.id}})
      Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})

      Review the implementation. Write review to .specd/reviews/{{task.id}}-review.md.
      Set status to failure if critical issues found.

      Emit progress and result blocks as above.
`);

    fs.writeFileSync(path.join(configDir, 'pipelines.yaml'), `pipelines:
  default:
    stages:
      - stage: plan
        agent: claude-planner
        critical: true
      - stage: implement
        agent: claude-implementer
        critical: true
      - stage: review
        agent: claude-reviewer
        on_fail: retry
        max_retries: 2

  quick-implement:
    stages:
      - stage: implement
        agent: claude-implementer
        critical: true

  plan-only:
    stages:
      - stage: plan
        agent: claude-planner
        critical: true
`);

    fs.writeFileSync(path.join(configDir, '.gitignore'), `status.json
logs/
`);

    console.log(`Initialized: ${configDir}`);
    console.log(`\nCreated:`);
    console.log(`  config.yaml     — settings (timeouts, parallel, notifications)`);
    console.log(`  agents.yaml     — agent definitions with system prompts`);
    console.log(`  pipelines.yaml  — pipeline definitions (default, quick-implement, plan-only)`);
    console.log(`  tasks/          — drop task YAML files here`);
    console.log(`  .gitignore      — excludes runtime files`);
    console.log(`\nNext steps:`);
    console.log(`  1. Edit agents.yaml to customize for your project`);
    console.log(`  2. Create a task: .specd/runner/tasks/001-my-feature.yaml`);
    console.log(`  3. Register:  specd-runner register`);
    console.log(`  4. Start:     specd-runner start`);
  });

program.parse();
