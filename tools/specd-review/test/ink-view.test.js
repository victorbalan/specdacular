// test/ink-view.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { agentLineState } from '../src/ui/ink-view.js';

describe('agentLineState', () => {
  it('marks an agent running with its latest status text', () => {
    const s = agentLineState({ name: 'r1', status: { progress: 'reviewing' }, done: false });
    a.equal(s.icon, 'spinner');
    a.equal(s.text, 'reviewing');
  });

  it('marks a finished agent done with its finding count', () => {
    const s = agentLineState({ name: 'r1', status: null, done: true, findingCount: 3 });
    a.equal(s.icon, 'check');
    a.match(s.text, /3 finding/);
  });

  it('marks a skipped agent', () => {
    const s = agentLineState({ name: 'r1', done: true, skipped: true });
    a.equal(s.icon, 'cross');
    a.match(s.text, /skipped/i);
  });
});
