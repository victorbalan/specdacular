import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { runReview } from '../src/orchestrator.js';

// Stub UI: auto-confirms, never edits findings, gives no feedback.
const autoUI = {
  async showRound() {},
  async findingsGate() { return { action: 'continue', findings: null, feedback: '' }; },
  async showResult() {},
};

function makeDeps({ reviewerFindingsByRound, fixerOk = true }) {
  let round = 0;
  return {
    git: {
      async getDiff() { return 'diff'; },
      async commitRound() { return `commit${round}`; },
    },
    runner: {
      async runReviewer(agent) {
        const findings = reviewerFindingsByRound[round] || [];
        return { agent: agent.name, output: { summary: 's', findings } };
      },
      async runFixer() {
        round += 1;
        return { changed: fixerOk };
      },
    },
  };
}

const reviewers = [{ name: 'r1', role: 'reviewer' }];
const fixer = { name: 'fix', role: 'fixer' };

describe('runReview', () => {
  it('converges when no blocking findings remain', async () => {
    const deps = makeDeps({
      reviewerFindingsByRound: {
        0: [{ file: 'a', line: 1, severity: 'blocking', category: 'c', description: 'd' }],
        1: [],
      },
    });
    const res = await runReview({
      config: { maxRounds: 5, reviewers, fixer }, base: 'B',
      cwd: '.', interactive: false, ui: autoUI, ...deps,
    });
    a.equal(res.outcome, 'converged');
    a.equal(res.rounds.length, 2);
  });

  it('stops at maxRounds when blocking findings persist', async () => {
    const blocking = [{ file: 'a', line: 1, severity: 'blocking', category: 'c', description: 'd' }];
    const deps = makeDeps({ reviewerFindingsByRound: { 0: blocking, 1: blocking, 2: blocking } });
    const res = await runReview({
      config: { maxRounds: 2, reviewers, fixer }, base: 'B',
      cwd: '.', interactive: false, ui: autoUI, ...deps,
    });
    a.equal(res.outcome, 'exhausted');
    a.equal(res.rounds.length, 2);
  });

  it('stops when the fixer makes no changes', async () => {
    const blocking = [{ file: 'a', line: 1, severity: 'blocking', category: 'c', description: 'd' }];
    const deps = makeDeps({ reviewerFindingsByRound: { 0: blocking }, fixerOk: false });
    const res = await runReview({
      config: { maxRounds: 5, reviewers, fixer }, base: 'B',
      cwd: '.', interactive: false, ui: autoUI, ...deps,
    });
    a.equal(res.outcome, 'fixer-stalled');
  });
});
