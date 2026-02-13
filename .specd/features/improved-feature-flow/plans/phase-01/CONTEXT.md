# Phase 1 Context: Rename + Toolbox

**Feature:** improved-feature-flow
**Phase Type:** Integration / Wiring
**Discussed:** 2026-02-13

## Phase Overview

Replace the current command surface by renaming `next` to `continue`, creating the `toolbox` command, and extracting shared workflow logic into reusable reference files.

## Resolved Questions

### Toolbox dispatch mechanism

**Question:** How does toolbox load and execute sub-workflows?
**Resolution:** Same `@` reference pattern used by `next-feature`. The toolbox workflow has a dispatch step that loads the corresponding workflow file based on user selection. Sub-workflow runs in the same context — no agent spawning.

**Details:**
- `@~/.claude/specdacular/workflows/discuss-feature.md` for discuss
- `@~/.claude/specdacular/workflows/research-feature.md` for research
- `@~/.claude/specdacular/workflows/plan-feature.md` for plan
- `@~/.claude/specdacular/workflows/review-feature.md` for review
- `@~/.claude/specdacular/workflows/insert-phase.md` for insert

**Related Decisions:** DEC-001

---

### Scope selection for discuss/research/plan

**Question:** How does the "whole feature or specific phase?" follow-up work?
**Resolution:** Discuss, Research, and Plan in toolbox have a two-step dispatch:
1. User picks the operation
2. Ask: "Whole feature or a specific phase?"
   - Whole feature → dispatch to feature-level workflow (discuss-feature, research-feature, plan-feature)
   - Specific phase → ask which phase, then dispatch to phase-level workflow (prepare-phase discussion/research, plan-phase)

Review and Insert skip the scope question — review applies to a specific phase, insert operates on the roadmap.

**Related Decisions:** DEC-007

---

### Feature name argument handling

**Question:** Does toolbox require feature name as argument or auto-detect?
**Resolution:** Same pattern as `next-feature` — if argument given, use it. If no argument, scan `.specd/features/*/config.json` for in-progress features and present a picker. This logic should be extracted into a shared reference file to avoid duplication.

**Related Decisions:** DEC-010

---

### Shared reference files extraction

**Question:** Can we extract duplicated workflow logic into reusable files?
**Resolution:** Yes. Extract into `specdacular/references/` (directory exists but is empty). Workflows `@`-reference these shared snippets.

Files to extract:
- `specdacular/references/select-feature.md` — Feature name argument handling + scanner/picker
- `specdacular/references/select-phase.md` — Phase argument handling + picker (used by toolbox scope question, prepare-phase, plan-phase)
- `specdacular/references/commit-config.md` — Auto-commit behavior reading from config.json

**Related Decisions:** DEC-010

---

### Reference completeness audit

**Question:** What files reference `next` that need updating to `continue`?
**Resolution:** 12 source files total:

**Command files (5):**
- `commands/specd/feature/next.md` → rename to `continue.md`
- `commands/specd/feature/new.md` — 2 refs
- `commands/specd/feature/plan.md` — 1 ref
- `commands/specd/feature/research.md` — 1 ref
- `commands/specd/feature/discuss.md` — 1 ref

**Workflow files (4):**
- `specdacular/workflows/next-feature.md` → rename to `continue-feature.md` + ~12 internal refs
- `specdacular/workflows/new-feature.md` — 8 refs (including `@` loads)
- `specdacular/workflows/execute-plan.md` — 1 ref
- `specdacular/workflows/plan-feature.md` — 2 refs

**Templates (1):**
- `specdacular/templates/features/STATE.md` — 1 ref

**Not updating:** Historical feature docs in `.specd/features/` for other features (document what was true at the time).

---

## Gray Areas Remaining

None

## Implications for Plans

- Phase 1 is bigger than originally scoped: now includes shared reference extraction
- Shared references reduce duplication across all workflows, not just new ones
- The rename is mechanical (find-and-replace across 12 files)
- Toolbox workflow is new but follows established dispatch pattern
- Existing workflows that use feature selection should be updated to `@` the shared reference (can be done incrementally — start with toolbox and continue, update others in Phase 4 cleanup)
