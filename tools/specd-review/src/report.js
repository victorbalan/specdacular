import { writeFileSync } from 'node:fs';
import { SEVERITY_ORDER } from './findings.js';

function renderFinding(f, n) {
  const loc = f.line != null ? `${f.file}:${f.line}` : f.file;
  return [
    `${n}. \`${loc}\` _(${f.category} — found by ${f.source})_`,
    `   - ${f.description}`,
    f.suggestion ? `   - **fix:** ${f.suggestion}` : null,
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
    lines.push('### Findings', '');
    let n = 0;
    for (const sev of SEVERITY_ORDER) {
      const group = r.findings.filter((f) => f.severity === sev);
      if (group.length === 0) continue;
      lines.push(`#### ${sev} (${group.length})`, '');
      for (const f of group) {
        n += 1;
        lines.push(renderFinding(f, n), '');
      }
    }
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
