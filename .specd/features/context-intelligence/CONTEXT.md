# Context: context-intelligence

**Last Updated:** 2026-02-06
**Sessions:** 1

## Discussion Summary

Analyzed context loading patterns across all Specdacular workflows. Found that every command loads the full context stack regardless of relevance. For a mature feature in Phase 4 execution, this means ~2,650 lines loaded when only ~620 are relevant (76% waste). Designed a phase-aware loading strategy with decision filtering, graduated loading, context archiving, and budget estimation.

---

## Resolved Questions

### Context reduction approach

**Question:** Should we reduce context via code (runtime filtering) or instructions (workflow guidance)?

**Resolution:** Instruction-based. Specdacular is markdown workflows with no runtime.

**Details:**
- Workflow files include specific instructions for what to load at each stage
- Phase-aware: "Load Phase N decisions, summarize earlier phases"
- Graduated: "Load summaries first, then full docs if needed"
- No code changes needed — just smarter workflow instructions

---

### Summarization trigger

**Question:** When should CONTEXT.md be summarized/archived?

**Resolution:** After 5+ discussion sessions, offer to archive.

**Details:**
- Workflow checks session count in CONTEXT.md header
- If >= 5: create `CONTEXT-archive.md` with full detail, condense CONTEXT.md to summaries
- Original detail always preserved in archive
- Claude performs the summarization (no scripts)

---

## Deferred Questions

### Exact context budget thresholds

**Reason:** Need real-world measurements from mature features
**Default for now:** Use 1,000 lines as warning threshold
**Revisit when:** After testing with real features

### Integration with Agent Skills progressive disclosure

**Reason:** Depends on agent-skills-migration feature
**Default for now:** Design context loading independently, align later
**Revisit when:** Agent Skills migration structure is decided

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-06 | Context waste analysis, loading strategies, archiving approach | Feature initialized, phase-aware loading designed, 76% reduction estimated |

---

## Gray Areas Remaining

- [ ] How to handle cross-phase decisions (relevant to multiple phases) — load in all relevant phases or only first?
- [ ] Summarization quality — how to ensure Claude's summaries capture critical detail
- [ ] Context budget estimation accuracy — line count vs actual token impact
- [ ] How graduated loading interacts with Agent Skills progressive disclosure

---

## Quick Reference

- **Feature:** `.specd/features/context-intelligence/FEATURE.md`
- **Decisions:** `.specd/features/context-intelligence/DECISIONS.md`
- **Research:** `.specd/features/context-intelligence/RESEARCH.md` (not yet created)
