# Context: new-command-rearchitect

**Last Updated:** 2026-02-17
**Sessions:** 1

## Discussion Summary

User wants to simplify the specdacular command structure and planning hierarchy. Key changes: (1) flatten plans so each phase has exactly one PLAN.md, (2) rename `features/` to `tasks/` and shorten commands from `/specd:feature:*` to `/specd:*`, (3) add `--semi-auto` and `--auto` flags to `/specd:continue` (interactive is default), (4) add a code review agent that runs after every phase execution.

Task type classification (small/medium/big/bug) was discussed but explicitly deferred.

Investigated reference library review patterns — two approaches exist (automated semantic review and user-guided git-diff review). The new review workflow will combine both: Claude inspects code against plan intent, presents findings with git diff, user approves or requests revisions, fix plans go in decimal phases.

---

## Resolved Questions

### Folder and command naming

**Question:** What should replace the `features/` folder and `feature:*` commands?

**Resolution:** Folder becomes `.specd/tasks/`, commands become `/specd:new`, `/specd:continue`, `/specd:discuss`, etc.

### Plan structure

**Question:** How should plans be organized?

**Resolution:** `phases/phase-NN/PLAN.md` — one plan file per phase. Phases should be kept small. No more multiple plans per phase.

### Auto-mode behavior

**Question:** Should the workflow auto-advance through stages?

**Resolution:** Interactive is the default. Two opt-in flags:
- `--semi-auto` — Auto-runs discuss→research→plan, then executes phase-by-phase with review + user approval after each
- `--auto` — Runs everything until task completion, only stops if review finds issues

### Backward compatibility

**Question:** Support existing `.specd/features/` layouts?

**Resolution:** No. Clean break, no migration.

### Code review

**Question:** Should code be reviewed after execution?

**Resolution:** Yes. A code review agent runs after every phase execution in all modes. It inspects code against plan intent, presents findings, and can generate fix plans in decimal phases (e.g., `phases/phase-01.1/PLAN.md`).

### Naming: steps vs phases

**Question:** Should the plan folders be called "steps" or "phases"?

**Resolution:** Keep "phases" naming. Folder structure: `phases/phase-01/PLAN.md`. Simpler and avoids introducing new terminology.

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
| 2026-02-17 | Folder rename, plan simplification, command rename, auto-mode, code review, naming | FEATURE.md created, 6 decisions |

---

## Gray Areas Remaining

- [ ] Workflow efficiency improvements — User wants to investigate current workflows/agents for streamlining beyond just renaming

---

## Quick Reference

- **Feature:** `.specd/features/new-command-rearchitect/FEATURE.md`
- **Decisions:** `.specd/features/new-command-rearchitect/DECISIONS.md`
