# Context: new-command-rearchitect

**Last Updated:** 2026-02-17
**Sessions:** 1

## Discussion Summary

User wants to simplify the specdacular command structure and planning hierarchy. Three main changes: (1) flatten plans so each step has exactly one PLAN.md, (2) rename `features/` to `tasks/` and shorten commands from `/specd:feature:*` to `/specd:*`, (3) make auto-mode the default for `/specd:continue` so the lifecycle runs without interactive prompts at each transition.

Task type classification (small/medium/big/bug) was discussed but explicitly deferred — the structure won't change per type yet.

---

## Resolved Questions

### Folder and command naming

**Question:** What should replace the `features/` folder and `feature:*` commands?

**Resolution:** Folder becomes `.specd/tasks/`, commands become `/specd:new`, `/specd:continue`, `/specd:discuss`, etc.

### Plan structure

**Question:** How should plans be organized?

**Resolution:** `steps/step-NN/PLAN.md` — one plan file per step. Steps should be kept small. No more multiple plans per phase.

### Auto-mode behavior

**Question:** Should the workflow auto-advance through stages?

**Resolution:** Yes, auto-mode is the default. `--no-auto` flag on `/specd:continue` restores the current interactive behavior.

### Backward compatibility

**Question:** Support existing `.specd/features/` layouts?

**Resolution:** No. Clean break, no migration.

---

## Deferred Questions

### Task type classification

**Reason:** User wants this but hasn't defined what changes per type yet
**Default for now:** All tasks get the same document structure
**Revisit when:** After the rearchitect is complete

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-17 | Folder rename, plan simplification, command rename, auto-mode | FEATURE.md created |

---

## Gray Areas Remaining

- [ ] Auto-mode implementation details — How does the workflow decide when to skip research vs. run it? Does it always run all stages, or does it use heuristics?
- [ ] Workflow efficiency improvements — User wants to investigate current workflows/agents for streamlining beyond just renaming

---

## Quick Reference

- **Feature:** `.specd/features/new-command-rearchitect/FEATURE.md`
- **Decisions:** `.specd/features/new-command-rearchitect/DECISIONS.md`
