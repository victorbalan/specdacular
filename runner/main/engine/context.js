export class ExecutionContext {
  constructor({ task, pipeline }) {
    this.task = { ...task };
    this.pipeline = { ...pipeline };
    this.stages = {};
    this.git = {};
  }

  startStage(stageName, agentName) {
    this.stages[stageName] = {
      status: 'running',
      agent: agentName,
      started_at: new Date().toISOString(),
      output: '',
      decisions: [],
      artifacts: [],
      journal: [],
      duration: null,
    };
  }

  completeStage(stageName, { status, output, decisions, artifacts }) {
    const stage = this.stages[stageName];
    if (!stage) return;
    stage.status = status;
    stage.output = output || '';
    stage.decisions = decisions || [];
    stage.artifacts = artifacts || [];
    const started = new Date(stage.started_at);
    stage.duration = Math.round((Date.now() - started.getTime()) / 1000);
  }

  updateJournal(stageName, entry) {
    const stage = this.stages[stageName];
    if (!stage) return;
    stage.journal.push(entry);
  }

  allPreviousOutput() {
    return Object.values(this.stages)
      .filter(s => s.status === 'success' && s.output)
      .map(s => s.output)
      .join('\n\n');
  }

  completedStages() {
    return Object.entries(this.stages)
      .filter(([, s]) => s.status === 'success')
      .map(([name, s]) => ({ stage: name, summary: s.output, status: s.status }));
  }

  templateVars(currentStage) {
    return {
      task: this.task,
      pipeline: this.pipeline,
      stages: this.stages,
      stage: currentStage || {},
      all_previous_output: this.allPreviousOutput(),
      git: this.git,
    };
  }

  toJSON() {
    return {
      task: this.task,
      pipeline: this.pipeline,
      stages: this.stages,
      git: this.git,
    };
  }

  static fromJSON(data) {
    const ctx = new ExecutionContext({
      task: data.task,
      pipeline: data.pipeline,
    });
    ctx.stages = data.stages || {};
    ctx.git = data.git || {};
    return ctx;
  }
}
