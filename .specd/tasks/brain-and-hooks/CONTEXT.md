# Context: brain-and-hooks

**Last Updated:** 2026-02-17
**Sessions:** 1

## Discussion Summary

Discussed the need to split specdacular's workflow system into a centralized orchestrator ("the brain") and a hook system. The brain owns all flow control and state transitions, reading a `pipeline.json` config that defines step order, enabled/disabled flags, and workflow file references. Users can fully replace the pipeline by providing their own `.specd/pipeline.json`. Hooks are markdown workflow files that run pre/post each step, receiving full task context and influencing subsequent steps.

---

## Resolved Questions

### What is the brain?

**Question:** What exactly is the "brain" and how does it relate to existing workflows?

**Resolution:** The brain is a central orchestrator workflow (`brain.md`) that reads `pipeline.json` and dispatches to individual step workflows. It absorbs flow control from `continue.md` and individual step workflows. Steps become pure "do the work" units with no knowledge of what comes next.

**Related Decisions:** DEC-001

### What format are hooks?

**Question:** Should hooks be shell scripts, markdown workflows, or both?

**Resolution:** Hooks are markdown workflow files only. This keeps everything in the same paradigm — hooks are just workflow steps that the brain executes, with full access to task context.

**Related Decisions:** DEC-002

### How does pipeline customization work?

**Question:** Can users partially override the pipeline or must they replace it entirely?

**Resolution:** Full replace. If `.specd/pipeline.json` exists, it's used instead of the default. No merge semantics. Simpler mental model.

**Related Decisions:** DEC-003

### Where does the default pipeline live?

**Question:** Where is the default pipeline.json stored and how does override resolution work?

**Resolution:** Default at `specdacular/pipeline.json` (copied during install). User override at `.specd/pipeline.json`. Brain checks `.specd/pipeline.json` first, falls back to installed default.

**Related Decisions:** DEC-004

---

## Deferred Questions

### Hook output contract

**Reason:** Need to design during planning — how exactly does a hook's output get fed into the next step
**Default for now:** Hooks can write to CONTEXT.md or a hook-output location
**Revisit when:** Planning phase

### Review step design

**Reason:** Review is listed as a pipeline step but doesn't exist yet as a workflow
**Default for now:** Disabled in default pipeline.json
**Revisit when:** Planning phase

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-17 | Brain concept, hooks format, pipeline config, customization model | 4 decisions recorded, core architecture defined |

---

## Gray Areas Remaining

- [ ] Hook output contract — How hook output flows into the next step
- [ ] Review step — Needs to be designed (currently disabled by default)
- [ ] Hook execution model — Does the brain execute hooks inline or as subagents?
- [ ] Error handling — What happens when a hook or step fails?

---

## Quick Reference

- **Task:** `.specd/tasks/brain-and-hooks/FEATURE.md`
- **Decisions:** `.specd/tasks/brain-and-hooks/DECISIONS.md`
- **Research:** `.specd/tasks/brain-and-hooks/RESEARCH.md` (if exists)
