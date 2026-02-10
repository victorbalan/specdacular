# Feature: agent-skills-migration

## What This Is

Adopt the Vercel Agent Skills atomic rules pattern for Specdacular's codebase documentation output. Map-codebase currently outputs a monolithic PATTERNS.md file; this changes it to output atomic `rules/` files following the Vercel React Best Practices pattern — each rule with title, impact, tags, and incorrect/correct code examples. Includes version tracking and migration for existing users.

## Technical Requirements

### Must Create

- [ ] `.specd/codebase/rules/` — Atomic rule files replacing PATTERNS.md (output by map-codebase)
- [ ] `.specd/codebase/rules/_sections.md` — Category definitions with impact levels (output by map-codebase)
- [ ] `.specd/codebase/rules/_template.md` — Standardized rule format reference
- [ ] `.specd/codebase/version.json` — Format version tracking (`{ "version": 2 }`)
- [ ] Migration script — Converts existing PATTERNS.md to atomic rules/ files

### Must Integrate With

- `specdacular/workflows/map-codebase.md` — Must be updated to output rules/ instead of PATTERNS.md
- `specdacular/agents/specd-codebase-mapper.md` — Must be updated for atomic rule output format
- `.specd/codebase/PATTERNS.md` — Existing file to be replaced by rules/ (migration needed)
- `.specd/codebase/MAP.md`, `STRUCTURE.md`, `CONCERNS.md` — Unchanged, kept as-is

### Constraints

- **Backward compatibility** — Existing users with PATTERNS.md must be offered migration, not broken
- **Vercel template format** — Each rule file follows the property table + incorrect/correct pattern from Vercel's react-best-practices
- **Progressive loading** — Rules loaded on demand by category prefix, not all at once
- **No functionality loss** — All patterns currently in PATTERNS.md must be captured in rules/

---

## Success Criteria

- [ ] Map-codebase outputs atomic `rules/` directory instead of PATTERNS.md
- [ ] Each rule file follows Vercel template (title, impact, tags, incorrect/correct examples)
- [ ] `rules/_sections.md` defines categories with impact levels
- [ ] `.specd/codebase/version.json` written with `{ "version": 2 }`
- [ ] Migration script converts existing PATTERNS.md to rules/ files
- [ ] Old format detected on command run, migration offered to user
- [ ] MAP.md, STRUCTURE.md, CONCERNS.md unchanged

---

## Out of Scope

- [X] Migrating Specdacular's own command system to SKILL.md format — separate future effort
- [X] Cross-tool interoperability (Cursor, VS Code, Gemini CLI) — not relevant for codebase output
- [X] Rewriting workflow logic — only output format changes
- [X] Changing MAP.md, STRUCTURE.md, or CONCERNS.md format

---

## Initial Context

### User Need
Map-codebase outputs a monolithic PATTERNS.md that loads everything into context even when only one category of patterns is needed. The Vercel Agent Skills pattern of atomic rule files enables progressive loading — load only the rules relevant to the current task.

### Integration Points
- Map-codebase workflow orchestrates the mapper agents
- Mapper agents write the output files
- Existing workflows reference `.specd/codebase/PATTERNS.md` — must handle both old and new format
- Version detection needed on specd command startup

### Key Constraints
- Vercel's React Best Practices rules/ is the reference implementation
- Rule files use property tables (not YAML frontmatter) for metadata
- `_sections.md` defines categories; filename prefixes group rules by category
