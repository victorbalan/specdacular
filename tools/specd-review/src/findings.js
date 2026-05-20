// Severity scale (highest to lowest). P0/P1 are "blocking" — they gate the
// review loop; P2/P3 are reported but do not block.
export const SEVERITY_ORDER = ['P0', 'P1', 'P2', 'P3'];
const VALID_SEVERITY = new Set(SEVERITY_ORDER);
const BLOCKING = new Set(['P0', 'P1']);
const SEVERITY_LABEL = {
  P0: 'P0 · critical',
  P1: 'P1 · high',
  P2: 'P2 · medium',
  P3: 'P3 · low',
};

export function normalizeFinding(raw, source) {
  return {
    file: raw.file || '(unknown)',
    line: Number.isInteger(raw.line) ? raw.line : null,
    severity: VALID_SEVERITY.has(raw.severity) ? raw.severity : 'P2',
    category: raw.category || 'general',
    description: raw.description || '',
    suggestion: raw.suggestion || '',
    source,
  };
}

function dedupeKey(f) {
  return `${f.file}::${f.line}::${f.category}`;
}

export function mergeReviewerOutputs(reviewerOutputs) {
  const summaries = {};
  const seen = new Map();
  for (const { agent, output } of reviewerOutputs) {
    if (!output) {
      summaries[agent] = '(no output)';
      continue;
    }
    summaries[agent] = output.summary || '';
    for (const raw of output.findings || []) {
      const f = normalizeFinding(raw, agent);
      const key = dedupeKey(f);
      if (seen.has(key)) {
        // Same issue found by two reviewers — keep the higher severity, and
        // record both sources.
        const existing = seen.get(key);
        if (SEVERITY_ORDER.indexOf(f.severity) < SEVERITY_ORDER.indexOf(existing.severity)) {
          existing.severity = f.severity;
        }
        if (!existing.source.includes(f.source)) existing.source += `, ${f.source}`;
      } else {
        seen.set(key, f);
      }
    }
  }
  return { findings: [...seen.values()], summaries };
}

export function severityGate(findings) {
  return {
    blocking: findings.filter((f) => BLOCKING.has(f.severity)),
    niceToHave: findings.filter((f) => !BLOCKING.has(f.severity)),
  };
}

function sortBySeverity(findings) {
  return [...findings].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );
}

// Renders all merged findings as a polished, severity-grouped plain-text
// document — the consolidated review summary shown in the UI and the report.
export function renderFindingsDoc(findings, summaries = {}) {
  const rule = '─'.repeat(64);
  const lines = ['═'.repeat(64), '  REVIEW SUMMARY'];
  const counts = SEVERITY_ORDER
    .map((s) => `${findings.filter((f) => f.severity === s).length} ${s}`)
    .join(' · ');
  lines.push(`  ${findings.length} finding(s)   ${counts}`);
  lines.push('═'.repeat(64), '');

  if (findings.length === 0) {
    lines.push('  No findings — the reviewers raised nothing. ✔', '');
  }

  let n = 0;
  for (const sev of SEVERITY_ORDER) {
    const group = sortBySeverity(findings).filter((f) => f.severity === sev);
    if (group.length === 0) continue;
    lines.push(`  ${SEVERITY_LABEL[sev].toUpperCase()}   (${group.length})`, `  ${rule}`);
    for (const f of group) {
      n += 1;
      const loc = f.line != null ? `${f.file}:${f.line}` : f.file;
      lines.push(`  ${n}.  ${loc}   [${f.category}]`);
      lines.push(`      ${f.description}`);
      if (f.suggestion) lines.push(`      ↳ fix: ${f.suggestion}`);
      lines.push(`      — found by ${f.source}`, '');
    }
  }

  const notes = Object.entries(summaries).filter(([, v]) => v && v !== '(no output)');
  if (notes.length) {
    lines.push('  REVIEWER NOTES', `  ${rule}`);
    for (const [agent, note] of notes) {
      lines.push(`  ${agent}:`, `      ${note}`, '');
    }
  }
  return lines.join('\n');
}
