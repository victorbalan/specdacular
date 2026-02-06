# Decisions: context-intelligence

**Feature:** context-intelligence
**Created:** 2026-02-06
**Last Updated:** 2026-02-06

---

## Active Decisions

### DEC-001: Phase-aware context loading as primary strategy

**Date:** 2026-02-06
**Status:** Active
**Phase:** 0
**Context:** Need to reduce context waste in workflows. Every command currently loads the full feature state regardless of which phase is active.
**Decision:** Implement phase-aware context loading: workflows load current phase's decisions/research prominently and only summaries of earlier phases.
**Rationale:**
- Phase is the natural unit of work in Specdacular
- Most decisions and research are phase-specific
- Earlier phases' details rarely needed during later execution
- Achieves ~76% context reduction in Phase 4 execution
**Implications:**
- All workflows must include phase-aware loading instructions
- Decisions must have `**Phase:** N` field (already in template)
- RESEARCH.md findings should include `**Phases:** N, M` tags
- Workflows need "current phase" awareness from STATE.md

---

### DEC-002: Archive, never delete context

**Date:** 2026-02-06
**Status:** Active
**Phase:** 0
**Context:** Summarization could lose critical details. Need to balance context reduction with information preservation.
**Decision:** Always archive full content before summarizing. Use `CONTEXT-archive.md` for discussion history, never delete from DECISIONS.md.
**Rationale:**
- Full detail available if needed for reference
- Summarization is lossy by nature
- Archive is cheap (disk), context window is expensive (tokens)
- User can always access archive manually
**Implications:**
- `CONTEXT-archive.md` created when summarization triggers
- Original CONTEXT.md condensed to summaries with "See archive for details"
- DECISIONS.md is filtered (not truncated) — show all decisions but load phase-relevant ones fully
- No automated deletion of any feature files

---

## Superseded Decisions

(none)

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-06 | Phase-aware context loading as primary strategy | Active |
| DEC-002 | 2026-02-06 | Archive, never delete context | Active |
