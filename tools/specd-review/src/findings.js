const VALID_SEVERITY = new Set(['blocking', 'nice-to-have']);

export function normalizeFinding(raw, source) {
  return {
    file: raw.file || '(unknown)',
    line: Number.isInteger(raw.line) ? raw.line : null,
    severity: VALID_SEVERITY.has(raw.severity) ? raw.severity : 'nice-to-have',
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
      if (!seen.has(key)) seen.set(key, f);
    }
  }
  return { findings: [...seen.values()], summaries };
}

export function severityGate(findings) {
  return {
    blocking: findings.filter((f) => f.severity === 'blocking'),
    niceToHave: findings.filter((f) => f.severity === 'nice-to-have'),
  };
}
