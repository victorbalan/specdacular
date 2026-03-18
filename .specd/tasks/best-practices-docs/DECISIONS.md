# Decisions: best-practices-docs

**Task:** best-practices-docs
**Created:** 2026-03-16
**Last Updated:** 2026-03-16

---

## Active Decisions

### DEC-001: Present Options, Don't Prescribe

**Date:** 2026-03-16
**Status:** Active
**Context:** Deciding whether the command should make opinionated choices or present options to the user
**Decision:** Present options with context and tradeoffs. Light "recommended" tags are acceptable, but the user chooses.
**Rationale:**
- Users have different needs and constraints — a one-size-fits-all prescription doesn't work
- The doc is more useful as a curated menu the user can reference repeatedly
- "Recommended" tags give guidance without locking in a choice
**Implications:**
- Research agents must capture tradeoffs for each option, not just the "best" one
- Output doc needs clear structure to present alternatives side by side
- More content per topic (multiple options vs single recommendation)

### DEC-002: Output Stays Separate From CLAUDE.md

**Date:** 2026-03-16
**Status:** Active
**Context:** Whether `docs/best-practices.md` should be added to the CLAUDE.md routing table
**Decision:** Keep it separate. The user may or may not commit the file.
**Rationale:**
- The doc is a reference for the user, not necessarily for Claude
- User should decide if/when to commit it
- Can always be integrated later with `/specd.docs`
**Implications:**
- The workflow does NOT modify CLAUDE.md
- No frontmatter with `generated_by: specd` (since it's not part of the docs system)
- The file is written but not committed automatically

### DEC-003: Ask User for Focus Areas Before Research

**Date:** 2026-03-16
**Status:** Active
**Context:** Whether research agents should go broad or be steered by user priorities
**Decision:** Ask the user before dispatching agents if they want to focus on specific areas.
**Rationale:**
- User may already know what they need (e.g., "I need help with testing")
- Focused research produces deeper, more useful results
- Broad research is still the default if user says "research everything"
**Implications:**
- Workflow needs an AskUserQuestion step before agent spawning
- Agent prompts must incorporate user's focus areas
- "Research everything" must still produce useful breadth

### DEC-004: Four Research Source Types

**Date:** 2026-03-16
**Status:** Active
**Context:** What sources should research agents use to find best practices?
**Decision:** Four source types: (1) official docs and getting-started guides, (2) awesome-{stack} lists and production-ready GitHub templates, (3) Claude Code MCP server registries and community skill lists, (4) tooling comparison resources (synthesized, not link-dumped).
**Rationale:**
- Official docs are authoritative but often miss community patterns
- Awesome-lists and templates show what the community actually uses
- MCP registries are the primary source for Claude Code ecosystem
- Synthesis over link-dumping keeps the doc actionable
**Implications:**
- Agents need web search and web fetch tools
- Agent prompts should specify source priority (official first, community second)

### DEC-005: Organize Output by Category

**Date:** 2026-03-16
**Status:** Active
**Context:** How should the output `docs/best-practices.md` be structured?
**Decision:** Organize by category — stack patterns, Claude Code ecosystem, tooling/DX — with each section presenting options at actionable depth.
**Rationale:**
- Category-based structure maps naturally to the 3-agent split
- Actionable depth means enough context to decide without leaving the doc
- Not just names — include what it does, tradeoffs, when to use it
**Implications:**
- Merge step organizes agent outputs into category sections
- Each option needs: name, what it does, tradeoffs, when to use it

### DEC-006: Detect and Research All Stacks

**Date:** 2026-03-16
**Status:** Active
**Context:** How to handle repos with multiple tech stacks (e.g., Python + TypeScript)?
**Decision:** Detect all stacks and research all of them with clearly labeled sections. If too many stacks detected, ask the user which to focus on.
**Rationale:**
- Multi-stack repos are common (API + frontend)
- Researching all gives complete picture
- User override prevents wasted research on irrelevant stacks
**Implications:**
- Tech detection must enumerate all detected stacks
- Agent prompts include all stacks (or user-selected subset)
- Output doc has per-stack sections where relevant

### DEC-007: Three Research Agents

**Date:** 2026-03-16
**Status:** Active
**Context:** How to split research work across parallel agents
**Decision:** 3 agents: (1) Stack patterns — project structure, architectural patterns, common libraries, (2) Claude Code ecosystem — MCP servers, skills, hooks, CLAUDE.md rules, (3) Tooling & DX — linters, formatters, testing frameworks, CI, pre-commit hooks.
**Rationale:**
- Matches the 3 categories in the output doc (DEC-005)
- Similar to existing research.md 3-agent pattern
- Each agent has a focused search domain
**Implications:**
- Each agent writes to a temp file, merge step combines them
- Agent prompts are stack-aware (receive detected tech info)
- User focus areas (DEC-003) steer all 3 agents

---

## Superseded Decisions

---

## Revoked Decisions

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-03-16 | Present Options, Don't Prescribe | Active |
| DEC-002 | 2026-03-16 | Output Stays Separate From CLAUDE.md | Active |
| DEC-003 | 2026-03-16 | Ask User for Focus Areas Before Research | Active |
| DEC-004 | 2026-03-16 | Four Research Source Types | Active |
| DEC-005 | 2026-03-16 | Organize Output by Category | Active |
| DEC-006 | 2026-03-16 | Detect and Research All Stacks | Active |
| DEC-007 | 2026-03-16 | Three Research Agents | Active |
