# Feature: execution-resilience

## What This Is

Git-based rollback, explicit resume protocol, and structured diagnostics for Specdacular's plan execution workflow. Enables clean recovery from verification failures, session crashes, and mid-execution problems. Adds a `specd.phase:rollback` command for reverting failed phases.

## Technical Requirements

### Must Create

- [ ] Git tagging protocol in `execute-plan.md` — Tag `specd/{feature}/phase-{N}/start` before execution and `specd/{feature}/phase-{N}/done` after successful completion
- [ ] Resume protocol in `execute-plan.md` — Explicit steps to recover from interrupted sessions (read STATE.md, verify last commit, re-run verification, continue or diagnose)
- [ ] Diagnostic mode for verification failures — Instead of "retry/skip/stop", provide: files modified, test output, likely cause, suggestion
- [ ] `commands/specd.phase-rollback.md` — New command definition for `specd.phase:rollback {feature} {N}`
- [ ] `specdacular/workflows/rollback-phase.md` — Rollback workflow that resets to git tag, cleans STATE.md, preserves plans

### Must Integrate With

- `specdacular/workflows/execute-plan.md` — Primary integration point for tagging, resume, and diagnostics
- `.specd/features/{name}/STATE.md` — Resume protocol reads/writes execution progress
- `.specd/features/{name}/CHANGELOG.md` — Diagnostic output recorded here
- `specdacular/workflows/plan-phase.md` — Plans preserved during rollback (only execution resets)
- Git repository — Tags for phase start/end, reset for rollback

### Constraints

- **Non-destructive by default** — Rollback uses `git reset` but always warns user first. Plans and feature state files are preserved.
- **Git-native** — Use standard git tags and reset. No custom tooling for version control.
- **Session-aware** — Resume protocol must handle the case where Claude's conversation was lost mid-execution
- **Safe tags** — Tag names follow `specd/{feature}/phase-{N}/{event}` convention, scoped to avoid collisions

---

## Success Criteria

- [ ] Before Phase N execution, `git tag specd/{feature}/phase-{N}/start` is created
- [ ] After successful Phase N, `git tag specd/{feature}/phase-{N}/done` is created
- [ ] `/specd.phase:rollback {feature} {N}` resets to pre-phase state, cleans STATE.md, preserves plans
- [ ] Verification failures show: files modified, test output, likely cause, and actionable suggestion
- [ ] Resume after interruption: reads STATE.md, verifies last task's commit, re-runs verification, continues or diagnoses
- [ ] Rollback warns user before executing destructive git operations

---

## Out of Scope

- [X] Partial task rollback — Rollback is per-phase, not per-task. Tasks within a phase are atomic.
- [X] Automatic rollback — Always requires explicit user command
- [X] Branch-based isolation — Execution happens on current branch, not feature branches
- [X] Backup beyond git — Git tags are the backup mechanism, no additional copies

---

## Initial Context

### User Need
Execution commits after each task but has no rollback mechanism. If verification fails, commits are already in git history. There's no way to revert to "pre-phase" state. If a session crashes mid-execution, STATE.md tracks position but there's no explicit resume protocol. When things go wrong, "retry/skip/stop" doesn't help diagnose the actual problem.

### Integration Points
- execute-plan.md (tagging, resume, diagnostics)
- STATE.md (execution progress tracking)
- CHANGELOG.md (diagnostic output)
- Git (tags, reset)
- New rollback command and workflow

### Key Constraints
- Must warn before any destructive git operation
- Plans survive rollback (only execution artifacts reset)
- Resume must work even when conversation context is lost
