# Context: fix-slowness

**Last Updated:** 2026-03-06
**Sessions:** 1

## Discussion Summary

User reported extreme slowness during `/specd.continue` execution phases — Claude spending 9-48+ minutes "thinking" (Musing/Actualizing/Flummoxing). Root cause analysis identified deterministic operations being handled by Claude's reasoning instead of scripts, plus excessive context loading during execution.

A prototype `hooks/specd-utils.js` was built and tested with 13 subcommands. All tests pass. The script handles commits, config updates, brain routing, phase management, changelog entries, and state updates.

User wants two parts: (1) integrate the utility script into workflows, (2) research the codebase for additional slowness sources we haven't identified yet.

---

## Resolved Questions

### What language for the utility script?

**Question:** Python or Node.js for the utility script?

**Resolution:** Node.js — stays zero-dependency, matches existing hooks pattern (`specd-check-update.js`, `specd-statusline.js`).

**Related Decisions:** DEC-001

### Should brain routing be included in the script?

**Question:** Script only mechanical operations, or also include the brain routing state machine?

**Resolution:** Include brain routing — it's a deterministic state machine that reads files and checks conditions. No Claude reasoning needed.

**Related Decisions:** DEC-002

### What context to skip during execution?

**Question:** Which files can be safely skipped during execute phase?

**Resolution:** Skip CONTEXT.md (discussion history), MAP.md, STRUCTURE.md, CONCERNS.md during execution. Keep FEATURE.md, DECISIONS.md, current PLAN.md, PATTERNS.md, and optionally RESEARCH.md/CHANGELOG.md.

**Related Decisions:** DEC-003

---

## Deferred Questions

### Workflow verbosity audit

**Reason:** Need research phase to systematically check all workflows for verbose instructions that inflate context
**Default for now:** Focus on the known high-impact changes (script + lean context)
**Revisit when:** Research phase

---

## Discussion History

| Date | Focus | Outcome |
|------|-------|---------|
| 2026-03-06 | Initial discussion — problem identification, solution design, prototype | FEATURE.md created, prototype script built and tested |

---

## Gray Areas Remaining

- [x] Additional slowness sources — Deferred to research phase
- [x] Workflow instruction optimization — Deferred to research phase

---

## Quick Reference

- **Task:** `.specd/tasks/fix-slowness/FEATURE.md`
- **Decisions:** `.specd/tasks/fix-slowness/DECISIONS.md`
- **Research:** `.specd/tasks/fix-slowness/RESEARCH.md` (if exists)
