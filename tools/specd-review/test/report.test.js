// test/report.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { renderReport } from '../src/report.js';

describe('renderReport', () => {
  it('renders rounds, findings, feedback, and the outcome', () => {
    const md = renderReport({
      base: 'abc123',
      outcome: 'converged',
      rounds: [
        {
          round: 1,
          findings: [
            { file: 'a.js', line: 4, severity: 'blocking', category: 'logic',
              description: 'off-by-one', suggestion: 'fix it', source: 'codex-perf' },
          ],
          summaries: { 'codex-perf': 'looked ok overall' },
          feedback: 'ignore style nits',
          commit: 'deadbee',
          skipped: ['claude-correctness'],
        },
      ],
    });
    a.match(md, /# specd-review report/);
    a.match(md, /Outcome.*converged/);
    a.match(md, /Round 1/);
    a.match(md, /off-by-one/);
    a.match(md, /ignore style nits/);
    a.match(md, /deadbee/);
    a.match(md, /claude-correctness/); // skipped agent noted
  });
});
