# Context: best-practices-docs

**Last Updated:** 2026-03-16
**Sessions:** 2

## Discussion Summary

Discussed the core concept: a command that detects repo tech stack, researches best practices and Claude Code ecosystem tools, and produces a reference doc. Key clarifications: the output should present options with context (not prescribe), the user should be asked for focus areas before research, and the doc stays separate from the CLAUDE.md routing table.

Session 2 resolved all remaining gray areas: agent research strategy (broad but actionable depth, 4 source types), doc structure (organized by category with options and tradeoffs), multi-stack handling (detect all, research all, ask user if too many), and confirmed 3-agent split (stack patterns, Claude Code ecosystem, tooling/DX).

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

### What sources should agents search?

**Question:** What specific sources should research agents use?

**Resolution:** Four source types: (1) official docs and getting-started guides, (2) awesome-{stack} lists and production-ready GitHub templates, (3) Claude Code MCP server registries and community skill lists, (4) tooling comparison resources (synthesized, not link-dumped).

**Related Decisions:** DEC-004

### How should the output doc be organized?

**Question:** By category? By decision point? By stack layer?

**Resolution:** By category — stack patterns, Claude Code ecosystem, tooling/DX — with each section presenting options at actionable depth (enough context and tradeoffs to make a decision without leaving the doc).

**Related Decisions:** DEC-005

### How to handle multi-stack repos?

**Question:** What if the repo uses both Python and TypeScript?

**Resolution:** Detect all stacks and research all of them, with sections clearly labeled per stack. If too many stacks detected, ask the user which to focus on.

**Related Decisions:** DEC-006

### How many research agents?

**Question:** How to split the research work across agents?

**Resolution:** 3 agents: (1) Stack patterns — project structure, architectural patterns, common libraries, (2) Claude Code ecosystem — MCP servers, skills, hooks, CLAUDE.md rules, (3) Tooling & DX — linters, formatters, testing frameworks, CI, pre-commit hooks.

**Related Decisions:** DEC-007

---

## Deferred Questions

### What does tech detection look like exactly?

**Reason:** Implementation detail — need to enumerate detection heuristics
**Default for now:** Check for marker files (package.json, pyproject.toml, go.mod, Cargo.toml, etc.) and inspect contents
**Revisit when:** Planning phase

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-03-16 | Core concept, tone, output format, user steering | FEATURE.md created, 3 decisions recorded |
| 2026-03-16 | Agent strategy, doc structure, multi-stack, agent split | All gray areas resolved, 4 new decisions |

---

## Gray Areas Remaining

All gray areas resolved.

---

## Quick Reference

- **Task:** `.specd/tasks/best-practices-docs/FEATURE.md`
- **Decisions:** `.specd/tasks/best-practices-docs/DECISIONS.md`
- **Research:** `.specd/tasks/best-practices-docs/RESEARCH.md` (if exists)
