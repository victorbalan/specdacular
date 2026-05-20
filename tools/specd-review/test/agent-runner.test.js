import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { renderPrompt, runAgent } from '../src/agent-runner.js';

const fixture = (name) =>
  fileURLToPath(new URL(`../test-fixtures/${name}`, import.meta.url));

describe('renderPrompt', () => {
  it('substitutes {{vars}} and leaves unknown ones blank', () => {
    const out = renderPrompt('a {{diff}} b {{missing}} c', { diff: 'X' });
    a.equal(out, 'a X b  c');
  });
});

describe('runAgent', () => {
  it('captures a specd-result block from a plain-transport agent', async () => {
    const agent = {
      name: 'stub',
      transport: 'plain',
      cmd: `node ${fixture('stub-result.mjs')}`,
      systemPrompt: 'review {{diff}}',
    };
    const res = await runAgent(agent, { diff: 'D' }, { cwd: process.cwd() });
    a.equal(res.result.summary, 'ok');
  });

  it('returns null result when the agent emits nothing parseable (after retry)', async () => {
    const agent = {
      name: 'stub',
      transport: 'plain',
      cmd: `node ${fixture('stub-noresult.mjs')}`,
      systemPrompt: 'x',
    };
    const res = await runAgent(agent, {}, { cwd: process.cwd() });
    a.equal(res.result, null);
  });
});
