// runner/main/orchestrator.js
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import { StateManager } from './state/manager.js';
import { TemplateManager } from './template-manager.js';
import { AgentRunner } from './agent/runner.js';
import { StageSequencer } from './pipeline/sequencer.js';
import { resolvePipeline } from './pipeline/resolver.js';
import { resolveTemplate, buildTemplateContext } from './agent/template.js';
import { WorktreeManager } from './worktree/manager.js';
import { createLogger } from './logger.js';

const log = createLogger('orchestrator', '\x1b[35m');

export class Orchestrator extends EventEmitter {
  constructor({ projectId, paths, config }) {
    super();
    this.projectId = projectId;
    this.paths = paths;
    this.config = config;
    this.projectPaths = paths.forProject(projectId);
    this.stateManager = new StateManager(this.projectPaths.statusJson);
    this.templateManager = new TemplateManager(paths);
    this.running = false;
    this.runningTasks = new Set();
    this.worktreeManager = null;
    this.activeRunners = new Set();
  }

  init() {
    log.info(`initializing project ${this.projectId}`);
    mkdirSync(this.projectPaths.tasksDir, { recursive: true });
    mkdirSync(this.projectPaths.logsDir, { recursive: true });

    // Load project config
    const projectJson = JSON.parse(readFileSync(this.projectPaths.projectJson, 'utf-8'));
    this.projectPath = projectJson.path;

    // Always init worktree manager — every task gets its own branch + worktree
    if (existsSync(join(this.projectPath, '.git'))) {
      this.worktreeManager = new WorktreeManager(this.projectPath);
      log.info(`worktree manager initialized for ${this.projectPath}`);
    }

    // Resume or reset tasks from previous run
    for (const task of this.getTasks()) {
      if (task.status === 'in_progress' || task.status === 'planning') {
        const completedStages = this.stateManager.getCompletedStages(task.id);
        if (completedStages.length > 0) {
          log.info(`resuming task ${task.id}: "${task.name}" (${completedStages.length} stages completed)`);
          this._resumeTask(task, completedStages);
        } else {
          const resetStatus = task.status === 'planning' ? 'idea' : 'ready';
          log.warn(`resetting task ${task.id} (no completed stages) → ${resetStatus}`);
          this.updateTask(task.id, { status: resetStatus });
        }
      }
    }

    // Forward state events
    this.stateManager.on('change', (event) => {
      this.emit('change', { ...event, project: this.projectId });
    });
  }

  getTasks() {
    const tasksDir = this.projectPaths.tasksDir;
    if (!existsSync(tasksDir)) return [];
    return readdirSync(tasksDir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(readFileSync(join(tasksDir, f), 'utf-8')));
  }

  getTask(taskId) {
    const taskPath = join(this.projectPaths.tasksDir, `${taskId}.json`);
    if (!existsSync(taskPath)) return null;
    return JSON.parse(readFileSync(taskPath, 'utf-8'));
  }

  createTask(task) {
    mkdirSync(this.projectPaths.tasksDir, { recursive: true });
    const taskPath = join(this.projectPaths.tasksDir, `${task.id}.json`);
    writeFileSync(taskPath, JSON.stringify(task, null, 2));
    return task;
  }

  updateTask(taskId, updates) {
    const task = this.getTask(taskId);
    if (!task) return null;
    const updated = { ...task, ...updates };
    const taskPath = join(this.projectPaths.tasksDir, `${taskId}.json`);
    writeFileSync(taskPath, JSON.stringify(updated, null, 2));
    return updated;
  }

  createIdea(name, description, autoExecute) {
    log.info(`creating idea: "${name}" (auto_execute: ${!!autoExecute})`);
    const id = `idea-${Date.now().toString(36)}`;
    const task = {
      id,
      name,
      description: description || '',
      project_id: this.projectId,
      working_dir: '.',
      pipeline: null,
      status: 'idea',
      priority: 10,
      depends_on: [],
      spec: '',
      feedback: '',
      auto_execute: !!autoExecute,
      pr_url: null,
      created_at: new Date().toISOString(),
    };
    return this.createTask(task);
  }

