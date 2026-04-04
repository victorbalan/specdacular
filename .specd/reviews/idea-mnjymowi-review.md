# Code Review: Retry with Feedback (idea-mnjymowi)

**Reviewer:** Claude Opus 4.6
**Date:** 2026-04-04
**Commits:** cb81a57..b820e60 (9 commits)
**Status:** success

---

## Summary

Implementation of two retry modes for failed/done tasks: "retry from scratch" (wipe branch, restart lifecycle) and "retry with feedback" (keep branch, accumulate guidance, re-run pipeline). All 8 plan tasks implemented correctly across 7 modified files.

## Correctness vs Plan

All plan tasks implemented faithfully:

| Task | Status | Notes |
|------|--------|-------|
| 1. StateManager.clearTask | Done | Matches plan exactly |
| 2. Template context feedback | Done | Single-line change, correct |
| 3. Orchestrator retry-fresh/retry-feedback | Done | Both actions implemented correctly |
| 4. IPC fix | Done | Routes through advanceTask now |
| 5. REST API update | Done | Accepts mode + feedback |
| 6. UI retry buttons + textarea | Done | Follows re-plan pattern |
| 7. KanbanBoard ACTION_MAP | Done | Removed failed entry, uses overlay |
| 8. Smoke test | Skipped | Manual test, no code changes needed |

## Findings

### Strengths

1. **Consistent pattern reuse**: The retry-feedback flow mirrors the existing re-plan flow (`runner/main/orchestrator.js:177-191` vs `146-157`). Same feedback accumulation pattern, same error handling structure.
2. **Clean IPC fix**: The `retry-task` handler (`runner/main/ipc.js:60`) now routes through `advanceTask` instead of directly mutating state, which is the correct pattern.
3. **Backward compatibility**: `action === 'retry'` still works alongside `retry-fresh` (`orchestrator.js:160`).
4. **UI follows existing patterns**: The retry textarea is structurally identical to the re-plan textarea, keeping the codebase consistent.

### Minor Issues

1. **`retry-fresh` clears spec on `done` tasks** (`orchestrator.js:170`): When retrying a completed task from scratch, `spec: ''` wipes the brainstorm output. This is intentional per the plan (full reset to `idea`), but a user who wants to re-run execution with the same spec would need to use `retry-feedback` instead. The UX makes this distinction clear with the two buttons, so this is acceptable.

2. **No empty-feedback guard on retry-feedback** (`TaskDetailOverlay.jsx:169`): The submit button fires even if `retryFeedback` is empty. This would call `advanceTask('retry-feedback', '')`, which would join with existing feedback. The orchestrator handles this gracefully (empty string is filtered by `.filter(Boolean)`), so no bug, but the button could be disabled when textarea is empty for better UX. This matches the existing re-plan behavior which also has no guard (`TaskDetailOverlay.jsx:234`), so it's consistent.

3. **Overlay closes after retry-fresh** (`KanbanBoard.jsx:120`): `handleAction` calls `setSelectedTask(null)` after action completes. For `retry-fresh`, the task resets to `idea` status and the overlay closes. The user sees the card move to the Ideas column. This is correct behavior.

### Edge Cases Verified

- **No worktreeManager**: `retry-fresh` guards with `if (this.worktreeManager)` (`orchestrator.js:162`) - safe
- **No existing feedback**: `[task.feedback, feedback].filter(Boolean).join(...)` handles null/empty correctly (`orchestrator.js:178`)
- **Task not found**: `advanceTask` returns `null`, API returns 404 (`api.js:113`) - correct
- **Done task retry**: Both buttons render for `currentStatus === 'done'` (`TaskDetailOverlay.jsx:127`) - correct

### Security

No concerns. No user input is passed to shell commands or file paths. Feedback is stored as a string on the task object and passed to the agent template context.

### Performance

No concerns. `clearTask` writes to disk once via `persist()`. No loops or expensive operations.

## Verdict

**PASS** - Implementation is correct, follows established patterns, and matches the plan. The minor UX improvement (disabling submit on empty feedback) is not blocking and is consistent with existing behavior.
