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
