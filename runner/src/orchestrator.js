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
    this.runningTasks = new Set();
  }

  async init() {
    const loader = new ConfigLoader(this.configDir);
    const all = await loader.loadAll();
    this.config = all.config;
    this.agents = all.agents;
    this.pipelines = all.pipelines;
    this.tasks = all.tasks;

    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    const maxParallel = this.config.defaults.max_parallel || 1;
    if (maxParallel > 1) {
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

  async runTask(task, workDir) {
    // workDir = worktree path for parallel execution, or null for sequential
    // If null, use the project root (parent of .specd)
    const projectDir = workDir || this._findGitRoot() || path.dirname(this.configDir);

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

    let specContent = task.description || '';
    if (task.spec) {
      const specPath = path.resolve(path.dirname(this.configDir), task.spec);
      if (fs.existsSync(specPath)) {
        specContent = fs.readFileSync(specPath, 'utf8');
      }
    }

    console.log(`[${task.id}] Starting in ${workDir ? 'worktree: ' + workDir : 'project dir: ' + projectDir}`);

    const sequencer = new StageSequencer({
      stages: pipeline.stages,
      createRunner: (stage) => {
        const agentConfig = this.agents[stage.agent];
        if (!agentConfig && stage.cmd) {
          return this._createCmdRunner(stage, projectDir);
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

        const runner = new AgentRunner(agentConfig, { timeout, stuckTimeout, cwd: projectDir });

        runner.on('status', (status) => {
          this.stateManager.updateLiveProgress(task.id, status);
          this.stateManager.persist();
        });

        runner.on('output', (line) => {
          this._appendLog(task.id, line);
        });

        const origRun = runner.run.bind(runner);
        runner.run = () => origRun(fullPrompt);

        return runner;
      },
      onStageStart: (stage) => {
        this._appendLog(task.id, `\n--- Stage: ${stage.stage} (${stage.agent || stage.cmd}) ---\n`);
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

  _createCmdRunner(stage, cwd) {
    const { spawn } = require('child_process');
    return {
      run: () => new Promise((resolve) => {
        const proc = spawn(stage.cmd, [], { shell: true, stdio: ['ignore', 'pipe', 'pipe'], cwd });
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

  _appendLog(taskId, line) {
    const logFile = path.join(this.logsDir, `${taskId}.log`);
    fs.appendFileSync(logFile, line + '\n');
  }

  /**
   * Create a PR for a task's worktree branch and record the URL.
   * Called after task success, and also by the periodic sweep.
   */
  async _createPRForTask(taskId, taskName, summary, cwd) {
    // Skip if PR already exists for this task
    const taskState = this.stateManager.getState().tasks[taskId];
    if (taskState?.pr_url) return taskState.pr_url;

    // Check if the task YAML already has a pr_url
    const taskFile = path.join(this.tasksDir, `${taskId}.yaml`);
    if (fs.existsSync(taskFile)) {
      const yaml = require('js-yaml');
      const data = yaml.load(fs.readFileSync(taskFile, 'utf8'));
      if (data.pr_url) {
        // Already has a PR — record it in state
        this.stateManager.setPrUrl(taskId, data.pr_url);
        this.stateManager.persist();
        return data.pr_url;
      }
    }

    if (!this.worktreeManager) return null;

    // The worktree might already be cleaned up. Check if the branch exists.
    const branchName = `specd/${taskId}`;
    try {
      const { execSync } = require('child_process');
      const repoRoot = this._findGitRoot();
      execSync(`git rev-parse --verify "${branchName}"`, { cwd: repoRoot, stdio: 'pipe' });
    } catch (e) {
      // Branch doesn't exist — nothing to PR
      return null;
    }

    const prUrl = await this.worktreeManager.createPR(taskId, taskName, summary);
    if (prUrl) {
      // Save to state
      this.stateManager.setPrUrl(taskId, prUrl);
      this.stateManager.persist();

      // Save to task YAML
      this._writePrUrlToYaml(taskId, prUrl);

      this._appendLog(taskId, `\n--- PR Created: ${prUrl} ---\n`);
      console.log(`[${taskId}] PR: ${prUrl}`);
    }
    return prUrl;
  }

  /**
   * Write the PR URL back into the task YAML file.
   */
  _writePrUrlToYaml(taskId, prUrl) {
    const taskFile = path.join(this.tasksDir, `${taskId}.yaml`);
    if (!fs.existsSync(taskFile)) return;
    try {
      const yaml = require('js-yaml');
      const data = yaml.load(fs.readFileSync(taskFile, 'utf8'));
      data.pr_url = prUrl;
      data.status = 'done';
      fs.writeFileSync(taskFile, yaml.dump(data));
    } catch (e) {
      console.error(`[${taskId}] Failed to write PR URL to YAML: ${e.message}`);
    }
  }

  /**
   * Sweep all done tasks and create PRs for any that are missing one.
   */
  async sweepPRs() {
    const state = this.stateManager.getState();
    for (const [taskId, task] of Object.entries(state.tasks)) {
      if (task.status === 'done' && !task.pr_url) {
        console.log(`[${taskId}] Sweep: creating missing PR...`);
        const summary = task.stages
          ?.map(s => s.summary).filter(Boolean).join('\n- ') || '';
        await this._createPRForTask(taskId, task.name, summary, null);
      }
    }
  }

  async runOnce() {
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

    // Run PR sweep on startup to catch any done tasks missing PRs
    await this.sweepPRs();

    let lastSweep = Date.now();
    const sweepInterval = 60000; // sweep every 60s

    while (this.running) {
      // Periodic PR sweep
      if (Date.now() - lastSweep > sweepInterval) {
        await this.sweepPRs();
        lastSweep = Date.now();
      }
      const loader = new ConfigLoader(this.configDir);
      this.tasks = await loader.loadTasks();

      const available = maxParallel - this.runningTasks.size;
      if (available <= 0) {
        await new Promise(r => setTimeout(r, interval));
        continue;
      }

      const tasks = this.pickNextTasks(available);
      if (tasks.length === 0) {
        await new Promise(r => setTimeout(r, interval));
        continue;
      }

      for (const task of tasks) {
        this.runningTasks.add(task.id);
        console.log(`[${task.id}] Launching (${this.runningTasks.size}/${maxParallel} slots used)`);

        // Fire and don't await — let tasks run concurrently
        const taskPromise = (async () => {
          let cwd = null;
          if (this.worktreeManager && maxParallel > 1) {
            try {
              cwd = await this.worktreeManager.create(task.id);
            } catch (e) {
              console.error(`[${task.id}] Failed to create worktree: ${e.message}`);
            }
          }
          try {
            const result = await this.runTask(task, cwd);

            // Create PR if task succeeded
            if (result.status === 'success') {
              const summary = result.results
                ?.map(r => r.result?.summary).filter(Boolean).join('\n- ') || '';
              await this._createPRForTask(task.id, task.name, summary, cwd);
            }
          } finally {
            this.runningTasks.delete(task.id);
            console.log(`[${task.id}] Finished (${this.runningTasks.size}/${maxParallel} slots used)`);
            if (this.worktreeManager && maxParallel > 1) {
              try { await this.worktreeManager.remove(task.id); } catch (e) { /* ignore */ }
            }
          }
        })();

        // Don't await — let it run in background
        taskPromise.catch(e => console.error(`[${task.id}] Unhandled error: ${e.message}`));
      }

      await new Promise(r => setTimeout(r, interval));
    }
  }

  stop() {
    this.running = false;
    if (this.taskWatcher) this.taskWatcher.close();
  }
}

module.exports = { Orchestrator };
