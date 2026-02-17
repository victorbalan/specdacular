# Task: brain-and-hooks

## What This Is

Rearchitect specdacular's workflow system into a config-driven orchestrator ("the brain") with a pluggable pipeline and markdown-based hook system. Replaces hardcoded flow control across multiple workflow files with a single orchestrator that reads `pipeline.json` to determine step order, enabled steps, workflow overrides, and pre/post hooks.

## Technical Requirements

### Must Create

- [ ] `specdacular/pipeline.json` — Default pipeline config shipped with the package (steps, order, enabled flags, hook slots)
- [ ] `specdacular/workflows/brain.md` — Central orchestrator workflow that reads pipeline.json, dispatches steps, runs hooks, manages state transitions
- [ ] Hook resolution logic in brain.md — Check for hook markdown files and execute them with task context before/after steps

### Must Integrate With

- `specdacular/workflows/continue.md` — Brain absorbs flow control logic from here; continue.md becomes a thin entry point that hands off to the brain
- `specdacular/workflows/discuss.md` — Simplified to "do the step and return," no flow control
- `specdacular/workflows/research.md` — Same simplification
- `specdacular/workflows/plan.md` — Same simplification
- `specdacular/workflows/execute-plan.md` — Same simplification
- `.specd/tasks/{name}/STATE.md` — Brain owns state transitions, reads/writes current stage
- `.specd/tasks/{name}/config.json` — Task-level config
- `.specd/config.json` — Project-level config
- `bin/install.js` — Must copy `pipeline.json` during install

### Constraints

- Zero dependencies — No new npm packages, markdown workflows only
- Full replace semantics — User's `.specd/pipeline.json` fully replaces default, no merging
- Backwards compatible — Existing `.specd/tasks/` folders should still work with the new brain
- Convention-based — Hook files are markdown workflows in `.specd/hooks/`, no new file formats

---

## Success Criteria

- [ ] Default `pipeline.json` defines the full step sequence (discuss, research, plan, execute, review) with enable/disable flags and hook slots
- [ ] Brain workflow reads pipeline.json, executes enabled steps in order, skips disabled steps
- [ ] User can place `.specd/pipeline.json` and the brain uses it instead of the default
- [ ] User can point a step's `workflow` field to a custom `.md` file and the brain executes it
- [ ] Pre/post hooks (per-step and global) execute as markdown workflow steps with full task context
- [ ] Existing step workflows (discuss, research, plan, execute) no longer contain flow control logic
- [ ] `continue.md` delegates to the brain for "what's next" logic

---

## Out of Scope

- [X] Shell script hooks — Hooks are markdown workflows only, not shell scripts
- [X] Merge semantics for pipeline.json — Full replace only, no partial overrides
- [X] GUI or interactive pipeline editor — Users edit pipeline.json directly
- [X] Runtime step reordering — Pipeline order is read at start, not modified mid-run

---

## Initial Context

### User Need
The current workflow system has flow control scattered across multiple files (continue.md, individual step workflows). Users can't customize the pipeline, disable steps, or inject their own logic. This makes the system rigid and hard to extend.

### Integration Points
- `continue.md` currently acts as a loose orchestrator — brain.md replaces this role
- Individual step workflows need flow control stripped out
- `bin/install.js` needs to copy pipeline.json
- STATE.md is the brain's primary state tracking mechanism

### Key Constraints
- Everything stays as markdown workflows — no new paradigms
- pipeline.json is the single source of truth for the pipeline
- Hooks are markdown files that execute as Claude workflow steps
