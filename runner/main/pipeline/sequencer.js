// runner/main/pipeline/sequencer.js
export class StageSequencer {
  constructor({ stages, createRunner, onStageStart, onStageComplete }) {
    this.stages = stages;
    this.createRunner = createRunner;
    this.onStageStart = onStageStart;
    this.onStageComplete = onStageComplete;
  }

  async run() {
    const results = [];

    for (const stage of this.stages) {
      const maxAttempts = 1 + (stage.max_retries || 0);
      let stageResult = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const runner = this.createRunner(stage);
        await this.onStageStart(stage, attempt);

        try {
          stageResult = await runner.run('');
        } catch (err) {
          stageResult = { status: 'failure', summary: err.message };
        }

        await this.onStageComplete(stage, stageResult, attempt);

        if (stageResult.status === 'success') break;
        if (stageResult.status === 'failure' && stage.on_fail !== 'retry') break;
      }

      results.push({ stage: stage.stage, ...stageResult });

      if (stageResult.status !== 'success' && stage.critical) {
        return { status: 'failure', results, failedStage: stage.stage };
      }
    }

    return { status: 'success', results };
  }
}
