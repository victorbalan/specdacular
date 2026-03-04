# Context: rm-keep-discussing

**Last Updated:** 2026-03-04
**Sessions:** 1

## Discussion Summary

User identified that workflow state (STATE.md, config.json) is saved only at workflow exit, meaning terminal closure loses progress. The "keep discussing / stop for now" prompts exist partly to trigger these saves. Fix: save state after every step incrementally, then remove the stop prompts since they're no longer needed.

---

## Resolved Questions

### What exactly should change?

**Question:** Is this about removing pauses, auto-looping, or state persistence?

**Resolution:** Primarily about state persistence. Every workflow step should commit state immediately. The "keep discussing" prompts become unnecessary as a side effect and should be removed. Existing pause behavior at stage boundaries (--auto/--semi-auto/--interactive) stays unchanged.

**Related Decisions:** DEC-001, DEC-002

### Should workflows auto-loop?

**Question:** After a step completes, should workflows automatically continue to the next step?

**Resolution:** Yes — workflows should flow forward without asking "keep going?". But this is a consequence of removing the stop prompts, not the primary goal. Existing mode-based pauses at stage boundaries remain.

**Related Decisions:** DEC-002

---

## Deferred Questions

None identified.

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-03-04 | State persistence, stop prompts, auto-loop | Core approach defined: incremental state saves + remove stop prompts |

---

## Gray Areas Remaining

- [ ] Exact commit granularity — How often to commit within a single workflow (after every sub-step vs after each logical unit)?
- [ ] Commit message format for incremental saves — Should they use a different format than end-of-workflow commits?

---

## Quick Reference

- **Task:** `.specd/tasks/rm-keep-discussing/FEATURE.md`
- **Decisions:** `.specd/tasks/rm-keep-discussing/DECISIONS.md`
- **Research:** `.specd/tasks/rm-keep-discussing/RESEARCH.md` (if exists)
