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
- All step workflows (discuss, research, plan, execute) need flow control stripped
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
**Decision:** Default at `specdacular/pipeline.json` (copied during install to `~/.claude/specdacular/pipeline.json`). User override at `.specd/pipeline.json`.
**Rationale:**
- Follows existing pattern — specdacular ships defaults, .specd holds user customizations
- Brain checks `.specd/pipeline.json` first, falls back to installed default
- Consistent with how config.json already works
**Implications:**
- `bin/install.js` must copy pipeline.json during install
- Brain resolution order: `.specd/pipeline.json` → installed `specdacular/pipeline.json`

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
