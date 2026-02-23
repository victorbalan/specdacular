# Phase 4 Context: Cleanup + Installation

**Feature:** improved-feature-flow
**Phase:** 4
**Prepared:** 2026-02-13

---

## Phase Goal

Remove old command files and update help so autocomplete shows the new simplified surface.

---

## Design Defaults

- Delete all `commands/specd.feature/` files except: new.md, continue.md, toolbox.md
- Delete the entire `commands/specd.phase/` directory (all 7 files)
- Delete old workflow: `specdacular/workflows/next-feature.md` (replaced by continue-feature.md)
- Update help.md to document new command surface
- `bin/install.js` copies `commands/specd.` recursively — no code changes needed
- Keep `blueprint.md` and `config.md` (not in scope for removal)

---

## Gray Areas Remaining

_(None)_
