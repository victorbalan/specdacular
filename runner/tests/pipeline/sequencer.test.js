const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('StageSequencer', () => {
  let StageSequencer;

  it('imports', () => {
    ({ StageSequencer } = require('../../src/pipeline/sequencer'));
  });

  it('runs all stages in order', async () => {
    const stages = [
      { stage: 'plan', agent: 'claude' },
      { stage: 'implement', agent: 'claude' },
    ];

    const stageLog = [];
    const seq = new StageSequencer({
      stages,
      createRunner: () => ({
        run: async () => { stageLog.push('ran'); return { status: 'success', summary: 'ok', files_changed: [], issues: [], next_suggestions: [] }; },
        on: () => {},
        kill: () => {},
      }),
      onStageStart: (s) => stageLog.push(`start:${s.stage}`),
      onStageComplete: (s) => stageLog.push(`complete:${s.stage}`),
      onProgress: () => {},
    });

    const result = await seq.run();
    assert.strictEqual(result.status, 'success');
    assert.deepStrictEqual(stageLog, ['start:plan', 'ran', 'complete:plan', 'start:implement', 'ran', 'complete:implement']);
  });

  it('retries on failure when configured', async () => {
    let attempt = 0;
    const stages = [
      { stage: 'test', agent: 'claude', on_fail: 'retry', max_retries: 2 },
    ];

    const seq = new StageSequencer({
      stages,
      createRunner: () => ({
        run: async () => {
          attempt++;
          if (attempt < 3) return { status: 'failure', summary: 'fail', files_changed: [], issues: [], next_suggestions: [] };
          return { status: 'success', summary: 'ok', files_changed: [], issues: [], next_suggestions: [] };
        },
        on: () => {},
        kill: () => {},
      }),
      onStageStart: () => {},
      onStageComplete: () => {},
      onProgress: () => {},
    });

    const result = await seq.run();
    assert.strictEqual(result.status, 'success');
    assert.strictEqual(attempt, 3);
  });

  it('stops on critical failure', async () => {
    const stages = [
      { stage: 'plan', agent: 'claude', critical: true },
      { stage: 'implement', agent: 'claude' },
    ];

    const ran = [];
    const seq = new StageSequencer({
      stages,
      createRunner: () => ({
        run: async () => { ran.push(1); return { status: 'failure', summary: 'fail', files_changed: [], issues: [], next_suggestions: [] }; },
        on: () => {},
        kill: () => {},
      }),
      onStageStart: () => {},
      onStageComplete: () => {},
      onProgress: () => {},
    });

    const result = await seq.run();
    assert.strictEqual(result.status, 'failure');
    assert.strictEqual(ran.length, 1);
  });

  it('skips non-critical failure when policy is skip', async () => {
    const stages = [
      { stage: 'lint', agent: 'claude', on_fail: 'skip' },
      { stage: 'implement', agent: 'claude' },
    ];

    const ran = [];
    const seq = new StageSequencer({
      stages,
      createRunner: (stage) => ({
        run: async () => {
          ran.push(stage.stage);
          if (stage.stage === 'lint') return { status: 'failure', summary: 'fail', files_changed: [], issues: [], next_suggestions: [] };
          return { status: 'success', summary: 'ok', files_changed: [], issues: [], next_suggestions: [] };
        },
        on: () => {},
        kill: () => {},
      }),
      onStageStart: () => {},
      onStageComplete: () => {},
      onProgress: () => {},
    });

    const result = await seq.run();
    assert.strictEqual(result.status, 'success');
    assert.deepStrictEqual(ran, ['lint', 'implement']);
  });
});
