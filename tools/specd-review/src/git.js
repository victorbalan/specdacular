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

// Run a `gh` command expecting JSON; returns null if gh is missing or errors.
function ghJson(cwd, args) {
  try {
    const out = execFileSync('gh', args, {
      cwd, stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    return JSON.parse(out);
  } catch {
    return null;
  }
}

// merge-base of HEAD with a branch, preferring its remote-tracking ref.
async function mergeBaseWith(git, branchName) {
  for (const ref of [`origin/${branchName}`, branchName]) {
    try {
      return (await git.raw(['merge-base', 'HEAD', ref])).trim();
    } catch {
      // ref not present locally — try the next candidate
    }
  }
  throw new Error(`could not resolve a review base for "${branchName}"`);
}

// Determines what to review. Priority:
//   1. an explicit --base override
//   2. the base branch of the PR (given, or open for the current branch)
//   3. the repository's default branch
//   4. a local main/master fallback (no gh / no remote)
// Returns { base, source } — source is a human-readable explanation.
export async function resolveBase(cwd, { prNumber, baseOverride } = {}) {
  const git = simpleGit(cwd);

  if (baseOverride) {
    return { base: await mergeBaseWith(git, baseOverride), source: `--base ${baseOverride}` };
  }

  const prView = ['pr', 'view', '--json', 'baseRefName,number'];
  if (prNumber) prView.splice(2, 0, String(prNumber));
  const pr = ghJson(cwd, prView);
  if (pr?.baseRefName) {
    return {
      base: await mergeBaseWith(git, pr.baseRefName),
      source: `PR #${pr.number} base "${pr.baseRefName}"`,
    };
  }

  const repo = ghJson(cwd, ['repo', 'view', '--json', 'defaultBranchRef']);
  const defaultBranch = repo?.defaultBranchRef?.name;
  if (defaultBranch) {
    return {
      base: await mergeBaseWith(git, defaultBranch),
      source: `default branch "${defaultBranch}"`,
    };
  }

  const branches = await git.branch();
  const local = ['main', 'master'].find((b) => branches.all.includes(b)) || 'main';
  return { base: await mergeBaseWith(git, local), source: `local branch "${local}"` };
}

export async function getDiff(cwd, base) {
  return simpleGit(cwd).diff([`${base}...HEAD`]);
}

export async function hasUncommittedChanges(cwd) {
  return !(await simpleGit(cwd).status()).isClean();
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
