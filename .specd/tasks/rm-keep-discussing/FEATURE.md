# Task: rm-keep-discussing

## What This Is

Make workflow state persistent after every step so users can close the terminal anytime without losing progress. Remove "keep discussing / stop for now" prompts that exist only as exit-time state-save triggers.

## Technical Requirements

### Must Create

No new files — this modifies existing workflow files.

### Must Integrate With

- `specdacular/workflows/discuss.md` — Add incremental state saves after each step (probe, record_decisions, update_context)
- `specdacular/workflows/research.md` — Add state save after agent completion and synthesis
- `specdacular/workflows/plan.md` — Add state save after phase derivation and roadmap write
- `specdacular/workflows/execute.md` — Add state save after each task (not just phase end)
- `specdacular/workflows/new.md` — Remove `continuation_offer` step; flow directly into next step after init
- `specdacular/workflows/review.md` — Remove "Stop for now" option
- `specdacular/workflows/orchestrator/new.md` — Remove `continuation_offer` step
- `specdacular/workflows/brain.md` — Remove "Stop for now" exit paths
- `specdacular/references/commit-docs.md` — Referenced for commit pattern

### Constraints

- Must respect `auto_commit_docs` setting — incremental saves still check this flag
- Existing `--auto` / `--semi-auto` / `--interactive` modes in `continue.md` and `brain.md` must keep working — this task doesn't change pause behavior at stage boundaries, only removes "stop for now" as an option
- Commits should be lightweight — don't commit unchanged files

---

## Success Criteria

- [ ] Closing terminal mid-discuss session preserves all completed steps (decisions, resolved questions)
- [ ] Closing terminal mid-research preserves partial research results
- [ ] Closing terminal mid-execute preserves completed tasks within a phase
- [ ] No workflow contains "Keep discussing" or "Stop for now" prompts
- [ ] `/specd.continue` can resume from any mid-workflow interruption point
- [ ] `--auto`, `--semi-auto`, `--interactive` modes still work as before

---

## Out of Scope

- [X] Changing pause/confirm behavior at stage boundaries — Those serve a different purpose (user confirmation before major transitions)
- [X] Modifying `continue.md` routing logic — The routing is fine; it reads state and dispatches correctly
- [X] Changing the `new-project.md` workflow — It already runs sequentially without stop prompts

---

## Initial Context

### User Need
When closing the terminal mid-workflow, progress is lost because state updates (STATE.md, config.json) are batched at workflow end. The "keep discussing / stop for now" prompts exist partly as state-save triggers, but they add friction and are unnecessary if state is always current.

### Integration Points
All workflow files in `specdacular/workflows/` that write STATE.md and config.json. The `commit-docs.md` reference handles the actual git commit with auto-commit checking.

### Key Constraints
Must not break the existing mode system (--auto/--semi-auto/--interactive). Incremental commits should be small and respect auto_commit_docs setting.
