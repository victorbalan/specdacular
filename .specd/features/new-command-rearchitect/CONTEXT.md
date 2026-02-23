# Context: new-command-rearchitect

**Last Updated:** 2026-02-17
**Sessions:** 1

## Discussion Summary

User wants to simplify specdacular's command structure, planning hierarchy, and internal efficiency. Key changes:

1. **Rename:** `features/` → `tasks/`, commands from `/specd.feature:*` → `/specd.*`
2. **Flatten plans:** One PLAN.md per phase at `phases/phase-NN/PLAN.md`. Phases kept small.
3. **Auto flags:** `--semi-auto` and `--auto` on `/specd.continue` (interactive is default)
4. **Code review:** Review agent runs after every phase execution in all modes
5. **Deduplication:** Extract ~2,000 lines of duplicated workflow logic into shared references
6. **Merge reviews:** Combine `review-feature.md` + `review-phase.md` into single `review.md`
7. **Fix research:** Convert `research-feature.md` from intent doc to proper step-based workflow
8. **Split orchestrator:** Move orchestrator branches to separate workflow files
9. **Remove phase commands:** Phase-specific variants (discuss-phase, research-phase, etc.) removed

Task type classification (small/medium/big/bug) was discussed but explicitly deferred.

---

## Resolved Questions

### Folder and command naming
**Resolution:** `.specd/tasks/`, commands `/specd.new`, `/specd.continue`, `/specd.discuss`, etc.

### Plan structure
**Resolution:** `phases/phase-NN/PLAN.md` — one plan per phase, phases kept small.

### Auto-mode behavior
**Resolution:** Interactive default. `--semi-auto` (auto discuss→research→plan, pause after each phase). `--auto` (run everything, stop only on review issues).

### Backward compatibility
**Resolution:** No. Clean break.

### Code review
**Resolution:** Runs after every phase execution in all modes. Combines semantic inspection + git diff. Fix plans in decimal phases.

### Naming: steps vs phases
**Resolution:** Keep "phases" naming. `phases/phase-01/PLAN.md`.

### Workflow duplication
**Resolution:** Extract 5 shared references: load-context, record-decision, spawn-research-agents, synthesize-research, validate-task.

### Two review workflows
**Resolution:** Merge into single `review.md`. Delete both `review-feature.md` and `review-phase.md`.

### research-feature.md format
**Resolution:** Rewrite as proper step-based workflow.

### Orchestrator branches
**Resolution:** Split into `workflows/orchestrator/new.md` and `orchestrator/plan.md`.

### Phase-specific commands
**Resolution:** Remove all. Main commands handle phases directly.

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
| 2026-02-17 | Renames, plan flattening, auto-mode, code review, naming, workflow efficiency | FEATURE.md created, 11 decisions |

---

## Gray Areas Remaining

None — discussion complete.

---

## Quick Reference

- **Feature:** `.specd/features/new-command-rearchitect/FEATURE.md`
- **Decisions:** `.specd/features/new-command-rearchitect/DECISIONS.md`
