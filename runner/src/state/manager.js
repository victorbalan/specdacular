const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

class StateManager extends EventEmitter {
  constructor(statusPath) {
    super();
    this.setMaxListeners(50);
    this.statusPath = statusPath;
    this.state = {
      started_at: new Date().toISOString(),
      tasks: {},
    };
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
      stages: [],
      pr_url: null,
    };
    this._emit('task_registered', { taskId, name });
  }

  setPrUrl(taskId, prUrl) {
    if (this.state.tasks[taskId]) {
      this.state.tasks[taskId].pr_url = prUrl;
      this._emit('pr_created', { taskId, prUrl });
    }
  }

  updateTaskStatus(taskId, status) {
    this.state.tasks[taskId].status = status;
    this._emit('task_status_changed', { taskId, status });
  }

  startStage(taskId, { stage, agent }) {
    const now = new Date().toISOString();
    const task = this.state.tasks[taskId];
    task.current_stage = stage;
    task.stages.push({
      stage,
      agent: agent || null,
      status: 'running',
      started_at: now,
      last_output_at: now,
      live_progress: null,
      duration: null,
      summary: null,
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
      currentStage.live_progress = null;
    }
    this._emit('stage_completed', { taskId, stage: currentStage?.stage, status, summary });
  }

  getLastOutputTime(taskId) {
    const task = this.state.tasks[taskId];
    if (!task) return null;
    const currentStage = task.stages[task.stages.length - 1];
    return currentStage?.last_output_at ? new Date(currentStage.last_output_at) : null;
  }

  persist() {
    const dir = path.dirname(this.statusPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.statusPath, JSON.stringify(this.state, null, 2));
  }

  _emit(type, data) {
    this.emit('change', { type, ...data, timestamp: new Date().toISOString() });
  }
}

module.exports = { StateManager };
