# Feature: agent-skills-migration

## What This Is

Migrate Specdacular from its custom command system (YAML frontmatter commands + monolithic workflow files) to the Agent Skills open standard (agentskills.io). Enables progressive disclosure, cross-tool interoperability, and dramatic context window savings.

## Technical Requirements

### Must Create

- [ ] `SKILL.md` — Standard Agent Skills entry point with frontmatter (`name`, `description`, `license`, `metadata`, `compatibility`). Compact router (~500 lines) that lists all commands with when-to-use guidance
- [ ] `references/workflows/` — Individual workflow files loaded on demand (migrated from `specdacular/workflows/`)
- [ ] `references/agents/` — Agent definitions loaded only when spawning (migrated from `specdacular/agents/`)
- [ ] `assets/templates/` — Template files loaded only when creating features (migrated from `specdacular/templates/`)
- [ ] `scripts/` — Any automation scripts (migrated from `bin/`)
- [ ] `.specd/codebase/rules/` — Atomic rule files replacing PATTERNS.md (output by map-codebase)
- [ ] `.specd/codebase/rules/_sections.md` — Category definitions with impact levels (output by map-codebase)
- [ ] `.specd/codebase/version.json` — Format version tracking (`{ "version": 2 }`)
- [ ] Migration script — Converts existing PATTERNS.md to atomic rules/ files

### Must Integrate With

- `commands/specd/*.md` — Current command definitions (to be replaced by SKILL.md routing)
- `specdacular/workflows/*.md` — Current monolithic workflows (to be decomposed into `references/`)
- `specdacular/agents/*.md` — Current agent definitions (to be moved to `references/agents/`)
- `specdacular/templates/` — Current templates (to be moved to `assets/templates/`)
- `bin/install.js` — Current installation script (to be simplified or replaced)
- `.specd/` — Feature state directory (unchanged, but referenced differently from SKILL.md)
- `specdacular/workflows/map-codebase.md` — Must be updated to output rules/ instead of PATTERNS.md
- `.specd/codebase/PATTERNS.md` — Existing file to be replaced by rules/ (migration needed)

### Constraints

- **Backward compatibility period** — Must support existing Claude Code command format during migration. Users shouldn't break overnight.
- **Progressive disclosure** — SKILL.md must be a compact router. Full workflow instructions loaded only when a specific command triggers. Currently workflows are 20-50KB each; at startup Claude should see only ~50 tokens per command.
- **Interoperability** — Same skill must work across Claude Code, Cursor, Gemini CLI, VS Code. Standard frontmatter and structure required.
- **No functionality loss** — Every current command must have an equivalent in the new structure.

---

## Success Criteria

- [ ] `SKILL.md` passes `skills-ref validate` CLI check
- [ ] All current commands have equivalent triggers in SKILL.md
- [ ] At startup, total tokens loaded from Specdacular < 500 (currently thousands)
- [ ] Full workflow instructions load only when user triggers a specific command
- [ ] Installation is: copy skill folder to `.claude/skills/specdacular/` (or equivalent per tool)
- [ ] Works in at least Claude Code and one other tool (Cursor or VS Code)
- [ ] Map-codebase outputs atomic `rules/` directory instead of PATTERNS.md
- [ ] Each rule file follows Vercel template (title, impact, tags, incorrect/correct examples)
- [ ] `.specd/codebase/version.json` written with `{ "version": 2 }`
- [ ] Migration script converts existing PATTERNS.md to rules/ files
- [ ] Old format detected on command run, migration offered to user

---

## Out of Scope

- [X] Rewriting workflow logic — Workflows are migrated structurally, not rewritten
- [X] Multi-skill splitting — Specdacular stays as one skill, not decomposed into many
- [X] Custom skill registry — Use standard installation, no custom package manager

---

## Initial Context

### User Need
Specdacular's custom command system is proprietary to Claude Code and wastes context by loading entire workflows at startup. The Agent Skills open standard solves both problems: progressive disclosure reduces context usage by ~90%, and the standard format works across all major AI coding tools.

### Integration Points
- Every command file in `commands/specd/` maps to a trigger in SKILL.md
- Every workflow in `specdacular/workflows/` becomes a reference file
- `bin/install.js` simplifies to directory copy
- Existing `.specd/` feature state is unaffected

### Key Constraints
- Must maintain feature parity with current command set
- Progressive disclosure is the primary technical win
- Vercel's React Best Practices skill is the reference implementation pattern
