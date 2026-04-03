const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('PipelineResolver', () => {
  let resolvePipeline;

  const pipelines = {
    default: {
      stages: [
        { stage: 'plan', agent: 'claude', critical: true },
        { stage: 'implement', agent: 'claude', critical: true },
        { stage: 'test', cmd: 'npm test', on_fail: 'retry', max_retries: 3 },
        { stage: 'review', agent: 'codex', on_fail: 'retry', max_retries: 2 },
      ],
    },
    'bug-fix': {
      stages: [
        { stage: 'investigate', agent: 'claude', critical: true },
        { stage: 'fix', agent: 'claude', critical: true },
      ],
    },
  };

  it('imports', () => {
    ({ resolvePipeline } = require('../../src/pipeline/resolver'));
  });

  it('resolves a named pipeline', () => {
    const result = resolvePipeline('default', pipelines, {});
    assert.strictEqual(result.stages.length, 4);
    assert.strictEqual(result.stages[0].stage, 'plan');
  });

  it('resolves a custom pipeline', () => {
    const result = resolvePipeline('bug-fix', pipelines, {});
    assert.strictEqual(result.stages.length, 2);
    assert.strictEqual(result.stages[0].stage, 'investigate');
  });

  it('throws on unknown pipeline', () => {
    assert.throws(() => resolvePipeline('nonexistent', pipelines, {}), /not found/);
  });

  it('applies stage_overrides', () => {
    const overrides = {
      test: { cmd: 'npm run test:custom', timeout: 7200 },
    };
    const result = resolvePipeline('default', pipelines, overrides);
    const testStage = result.stages.find(s => s.stage === 'test');
    assert.strictEqual(testStage.cmd, 'npm run test:custom');
    assert.strictEqual(testStage.timeout, 7200);
    assert.strictEqual(testStage.on_fail, 'retry');
  });

  it('applies default timeout and failure_policy to stages', () => {
    const defaults = { timeout: 3600, failure_policy: 'skip' };
    const result = resolvePipeline('default', pipelines, {}, defaults);
    const planStage = result.stages.find(s => s.stage === 'plan');
    assert.strictEqual(planStage.timeout, 3600);
    assert.strictEqual(planStage.critical, true);
  });
});
