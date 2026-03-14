# Context: 180-turn

**Last Updated:** 2026-03-13
**Sessions:** 2

## Discussion Summary

The user wants to fundamentally rethink how specdacular handles codebase context. Instead of generating custom `.specd/codebase/` docs (MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md) that every workflow must check, the new approach uses CLAUDE.md as a routing table pointing to topic-specific docs in `docs/`. This mirrors the pattern the user successfully implemented on the SND webclient project and aligns with context engineering principles (every token fights for its place, on-demand knowledge loading).

Two references informed the design:
- Bassim Eledath's "8 Levels of Agentic Engineering" — particularly levels 3-4 (context engineering, compounding loop)
- mp-web3/claude-starter-kit — on-demand knowledge files, routing tables, session hooks

The user's SND webclient CLAUDE.md serves as the target pattern: a routing table ("Working on X? Read docs/Y.md") + always-true rules + on-demand topic docs.

---

## Resolved Questions

### How to handle raw codebase analysis

**Question:** Should we create new agents for doc generation or reuse existing ones?

**Resolution:** Reuse the same 4 parallel mapper agents (map, patterns, structure, concerns). Their raw outputs get merged and reorganized into topic-based docs. This is exactly how the user did it on the SND project — generated the 4 raw docs, then used them to create focused topic docs.

**Related Decisions:** DEC-001

### Where docs live

**Question:** Where should generated docs go?

**Resolution:** Check if CLAUDE.md already references a docs path — use that. Otherwise default to `docs/`. Never use `.specd/` for these.

**Related Decisions:** DEC-002

### Review flow

**Question:** How interactive should the review/generation flow be?

**Resolution:** Create a separate `/specd.docs.review` command for auditing docs. It tracks review dates per doc, checks for staleness, and suggests improvements or new files. The generation flow (`/specd.docs`) proposes a list of docs to create and gets user approval before generating.

**Related Decisions:** DEC-003

### CLAUDE.md ownership

**Question:** What if the user already has a CLAUDE.md?

**Resolution:** Append/merge the routing table. Can also propose removing bloat if there's too much boilerplate. Non-destructive — never delete user content without approval.

**Related Decisions:** DEC-004

### CLAUDE.md is purely a router

**Question:** Should always-true rules go directly in CLAUDE.md or in a doc file?

**Resolution:** CLAUDE.md is purely a routing table. All rules go in `docs/rules.md`, even one-liners. No inline rules in CLAUDE.md at all.

**Related Decisions:** DEC-006

### Review date tracking

**Question:** Where to store review dates — frontmatter or manifest?

**Resolution:** YAML frontmatter in each doc (`last_reviewed`, `generated_by` fields). Self-contained, easy to grep.

**Related Decisions:** DEC-007

### Research agents during generation vs. review

**Question:** Should we research best practices during doc generation?

**Resolution:** No. Generation uses only what mapper agents find in the actual codebase. Research agents are used during review only (`/specd.docs.review`) to suggest improvements.

**Related Decisions:** DEC-008

---

## Deferred Questions

### Skill generators per project

**Reason:** User explicitly said this is future work after docs system is in place.
**Default for now:** Not included in this task.
**Revisit when:** After 180-turn is complete.

### How to handle docs for monorepo / multi-project setups

**Reason:** Not enough info yet on how orchestrator mode interacts with the new docs system.
**Default for now:** Focus on single-project case.
**Revisit when:** User brings up orchestrator + docs interaction.

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-03-13 | Full scope: replace codebase system, new commands, CLAUDE.md routing, dynamic topics, review tracking | FEATURE.md defined, 5 decisions recorded |
| 2026-03-13 | Gray areas: merging heuristics, rules location, review storage, research timing | All 4 gray areas resolved, 3 new decisions (DEC-006/007/008) |

---

## Gray Areas Remaining

All initial gray areas resolved in session 2. See DEC-006, DEC-007, DEC-008.

---

## Quick Reference

- **Task:** `.specd/tasks/180-turn/FEATURE.md`
- **Decisions:** `.specd/tasks/180-turn/DECISIONS.md`
- **Research:** `.specd/tasks/180-turn/RESEARCH.md` (if exists)
