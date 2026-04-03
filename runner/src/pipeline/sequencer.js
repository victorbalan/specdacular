class StageSequencer {
  constructor({ stages, createRunner, onStageStart, onStageComplete, onProgress }) {
    this.stages = stages;
    this.createRunner = createRunner;
    this.onStageStart = onStageStart;
    this.onStageComplete = onStageComplete;
    this.onProgress = onProgress;
  }

  async run() {
    const results = [];

    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];
      const maxAttempts = 1 + (stage.max_retries || 0);
      let stageResult = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        this.onStageStart(stage, attempt);
        const runner = this.createRunner(stage);
        stageResult = await runner.run('');
        this.onStageComplete(stage, stageResult, attempt);

        if (stageResult.status === 'success') break;
        if (stage.on_fail !== 'retry') break;
      }

      results.push({ stage: stage.stage, result: stageResult });

      if (stageResult.status !== 'success') {
        if (stage.critical) {
          return {
            status: 'failure',
            failedStage: stage.stage,
            results,
          };
        }
      }
    }

    return { status: 'success', results };
  }
}

module.exports = { StageSequencer };
