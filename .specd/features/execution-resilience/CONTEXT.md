# Context: execution-resilience

**Last Updated:** 2026-02-06
**Sessions:** 1

## Discussion Summary

Analyzed execution failure modes in Specdacular's `execute-plan.md` workflow. Identified three gaps: no rollback mechanism (commits are permanent), no resume protocol (session crashes lose context), and vague verification failure handling ("retry/skip/stop" without diagnostics). Designed a git tag-based rollback system, explicit resume protocol, and structured diagnostic mode.

---

## Resolved Questions

### Rollback granularity

**Question:** Should rollback be per-task, per-plan, or per-phase?

**Resolution:** Per-phase. Tasks within a phase are treated as atomic.

**Details:**
- `git tag specd/{feature}/phase-{N}/start` before phase begins
- `git tag specd/{feature}/phase-{N}/done` after phase completes
- Rollback resets to start tag, clearing all tasks in that phase
- More granular rollback is complex and rarely needed — if a task fails, usually the whole phase approach needs rethinking

---

### What survives rollback

**Question:** Should rollback also reset plans and decisions, or just execution artifacts?

**Resolution:** Only execution artifacts reset. Plans, decisions, research, and roadmap are preserved.

**Details:**
- Git reset removes code changes from the phase
- STATE.md is cleaned to pre-phase state
- PLAN.md files remain (the plan wasn't wrong, execution was)
- DECISIONS.md, RESEARCH.md, ROADMAP.md unchanged
- CHANGELOG.md entries from the phase are removed (they document execution, not planning)

---

### Resume without conversation context

**Question:** How does resume work if the user starts a new Claude session?

**Resolution:** STATE.md + git log provide enough context to resume without conversation history.

**Details:**
1. Read STATE.md → find last completed task and current plan
2. Check git log → verify the last task's commit exists
3. Run the last task's verification command → confirm it still passes
4. If passes → continue to next task
5. If fails → diagnostic mode: show files modified since phase start, run tests, report status

---

## Deferred Questions

### Tag cleanup strategy

**Reason:** Not critical for initial implementation
**Default for now:** Tags accumulate (cheap in git)
**Revisit when:** If tag namespace becomes cluttered

### Multi-branch scenarios

**Reason:** Execution on feature branches is out of scope
**Default for now:** All execution happens on current branch
**Revisit when:** If users request branch-based feature isolation

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-06 | Rollback mechanism, resume protocol, diagnostic mode | Feature initialized, 3 core questions resolved, 2 deferred |

---

## Gray Areas Remaining

- [ ] How to handle rollback when other (non-Specdacular) commits happened after the phase start tag
- [ ] Whether diagnostic mode should attempt automated root cause analysis or just present data
- [ ] How resume interacts with the deviation categories from workflow-validation feature
- [ ] Whether to add a `specd:phase:status` command to show execution progress without modifying anything

---

## Quick Reference

- **Feature:** `.specd/features/execution-resilience/FEATURE.md`
- **Decisions:** `.specd/features/execution-resilience/DECISIONS.md`
- **Research:** `.specd/features/execution-resilience/RESEARCH.md` (not yet created)