  async advanceTask(taskId, action, feedback) {
    log.info(`advance ${taskId} → ${action}${feedback ? ' (with feedback)' : ''}`);
    const task = this.getTask(taskId);
    if (!task) return null;

    if (action === 'plan') {
      if (feedback) {
        this.updateTask(taskId, { status: 'planning', feedback });
      } else {
        this.updateTask(taskId, { status: 'planning' });
      }

      this._runBrainstormPipeline(task, []).catch(err => {
        console.error(`Brainstorm failed for ${taskId}:`, err);
        this.updateTask(taskId, { status: 'failed', failed_pipeline: 'brainstorm' });
        this.stateManager.updateTaskStatus(taskId, 'failed');
        this.stateManager.persist();
      });

      return this.getTask(taskId);
    }

    if (action === 'approve') {
      this.updateTask(taskId, { status: 'ready' });
      return this.getTask(taskId);
    }

    if (action === 're-plan') {
      const updatedFeedback = [task.feedback, feedback].filter(Boolean).join('\n\n---\n\n');
      this.updateTask(taskId, { status: 'planning', feedback: updatedFeedback });

      this._runBrainstormPipeline({ ...task, feedback: updatedFeedback }, []).catch(err => {
        console.error(`Re-plan failed for ${taskId}:`, err);
        this.updateTask(taskId, { status: 'failed', failed_pipeline: 'brainstorm' });
        this.stateManager.updateTaskStatus(taskId, 'failed');
        this.stateManager.persist();
      });

      return this.getTask(taskId);
    }

    if (action === 'retry' || action === 'retry-fresh') {
      // Clean slate: remove worktree/branch, clear all state
      if (this.worktreeManager) {
        try { this.worktreeManager.remove(taskId, true); } catch {}
      }
      this.stateManager.clearTask(taskId);
      this.updateTask(taskId, {
        status: 'idea',
        failed_pipeline: null,
        pr_url: null,
        spec: '',
        feedback: '',
        completed_stages: null,
      });
      return this.getTask(taskId);
    }

    if (action === 'retry-feedback') {
      const updatedFeedback = [task.feedback, feedback].filter(Boolean).join('\n\n---\n\n');
      if (task.failed_pipeline === 'brainstorm') {
        this.updateTask(taskId, { status: 'planning', feedback: updatedFeedback, failed_pipeline: null });
        this._runBrainstormPipeline({ ...task, feedback: updatedFeedback }, []).catch(err => {
          console.error(`Retry brainstorm failed for ${taskId}:`, err);
          this.updateTask(taskId, { status: 'failed', failed_pipeline: 'brainstorm' });
          this.stateManager.updateTaskStatus(taskId, 'failed');
          this.stateManager.persist();
        });
      } else {
        this.stateManager.clearTask(taskId);
        this.updateTask(taskId, { status: 'ready', feedback: updatedFeedback, failed_pipeline: null, completed_stages: null });
      }
      return this.getTask(taskId);
    }

    return null;
  }

