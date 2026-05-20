// test/findings.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import {
  normalizeFinding, mergeReviewerOutputs, severityGate, renderFindingsDoc,
} from '../src/findings.js';

describe('normalizeFinding', () => {
  it('fills defaults and stamps the source', () => {
    const f = normalizeFinding({ file: 'a.js', description: 'bug' }, 'codex-security');
    a.equal(f.file, 'a.js');
    a.equal(f.line, null);
    a.equal(f.severity, 'P2');
    a.equal(f.category, 'general');
    a.equal(f.suggestion, '');
    a.equal(f.source, 'codex-security');
  });

  it('coerces an unknown severity to P2', () => {
    const f = normalizeFinding({ file: 'a.js', description: 'x', severity: 'WARN' }, 's');
    a.equal(f.severity, 'P2');
  });

  it('keeps a valid severity', () => {
    const f = normalizeFinding({ file: 'a.js', description: 'x', severity: 'P0' }, 's');
    a.equal(f.severity, 'P0');
  });
});

describe('mergeReviewerOutputs', () => {
  it('collects findings from all reviewers and dedupes by file+line+category', () => {
    const merged = mergeReviewerOutputs([
      { agent: 'r1', output: { summary: 's1', findings: [
        { file: 'a.js', line: 10, category: 'logic', description: 'd', severity: 'P1' },
      ] } },
      { agent: 'r2', output: { summary: 's2', findings: [
        { file: 'a.js', line: 10, category: 'logic', description: 'dupe', severity: 'P0' },
        { file: 'b.js', line: 2, category: 'perf', description: 'd2', severity: 'P3' },
      ] } },
    ]);
    a.equal(merged.findings.length, 2);
    a.equal(merged.summaries.r1, 's1');
    a.equal(merged.summaries.r2, 's2');
  });

  it('on a duplicate keeps the higher severity and records both sources', () => {
    const merged = mergeReviewerOutputs([
      { agent: 'r1', output: { summary: '', findings: [
        { file: 'a.js', line: 10, category: 'logic', description: 'd', severity: 'P2' },
      ] } },
      { agent: 'r2', output: { summary: '', findings: [
        { file: 'a.js', line: 10, category: 'logic', description: 'd', severity: 'P0' },
      ] } },
    ]);
    a.equal(merged.findings.length, 1);
    a.equal(merged.findings[0].severity, 'P0');
    a.match(merged.findings[0].source, /r1/);
    a.match(merged.findings[0].source, /r2/);
  });

  it('tolerates a reviewer with no output', () => {
    const merged = mergeReviewerOutputs([{ agent: 'r1', output: null }]);
    a.equal(merged.findings.length, 0);
    a.equal(merged.summaries.r1, '(no output)');
  });
});

describe('severityGate', () => {
  it('treats P0/P1 as blocking and P2/P3 as nice-to-have', () => {
    const g = severityGate([
      { severity: 'P0' }, { severity: 'P1' }, { severity: 'P2' }, { severity: 'P3' },
    ]);
    a.equal(g.blocking.length, 2);
    a.equal(g.niceToHave.length, 2);
  });
});

describe('renderFindingsDoc', () => {
  it('groups findings by severity and includes reviewer notes', () => {
    const doc = renderFindingsDoc(
      [
        { file: 'a.js', line: 4, severity: 'P0', category: 'logic',
          description: 'off-by-one', suggestion: 'fix it', source: 'codex-perf' },
        { file: 'b.js', line: null, severity: 'P3', category: 'style',
          description: 'naming nit', suggestion: '', source: 'codex-architecture' },
      ],
      { 'codex-perf': 'looked at the hot path' },
    );
    a.match(doc, /REVIEW SUMMARY/);
    a.match(doc, /P0 · CRITICAL/);
    a.match(doc, /off-by-one/);
    a.match(doc, /P3 · LOW/);
    a.match(doc, /REVIEWER NOTES/);
    a.match(doc, /looked at the hot path/);
  });

  it('reports cleanly when there are no findings', () => {
    a.match(renderFindingsDoc([], {}), /No findings/);
  });
});
