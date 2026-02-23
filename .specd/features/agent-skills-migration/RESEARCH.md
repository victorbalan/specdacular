# Research: agent-skills-migration

**Researched:** 2026-02-09
**Feature:** Migrate Specdacular to Agent Skills open standard + atomic codebase rules
**Confidence:** HIGH (codebase integration), HIGH (standard spec), MEDIUM (pitfalls)

## Summary

Research across three dimensions confirms the migration is feasible and well-aligned with the standard. The codebase has 17 commands, 17 workflows (6,418 lines), 2 agents, and templates — all mapping cleanly to the Agent Skills directory structure. The standard requires only `name` and `description` in SKILL.md frontmatter, with progressive disclosure loading references/ on demand. Arguments are NOT part of the standard — Claude Code's `$ARGUMENTS` mechanism continues to work as-is. Cross-tool installation varies by tool but follows a consistent pattern (skills directory with SKILL.md entry point). Key pitfall risks are YAML parsing edge cases, broken cross-references during file splitting, and "dual format hell" during the backward compatibility period.

**Key recommendation:** Start with the SKILL.md router + references/ structure (Specdacular's own packaging), then tackle the map-codebase output change (PATTERNS.md to rules/) as a second track. Keep the backward compatibility window short and version-gated.

---

## Codebase Integration

### Current Structure (What We're Migrating From)

**17 commands** in `commands/specd.`:

| Command | Workflow Reference |
|---------|-------------------|
| `specd.help` | (static output, no workflow) |
| `specd.status` | `workflows/status.md` |
| `specd.update` | (custom process in command) |
| `specd.codebase.map` | `workflows/map-codebase.md` |
| `specd.blueprint` | `workflows/blueprint.md` |
| `specd.feature:new` | `workflows/new-feature.md` |
| `specd.feature:discuss` | `workflows/discuss-feature.md` |
| `specd.feature:research` | `workflows/research-feature.md` |
| `specd.feature:plan` | `workflows/plan-feature.md` |
| `specd.feature:next` | `workflows/next-feature.md` |
| `specd.phase:prepare` | `workflows/prepare-phase.md` |
| `specd.phase:research` | `workflows/research-phase.md` |
| `specd.phase:plan` | `workflows/plan-phase.md` |
| `specd.phase:execute` | `workflows/execute-plan.md` |
| `specd.phase:review` | `workflows/review-phase.md` |
| `specd.phase:insert` | `workflows/insert-phase.md` |
| `specd.phase:renumber` | `workflows/renumber-phases.md` |

All use identical frontmatter pattern: `name`, `description`, `argument-hint`, `allowed-tools`.

**17 workflows** in `specdacular/workflows/` — total 6,418 lines. Each is a self-contained XML-tagged document (`<purpose>`, `<philosophy>`, `<process>`, `<step>`, `<success_criteria>`).

**2 agents:**
- `feature-researcher.md` — Spawned for research tasks (uses WebSearch, WebFetch)
- `specd-codebase-mapper.md` — Spawned 4x by map-codebase for parallel analysis

**Templates** in `specdacular/templates/`:
- `features/` — FEATURE.md, CONTEXT.md, DECISIONS.md, RESEARCH.md, STATE.md, CHANGELOG.md, PLAN.md, ROADMAP.md, config.json
- `blueprint/` — index.html, styles.css, scripts.js

### Migration Mapping

| Current | New | Change |
|---------|-----|--------|
| `commands/specd.*.md` (17 files) | `SKILL.md` (1 router file) | Rewrite |
| `specdacular/workflows/*.md` (17 files) | `references/workflows/*.md` | Move + path update |
| `specdacular/agents/*.md` (2 files) | `references/agents/*.md` | Move + path update |
| `specdacular/templates/` | `assets/templates/` | Move + path update |
| `bin/install.js` | `scripts/install.js` | Simplify |

### Path Updates Required in All Workflows

- `~/.claude/specdacular/workflows/{name}` → `references/workflows/{name}`
- `~/.claude/specdacular/templates/{path}` → `assets/templates/{path}`
- `~/.claude/agents/specd-{name}` → `references/agents/{name}`

### Context Window Impact

| Metric | Current | After Migration |
|--------|---------|-----------------|
| Startup context | ~5-10KB (all command files loaded) | ~50-100 tokens (frontmatter only) |
| Per-command load | 20-50KB (workflow + agent defs) | Same (loaded on demand) |
| Total skill footprint | 6,418 lines across 17 workflows | Same lines, loaded progressively |

---

## Agent Skills Standard

### SKILL.md Format (Confidence: HIGH)

**Required frontmatter:**
- `name` — 1-64 chars, lowercase letters/numbers/hyphens, must match directory name
- `description` — 1-1024 chars, what it does and when to use it

**Optional frontmatter:**
- `license` — License name or reference
- `compatibility` — Environment requirements (max 500 chars)
- `metadata` — Key-value mapping (author, version, etc.)
- `allowed-tools` — Space-delimited pre-approved tools (Claude Code only, experimental)

**Body:** Markdown, no format restrictions. Keep under 500 lines / 5000 tokens. Move detailed content to `references/`.

### Progressive Disclosure (Confidence: HIGH)

1. **Discovery (startup):** Agent loads only `name` + `description` from frontmatter (~50 tokens)
2. **Activation (task match):** Agent loads full SKILL.md body into context
3. **On-demand:** Files in `references/`, `assets/`, `scripts/` loaded only when referenced

Directory structure:
```
skill-name/
├── SKILL.md          # Required, loaded on activation
├── references/       # On-demand when referenced
├── assets/           # On-demand when referenced
└── scripts/          # On-demand when executed
```

### Argument Handling (Confidence: HIGH)

Arguments are **NOT part of the Agent Skills standard**. Each tool implements its own mechanism:

- **Claude Code:** `$ARGUMENTS` placeholder, positional `$1`, `$2`, `argument-hint` frontmatter
- **Cursor:** Arguments passed in prompt context
- **VS Code/Copilot:** Arguments via prompt context

**Implication for Specdacular:** `$ARGUMENTS` continues to work. No standard-level concern here.

### Cross-Tool Installation (Confidence: MEDIUM-HIGH)

| Tool | Skills Path | Notes |
|------|------------|-------|
| Claude Code | `~/.claude/skills/` (global) or `.claude/skills/` (project) | Scans at startup, loads frontmatter |
| Cursor | CLI auto-detection | Requires restart after install |
| VS Code / Copilot | Workspace skills directory | Reads frontmatter at startup |
| Gemini CLI | `.gemini/skills/` (workspace or user) | Hierarchy: workspace > user > extension |

### Validation (Confidence: MEDIUM-HIGH)

`skills-ref` CLI (Python, Apache 2.0):
- `skills-ref validate <path>` — Validate SKILL.md against spec
- `skills-ref read-properties <path>` — Extract metadata as JSON
- `skills-ref to-prompt <path>` — Generate XML skill blocks for agent prompts

### Vercel Skill Structure (Confidence: HIGH)

SKILL.md: ~500 lines, compact router listing 57 rules by category with one-liner descriptions.

Rule files use property table format (not YAML frontmatter):
```markdown
| Property | Value |
|----------|-------|
| title | Promise.all() for Independent Operations |
| impact | CRITICAL |
| impactDescription | 2-10x improvement |
| tags | async, parallelization, promises |

## Rule description
[explanation]

## Incorrect
[code example]

## Correct
[code example]
```

`_sections.md`: 8 categories, each with ID (filename prefix), impact level, description.

`AGENTS.md`: 79.8KB compiled document with all rules expanded. Generated by build script.

### Other Notable Skills

- **anthropics/skills** — pdf, docx, xlsx, pptx, skill-creator (production reference implementations)
- **vercel-labs/agent-skills** — react-best-practices, web-design-guidelines, composition-patterns
- **VoltAgent/awesome-agent-skills** — 300+ community skills catalog

---

## Pitfalls

### Critical

**YAML frontmatter parsing crashes on special characters**
- Real GitHub issues: Claude Code hangs on brackets in `argument-hint`, XML tags in descriptions cause `ConfigFrontmatterError`
- Prevention: Quote all frontmatter values with special chars. Validate with `skills-ref validate` before release. Test across tools.
- Detection: Automated YAML validation in CI.

**Broken cross-references when splitting PATTERNS.md into rules/**
- When monolithic file splits into atomic files, existing `@references` in workflows break.
- Prevention: Build reference map before splitting. Update references atomically with splits. Use relative paths from stable anchor.
- Detection: Grep for old filename after splitting. Dead link checker on all `@references`.

**Migration script data loss**
- Multiple interpretations of ambiguous content during conversion.
- Prevention: Dry-run with `--preview`. Never modify in place — write to new location, verify, then move. Log all decisions to migration-report.json.

### Moderate

**"Dual format hell" during backward compatibility**
- Two code paths double complexity. Users get stuck on old format.
- Prevention: Define explicit deprecation timeline (v0.7 reads both, v0.8 warns, v0.9 removes). Keep window short.

**Progressive disclosure navigation failures**
- Agents fail to find referenced files in expected order.
- Prevention: Test that agents find files. Keep index lightweight. If agents repeatedly load same file, inline that content into SKILL.md.

**Cross-tool compatibility breaks on extended frontmatter**
- Different tools parse slightly differently. Non-standard fields fail silently.
- Prevention: Stick to core spec fields (`name`, `description`). Test in at least 2 tools.

**Skill description too vague for correct selection**
- Claude can't distinguish this skill from similar ones when description is generic.
- Prevention: Description must be specific. Not "Maps codebase" but "Analyzes codebase with parallel agents to produce .specd/codebase/ documents for feature planning."

### Minor

**Rules directory clutter**
- Too many atomic files without organization.
- Prevention: Use prefix-based grouping (like Vercel). Limit to 7-10 rules per category. Include `_sections.md` for navigation.

**Stale docs during transition**
- Prevention: Deprecation warnings in old command files. Clear v1 vs v2 comparison in README.

### Task-Specific Warnings

| When Implementing | Watch Out For | Prevention |
|-------------------|---------------|------------|
| SKILL.md creation | Frontmatter field mismatches (old `command:` vs new `name:`) | Field mapping table; validate with skills-ref |
| PATTERNS.md → rules/ | Dangling @references; lost section context | Map all references before splitting |
| version.json | Schema evolution; tooling not checking before operating | Add early; validate in every command entry point |
| Migration script | Partial failures leave broken state | Atomic operations; --preview mode; backups |
| Backward compat period | Two code paths; unclear support timeline | Hard deprecation date; prominent warnings |
| Cross-tool testing | Each tool parses slightly differently | Stick to core spec; test in 2+ tools |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase structure | HIGH | Full exploration of all 17 commands, workflows, agents, templates |
| SKILL.md format | HIGH | Verified from official agentskills.io specification |
| Progressive disclosure | HIGH | Standard mechanism documented and verified |
| Argument handling | HIGH | Confirmed NOT part of standard; $ARGUMENTS is Claude Code-specific |
| Cross-tool installation | MEDIUM-HIGH | Documented for Claude Code, Gemini CLI; less certain for Cursor |
| Vercel pattern | HIGH | Analyzed SKILL.md, _sections.md, _template.md, rule files |
| Migration pitfalls | MEDIUM | Based on real GitHub issues + general migration research |
| rules/ output format | MEDIUM | Vercel pattern clear; adapting for arbitrary codebases needs testing |

## Open Questions

- **Rule file format for codebase output:** Vercel uses property tables, not YAML frontmatter. Should we follow the same property table format, or use YAML frontmatter in rule files? Property tables are more readable but less machine-parseable.
- **AGENTS.md compilation:** Vercel has a build step that compiles all rules into one AGENTS.md. Do we need an equivalent compiled output, or is the rules/ directory sufficient?
- **Skill name constraints:** Standard requires name to match directory name, lowercase with hyphens only. Current name `specd` works. But nested commands (`feature:discuss`) — do these become part of the description/routing or separate skills?
- **Allowed-tools field:** Experimental, Claude Code only. Should we use it for tool restrictions per command, or skip it for cross-tool compatibility?

## Sources

### Codebase (from Explore)
- All 17 command files in `commands/specd.`
- All 17 workflow files in `specdacular/workflows/`
- Agent definitions in `specdacular/agents/` and `.claude/agents/`
- Templates in `specdacular/templates/`
- Installation in `bin/install.js`

### External (verified)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Agent Skills Overview](https://agentskills.io/what-are-skills)
- [Integrate Skills](https://agentskills.io/integrate-skills)
- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills)
- [VS Code Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [Gemini CLI Skills](https://geminicli.com/docs/cli/skills/)
- [Vercel react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
- [Anthropic official skills](https://github.com/anthropics/skills)
- [skills-ref CLI](https://github.com/agentskills/agentskills/tree/main/skills-ref)

### GitHub Issues (YAML parsing bugs)
- [argument-hint with brackets causes TUI hang](https://github.com/anthropics/claude-code/issues/22161)
- [XML tags in descriptions cause ConfigFrontmatterError](https://github.com/anthropics/claude-code/issues/12958)
- [Valid line breaks in frontmatter cause parsing failure](https://github.com/anthropics/claude-code/issues/4700)
- [skill-creator prohibits optional fields](https://github.com/anthropics/skills/issues/249)
