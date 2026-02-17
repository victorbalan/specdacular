# Decisions: brain-and-hooks

**Task:** brain-and-hooks
**Created:** 2026-02-17
**Last Updated:** 2026-02-17

---

## Active Decisions

### DEC-001: Brain as central orchestrator (Option B)

**Date:** 2026-02-17
**Status:** Active
**Context:** Two approaches considered: (A) brain as thin dispatcher calling existing workflows, or (B) brain absorbs all flow control, step workflows simplified to pure execution.
**Decision:** Option B — the brain owns all flow control and state transitions. Individual step workflows just do their job and return.
**Rationale:**
- Cleaner separation of concerns — steps don't need to know about the pipeline
- Single place to understand and modify flow control
- Makes customization simpler — override one step without worrying about flow logic
**Implications:**
- `continue.md` becomes a thin entry point delegating to brain.md
- All step workflows (discuss, research, plan, execute, review) need flow control stripped
- STATE.md transitions managed exclusively by the brain

### DEC-002: Hooks as markdown workflows only

**Date:** 2026-02-17
**Status:** Active
**Context:** Hooks could be shell scripts, markdown workflows, or both.
**Decision:** Hooks are markdown workflow files only — no shell scripts.
**Rationale:**
- Keeps everything in the same paradigm (markdown workflows)
- Hooks get full Claude capabilities — can read code, analyze context, make decisions
- More powerful than shell scripts for influencing AI-driven steps
**Implications:**
- Hook files live in `.specd/hooks/` as `.md` files
- Brain executes hooks as workflow steps with full task context
- Hook naming: `pre-{step}.md`, `post-{step}.md`, `pre-step.md`, `post-step.md`

### DEC-003: Full replace semantics for pipeline.json

**Date:** 2026-02-17
**Status:** Active
**Context:** User pipeline customization could use merge (partial override) or full replace semantics.
**Decision:** Full replace — if `.specd/pipeline.json` exists, it completely replaces the default.
**Rationale:**
- Simpler mental model — no merge surprises
- User has full control over their pipeline
- Easier to reason about what pipeline is active
**Implications:**
- Users must define the complete pipeline in their override
- No inheritance from default pipeline
- Documentation must make this clear

### DEC-004: Pipeline.json location and resolution

**Date:** 2026-02-17
**Status:** Active
**Context:** Need to determine where default and override pipeline configs live.
**Decision:** Default at `specdacular/pipeline.json` (copied during install). User override at `.specd/pipeline.json`.
**Rationale:**
- Follows existing pattern — specdacular ships defaults, .specd holds user customizations
- Brain checks `.specd/pipeline.json` first, falls back to installed default
**Implications:**
- `bin/install.js` must copy pipeline.json during install
- Brain resolution order: `.specd/pipeline.json` → installed `specdacular/pipeline.json`

### DEC-005: Hooks are just workflow steps — no special output contract

**Date:** 2026-02-17
**Status:** Active
**Context:** Need to define how hook output flows into subsequent steps. Options: (1) hooks append to CONTEXT.md, (2) hooks write to transient file, (3) hooks just modify task files directly like any workflow step.
**Decision:** Option 3 — hooks are regular workflow steps with no special contract. They can modify any task file (FEATURE.md, CONTEXT.md, DECISIONS.md, etc.) directly.
**Rationale:**
- No special plumbing needed — hooks are just workflow steps
- Next step reads the same files it always reads, naturally picks up hook changes
- Simple and consistent with existing patterns
**Implications:**
- No hook-specific output files or contracts
- Hooks have full read/write access to task files
- Order matters — pre-hooks modify files before the step reads them

### DEC-006: Hook execution mode configurable (inline vs subagent)

