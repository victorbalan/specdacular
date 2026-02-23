# Context: improved-status-command

**Last Updated:** 2026-02-11
**Sessions:** 1

## Discussion Summary

Discussed extending `/specd.status` to support orchestrator (multi-project) mode. The current command only reads `.specd/features/` at the repo root, missing sub-project features entirely. Agreed on a grouped display format where orchestrator features show as parent rows with sub-project features indented underneath. Standalone sub-project features (not part of any orchestrator feature) appear in a separate "Project Features" section grouped by project.

---

## Resolved Questions

### How should orchestrator and sub-project features relate visually?

**Question:** Should the output use a grouped view (orchestrator feature as header with indented sub-projects) or a flat view (single table with project column)?

**Resolution:** Grouped view. Orchestrator feature is the parent row, sub-project features are indented with `└ project` underneath.

**Details:**
- Preserves the orchestrator/sub-project hierarchy visually
- Makes it clear which project work belongs to which system-level feature
- Flat view would show the same feature name multiple times with no clear connection

**Related Decisions:** DEC-001

---

### What about sub-project features that don't have an orchestrator parent?

**Question:** Should standalone sub-project features appear, and if so, how?

**Resolution:** Show them in a separate "Project Features" section below orchestrator features, grouped by project name.

**Details:**
- Each project gets its own sub-header with path
- Uses the same table format (Feature, Stage, Plans, Next Action)
- Keeps orchestrator-coordinated work visually separate from project-local work

**Related Decisions:** DEC-002

---

## Deferred Questions

_None identified._

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-11 | Orchestrator mode display, grouped vs flat, standalone features | Agreed on grouped view with separate project features section |

---

## Gray Areas Remaining

_None identified._

---

## Quick Reference

- **Feature:** `.specd/features/improved-status-command/FEATURE.md`
- **Decisions:** `.specd/features/improved-status-command/DECISIONS.md`
- **Research:** `.specd/features/improved-status-command/RESEARCH.md` (if exists)
