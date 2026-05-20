import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { renderPrompt, runAgent } from '../src/agent-runner.js';

describe('renderPrompt', () => {
  it('substitutes {{vars}} and leaves unknown ones blank', () => {
    const out = renderPrompt('a {{diff}} b {{missing}} c', { diff: 'X' });
    a.equal(out, 'a X b  c');
  });
});

describe('runAgent', () => {
  it('captures a specd-result block from a plain-transport agent', async () => {
    const block = '```specd-result\\n{"summary":"ok","findings":[]}\\n```';
    const agent = {
      name: 'stub',
      transport: 'plain',
      cmd: `node -e "console.log('${block}')"`,
      systemPrompt: 'review {{diff}}',
    };
    const res = await runAgent(agent, { diff: 'D' }, { cwd: process.cwd() });
    a.equal(res.result.summary, 'ok');
  });

  it('returns null result when the agent emits nothing parseable (after retry)', async () => {
    const agent = {
      name: 'stub',
      transport: 'plain',
      cmd: `node -e "console.log('nothing here')"`,
      systemPrompt: 'x',
    };
    const res = await runAgent(agent, {}, { cwd: process.cwd() });
    a.equal(res.result, null);
  });
});
