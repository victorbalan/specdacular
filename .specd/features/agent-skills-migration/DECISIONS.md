# Decisions: agent-skills-migration

**Feature:** agent-skills-migration
**Created:** 2026-02-06
**Last Updated:** 2026-02-06

---

## Active Decisions

### DEC-001: Migrate to Agent Skills open standard format

**Date:** 2026-02-06
**Status:** Active
**Phase:** 0
**Context:** Specdacular uses a proprietary command system that only works with Claude Code and loads entire workflows into context at startup. The Agent Skills open standard is supported by Claude Code, Cursor, Gemini CLI, VS Code, and others.
**Decision:** Adopt the Agent Skills open standard as Specdacular's command/skill format.
**Rationale:**
- Progressive disclosure reduces startup context from thousands of tokens to ~50 per command
- Interoperability across all major AI coding tools
- Standard validation tooling (`skills-ref validate`)
- Established ecosystem with growing adoption
**Implications:**
- All commands must be expressible as SKILL.md triggers
- Directory structure must follow `references/`, `assets/`, `scripts/` convention
- Installation simplifies to directory copy
- Backward compatibility period needed during migration

---

### DEC-002: Use Vercel React Best Practices as reference implementation

**Date:** 2026-02-06
**Status:** Active
**Phase:** 0
**Context:** Need a concrete example of a well-structured Agent Skill to model Specdacular's migration after.
**Decision:** Use Vercel's React Best Practices skill as the primary reference for structure and patterns.
**Rationale:**
- Production-proven skill with 57 atomic rules
- Demonstrates compact SKILL.md router pattern
- Shows `_sections.md` for categorization
- Shows `_template.md` for standardized rule format
**Implications:**
- Study Vercel's pattern for SKILL.md organization
- Consider `_sections.md` for Specdacular's command categories (feature:*, phase:*, utility)
- Adapt atomic rule pattern to Specdacular's workflow structure

---

### DEC-003: Incremental migration with backward compatibility

**Date:** 2026-02-06
**Status:** Active
**Phase:** 0
**Context:** Users have existing Specdacular installations using the current command system. Breaking change would disrupt workflows.
**Decision:** Migrate incrementally — create new structure alongside old, deprecate, then remove.
**Rationale:**
- Users can transition at their own pace
- Reduces risk of migration bugs
- Allows testing new structure before committing fully
**Implications:**
- Both old commands/ and new SKILL.md will coexist temporarily
- Need clear deprecation notices in old command files
- Final cleanup phase removes old structure

---

## Superseded Decisions

(none)

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-06 | Migrate to Agent Skills open standard format | Active |
| DEC-002 | 2026-02-06 | Use Vercel React Best Practices as reference implementation | Active |
| DEC-003 | 2026-02-06 | Incremental migration with backward compatibility | Active |
