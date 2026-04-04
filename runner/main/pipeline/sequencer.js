// runner/main/pipeline/sequencer.js
import { createLogger } from '../logger.js';

const log = createLogger('pipeline', '\x1b[33m');

export class StageSequencer {
  constructor({ stages, completedStages, createRunner, onStageStart, onStageComplete }) {
    this.stages = stages;
    this.completedStages = completedStages || [];
    this.createRunner = createRunner;
    this.onStageStart = onStageStart;
    this.onStageComplete = onStageComplete;
  }

  async run() {
    const results = [];
    let previousOutput = '';

    for (const stage of this.stages) {
      // Check if this stage was already completed (resume case)
      const completed = this.completedStages.find(s => s.stage === stage.stage && s.status === 'success');
      if (completed) {
        log.info(`stage "${stage.stage}" — skipping (already completed)`);
        results.push({ stage: stage.stage, status: 'success', summary: completed.summary });
        previousOutput = completed.summary || '';
        continue;
      }

      const maxAttempts = 1 + (stage.max_retries || 0);
      let stageResult = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        log.info(`stage "${stage.stage}" (agent: ${stage.agent}) attempt ${attempt}/${maxAttempts}`);
        const runner = this.createRunner(stage, previousOutput);
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

      log.info(`stage "${stage.stage}" → ${stageResult.status}`);
      results.push({ stage: stage.stage, ...stageResult });
      previousOutput = stageResult?.summary || '';

      if (stageResult.status !== 'success' && stage.critical) {
        log.error(`critical stage "${stage.stage}" failed — aborting pipeline`);
        return { status: 'failure', results, failedStage: stage.stage };
      }
    }

    log.info(`pipeline complete — all stages passed`);
    return { status: 'success', results };
  }
}
