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
  constructor({ configDir, tasksDir, statusPath, logsDir, projectName }) {
    this.configDir = configDir;
    this.tasksDir = tasksDir || path.join(configDir, 'tasks');
    this.statusPath = statusPath || path.join(configDir, 'status.json');
    this.logsDir = logsDir || path.join(configDir, 'logs');
    this.projectName = projectName || 'default';

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

    // Restore completed tasks from status.json (survives restarts)
    this._restoreState();

    // Also mark tasks as done in YAML if status.json says they're done
    // (handles case where orchestrator crashed before updating YAML)
    this._syncTaskYamlStatuses();

    const maxParallel = this.config.defaults.max_parallel || 1;
    if (maxParallel > 1) {
      const repoRoot = this._findGitRoot();
      if (repoRoot) {
        this.worktreeManager = new WorktreeManager(repoRoot);
      }
    }
  }

  _restoreState() {
    if (!fs.existsSync(this.statusPath)) return;

    try {
      const saved = JSON.parse(fs.readFileSync(this.statusPath, 'utf8'));
      // Restore completed tasks set
      for (const [taskId, task] of Object.entries(saved.tasks || {})) {
        if (task.status === 'done') {
          this.completedTasks.add(taskId);
        }
      }
      // Restore the full state so dashboard shows history
      this.stateManager.state = saved;
      this.stateManager.state.started_at = new Date().toISOString();

      const completed = this.completedTasks.size;
      if (completed > 0) {
        console.log(`Restored ${completed} completed task(s) from previous run.`);
      }
    } catch (e) {
      console.error(`Failed to restore state: ${e.message}`);
    }
  }

  _syncTaskYamlStatuses() {
    const yaml = require('js-yaml');
    for (const taskId of this.completedTasks) {
      const taskFile = path.join(this.tasksDir, `${taskId}.yaml`);
      if (!fs.existsSync(taskFile)) continue;
      try {
        const data = yaml.load(fs.readFileSync(taskFile, 'utf8'));
        if (data.status === 'ready' || data.status === 'in_progress') {
          data.status = 'done';
          fs.writeFileSync(taskFile, yaml.dump(data));
          console.log(`[${taskId}] Updated YAML status to done`);
        }
      } catch (e) { /* ignore parse errors */ }
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

  _isPickable(task, excludeSet) {
    // Only pick tasks with status: ready
    if (task.status !== 'ready') return false;
    if (this.completedTasks.has(task.id)) return false;
    if (excludeSet.has(task.id)) return false;
    const deps = task.depends_on || [];
    return deps.every(dep => this.completedTasks.has(dep));
  }

  pickNextTask() {
    const ready = this.tasks
      .filter(t => this._isPickable(t, this.runningTasks))
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
    return ready[0] || null;
  }

  pickNextTasks(count) {
    const tasks = [];
    const tempRunning = new Set(this.runningTasks);
    for (let i = 0; i < count; i++) {
      const ready = this.tasks
        .filter(t => this._isPickable(t, tempRunning))
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

    console.log(`[${task.id}] Starting "${task.name}" in ${workDir ? 'worktree: ' + workDir : 'project dir: ' + projectDir}`);
    console.log(`[${task.id}] Pipeline: ${pipelineName} (${pipeline.stages.length} stages: ${pipeline.stages.map(s => s.stage).join(' → ')})`);

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
      onStageStart: (stage, attempt) => {
        const retryStr = attempt > 0 ? ` (retry ${attempt})` : '';
        console.log(`[${task.id}] Stage: ${stage.stage}${retryStr} → ${stage.agent || stage.cmd}`);
        this._appendLog(task.id, `\n--- Stage: ${stage.stage} (${stage.agent || stage.cmd})${retryStr} ---\n`);
        this.stateManager.startStage(task.id, { stage: stage.stage, agent: stage.agent });
        this.stateManager.persist();
      },
      onStageComplete: async (stage, result) => {
        const icon = result.status === 'success' ? '✓' : '✗';
        console.log(`[${task.id}] ${icon} ${stage.stage}: ${result.summary || result.status}`);
        this.stateManager.completeStage(task.id, result.status, result.summary);
        this.stateManager.persist();

        // Push and create/update PR after every stage
        if (result.status === 'success') {
          try {
            await this._pushAndPR(task, projectDir, pipeline);
          } catch (e) {
            console.error(`[${task.id}] Push/PR failed: ${e.message}`);
          }
        }
      },
      onProgress: (stage, progress) => {
        this.stateManager.updateLiveProgress(task.id, progress);
        this.stateManager.persist();
      },
    });

    const result = await sequencer.run();

    const finalStatus = result.status === 'success' ? 'done' : 'failed';
    console.log(`[${task.id}] ${finalStatus === 'done' ? '✓ Completed' : '✗ Failed'}${result.failedStage ? ' at stage: ' + result.failedStage : ''}`);
    this.stateManager.updateTaskStatus(task.id, finalStatus);
    this.stateManager.persist();

    if (finalStatus === 'done') {
      this.completedTasks.add(task.id);
    }

    // Update the task YAML file status so it won't be re-picked on restart
    this._updateTaskYamlStatus(task.id, finalStatus);

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

  async _pushAndPR(task, projectDir, pipeline) {
    const { execSync } = require('child_process');
    const branchName = `specd/${task.id}`;

    try {
      const repoRoot = this._findGitRoot();
      if (!repoRoot) return; // not a git repo
      execSync(`git rev-parse --verify "${branchName}"`, { cwd: repoRoot, stdio: 'pipe' });

      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot, stdio: 'pipe' }).toString().trim();
      const mergeBase = execSync(`git merge-base "${currentBranch}" "${branchName}"`, { cwd: repoRoot, stdio: 'pipe' }).toString().trim();
      const count = parseInt(execSync(`git rev-list --count ${mergeBase}..${branchName}`, { cwd: repoRoot, stdio: 'pipe' }).toString().trim());

      if (count === 0) return; // nothing to push

      // Push
      console.log(`[${task.id}] Pushing ${count} commit(s)...`);
      execSync(`git push -u origin "${branchName}"`, { cwd: projectDir, stdio: 'pipe' });

      // Check if PR already exists
      let prUrl = this.stateManager.getState().tasks[task.id]?.pr_url;
      if (prUrl && prUrl !== 'none') {
        // PR exists — update the body with latest stage info
        console.log(`[${task.id}] PR exists, updating...`);
        const body = this._buildPRBody(task);
        try {
          execSync(`gh pr edit "${branchName}" --body-file -`, {
            cwd: repoRoot, stdio: ['pipe', 'pipe', 'pipe'], input: body
          });
        } catch (e) { /* ignore update failures */ }
        return;
      }

      // Create PR
      console.log(`[${task.id}] Creating PR...`);
      const baseBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot, stdio: 'pipe' }).toString().trim();
      const title = task.name.length > 70 ? task.name.substring(0, 67) + '...' : task.name;
      const body = this._buildPRBody(task);

      try {
        prUrl = execSync(
          `gh pr create --base "${baseBranch}" --head "${branchName}" --title "${title.replace(/"/g, '\\"')}" --body-file -`,
          { cwd: repoRoot, stdio: ['pipe', 'pipe', 'pipe'], input: body }
        ).toString().trim();

        console.log(`[${task.id}] PR: ${prUrl}`);
        this.stateManager.setPrUrl(task.id, prUrl);
        this.stateManager.persist();
        this._writePrUrlToYaml(task.id, prUrl);
        this._appendLog(task.id, `\n--- PR Created: ${prUrl} ---\n`);
      } catch (e) {
        // PR might already exist
        const stderr = e.stderr?.toString() || '';
        if (stderr.includes('already exists')) {
          try {
            prUrl = execSync(`gh pr view "${branchName}" --json url --jq .url`, { cwd: repoRoot, stdio: 'pipe' }).toString().trim();
            if (prUrl) {
              this.stateManager.setPrUrl(task.id, prUrl);
              this.stateManager.persist();
              console.log(`[${task.id}] PR already exists: ${prUrl}`);
            }
          } catch (e2) { /* give up */ }
        } else {
          console.error(`[${task.id}] PR creation failed: ${stderr}`);
        }
      }
    } catch (e) {
      // Branch doesn't exist or other git error — skip
    }
  }

  _buildPRBody(task) {
    const state = this.stateManager.getState().tasks[task.id];
    const stages = state?.stages || [];

    let body = `## ${task.name}\n\n`;

    // Stage summary table
    body += '| Stage | Status | Summary |\n|-------|--------|--------|\n';
    for (const s of stages) {
      const icon = s.status === 'success' ? 'done' : s.status === 'running' ? 'running' : s.status;
      body += `| ${s.stage} | ${icon} | ${(s.summary || '').substring(0, 80)} |\n`;
    }

    body += `\n## Task\n\n\`${task.id}\`\n`;

    if (task.description) {
      body += `\n## Description\n\n${typeof task.description === 'string' ? task.description.substring(0, 500) : ''}\n`;
    }

    body += '\n---\n_Updated by specd-runner_\n';
    return body;
  }

  _updateTaskYamlStatus(taskId, status) {
    const taskFile = path.join(this.tasksDir, `${taskId}.yaml`);
    if (!fs.existsSync(taskFile)) return;
    try {
      const yaml = require('js-yaml');
      const data = yaml.load(fs.readFileSync(taskFile, 'utf8'));
      data.status = status;
      fs.writeFileSync(taskFile, yaml.dump(data));
    } catch (e) {
      console.error(`[${taskId}] Failed to update YAML status: ${e.message}`);
    }
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
    // Skip if PR already exists or was already attempted
    const taskState = this.stateManager.getState().tasks[taskId];
    if (taskState?.pr_url) return taskState.pr_url;

    // Check if the task YAML already has a pr_url (including 'none')
    const taskFile = path.join(this.tasksDir, `${taskId}.yaml`);
    if (fs.existsSync(taskFile)) {
      const yaml = require('js-yaml');
      const data = yaml.load(fs.readFileSync(taskFile, 'utf8'));
      if (data.pr_url) {
        this.stateManager.setPrUrl(taskId, data.pr_url);
        this.stateManager.persist();
        return data.pr_url;
      }
    }

    if (!this.worktreeManager) {
      // No worktree manager — mark as no PR needed
      this._markNoPR(taskId, 'no worktree manager');
      return null;
    }

    // Check if the branch exists
    const branchName = `specd/${taskId}`;
    try {
      const { execSync } = require('child_process');
      const repoRoot = this._findGitRoot();
      execSync(`git rev-parse --verify "${branchName}"`, { cwd: repoRoot, stdio: 'pipe' });
    } catch (e) {
      // Branch doesn't exist — mark so we don't retry
      this._markNoPR(taskId, 'no branch found');
      return null;
    }

    // Check if branch actually has changes
    if (!this.worktreeManager.hasChanges(taskId)) {
      this._markNoPR(taskId, 'no changes on branch');
      return null;
    }

    const prUrl = await this.worktreeManager.createPR(taskId, taskName, summary);
    if (prUrl) {
      this.stateManager.setPrUrl(taskId, prUrl);
      this.stateManager.persist();
      this._writePrUrlToYaml(taskId, prUrl);
      this._appendLog(taskId, `\n--- PR Created: ${prUrl} ---\n`);
      console.log(`[${taskId}] PR: ${prUrl}`);
    } else {
      // createPR failed — mark so we don't infinite loop
      this._markNoPR(taskId, 'gh pr create failed');
    }
    return prUrl;
  }

  _markNoPR(taskId, reason) {
    console.log(`[${taskId}] No PR: ${reason}`);
    // Use 'none' as a sentinel so the sweep stops retrying
    this.stateManager.setPrUrl(taskId, 'none');
    this.stateManager.persist();
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
    const needsPR = Object.entries(state.tasks)
      .filter(([_, t]) => t.status === 'done' && !t.pr_url);

    if (needsPR.length === 0) return;

    console.log(`[sweep] ${needsPR.length} done task(s) without PR`);
    for (const [taskId, task] of needsPR) {
      const summary = task.stages
        ?.map(s => s.summary).filter(Boolean).join('\n- ') || '';
      await this._createPRForTask(taskId, task.name, summary, null);
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

    const readyCount = this.tasks.filter(t => t.status === 'ready').length;
    console.log(`\n${readyCount} task(s) ready, ${this.completedTasks.size} completed, max_parallel: ${maxParallel}\n`);

    while (this.running) {
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
            await this.runTask(task, cwd);
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
