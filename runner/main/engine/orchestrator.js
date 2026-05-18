// runner/main/engine/orchestrator.js
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import { StateManager } from '../state/manager.js';
import { TemplateManager } from '../template-manager.js';
import { AgentRunner } from '../agent/runner.js';
import { StageSequencer } from '../pipeline/sequencer.js';
import { resolvePipeline } from '../pipeline/resolver.js';
import { resolveTemplate } from '../agent/template.js';
import { ExecutionContext } from './context.js';
import { ActionRegistry } from './actions/registry.js';
import { JournalWatcher } from './progress/journal-watcher.js';
import { createLogger } from '../logger.js';

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
    this.actionRegistry = ActionRegistry.withBuiltins();
    this.running = false;
    this.runningTasks = new Set();
    this.activeRunners = new Set();
    this.runnersByTask = new Map();
  }

  init() {
    log.info(`initializing project ${this.projectId}`);
    mkdirSync(this.projectPaths.tasksDir, { recursive: true });
    mkdirSync(this.projectPaths.logsDir, { recursive: true });

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

  createIdea(name, description, autoExecute, pipeline) {
    log.info(`creating idea: "${name}"${pipeline ? ` (pipeline: ${pipeline})` : ''}`);
    const id = `idea-${Date.now().toString(36)}`;
    const task = {
      id,
      name,
      description: description || '',
      project_id: this.projectId,
      pipeline: pipeline || null,
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
    const agents = this.templateManager.getAgents();
    const pipelines = this.templateManager.getPipelines();
    const pipelineName = task.pipeline || this.config.defaults?.pipeline || 'default';
    const pipeline = resolvePipeline(pipelineName, pipelines, task.stage_overrides, this.config.defaults);
    const pipelineConfig = pipelines[pipelineName] || {};

    const ctx = new ExecutionContext({
      task: { id: task.id, name: task.name, description: task.description, feedback: task.feedback, spec: task.spec },
      pipeline: { name: pipelineName, total_stages: pipeline.stages.length },
    });

    let repoDir = null;
    try {
      const projectJson = JSON.parse(readFileSync(this.projectPaths.projectJson, 'utf-8'));
      repoDir = projectJson.path;
    } catch {}

    ctx._runtime = { repoDir, cwd: repoDir };

    const startActions = pipelineConfig.on_start || [];
    await this.actionRegistry.runAll(startActions, ctx, pipelineConfig.actions);

    const cwd = ctx._runtime.cwd || repoDir;

    this.runningTasks.add(task.id);
    this.stateManager.registerTask(task.id, { name: task.name, pipeline: pipelineName });
    this.stateManager.updateTaskStatus(task.id, 'in_progress');
    this.updateTask(task.id, { status: 'in_progress' });

    const logPath = join(this.projectPaths.logsDir, `${task.id}.log`);

    const sequencer = new StageSequencer({
      stages: pipeline.stages,
      completedStages: ctx.completedStages(),
      createRunner: (stage, previousOutput) => {
        const agentDef = agents[stage.agent];
        if (!agentDef) throw new Error(`Agent not found: ${stage.agent}`);

        ctx.startStage(stage.stage, stage.agent);
        ctx._runtime.currentStage = stage.stage;

        const vars = ctx.templateVars({ name: stage.stage, index: stage.index, total: stage.total });
        const resolvedPrompt = resolveTemplate(agentDef.system_prompt || '', vars);

        const runner = new AgentRunner({
          ...agentDef,
          system_prompt: resolvedPrompt,
          timeout: stage.timeout,
          stuck_timeout: this.config.defaults?.stuck_timeout,
        });

        const journalWatcher = cwd ? new JournalWatcher(cwd) : null;

        runner.on('status', (s) => {
          this.stateManager.updateLiveProgress(task.id, s);
        });
        runner.on('output', () => {
          if (journalWatcher) {
            const entries = journalWatcher.readNew();
            for (const entry of entries) {
              ctx.updateJournal(stage.stage, entry);
              if (entry.type === 'progress') {
                this.stateManager.updateLiveProgress(task.id, entry);
              }
              if (entry.type === 'decision') {
                this._commitOnDecision(cwd, ctx, entry).catch(err =>
                  log.warn(`decision commit failed: ${err.message}`)
                );
              }
            }
          }
        });

        this.activeRunners.add(runner);
        if (!this.runnersByTask.has(task.id)) this.runnersByTask.set(task.id, new Set());
        this.runnersByTask.get(task.id).add(runner);
        return {
          run: () => {
            const p = runner.run(task.spec || task.description || task.name, { cwd, logPath });
            p.finally(() => {
              this.activeRunners.delete(runner);
              const set = this.runnersByTask.get(task.id);
              if (set) {
                set.delete(runner);
                if (set.size === 0) this.runnersByTask.delete(task.id);
              }
            });
            return p;
          },
        };
      },
      onStageStart: async (stage) => {
        this.stateManager.startStage(task.id, { stage: stage.stage, agent: stage.agent });
        this.stateManager.persist();
      },
      onStageComplete: async (stage, result) => {
        ctx.completeStage(stage.stage, {
          status: result.status,
          output: result.summary || '',
          decisions: result.decisions || [],
          artifacts: result.files_changed || [],
        });
        this.stateManager.completeStage(task.id, result.status, result.summary);
        this.stateManager.persist();

        const stageActions = pipelineConfig.on_stage_complete || [];
        await this.actionRegistry.runAll(stageActions, ctx, pipelineConfig.actions);
      },
    });

    const result = await sequencer.run();
    const finalStatus = result.status === 'success' ? 'done' : 'failed';

    ctx._runtime.finalStatus = finalStatus;
    this.stateManager.updateTaskStatus(task.id, finalStatus);
    this.stateManager.persist();
    this.updateTask(task.id, { status: finalStatus, pr_url: ctx.git?.pr_url });

    const completionActions = finalStatus === 'done'
      ? (pipelineConfig.on_complete || [])
      : (pipelineConfig.on_fail || []);
    await this.actionRegistry.runAll(completionActions, ctx, pipelineConfig.actions);

    this.runningTasks.delete(task.id);
    return result;
  }

  async advanceTask(taskId, action, feedback) {
    log.info(`advance ${taskId} → ${action}`);
    const task = this.getTask(taskId);
    if (!task) return null;

    if (action === 'approve') {
      return this.updateTask(taskId, { status: 'ready' });
    }

    if (action === 'plan') {
      const planPipeline = task.pipeline || 'brainstorm';
      this.updateTask(taskId, { status: 'planning', feedback: feedback || task.feedback });
      this._runPipeline(task, planPipeline).catch(err => {
        log.error(`${planPipeline} failed for ${taskId}: ${err}`);
        this.updateTask(taskId, { status: 'failed', failed_pipeline: planPipeline });
        this.stateManager.updateTaskStatus(taskId, 'failed');
        this.stateManager.persist();
      });
      return this.getTask(taskId);
    }

    if (action === 're-plan') {
      const planPipeline = task.pipeline || 'brainstorm';
      const updatedFeedback = [task.feedback, feedback].filter(Boolean).join('\n\n---\n\n');
      this.updateTask(taskId, { status: 'planning', feedback: updatedFeedback });
      this._runPipeline({ ...task, feedback: updatedFeedback }, planPipeline).catch(err => {
        log.error(`re-plan (${planPipeline}) failed for ${taskId}: ${err}`);
        this.updateTask(taskId, { status: 'failed', failed_pipeline: planPipeline });
        this.stateManager.updateTaskStatus(taskId, 'failed');
        this.stateManager.persist();
      });
      return this.getTask(taskId);
    }

    if (action === 'retry' || action === 'retry-fresh') {
      this.stateManager.clearTask(taskId);
      return this.updateTask(taskId, {
        status: 'idea',
        failed_pipeline: null,
        pr_url: null,
        spec: '',
        feedback: '',
      });
    }

    if (action === 'retry-feedback') {
      const updatedFeedback = [task.feedback, feedback].filter(Boolean).join('\n\n---\n\n');
      this.stateManager.clearTask(taskId);
      return this.updateTask(taskId, { status: 'ready', feedback: updatedFeedback, failed_pipeline: null });
    }

    return null;
  }

  async _runPipeline(task, pipelineName) {
    return this.runTask({ ...task, pipeline: pipelineName });
  }

  async startLoop(interval = 5000) {
    this.running = true;
    while (this.running) {
      const maxParallel = this.config.defaults?.max_parallel || 1;
      const available = maxParallel - this.runningTasks.size;
      for (let i = 0; i < available; i++) {
        const task = this.pickNextTask();
        if (!task) break;
        this.runTask(task).catch(err => log.error(`task ${task.id} failed: ${err}`));
      }
      await new Promise(r => setTimeout(r, interval));
    }
  }

  stop() { this.running = false; }

  killRunningAgents() {
    for (const runner of this.activeRunners) runner.kill();
  }

  async _commitOnDecision(cwd, ctx, entry) {
    if (!cwd) return;
    const { execSync } = await import('child_process');
    let status = '';
    try {
      status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
    } catch {
      return;
    }
    if (!status) return;
    const decision = (entry.decision || 'decision').toString().replace(/"/g, "'").slice(0, 72);
    const stageName = ctx._runtime?.currentStage || 'agent';
    const taskId = ctx.task?.id || 'task';
    const message = `chore(${taskId}): ${stageName} decision — ${decision}`;
    try {
      execSync('git add -A', { cwd, stdio: 'pipe' });
      execSync(`git commit -m "${message}"`, { cwd, stdio: 'pipe' });
      const hash = execSync('git rev-parse --short HEAD', { cwd, encoding: 'utf-8' }).trim();
      log.info(`decision-commit ${hash}: ${message}`);
      const branch = ctx.git?.branch;
      if (branch) {
        try {
          execSync(`git push origin ${branch}`, { cwd, stdio: 'pipe' });
        } catch (err) {
          log.warn(`decision push failed: ${err.message}`);
        }
      }
    } catch (err) {
      log.warn(`decision commit skipped: ${err.message}`);
    }
  }

  stopTask(taskId) {
    log.info(`stopping task ${taskId}`);
    const runners = this.runnersByTask.get(taskId);
    if (runners) {
      for (const runner of runners) {
        try { runner.kill(); } catch (e) { log.error(`failed to kill runner: ${e}`); }
        this.activeRunners.delete(runner);
      }
      this.runnersByTask.delete(taskId);
    }
    this.runningTasks.delete(taskId);
    this.stateManager.clearTask(taskId);
    this.stateManager.persist();
    return this.updateTask(taskId, {
      status: 'idea',
      failed_pipeline: null,
      pr_url: null,
    });
  }
}
