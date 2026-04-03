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
  }

  init() {
    // Ensure project dirs exist
    mkdirSync(this.projectPaths.tasksDir, { recursive: true });
    mkdirSync(this.projectPaths.logsDir, { recursive: true });

    // Load project config
    const projectJson = JSON.parse(readFileSync(this.projectPaths.projectJson, 'utf-8'));
    this.projectPath = projectJson.path;

    // Init worktree manager if parallel
    const maxParallel = this.config.defaults?.max_parallel || 1;
    if (maxParallel > 1 && existsSync(join(this.projectPath, '.git'))) {
      this.worktreeManager = new WorktreeManager(this.projectPath);
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

  createIdea(name) {
    const id = `idea-${Date.now().toString(36)}`;
    const task = {
      id,
      name,
      description: '',
      project_id: this.projectId,
      working_dir: '.',
      pipeline: null,
      status: 'idea',
      priority: 10,
      depends_on: [],
      spec: '',
      feedback: '',
      created_at: new Date().toISOString(),
    };
    return this.createTask(task);
  }

  async advanceTask(taskId, action, feedback) {
    const task = this.getTask(taskId);
    if (!task) return null;

    if (action === 'plan') {
      if (feedback) {
        this.updateTask(taskId, { status: 'planning', feedback });
      } else {
        this.updateTask(taskId, { status: 'planning' });
      }

      this._runBrainstormPipeline(task).catch(err => {
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

      this._runBrainstormPipeline({ ...task, feedback: updatedFeedback }).catch(err => {
        console.error(`Re-plan failed for ${taskId}:`, err);
        this.updateTask(taskId, { status: 'failed', failed_pipeline: 'brainstorm' });
        this.stateManager.updateTaskStatus(taskId, 'failed');
        this.stateManager.persist();
      });

      return this.getTask(taskId);
    }

    if (action === 'retry') {
      const newStatus = task.failed_pipeline === 'brainstorm' ? 'idea' : 'ready';
      this.updateTask(taskId, { status: newStatus, failed_pipeline: null });
      return this.getTask(taskId);
    }

    return null;
  }

  async _runBrainstormPipeline(task) {
    const agents = this.templateManager.getAgents(this.projectId);
    const pipelines = this.templateManager.getPipelines(this.projectId);
    const pipeline = resolvePipeline('brainstorm', pipelines, null, this.config.defaults);

    this.stateManager.registerTask(task.id, { name: task.name, pipeline: 'brainstorm' });
    this.stateManager.updateTaskStatus(task.id, 'planning');

    const prompt = [task.name, task.description, task.feedback].filter(Boolean).join('\n\n');
    const logPath = join(this.projectPaths.logsDir, `${task.id}.log`);

    const sequencer = new StageSequencer({
      stages: pipeline.stages,
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

        return { run: () => runner.run(prompt, { cwd: this.projectPath, logPath }) };
      },
      onStageStart: async (stage, attempt) => {
        this.stateManager.startStage(task.id, { stage: stage.stage, agent: stage.agent });
        this.stateManager.persist();
      },
      onStageComplete: async (stage, result, attempt) => {
        this.stateManager.completeStage(task.id, result.status, result.summary);
        this.stateManager.persist();
      },
    });

    const result = await sequencer.run();

    if (result.status === 'success') {
      const lastStage = result.results[result.results.length - 1];
      this.updateTask(task.id, { status: 'review', spec: lastStage.summary || '' });
      this.stateManager.updateTaskStatus(task.id, 'review');
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
    const agents = this.templateManager.getAgents(this.projectId);
    const pipelines = this.templateManager.getPipelines(this.projectId);
    const pipelineName = task.pipeline || this.config.defaults?.pipeline || 'default';
    const pipeline = resolvePipeline(pipelineName, pipelines, task.stage_overrides, this.config.defaults);

    this.runningTasks.add(task.id);
    this.stateManager.registerTask(task.id, { name: task.name, pipeline: pipelineName });
    this.stateManager.updateTaskStatus(task.id, 'in_progress');
    this.updateTask(task.id, { status: 'in_progress' });

    // Determine working directory
    const workingDir = task.working_dir || '.';
    let cwd = join(this.projectPath, workingDir);
    let worktreePath = null;

    if (this.worktreeManager && existsSync(join(cwd, '.git'))) {
      worktreePath = this.worktreeManager.create(task.id);
      cwd = worktreePath;
    }

    const logPath = join(this.projectPaths.logsDir, `${task.id}.log`);

    const sequencer = new StageSequencer({
      stages: pipeline.stages,
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

        return { run: () => runner.run(task.spec || task.description || task.name, { cwd, logPath }) };
      },
      onStageStart: async (stage, attempt) => {
        this.stateManager.startStage(task.id, { stage: stage.stage, agent: stage.agent });
        this.stateManager.persist();
      },
      onStageComplete: async (stage, result, attempt) => {
        this.stateManager.completeStage(task.id, result.status, result.summary);
        this.stateManager.persist();
      },
    });

    const result = await sequencer.run();

    const finalStatus = result.status === 'success' ? 'done' : 'failed';
    this.stateManager.updateTaskStatus(task.id, finalStatus);
    this.stateManager.persist();
    this.updateTask(task.id, { status: finalStatus });

    // Create PR if worktree has changes
    if (worktreePath && this.worktreeManager.hasChanges(task.id)) {
      const summary = result.results.map(r => `- ${r.stage}: ${r.summary}`).join('\n');
      const prUrl = this.worktreeManager.createPR(task.id, task.name, summary);
      if (prUrl) this.stateManager.setPrUrl(task.id, prUrl);
      this.stateManager.persist();
    }

    // Cleanup worktree
    if (worktreePath) {
      this.worktreeManager.remove(task.id);
    }

    this.runningTasks.delete(task.id);
    return result;
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
}
