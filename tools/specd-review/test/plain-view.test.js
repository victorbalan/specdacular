import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { formatFindings, parseGateInput } from '../src/ui/plain-view.js';

describe('formatFindings', () => {
  it('renders findings grouped by severity', () => {
    const text = formatFindings([
      { file: 'a.js', line: 3, severity: 'P0', category: 'logic',
        description: 'bug', suggestion: '', source: 'r1' },
      { file: 'a.js', line: 9, severity: 'P3', category: 'style',
        description: 'nit', suggestion: '', source: 'r2' },
    ]);
    a.match(text, /a\.js/);
    a.match(text, /P0 · CRITICAL/);
    a.match(text, /bug/);
  });

  it('reports when there are no findings', () => {
    a.match(formatFindings([]), /no findings/i);
  });
});

describe('parseGateInput', () => {
  it('maps slash commands to actions', () => {
    a.deepEqual(parseGateInput('/continue'), { action: 'continue' });
    a.deepEqual(parseGateInput('/accept'), { action: 'accept' });
    a.deepEqual(parseGateInput('/quit'), { action: 'quit' });
    a.deepEqual(parseGateInput('/edit'), { action: 'edit' });
  });

  it('treats plain text as feedback', () => {
    a.deepEqual(parseGateInput('skip the nits'), { action: 'feedback', feedback: 'skip the nits' });
  });

  it('treats an empty line as continue', () => {
    a.deepEqual(parseGateInput('  '), { action: 'continue' });
  });
});