  async _runBrainstormPipeline(task, completedStages) {
    log.info(`starting brainstorm pipeline for ${task.id}: "${task.name}"`);
    const agents = this.templateManager.getAgents(this.projectId);
    const pipelines = this.templateManager.getPipelines(this.projectId);
    const pipeline = resolvePipeline('brainstorm', pipelines, null, this.config.defaults);

    this.stateManager.registerTask(task.id, { name: task.name, pipeline: 'brainstorm' });
    this.stateManager.updateTaskStatus(task.id, 'planning');
    this.updateTask(task.id, { last_pipeline: 'brainstorm' });

    const prompt = [task.name, task.description, task.feedback].filter(Boolean).join('\n\n');
    const logPath = join(this.projectPaths.logsDir, `${task.id}.log`);

    // Create worktree for this task
    let cwd = this.projectPath;
    if (this.worktreeManager) {
      try {
        cwd = this.worktreeManager.create(task.id);
        log.info(`created worktree for ${task.id} at ${cwd}`);
      } catch (err) {
        log.warn(`worktree creation failed for ${task.id}: ${err.message}, using project dir`);
      }
    }

    const sequencer = new StageSequencer({
      stages: pipeline.stages,
      completedStages: completedStages || [],
      createRunner: (stage, previousOutput) => {
        const agentDef = agents[stage.agent];
        if (!agentDef) throw new Error(`Agent not found: ${stage.agent}`);

        const context = buildTemplateContext(task, stage, pipeline, this.projectPaths, previousOutput);
        const resolvedPrompt = resolveTemplate(agentDef.system_prompt || '', context);

        const runner = new AgentRunner({
          ...agentDef,
          system_prompt: resolvedPrompt,
          timeout: stage.timeout,
          stuck_timeout: this.config.defaults?.stuck_timeout,
        });

        runner.on('status', (s) => this.stateManager.updateLiveProgress(task.id, s));
        runner.on('output', () => this.stateManager.persist());

        this.activeRunners.add(runner);
        return {
          run: () => {
            const p = runner.run(prompt, { cwd, logPath });
            p.finally(() => this.activeRunners.delete(runner));
            return p;
          }
        };
      },
      onStageStart: async (stage, attempt) => {
        this.stateManager.startStage(task.id, { stage: stage.stage, agent: stage.agent });
        this.stateManager.persist();
      },
      onStageComplete: async (stage, result, attempt) => {
        this.stateManager.completeStage(task.id, result.status, result.summary);
        this.stateManager.persist();
        // Create/update draft PR after each stage
        this._createOrUpdatePR(task.id, task.name, stage.stage, result);
      },
    });

    const result = await sequencer.run();

    if (result.status === 'success') {
      const lastStage = result.results[result.results.length - 1];
      const currentTask = this.getTask(task.id);
      if (currentTask?.auto_execute) {
        log.info(`auto-execute: advancing ${task.id} directly to ready (skipping review)`);
        this.updateTask(task.id, { status: 'ready', spec: lastStage.summary || '' });
        this.stateManager.updateTaskStatus(task.id, 'ready');
      } else {
        this.updateTask(task.id, { status: 'review', spec: lastStage.summary || '' });
        this.stateManager.updateTaskStatus(task.id, 'review');
      }
    } else {
      this.updateTask(task.id, { status: 'failed', failed_pipeline: 'brainstorm' });
      this.stateManager.updateTaskStatus(task.id, 'failed');
    }
    this.stateManager.persist();
  }

  pickNextTask() {
    const tasks = this.getTasks();
    const completedIds = new Set(
      Object.entries(this.stateManager.getState().tasks)
        .filter(([, t]) => t.status === 'done')
        .map(([id]) => id)
    );

    return tasks
      .filter(t => t.status === 'ready' && !this.runningTasks.has(t.id))
      .filter(t => (t.depends_on || []).every(dep => completedIds.has(dep)))
      .sort((a, b) => (a.priority || 99) - (b.priority || 99))[0] || null;
  }

  async runTask(task) {
    log.info(`running task ${task.id}: "${task.name}"`);
    const agents = this.templateManager.getAgents(this.projectId);
    const pipelines = this.templateManager.getPipelines(this.projectId);
    const pipelineName = task.pipeline || this.config.defaults?.pipeline || 'default';
    log.info(`  pipeline: ${pipelineName}`);
    const pipeline = resolvePipeline(pipelineName, pipelines, task.stage_overrides, this.config.defaults);

    const completedStages = task.completed_stages || [];
    if (completedStages.length > 0) {
      log.info(`resuming task ${task.id} with ${completedStages.length} completed stages`);
      this.updateTask(task.id, { completed_stages: null });
    }

    this.runningTasks.add(task.id);
    this.stateManager.registerTask(task.id, { name: task.name, pipeline: pipelineName });
    this.stateManager.updateTaskStatus(task.id, 'in_progress');
    this.updateTask(task.id, { status: 'in_progress', last_pipeline: pipelineName });

    // Create worktree — reuse existing one if brainstorm already created it
    let cwd = this.projectPath;
    if (this.worktreeManager) {
      const existing = this.worktreeManager.getPath(task.id);
      if (existing) {
        cwd = existing;
        log.info(`reusing existing worktree for ${task.id} at ${cwd}`);
      } else {
        try {
          cwd = this.worktreeManager.create(task.id);
          log.info(`created worktree for ${task.id} at ${cwd}`);
        } catch (err) {
          log.warn(`worktree creation failed for ${task.id}: ${err.message}, using project dir`);
        }
      }
    }

    const logPath = join(this.projectPaths.logsDir, `${task.id}.log`);

    const sequencer = new StageSequencer({
      stages: pipeline.stages,
      completedStages,
      createRunner: (stage, previousOutput) => {
        const agentDef = agents[stage.agent];
        if (!agentDef) throw new Error(`Agent not found: ${stage.agent}`);

        const context = buildTemplateContext(task, stage, pipeline, this.projectPaths, previousOutput);
        const resolvedPrompt = resolveTemplate(agentDef.system_prompt || '', context);

        const runner = new AgentRunner({
          ...agentDef,
          system_prompt: resolvedPrompt,
          timeout: stage.timeout,
          stuck_timeout: this.config.defaults?.stuck_timeout,
        });

        runner.on('status', (s) => this.stateManager.updateLiveProgress(task.id, s));
        runner.on('output', () => this.stateManager.persist());

        this.activeRunners.add(runner);
        return {
          run: () => {
            const p = runner.run(task.spec || task.description || task.name, { cwd, logPath });
            p.finally(() => this.activeRunners.delete(runner));
            return p;
          }
        };
      },
      onStageStart: async (stage, attempt) => {
        this.stateManager.startStage(task.id, { stage: stage.stage, agent: stage.agent });
        this.stateManager.persist();
      },
      onStageComplete: async (stage, result, attempt) => {
        this.stateManager.completeStage(task.id, result.status, result.summary);
        this.stateManager.persist();
        // Create/update draft PR after each stage
        this._createOrUpdatePR(task.id, task.name, stage.stage, result);
      },
    });

    const result = await sequencer.run();

    const finalStatus = result.status === 'success' ? 'done' : 'failed';
    this.stateManager.updateTaskStatus(task.id, finalStatus);
    this.stateManager.persist();
    this.updateTask(task.id, { status: finalStatus });

    // Final PR update — mark as ready for review if done
    if (finalStatus === 'done') {
      this._createOrUpdatePR(task.id, task.name, 'complete', { status: 'success', summary: 'All stages passed' });
    }

    this.runningTasks.delete(task.id);
    return result;
  }

