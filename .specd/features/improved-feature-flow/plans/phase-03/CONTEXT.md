# Phase 3 Context: Insert Workflow

**Feature:** improved-feature-flow
**Phase:** 3
**Prepared:** 2026-02-13

---

## Phase Goal

Create insert-phase workflow that allows inserting new phases mid-development with decimal numbering. Wire it into the toolbox.

---

## Design Defaults (no discussion needed)

- Insert asks: after which phase, phase name, phase goal
- Creates `plans/phase-{N.M}/` directory (empty, like plan-feature creates)
- Updates ROADMAP.md with new entry positioned after parent phase
- Increments `phases.total` in config.json
- Decimal numbering: one level only (6.1, 6.2, no 6.1.1) per DEC-006
- Toolbox already references `insert-phase.md` — just needs the workflow to exist

---

## Gray Areas Remaining

_(All resolved by existing decisions)_