**Date:** 2026-02-17
**Status:** Active
**Context:** Hooks could run inline (in brain's context) or as subagents (separate Task). Each has tradeoffs for context usage and coordination.
**Decision:** Configurable per hook via `"mode": "inline"` or `"mode": "subagent"`. Default is inline.
**Rationale:**
- Inline is simpler and faster for small hooks
- Subagent protects context window for heavy hooks (e.g., "analyze entire test suite")
- User decides based on their hook's complexity
**Implications:**
- Hook config shape: `{ "workflow": "...", "mode": "inline|subagent", "optional": true|false }`
- Brain must support both execution paths

### DEC-007: Optional flag on hooks for error handling

**Date:** 2026-02-17
**Status:** Active
**Context:** Need to define what happens when a hook or step fails.
**Decision:** Steps always stop the pipeline on failure. Hooks have an `optional` flag — `false` (default) stops pipeline, `true` logs failure and continues.
**Rationale:**
- Steps are core work — failure should always stop
- Hooks may be "nice to have" that shouldn't block progress
- User controls criticality per hook
**Implications:**
- Brain saves state on any failure so user can resume
- Optional hooks log failure to CHANGELOG.md or similar
- Non-optional hooks act as gates

### DEC-008: Nested pipelines — main + phase-execution

**Date:** 2026-02-17
**Status:** Active
**Context:** Execute and review loop per phase, but the main pipeline is linear. Need to model the per-phase loop.
**Decision:** pipeline.json supports nested pipelines. Main pipeline references `"pipeline": "phase-execution"` which loops per phase from ROADMAP.md. Phase-execution contains: execute → review → revise.
**Rationale:**
- Clean separation between task lifecycle (main) and per-phase work (phase-execution)
- Users can customize the phase loop independently (e.g., add a test step)
- Brain handles the loop logic for sub-pipelines
**Implications:**
- pipeline.json has a `"pipelines"` object with named pipelines
- A step with `"pipeline": "name"` delegates to that sub-pipeline
- Brain loops the sub-pipeline per phase

### DEC-009: Revise extracted from review as separate step

**Date:** 2026-02-17
**Status:** Active
**Context:** Currently review.md handles both inspection AND fix plan creation (collect_feedback + create_fix_plan steps).
**Decision:** Extract fix plan logic into a separate `revise.md` workflow. Review becomes pure inspection, revise handles user feedback and fix plan creation.
**Rationale:**
- Cleaner separation — review inspects, revise acts
- Each step does one thing
- Makes the phase-execution pipeline explicit: execute → review → revise
**Implications:**
- New workflow: `specdacular/workflows/revise.md`
- `review.md` simplified: remove collect_feedback and create_fix_plan steps
- Brain handles loop: if revise creates fix plans → back to execute

### DEC-010: Brain replicates continue.md modes exactly

**Date:** 2026-02-17
**Status:** Active
**Context:** continue.md has three modes: interactive (prompt at each transition), semi-auto (auto through discuss→research→plan, pause after phase execute+review), auto (run everything, stop on review issues).
**Decision:** Brain preserves these exact modes. Mode is set in pipeline.json and/or via CLI flags (--semi-auto, --auto).
**Rationale:**
- Users already know these modes
- They map well to the pipeline model
- No reason to change what works
**Implications:**
- `"mode"` field in pipeline.json sets default
- CLI flags override: `--semi-auto`, `--auto`
- Brain behavior per mode matches current continue.md exactly

---

## Superseded Decisions

---

## Revoked Decisions

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-17 | Brain as central orchestrator (Option B) | Active |
| DEC-002 | 2026-02-17 | Hooks as markdown workflows only | Active |
| DEC-003 | 2026-02-17 | Full replace semantics for pipeline.json | Active |
| DEC-004 | 2026-02-17 | Pipeline.json location and resolution | Active |
| DEC-005 | 2026-02-17 | Hooks are just workflow steps — no special output contract | Active |
| DEC-006 | 2026-02-17 | Hook execution mode configurable (inline vs subagent) | Active |
| DEC-007 | 2026-02-17 | Optional flag on hooks for error handling | Active |
| DEC-008 | 2026-02-17 | Nested pipelines — main + phase-execution | Active |
| DEC-009 | 2026-02-17 | Revise extracted from review as separate step | Active |
| DEC-010 | 2026-02-17 | Brain replicates continue.md modes exactly | Active |
