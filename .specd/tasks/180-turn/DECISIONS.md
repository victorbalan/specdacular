# Decisions: 180-turn

**Task:** 180-turn
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

---

## Active Decisions

### DEC-001: Reuse existing 4 mapper agents for raw analysis

**Date:** 2026-03-13
**Status:** Active
**Context:** Needed to decide whether to create new agents or reuse existing ones for codebase analysis.
**Decision:** Reuse the same 4 parallel agents (map, patterns, structure, concerns). Their raw outputs are merged and reorganized into topic-based docs in a second pass.
**Rationale:**
- User validated this two-step approach on the SND webclient project
- Agents already produce good raw analysis
- Separation of concerns: agents analyze, workflow merges
**Implications:**
- `agents/specd-codebase-mapper.md` stays unchanged
- New workflow handles the merge + topic detection logic
- Agent outputs become intermediate artifacts, not final docs

### DEC-002: Docs location discovery order

**Date:** 2026-03-13
**Status:** Active
**Context:** Need to determine where topic-specific docs should be written.
**Decision:** Check if CLAUDE.md references a docs path first. If found, use it. If not, default to `docs/`. Never use `.specd/` for docs.
**Rationale:**
- Respects existing project conventions
- `docs/` is the most common convention
- Moving away from `.specd/` for codebase knowledge
**Implications:**
- Need a CLAUDE.md parser to detect existing doc references
- `docs/` is created if it doesn't exist and no alternative is found

### DEC-003: Separate review command with date tracking

**Date:** 2026-03-13
**Status:** Active
**Context:** Needed to decide how interactive the doc review/audit flow should be.
**Decision:** Create `/specd.docs.review` as a separate command that audits docs, tracks review dates, and suggests improvements or new files. Similar to current `codebase.review` in toolbox.
**Rationale:**
- Keeps generation and review as distinct operations
- Review dates allow staleness detection
- User can run review independently of generation
**Implications:**
- Need review date storage mechanism (TBD: frontmatter vs manifest)
- Review command checks accuracy of existing docs against current code

### DEC-004: Non-destructive CLAUDE.md merging

**Date:** 2026-03-13
**Status:** Active
**Context:** Users may already have CLAUDE.md with custom content.
**Decision:** Append/merge routing table into existing CLAUDE.md. Can propose removing bloat but never delete without user approval.
**Rationale:**
- CLAUDE.md is the user's file, not ours
- Bloat removal improves context efficiency but needs user consent
**Implications:**
- Need section markers or smart detection to find/update routing table
- Proposal flow for bloat removal: show what would be removed, get approval

### DEC-005: Dynamic doc topics based on codebase content

**Date:** 2026-03-13
**Status:** Active
**Context:** Needed to decide whether doc topics are fixed or dynamic.
**Decision:** Topics are dynamically determined by analyzing what the codebase actually uses. Research agents investigate best practices for the detected stack. No fixed list of topics.
**Rationale:**
- A CSS doc for a project with no CSS is wasted context
- Different stacks need different guidance (React project vs. Go API vs. CLI tool)
- Research agents can find current best practices for detected technologies
**Implications:**
- Topic detection logic needed in the merge step
- Research agents called during doc generation
- Proposed topic list shown to user for approval before generation

---

## Superseded Decisions

---

## Revoked Decisions

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-03-13 | Reuse existing 4 mapper agents for raw analysis | Active |
| DEC-002 | 2026-03-13 | Docs location discovery order | Active |
| DEC-003 | 2026-03-13 | Separate review command with date tracking | Active |
| DEC-004 | 2026-03-13 | Non-destructive CLAUDE.md merging | Active |
| DEC-005 | 2026-03-13 | Dynamic doc topics based on codebase content | Active |
