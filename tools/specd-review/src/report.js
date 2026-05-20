import { writeFileSync } from 'node:fs';

function renderFinding(f) {
  const loc = f.line != null ? `${f.file}:${f.line}` : f.file;
  return [
    `- **[${f.severity}]** \`${loc}\` _(${f.category}, ${f.source})_`,
    `  - ${f.description}`,
    f.suggestion ? `  - suggestion: ${f.suggestion}` : null,
  ].filter(Boolean).join('\n');
}

function renderRound(r) {
  const lines = [`## Round ${r.round}`, ''];
  if (r.skipped && r.skipped.length) {
    lines.push(`_Skipped reviewers (no valid output): ${r.skipped.join(', ')}_`, '');
  }
  for (const [agent, summary] of Object.entries(r.summaries || {})) {
    lines.push(`**${agent}:** ${summary}`, '');
  }
  if (r.findings.length) {
    lines.push('### Findings', '', ...r.findings.map(renderFinding), '');
  } else {
    lines.push('No findings.', '');
  }
  if (r.feedback) lines.push(`### User feedback`, '', `> ${r.feedback}`, '');
  if (r.commit) lines.push(`Fix committed: \`${r.commit}\``, '');
  return lines.join('\n');
}

export function renderReport({ base, outcome, rounds }) {
  return [
    '# specd-review report',
    '',
    `- Base: \`${base}\``,
    `- Outcome: **${outcome}**`,
    `- Rounds: ${rounds.length}`,
    '',
    ...rounds.map(renderRound),
  ].join('\n');
}

export function writeReport(path, runState) {
  writeFileSync(path, renderReport(runState));
}
