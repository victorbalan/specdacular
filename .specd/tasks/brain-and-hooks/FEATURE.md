# Task: brain-and-hooks

## What This Is

Rearchitect specdacular's workflow system into a config-driven orchestrator ("the brain") with a pluggable pipeline and markdown-based hook system. The brain replaces `continue.md` as the central dispatcher — same behavior (interactive/semi-auto/auto modes, state-based routing, user prompts before steps) but driven by `pipeline.json` instead of hardcoded logic. Supports nested pipelines (main lifecycle + phase-execution loop) and pre/post hooks on every step.

## Technical Requirements

### Must Create

- [ ] `specdacular/pipeline.json` — Default pipeline config with nested pipelines, step configs, hook slots, and mode setting
- [ ] `specdacular/workflows/brain.md` — Central orchestrator that reads pipeline.json, manages modes (interactive/semi-auto/auto), dispatches steps, runs hooks, manages state transitions, handles the phase-execution loop
- [ ] Hook execution logic in brain.md — Resolve hook markdown files, execute inline or as subagent based on hook config

### Pipeline Structure

```json
{
  "mode": "interactive",
  "pipelines": {
    "main": [
      { "name": "discuss", "enabled": true, "workflow": "discuss.md", "hooks": { "pre": null, "post": null } },
      { "name": "research", "enabled": true, "workflow": "research.md", "hooks": { "pre": null, "post": null } },
      { "name": "plan", "enabled": true, "workflow": "plan.md", "hooks": { "pre": null, "post": null } },
      { "name": "phase-execution", "pipeline": "phase-execution" }
    ],
    "phase-execution": [
      { "name": "execute", "enabled": true, "workflow": "execute.md", "hooks": { "pre": null, "post": null } },
      { "name": "review", "enabled": true, "workflow": "review.md", "hooks": { "pre": null, "post": null } },
      { "name": "revise", "enabled": true, "workflow": "revise.md", "hooks": { "pre": null, "post": null } }
    ]
  },
  "hooks": {
    "pre-step": null,
    "post-step": null
  }
}
```

### Hook Config Shape

```json
{
  "workflow": "path/to/hook.md",
  "mode": "inline",
  "optional": true
}
```

- `mode`: `"inline"` (default) — runs in brain's context. `"subagent"` — spawns as Task agent.
- `optional`: `false` (default) — failure stops pipeline. `true` — failure logged, continues.

### Must Integrate With

- `specdacular/workflows/continue.md` — Brain absorbs all flow control logic; continue.md becomes a thin entry point that hands off to brain
- `specdacular/workflows/discuss.md` — Simplified to pure step execution, no flow control
- `specdacular/workflows/research.md` — Same simplification
- `specdacular/workflows/plan.md` — Same simplification
- `specdacular/workflows/execute.md` — Same simplification (currently `execute-plan.md`), no longer triggers review directly
- `specdacular/workflows/review.md` — Same simplification, no longer handles fix plan creation (that moves to revise)
- `specdacular/workflows/revise.md` — New: extracted from review.md's collect_feedback + create_fix_plan steps
- `.specd/tasks/{name}/STATE.md` — Brain owns all state transitions
- `.specd/tasks/{name}/config.json` — Task-level config (phases, status)
- `.specd/config.json` — Project-level config
- `bin/install.js` — Must copy `pipeline.json` during install

### Brain Responsibilities (from continue.md)

- **Mode handling:** Interactive (prompt at each transition), semi-auto (auto through main pipeline, pause after phase execute+review), auto (runs everything, stops on review issues)
- **State-based routing:** Read STATE.md + config.json to determine current position in pipeline
- **User prompts:** Before dispatching any step in interactive mode, present what's about to happen and offer alternatives (skip, go back, stop)
- **Phase loop:** The `phase-execution` sub-pipeline loops per phase from ROADMAP.md. Brain handles: review approves → next phase, review finds issues → revise → back to execute
- **Stop/resume:** Save state at any point, user resumes with `/specd:continue`

### Constraints

- Zero dependencies — No new npm packages, markdown workflows only
- Full replace semantics — User's `.specd/pipeline.json` fully replaces default, no merging
- Backwards compatible — Existing `.specd/tasks/` folders should still work with the new brain
- Convention-based — Hook files are markdown workflows in `.specd/hooks/`, no new file formats
- Modes preserved — Interactive, semi-auto, auto work exactly as today

---

## Success Criteria

- [ ] Default `pipeline.json` defines nested pipelines (main + phase-execution) with all steps, hooks, and mode
- [ ] Brain reads pipeline.json, routes based on state, dispatches steps in order
- [ ] Interactive mode prompts before each step (same UX as current continue.md)
- [ ] Semi-auto and auto modes work as today
- [ ] Phase-execution sub-pipeline loops per phase from ROADMAP.md
- [ ] User can place `.specd/pipeline.json` and the brain uses it instead of the default
- [ ] User can swap any step's workflow to a custom `.md` file
- [ ] User can enable/disable any step
- [ ] Pre/post hooks execute as markdown workflows (inline or subagent, optional or required)
- [ ] Global pre-step/post-step hooks run around every step
- [ ] Existing step workflows no longer contain flow control logic
- [ ] `revise.md` extracted from review.md's fix plan logic
- [ ] `continue.md` becomes thin entry point delegating to brain

---

## Out of Scope

- [X] Shell script hooks — Hooks are markdown workflows only
- [X] Merge semantics for pipeline.json — Full replace only
- [X] GUI or interactive pipeline editor — Users edit pipeline.json directly
- [X] Runtime step reordering — Pipeline order is read at start, not modified mid-run
- [X] New discuss-phase or research-phase workflows — Not in current active codebase, can be added later as pipeline steps

---

## Initial Context

### User Need
The current workflow system has flow control scattered across multiple files (continue.md, individual step workflows). Users can't customize the pipeline, disable steps, or inject their own logic. This makes the system rigid and hard to extend.

### Integration Points
- `continue.md` currently acts as a loose orchestrator — brain.md replaces this role entirely
- Individual step workflows need flow control stripped out
- `review.md` needs fix plan logic extracted into `revise.md`
- `bin/install.js` needs to copy pipeline.json
- STATE.md + config.json are the brain's primary state tracking mechanisms

### Key Constraints
- Everything stays as markdown workflows — no new paradigms
- pipeline.json is the single source of truth for the pipeline
- Hooks are markdown files that execute as Claude workflow steps (inline or subagent)
- The brain must replicate all current continue.md behavior (modes, prompts, state routing)
