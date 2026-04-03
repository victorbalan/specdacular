const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const mockAgentPath = path.join(__dirname, '..', 'fixtures', 'mock-agent.js');

describe('AgentRunner', () => {
  let AgentRunner;

  it('imports', () => {
    ({ AgentRunner } = require('../../src/agent/runner'));
  });

  it('runs a CLI agent and collects result', async () => {
    const agent = {
      cmd: `node ${mockAgentPath}`,
      prompt_flag: '',
      output_format: 'json_block',
    };

    const runner = new AgentRunner(agent);
    const statuses = [];
    const outputLines = [];

    runner.on('status', (s) => statuses.push(s));
    runner.on('output', (line) => outputLines.push(line));

    const result = await runner.run('test prompt');

    assert.strictEqual(result.status, 'success');
    assert.strictEqual(result.summary, 'did the work');
    assert.ok(statuses.length >= 1);
    assert.strictEqual(statuses[0].progress, 'doing work');
    assert.ok(outputLines.length >= 1);
  });

  it('returns failure when process exits non-zero', async () => {
    const agent = {
      cmd: 'node -e "process.exit(1)"',
      prompt_flag: '',
      output_format: 'json_block',
    };

    const runner = new AgentRunner(agent);
    const result = await runner.run('test');

    assert.strictEqual(result.status, 'failure');
  });

  it('respects timeout', async () => {
    const agent = {
      cmd: 'node -e "setTimeout(()=>{},60000)"',
      prompt_flag: '',
      output_format: 'json_block',
    };

    const runner = new AgentRunner(agent, { timeout: 500 });
    const result = await runner.run('test');

    assert.strictEqual(result.status, 'failure');
    assert.ok(result.summary.includes('timeout') || result.summary.includes('Timeout'));
  });
});
