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

### DEC-002: One plan per phase

**Date:** 2026-02-17
**Status:** Active
**Context:** Current structure has phases with multiple plans each, which is confusing for users to review
**Decision:** Each phase gets exactly one `PLAN.md` at `phases/phase-NN/PLAN.md`. Phases should be kept small.
**Rationale:**
- Easier for users to review one file per phase
- Simpler mental model
- Create more phases if granularity is needed
**Implications:**
- Plan template updated
- ROADMAP.md references phases with single plans
- STATE.md tracks phases (no plan-level tracking needed)
- Plan workflow creates more, smaller phases

---

### DEC-003: Interactive mode is default, auto is opt-in

**Date:** 2026-02-17
**Status:** Active
**Context:** Initially considered auto as default, but user wants to test auto behavior before pushing to all users
**Decision:** Interactive mode (current behavior) is the default. Two opt-in flags:
- `--semi-auto` — Auto-runs discuss→research→plan, pauses for user after each phase execution + review
- `--auto` — Runs everything, only stops if review finds issues or task is complete
**Rationale:**
- Safer default for users
- Allows testing auto behavior with a flag
**Implications:**
- `continue` workflow needs argument parsing for `--semi-auto` and `--auto`
- Three distinct control flows in the continue workflow

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

### DEC-005: Code review agent runs after every phase execution

**Date:** 2026-02-17
**Status:** Active
**Context:** Need quality gate after execution. Reference library has two review patterns (automated semantic + user-guided git-diff).
**Decision:** Code review agent runs automatically after every phase execution, regardless of mode. Combines both approaches: Claude inspects code vs plan intent, presents findings with git diff, user approves or requests revisions.
**Rationale:**
- Catches deviations before they compound
- User always sees what was built before moving on
- Fix plans use decimal phases (e.g., `phase-01.1/PLAN.md`)
**Implications:**
- New `review.md` workflow and command
- Execute workflow triggers review automatically after completion
- Review loop: execute → review → fix plan → execute fix → re-review

---

### DEC-006: Keep "phases" naming (not "steps")

**Date:** 2026-02-17
**Status:** Active
**Context:** Considered renaming phases to steps, but introduces unnecessary new terminology
**Decision:** Keep `phases/phase-NN/PLAN.md` structure. Just simplify to one PLAN.md per phase.
**Rationale:**
- Avoids confusion with two naming schemes
- Phases is already established in the codebase
**Implications:**
- No naming migration needed for phase references
- Fix plans in decimal phases: `phases/phase-01.1/PLAN.md`

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-17 | Rename features to tasks | Active |
| DEC-002 | 2026-02-17 | One plan per phase | Active |
| DEC-003 | 2026-02-17 | Interactive mode is default, auto is opt-in | Active |
| DEC-004 | 2026-02-17 | No backward compatibility | Active |
| DEC-005 | 2026-02-17 | Code review agent runs after every phase execution | Active |
| DEC-006 | 2026-02-17 | Keep "phases" naming (not "steps") | Active |
