// runner/main/engine/progress/inference.js
import { execSync } from 'child_process';

export function inferProgress(cwd, lastOutputAt) {
  const secondsSinceOutput = Math.round((Date.now() - lastOutputAt) / 1000);

  try {
    const log = execSync('git log --oneline -1 --since="5 minutes ago"', {
      cwd,
      encoding: 'utf-8',
    }).trim();
    if (log) {
      return { message: `Agent committed: ${log}`, type: 'inference' };
    }
  } catch {
    // Not a git repo or no commits
  }

  try {
    const diff = execSync('git diff --stat', { cwd, encoding: 'utf-8' }).trim();
    if (diff) {
      const lines = diff.split('\n');
      const summary = lines[lines.length - 1];
      return { message: `Agent modified files: ${summary}`, type: 'inference' };
    }
  } catch {
    // Not a git repo
  }

  if (secondsSinceOutput < 60) {
    return { message: `Agent active (last output ${secondsSinceOutput}s ago)`, type: 'inference' };
  }

  return { message: `Agent idle for ${Math.round(secondsSinceOutput / 60)} minutes`, type: 'inference' };
}
