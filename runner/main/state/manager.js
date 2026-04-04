import { writeFileSync, existsSync, readFileSync } from 'fs';
import { EventEmitter } from 'events';

export class StateManager extends EventEmitter {
  constructor(statusPath) {
    super();
    this.statusPath = statusPath;
    this.state = existsSync(statusPath)
      ? JSON.parse(readFileSync(statusPath, 'utf-8'))
      : { started_at: new Date().toISOString(), tasks: {} };
  }

  getState() {
    return this.state;
  }

  registerTask(taskId, { name, pipeline }) {
    this.state.tasks[taskId] = {
      name,
      status: 'queued',
      current_stage: null,
      pipeline,
      pr_url: null,
      stages: [],
    };
    this._emit('task_registered', { taskId, name });
  }

  updateTaskStatus(taskId, status) {
    this.state.tasks[taskId].status = status;
    this._emit('task_status_changed', { taskId, status });
  }

  startStage(taskId, { stage, agent }) {
    const task = this.state.tasks[taskId];
    task.current_stage = stage;
    task.stages.push({
      stage,
      agent,
      status: 'running',
      started_at: new Date().toISOString(),
      duration: null,
      summary: null,
      live_progress: null,
    });
    this._emit('stage_started', { taskId, stage, agent });
  }

  updateLiveProgress(taskId, progress) {
    const task = this.state.tasks[taskId];
    const currentStage = task.stages[task.stages.length - 1];
    if (currentStage) {
      currentStage.live_progress = progress;
      currentStage.last_output_at = new Date().toISOString();
    }
    this._emit('live_progress', { taskId, progress });
  }

  completeStage(taskId, status, summary) {
    const task = this.state.tasks[taskId];
    const currentStage = task.stages[task.stages.length - 1];
    if (currentStage) {
      currentStage.status = status;
      currentStage.summary = summary;
      const started = new Date(currentStage.started_at);
      currentStage.duration = Math.round((Date.now() - started.getTime()) / 1000);
    }
    this._emit('stage_completed', { taskId, stage: currentStage?.stage, status, summary });
  }

  setPrUrl(taskId, prUrl) {
    this.state.tasks[taskId].pr_url = prUrl;
    this._emit('pr_created', { taskId, prUrl });
  }

  getCompletedStages(taskId) {
    const task = this.state.tasks?.[taskId];
    if (!task) return [];
    return task.stages.filter(s => s.status === 'success');
  }

  persist() {
    writeFileSync(this.statusPath, JSON.stringify(this.state, null, 2));
  }

  _emit(type, data) {
    this.emit('change', { type, ...data });
  }
}
