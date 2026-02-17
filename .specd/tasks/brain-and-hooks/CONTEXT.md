# Context: brain-and-hooks

**Last Updated:** 2026-02-17
**Sessions:** 1

## Discussion Summary

Discussed rearchitecting specdacular into a config-driven orchestrator ("the brain") with a hook system. The brain replaces `continue.md` as the central dispatcher — same modes (interactive/semi-auto/auto), same state-based routing, same user prompts, but driven by `pipeline.json` instead of hardcoded logic.

Key architectural decisions: nested pipelines (main lifecycle + phase-execution loop), hooks as markdown workflows with configurable execution mode (inline/subagent) and optional flag, full replace semantics for user pipeline overrides, and extracting revise as a separate step from review.

---

## Resolved Questions

### What is the brain?

**Question:** What exactly is the "brain" and how does it relate to existing workflows?

**Resolution:** The brain is `continue.md` reimagined as a config-driven orchestrator. It absorbs all flow control from continue.md and individual step workflows. Steps become pure "do the work" units. Same behavior, driven by pipeline.json.

**Related Decisions:** DEC-001, DEC-010

### What format are hooks?

**Question:** Should hooks be shell scripts, markdown workflows, or both?

**Resolution:** Markdown workflow files only. Hooks are just workflow steps — they can modify any task file directly, no special output contract.

**Related Decisions:** DEC-002, DEC-005

### How does hook execution work?

**Question:** Should hooks run inline or as subagents?

**Resolution:** Configurable per hook. `"mode": "inline"` (default) runs in brain's context, `"mode": "subagent"` spawns a Task agent. Also supports `"optional": true` to continue on failure.

**Related Decisions:** DEC-006, DEC-007

### How does pipeline customization work?

**Question:** Can users partially override the pipeline or must they replace it entirely?

**Resolution:** Full replace. `.specd/pipeline.json` replaces default entirely. Default at `specdacular/pipeline.json`.

**Related Decisions:** DEC-003, DEC-004

### How does the per-phase loop work?

**Question:** Execute and review loop per phase — how to model this?

**Resolution:** Nested pipelines. Main pipeline has `"pipeline": "phase-execution"` step. Phase-execution sub-pipeline (execute → review → revise) loops per phase from ROADMAP.md.

**Related Decisions:** DEC-008, DEC-009

---

## Deferred Questions

### Hook file discovery

**Reason:** Need to decide during planning — does the brain look for hooks in `.specd/hooks/` by convention, or only from pipeline.json paths?
**Default for now:** Pipeline.json defines hook paths explicitly
**Revisit when:** Planning phase

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-17 | Brain concept, hooks, pipeline config, nested pipelines, modes, revise extraction | 10 decisions recorded, architecture fully defined |

---

## Gray Areas Remaining

- [ ] Hook file discovery — convention-based vs explicit paths only

---

## Quick Reference

- **Task:** `.specd/tasks/brain-and-hooks/FEATURE.md`
- **Decisions:** `.specd/tasks/brain-and-hooks/DECISIONS.md`
- **Research:** `.specd/tasks/brain-and-hooks/RESEARCH.md` (if exists)
