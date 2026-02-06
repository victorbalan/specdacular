# Context: research-quality-pipeline

**Last Updated:** 2026-02-06
**Sessions:** 1

## Discussion Summary

Analyzed the research-to-planning pipeline in Specdacular. Found that confidence levels marked by research agents are lost during synthesis — the synthesized RESEARCH.md treats all findings equally. Plans reference research with minimal "From Research" sections that don't distinguish confidence. Additionally, codebase docs (`map-codebase`) have no timestamps so Claude can't detect staleness. Designed a confidence propagation system and staleness detection mechanism.

---

## Resolved Questions

### Confidence level definitions

**Question:** What do HIGH, MEDIUM, and LOW confidence mean concretely?

**Resolution:** Tied to verification source.

**Details:**
- **HIGH**: Verified against actual codebase (pattern found in existing files, API confirmed in code)
- **MEDIUM**: From official documentation or well-established libraries
- **LOW**: From community sources (blog posts, Stack Overflow, single tutorials), or unverified claims
- During synthesis, confidence can only maintain or lower (never inflate)

---

### How confidence appears in plans

**Question:** How should planners use confidence information?

**Resolution:** Separate sections in "From Research" with different instructions.

**Details:**
- HIGH confidence → "Use directly" — implement as research suggests
- MEDIUM confidence → "Recommended" — implement but be aware of edge cases
- LOW confidence → "Verify before implementing" — check compatibility, test assumption first
- This gives Claude clear, actionable guidance per finding

---

### Staleness threshold

**Question:** How many commits behind makes codebase docs "stale"?

**Resolution:** 50 commits as default threshold.

**Details:**
- Compare `git_sha` in `metadata.json` against current HEAD
- If >50 commits ahead: "Codebase docs may be stale. Consider `/specd:map-codebase --refresh`."
- 50 is a rough heuristic — can be adjusted based on experience
- Warning only, never blocks execution

---

## Deferred Questions

### Conflict resolution protocol

**Reason:** Need more examples of research-vs-decision conflicts
**Default for now:** Flag conflict and ask user to resolve
**Revisit when:** After testing with real features that have both research and decisions

### Phase-level vs feature-level research conflicts

**Reason:** Unclear how common this is
**Default for now:** Flag during phase research synthesis
**Revisit when:** After multiple features use phase-level research

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-06 | Confidence pipeline, staleness detection, conflict detection | Feature initialized, confidence tiers defined, staleness threshold set |

---

## Gray Areas Remaining

- [ ] How to handle findings where confidence changes over time (e.g., library update invalidates HIGH confidence)
- [ ] Whether to propagate confidence into execution deviation handling (LOW confidence plan items more likely to deviate)
- [ ] Exact format for `metadata.json` — what other fields beyond `generated_at`, `git_sha`, `files_analyzed`

---

## Quick Reference

- **Feature:** `.specd/features/research-quality-pipeline/FEATURE.md`
- **Decisions:** `.specd/features/research-quality-pipeline/DECISIONS.md`
- **Research:** `.specd/features/research-quality-pipeline/RESEARCH.md` (not yet created)
