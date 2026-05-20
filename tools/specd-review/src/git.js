import { simpleGit } from 'simple-git';
import { execFileSync } from 'node:child_process';

export async function assertCleanTree(cwd) {
  const status = await simpleGit(cwd).status();
  if (!status.isClean()) {
    throw new Error(
      'Working tree has uncommitted changes. Commit or stash them before running specd-review.',
    );
  }
}

export async function resolveBase(cwd) {
  const git = simpleGit(cwd);
  const branches = await git.branch();
  const candidates = ['main', 'master'];
  const baseBranch = candidates.find((b) => branches.all.includes(b)) || 'main';
  return (await git.raw(['merge-base', 'HEAD', baseBranch])).trim();
}

export async function getDiff(cwd, base) {
  return simpleGit(cwd).diff([`${base}...HEAD`]);
}

export async function commitRound(cwd, round, issueCount) {
  const git = simpleGit(cwd);
  await git.add(['-A']);
  await git.commit(`specd-review round ${round}: ${issueCount} issue(s)`);
  return (await git.revparse(['HEAD'])).trim();
}

// PR checkout uses the gh CLI directly. Returns the checked-out branch name.
export function checkoutPR(cwd, prNumber) {
  execFileSync('gh', ['pr', 'checkout', String(prNumber)], { cwd, stdio: 'inherit' });
  return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd })
    .toString()
    .trim();
}
