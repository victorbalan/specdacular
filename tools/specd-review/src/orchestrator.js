import { mergeReviewerOutputs, severityGate } from './findings.js';

export async function runReview({
  config, base, cwd, interactive, ui, git, runner,
}) {
  const rounds = [];
  const priorFixes = [];
  let diff = await git.getDiff(cwd, base);

  for (let round = 1; round <= config.maxRounds; round++) {
    await ui.showRound({ round, reviewers: config.reviewers, base });

    // Reviewers in parallel; a rejected reviewer is treated as skipped.
    const priorWork = priorFixes.length ? priorFixes.join('\n') : '(none)';
    const settled = await Promise.allSettled(
      config.reviewers.map((agent) =>
        runner.runReviewer(agent, { diff, round, base, priorWork })),
    );
    const reviewerOutputs = [];
    const skipped = [];
    settled.forEach((s, i) => {
      const name = config.reviewers[i].name;
      if (s.status === 'fulfilled' && s.value.output) reviewerOutputs.push(s.value);
      else skipped.push(name);
    });

    let { findings, summaries } = mergeReviewerOutputs(reviewerOutputs);
    let feedback = '';

    if (interactive) {
      const gate = await ui.findingsGate({ round, findings, summaries });
      if (gate.action === 'accept') {
        rounds.push({ round, findings, summaries, feedback: '', commit: null, skipped });
        return { base, outcome: 'accepted', rounds };
      }
      if (gate.action === 'quit') {
        rounds.push({ round, findings, summaries, feedback: '', commit: null, skipped });
        return { base, outcome: 'aborted', rounds };
      }
      if (gate.findings) findings = gate.findings; // user-edited
      feedback = gate.feedback || '';
    }

    const { blocking } = severityGate(findings);
    if (blocking.length === 0) {
      rounds.push({ round, findings, summaries, feedback, commit: null, skipped });
      return { base, outcome: 'converged', rounds };
    }

    const fix = await runner.runFixer(config.fixer, { diff, findings, feedback, round });
    if (!fix.changed) {
      rounds.push({ round, findings, summaries, feedback, commit: null, skipped });
      return { base, outcome: 'fixer-stalled', rounds };
    }

    const commit = await git.commitRound(cwd, round, blocking.length);
    rounds.push({ round, findings, summaries, feedback, commit, skipped });
    if (fix.summary) priorFixes.push(`Round ${round}: ${fix.summary}`);
    diff = await git.getDiff(cwd, base);
  }

  return { base, outcome: 'exhausted', rounds };
}
