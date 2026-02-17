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

### DEC-007: Extract shared references to eliminate duplication

**Date:** 2026-02-17
**Status:** Active
**Context:** Workflow analysis found ~2,000 lines of duplication across 17 workflows (22-26% of total). Same patterns copy-pasted: validation, context loading, decision recording, research agent spawning, research synthesis.
**Decision:** Extract five shared references:
- `load-context.md` — Standard feature context loading (~400 lines saved across 8+ workflows)
- `record-decision.md` — DEC-{NNN} template (~180 lines saved across 6+ workflows)
- `spawn-research-agents.md` — Three-agent research pattern (~300 lines saved)
- `synthesize-research.md` — RESEARCH.md template and synthesis
- `validate-task.md` — Task existence and file validation (~100 lines saved across 10+ workflows)
**Rationale:**
- Reduces maintenance burden — fix once, applies everywhere
- Makes workflows shorter and easier to read
- Consistent behavior across all workflows
**Implications:**
- Workflows reference shared docs via `@` paths
- References must be parameterized (e.g., which optional files to load)

---

### DEC-008: Merge two review workflows into one

**Date:** 2026-02-17
**Status:** Active
**Context:** Two competing review workflows exist: `review-feature.md` (user-guided, git diff, actually used) and `review-phase.md` (Claude-driven semantic inspection, 545 lines, not connected to any command). Confusing and wasteful.
**Decision:** Merge into a single `review.md` workflow that combines both: Claude inspects code vs plan intent first, then presents findings with git diff summary. User approves or requests revisions. Fix plans in decimal phases.
**Rationale:**
- One review model, not two
- Takes the best of both: automated inspection + user control
- Eliminates 545 lines of orphaned workflow
**Implications:**
- `review-phase.md` and `review-feature.md` both deleted
- New `review.md` is the single review entry point
- Execute workflow chains to review automatically

---

### DEC-009: Convert research-feature.md to proper step-based workflow

**Date:** 2026-02-17
**Status:** Active
**Context:** `research-feature.md` is an intent document with `<research_dimensions>` sections, not a step-based `<process>` workflow like all others. Inconsistent when referenced by `continue-feature.md`.
**Decision:** Rewrite as proper step-based workflow (`research.md`) using the same `<step name="...">` format. Reference the new shared `spawn-research-agents.md` and `synthesize-research.md`.
**Rationale:**
- Consistent workflow format
- Predictable behavior when dispatched by continue workflow
**Implications:**
- `research.md` becomes a real workflow, not a conceptual doc

---

### DEC-010: Split orchestrator branches into separate workflow files

**Date:** 2026-02-17
**Status:** Active
**Context:** Five workflows have orchestrator-mode branches that roughly double their line count (~700 lines total). Makes main workflows hard to read.
**Decision:** Extract orchestrator logic into `specdacular/workflows/orchestrator/new.md` and `orchestrator/plan.md`. Main workflows detect mode and branch: `@orchestrator/this-workflow.md`.
**Rationale:**
- Main workflows stay focused on single-project flow
- Orchestrator logic is self-contained and easier to maintain
**Implications:**
- New `orchestrator/` subdirectory in workflows
- Main workflows need mode detection + branch

---

### DEC-011: Remove phase-specific command variants

**Date:** 2026-02-17
**Status:** Active
**Context:** Current system has both feature-level and phase-level commands: `discuss-feature` + `discuss-phase`, `research-feature` + `research-phase`, `plan-feature` + `plan-phase`, `prepare-phase`, `insert-phase`, `renumber-phases`. With one PLAN.md per phase, the phase-level variants are unnecessary — the main commands handle everything.
**Decision:** Remove all phase-specific commands and workflows. The main commands (`discuss`, `research`, `plan`, `execute`, `review`) operate on phases directly.
**Rationale:**
- One PLAN.md per phase means less phase-specific complexity
- Fewer commands = simpler UX
- `continue` workflow handles phase progression
**Implications:**
- 6 command files and 6 workflow files removed
- `toolbox.md` simplified (fewer operations to expose)

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
| DEC-007 | 2026-02-17 | Extract shared references to eliminate duplication | Active |
| DEC-008 | 2026-02-17 | Merge two review workflows into one | Active |
| DEC-009 | 2026-02-17 | Convert research to proper step-based workflow | Active |
| DEC-010 | 2026-02-17 | Split orchestrator branches into separate files | Active |
| DEC-011 | 2026-02-17 | Remove phase-specific command variants | Active |
