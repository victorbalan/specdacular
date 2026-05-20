// test/findings.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { normalizeFinding, mergeReviewerOutputs, severityGate } from '../src/findings.js';

describe('normalizeFinding', () => {
  it('fills defaults and stamps the source', () => {
    const f = normalizeFinding({ file: 'a.js', description: 'bug' }, 'codex-security');
    a.equal(f.file, 'a.js');
    a.equal(f.line, null);
    a.equal(f.severity, 'nice-to-have');
    a.equal(f.category, 'general');
    a.equal(f.suggestion, '');
    a.equal(f.source, 'codex-security');
  });

  it('coerces an unknown severity to nice-to-have', () => {
    const f = normalizeFinding({ file: 'a.js', description: 'x', severity: 'WARN' }, 's');
    a.equal(f.severity, 'nice-to-have');
  });

  it('keeps a valid blocking severity', () => {
    const f = normalizeFinding({ file: 'a.js', description: 'x', severity: 'blocking' }, 's');
    a.equal(f.severity, 'blocking');
  });
});

describe('mergeReviewerOutputs', () => {
  it('collects findings from all reviewers and dedupes by file+line+category', () => {
    const merged = mergeReviewerOutputs([
      { agent: 'r1', output: { summary: 's1', findings: [
        { file: 'a.js', line: 10, category: 'logic', description: 'd', severity: 'blocking' },
      ] } },
      { agent: 'r2', output: { summary: 's2', findings: [
        { file: 'a.js', line: 10, category: 'logic', description: 'dupe', severity: 'blocking' },
        { file: 'b.js', line: 2, category: 'perf', description: 'd2', severity: 'nice-to-have' },
      ] } },
    ]);
    a.equal(merged.findings.length, 2);
    a.equal(merged.summaries.r1, 's1');
    a.equal(merged.summaries.r2, 's2');
  });

  it('tolerates a reviewer with no output', () => {
    const merged = mergeReviewerOutputs([{ agent: 'r1', output: null }]);
    a.equal(merged.findings.length, 0);
    a.equal(merged.summaries.r1, '(no output)');
  });
});

describe('severityGate', () => {
  it('splits blocking from nice-to-have', () => {
    const g = severityGate([
      { severity: 'blocking' }, { severity: 'nice-to-have' }, { severity: 'blocking' },
    ]);
    a.equal(g.blocking.length, 2);
    a.equal(g.niceToHave.length, 1);
  });
});
