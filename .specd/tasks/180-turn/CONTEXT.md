# Context: 180-turn

**Last Updated:** 2026-03-13
**Sessions:** 1

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

---

## Gray Areas Remaining

- [ ] **Doc topic merging heuristics** — How exactly to merge 4 agent outputs into topic-based docs. What triggers a merge (e.g., when patterns + map both mention react-query, create one doc)? Needs research into the user's SND experience.
- [ ] **Always-true rules extraction** — How to identify which patterns should go in CLAUDE.md directly vs. in a doc file. What's the threshold?
- [ ] **Review date storage format** — Where to track review dates per doc (frontmatter in each doc? Separate manifest file?)
- [ ] **Research agent usage for best practices** — How to use Claude's research tools to investigate best practices for the detected stack during doc generation.

---

## Quick Reference

- **Task:** `.specd/tasks/180-turn/FEATURE.md`
- **Decisions:** `.specd/tasks/180-turn/DECISIONS.md`
- **Research:** `.specd/tasks/180-turn/RESEARCH.md` (if exists)
