# Context: best-practices-docs

**Last Updated:** 2026-03-16
**Sessions:** 1

## Discussion Summary

Discussed the core concept: a command that detects repo tech stack, researches best practices and Claude Code ecosystem tools, and produces a reference doc. Key clarifications: the output should present options with context (not prescribe), the user should be asked for focus areas before research, and the doc stays separate from the CLAUDE.md routing table.

---

## Resolved Questions

### What tone should the output take?

**Question:** Should the command be opinionated (pick the best approach) or neutral (present options)?

**Resolution:** Present options with context and tradeoffs. Light "recommended" tags are okay, but no hard opinions. The doc is a curated menu, not a prescription.

**Related Decisions:** DEC-001

### Should the doc integrate with /specd.docs?

**Question:** Should `docs/best-practices.md` appear in the CLAUDE.md routing table?

**Resolution:** No — stays separate. The user may or may not commit it. Can be integrated later if they choose.

**Related Decisions:** DEC-002

### Should the user be able to steer research?

**Question:** Should research agents just go broad, or should the user have input?

**Resolution:** Ask the user before dispatching agents if they want to focus on specific areas (e.g., "testing patterns", "auth best practices"). They can also say "research everything."

**Related Decisions:** DEC-003

---

## Deferred Questions

### How many research agents?

**Reason:** Need to decide during planning — depends on how we split research areas
**Default for now:** 3 agents (stack practices, Claude Code ecosystem, tooling/DX) — similar to existing research.md pattern
**Revisit when:** Planning phase

### What does tech detection look like exactly?

**Reason:** Implementation detail — need to enumerate detection heuristics
**Default for now:** Check for marker files (package.json, pyproject.toml, go.mod, Cargo.toml, etc.) and inspect contents
**Revisit when:** Planning phase

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-03-16 | Core concept, tone, output format, user steering | FEATURE.md created, 3 decisions recorded |

---

## Gray Areas Remaining

- [ ] Agent research strategy — What specific sources should agents search? (official docs, awesome-lists, MCP registries, etc.)
- [ ] Doc structure — How should the output doc be organized? (by category? by decision point? by stack layer?)
- [ ] Multi-stack repos — What if the repo uses both Python and TypeScript? Research both? Ask user to pick?

---

## Quick Reference

- **Task:** `.specd/tasks/best-practices-docs/FEATURE.md`
- **Decisions:** `.specd/tasks/best-practices-docs/DECISIONS.md`
- **Research:** `.specd/tasks/best-practices-docs/RESEARCH.md` (if exists)
