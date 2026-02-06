# Context: agent-skills-migration

**Last Updated:** 2026-02-06
**Sessions:** 1

## Discussion Summary

Analyzed Specdacular's current architecture against the Agent Skills open standard (agentskills.io). Identified that the current custom command system (YAML frontmatter in `commands/specd/*.md` pointing to monolithic workflows in `specdacular/workflows/*.md`) wastes context and limits interoperability. The Agent Skills standard offers progressive disclosure (50 tokens at startup vs thousands), cross-tool support, and standard validation tooling. Vercel's React Best Practices skill was studied as a reference implementation: 57 atomic rules, compact SKILL.md router, `_sections.md` for categories.

---

## Resolved Questions

### Migration approach

**Question:** Should we migrate all at once or incrementally?

**Resolution:** Incremental migration with backward compatibility period.

**Details:**
- Create new SKILL.md structure alongside existing commands
- Migrate workflows one at a time to `references/`
- Deprecate old command files once new structure is validated
- Remove old structure in a final cleanup phase

**Related Decisions:** DEC-001

---

### Directory structure

**Question:** What directory layout should the skill use?

**Resolution:** Follow Agent Skills standard: `references/`, `assets/`, `scripts/`

**Details:**
- `references/workflows/` — Individual workflow files (loaded on demand)
- `references/agents/` — Agent definitions (loaded when spawning)
- `assets/templates/` — Template files (loaded when creating)
- `scripts/` — Automation scripts

---

## Deferred Questions

### Exact SKILL.md routing syntax

**Reason:** Need to research current Agent Skills standard trigger format in depth
**Default for now:** Follow Vercel React Best Practices pattern
**Revisit when:** During research phase

### Cross-tool testing strategy

**Reason:** Need to identify which tools beyond Claude Code to target first
**Default for now:** Focus on Claude Code, validate Cursor compatibility
**Revisit when:** During planning phase

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-06 | Architecture analysis, standard comparison, reference implementation review | Feature initialized, migration approach decided, directory structure chosen |

---

## Gray Areas Remaining

- [ ] Exact Agent Skills frontmatter fields required for Specdacular's use case
- [ ] How progressive disclosure works for commands with arguments (e.g., `feature:discuss {name}`)
- [ ] Whether `_sections.md` pattern from Vercel is needed or if SKILL.md routing suffices
- [ ] Installation flow for non-Claude-Code tools (Cursor, VS Code, Gemini CLI)

---

## Quick Reference

- **Feature:** `.specd/features/agent-skills-migration/FEATURE.md`
- **Decisions:** `.specd/features/agent-skills-migration/DECISIONS.md`
- **Research:** `.specd/features/agent-skills-migration/RESEARCH.md` (not yet created)