  _createOrUpdatePR(taskId, taskName, stageName, result) {
    if (!this.worktreeManager) return;
    if (!this.worktreeManager.hasChanges(taskId)) {
      log.info(`no changes to push for ${taskId} after stage "${stageName}"`);
      return;
    }

    try {
      const task = this.getTask(taskId);
      const existingPr = task?.pr_url;

      if (existingPr) {
        // PR already exists — just push new commits
        log.info(`pushing new commits for ${taskId} (PR exists: ${existingPr})`);
        this.worktreeManager.push(taskId);
      } else {
        // Create draft PR
        log.info(`creating draft PR for ${taskId} after stage "${stageName}"`);
        const summary = `Stage: ${stageName}\n\n${result?.summary || ''}`;
        const prUrl = this.worktreeManager.createDraftPR(taskId, taskName, summary);
        if (prUrl) {
          this.updateTask(taskId, { pr_url: prUrl });
          this.stateManager.setPrUrl(taskId, prUrl);
          this.stateManager.persist();
          log.info(`draft PR created: ${prUrl}`);
        }
      }
    } catch (err) {
      log.error(`PR creation/update failed for ${taskId}: ${err.message}`);
    }
  }

  _resumeTask(task, completedStages) {
    const pipelineName = task.last_pipeline || (task.status === 'planning' ? 'brainstorm' : 'default');

    if (pipelineName === 'brainstorm') {
      this._runBrainstormPipeline(task, completedStages).catch(err => {
        log.error(`resume brainstorm failed for ${task.id}: ${err}`);
        this.updateTask(task.id, { status: 'failed', failed_pipeline: 'brainstorm' });
        this.stateManager.updateTaskStatus(task.id, 'failed');
        this.stateManager.persist();
      });
    } else {
      // Save completed stages on task so runTask can use them
      this.updateTask(task.id, { status: 'ready', completed_stages: completedStages.map(s => ({ stage: s.stage, summary: s.summary, status: s.status })) });
    }
  }

  async startLoop(interval = 5000) {
    this.running = true;

    while (this.running) {
      const maxParallel = this.config.defaults?.max_parallel || 1;
      const available = maxParallel - this.runningTasks.size;

      for (let i = 0; i < available; i++) {
        const task = this.pickNextTask();
        if (!task) break;
        // Fire and forget — runs in parallel
        this.runTask(task).catch(err => {
          console.error(`Task ${task.id} failed:`, err);
        });
      }

      await new Promise(r => setTimeout(r, interval));
    }
  }

  stop() {
    this.running = false;
  }

  killRunningAgents() {
    log.info(`killing ${this.activeRunners.size} running agents`);
    for (const runner of this.activeRunners) {
      runner.kill();
    }
  }
}
