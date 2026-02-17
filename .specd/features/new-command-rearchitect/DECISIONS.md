# Decisions: new-command-rearchitect

**Feature:** new-command-rearchitect
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

---

## Active Decisions

### DEC-001: Rename features to tasks

**Date:** 2026-02-17
**Status:** Active
**Context:** Commands were verbose (`/specd:feature:new`) and folder name (`features/`) didn't fit all work types
**Decision:** Rename `.specd/features/` to `.specd/tasks/` and shorten all commands from `/specd:feature:*` to `/specd:*`
**Rationale:**
- Shorter commands are faster to type
- "Task" is more general than "feature" — covers bugs, refactors, etc.
**Implications:**
- All command files renamed
- All workflow files renamed
- Templates moved from `templates/features/` to `templates/tasks/`
- Installer updated for new paths

---

### DEC-002: One plan per step

**Date:** 2026-02-17
**Status:** Active
**Context:** Current structure has phases with multiple plans each, which is confusing for users to review
**Decision:** Replace `plans/phase-NN/NN-PLAN.md` with `steps/step-NN/PLAN.md` — exactly one PLAN.md per step
**Rationale:**
- Easier for users to review one file per step
- Simpler mental model
- Can create more steps if granularity is needed
**Implications:**
- Plan template updated
- ROADMAP.md references steps instead of phases
- STATE.md tracks steps instead of phases/plans
- `plan-feature` workflow (now `plan`) creates steps instead of phases

---

### DEC-003: Auto-mode as default

**Date:** 2026-02-17
**Status:** Active
**Context:** Current workflow prompts user at every stage transition (discuss→research→plan→execute)
**Decision:** `/specd:continue` runs in auto-mode by default, advancing through stages without prompting. `--no-auto` flag restores interactive behavior.
**Rationale:**
- Users who know what they want shouldn't be slowed down
- Interactive mode still available when needed
**Implications:**
- `continue` workflow needs auto-advance logic
- Need heuristics for when to skip stages (e.g., skip research for small tasks?)
- `$ARGUMENTS` parsing needs to handle `--no-auto` flag

---

### DEC-004: No backward compatibility

**Date:** 2026-02-17
**Status:** Active
**Context:** Considered supporting old `.specd/features/` layout alongside new `.specd/tasks/`
**Decision:** Clean break. No migration, no dual support.
**Rationale:**
- Simpler codebase
- Tool is early enough that users can recreate tasks
**Implications:**
- Existing `.specd/features/` folders in user projects become orphaned

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-17 | Rename features to tasks | Active |
| DEC-002 | 2026-02-17 | One plan per step | Active |
| DEC-003 | 2026-02-17 | Auto-mode as default | Active |
| DEC-004 | 2026-02-17 | No backward compatibility | Active |
