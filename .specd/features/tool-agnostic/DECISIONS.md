# Decisions: tool-agnostic

**Feature:** tool-agnostic
**Created:** 2026-02-13
**Last Updated:** 2026-02-13
**Decisions Count:** 10

---

## Active Decisions

### DEC-001: Generator approach, not universal abstraction

**Date:** 2026-02-13
**Status:** Active
**Context:** Needed to decide between building a universal workflow format or a direct translation from Claude Code to Codex.
**Decision:** Build a direct generator/transpiler. Claude Code files are the source of truth; a build script produces Codex-compatible output.
**Rationale:**
- Two concrete implementations teach us what actually needs abstracting, if a third tool is ever added
- Avoids premature abstraction — we don't know what a "universal" format should look like yet
- Keeps the existing Claude Code codebase unchanged
- Simpler to build and maintain
**Implications:**
- `codex/` directory contains generated files, never edited directly
- Any workflow change requires re-running the build
- If we add Cursor later, we build another generator, not retrofit an abstraction
**References:**
- `bin/install.js` — existing installer pattern to extend

---

### DEC-002: Scope to Claude Code + Codex only

**Date:** 2026-02-13
**Status:** Active
**Context:** User initially considered Cursor support as well.
**Decision:** Focus on Claude Code and Codex. Cursor deferred.
**Rationale:**
- Reduces scope to something shippable
- Codex has the closest feature parity (skills, slash commands, user questions)
- Can add Cursor later with a separate generator
**Implications:**
- No need to consider `.cursorrules` format or Cursor-specific patterns
- Architecture should be clean enough that adding another target is straightforward

---

### DEC-003: Generated files committed to repository

**Date:** 2026-02-13
**Status:** Active
**Context:** Whether to gitignore generated Codex files or commit them.
**Decision:** Commit generated `codex/` directory to the repository.
**Rationale:**
- Users can inspect diffs between Claude Code and Codex versions
- Codex users can grab files directly without running a build
- CI can verify build is up to date (no dirty diff after build)
**Implications:**
- PRs will include generated file diffs
- Need discipline to run build before committing workflow changes
- `package.json` gets a `build:codex` script

---

### DEC-004: Skill directory pattern with references/ folder

**Date:** 2026-02-13
**Status:** Active
**Context:** Codex doesn't support `@path` file inclusion in SKILL.md. Needed to decide how to structure complex multi-step workflows.
**Decision:** Each workflow becomes a skill directory: brief SKILL.md entry point + `references/workflow.md` with full logic.
**Rationale:**
- Codex supports `references/` folder with standard markdown links for on-demand loading
- SKILL.md recommended under 500 lines; our workflows are longer
- Maps directly to our existing command (thin) → workflow (detailed) split
- Keeps the same architectural pattern across both tools
**Implications:**
- Build script generates skill directories, not just single files
- `codex/skills/specd-{name}/SKILL.md` + `codex/skills/specd-{name}/references/workflow.md`
- Tool references translated in the workflow.md (Read → cat, Grep → rg, etc.)
**References:**
- Codex Agent Skills specification
- `commands/specd/*.md` → SKILL.md mapping
- `specdacular/workflows/*.md` → references/workflow.md mapping

---

### DEC-005: Progressive rollout — start with easy workflows

**Date:** 2026-02-13
**Status:** Active
**Context:** Research showed 20 workflows with varying complexity. 4 require parallel agent conversion.
**Decision:** Start with the 6 easy-to-convert workflows (status, help, config, discuss-feature, review-feature, toolbox), then medium, then hard.
**Rationale:**
- Validates the translation approach with minimal risk
- Easy workflows have no agent spawning, simple tool usage
- Catches build script bugs before tackling complex conversions
**Implications:**
- Phase 1 deliverable is limited but functional
- Complex workflows (map-codebase, research-*) come later

---

### DEC-006: Pre-commit hook for generated file staleness

**Date:** 2026-02-13
**Status:** Active
**Context:** Research identified stale generated files as a critical maintenance pitfall.
**Decision:** Add a pre-commit hook that verifies `codex/` is up to date with source. CI check as backup.
**Rationale:**
- Prevents shipping outdated Codex skills
- Catches the issue before it reaches the repo
- Low cost to implement, high value prevention
**Implications:**
- Build script must be deterministic (same input = same output)
- Auto-generated header comment in all generated files

---

### DEC-007: Shared references copied per-skill

**Date:** 2026-02-13
**Status:** Active
**Phase:** 2 — Easy Workflow Conversion
**Context:** Multiple workflows reference commit-docs.md and commit-code.md. Needed to decide where these go in Codex output.
**Decision:** Copy shared references into each skill's `references/` directory. Each skill is self-contained.
**Rationale:**
- No relative path complexity
- Skills work independently even if moved/copied
- Small file duplication is acceptable
**Implications:**
- Build script needs a "shared references" list to copy per-skill

---

### DEC-008: Cross-workflow references become skill pointers

**Date:** 2026-02-13
**Status:** Active
**Phase:** 2 — Easy Workflow Conversion
**Context:** Workflows reference other workflows via `@path`. Codex skills can't use `@path` syntax.
**Decision:** Replace cross-workflow references with "See skill: specd-{name}" text. Codex discovers skills by name.
**Rationale:**
- Codex has built-in skill discovery
- Avoids deep nesting of referenced content
- Keeps each skill focused
**Implications:**
- Build script needs a translation rule for cross-workflow references

---

### DEC-009: Create command stubs for workflow-only files

**Date:** 2026-02-13
**Status:** Active
**Phase:** 3 — Complex Workflow Conversion
**Context:** 9 workflows lack command files, preventing skill generation. Build script discovers commands, not workflows.
**Decision:** Create command stub .md files for all 9 workflows. Also extend build script to discover internal workflows as fallback.
**Rationale:**
- Commands make workflows user-invocable in both Claude Code and Codex
- Build script fallback catches any referenced-but-not-commanded workflows
**Implications:**
- New files in commands/specd/feature/ and commands/specd/phase/

---

### DEC-010: Parallel agents → sequential with warnings in Codex

**Date:** 2026-02-13
**Status:** Active
**Phase:** 3 — Complex Workflow Conversion
**Context:** map-codebase uses 4 parallel background agents. Codex has no equivalent.
**Decision:** Convert to sequential execution with explicit timing warnings.
**Rationale:**
- Sequential is correct behavior, just slower
- Warning sets user expectations
- Only map-codebase is truly parallel; others already sequential
**Implications:**
- Build script adds "Note: In Codex, these run sequentially (slower than Claude Code)" to affected workflows

---

## Superseded Decisions

_None yet._

---

## Revoked Decisions

_None yet._

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-13 | Generator approach, not universal abstraction | Active |
| DEC-002 | 2026-02-13 | Scope to Claude Code + Codex only | Active |
| DEC-003 | 2026-02-13 | Generated files committed to repository | Active |
| DEC-004 | 2026-02-13 | Skill directory pattern with references/ folder | Active |
| DEC-005 | 2026-02-13 | Progressive rollout — start with easy workflows | Active |
| DEC-006 | 2026-02-13 | Pre-commit hook for generated file staleness | Active |
| DEC-007 | 2026-02-13 | Shared references copied per-skill | Active |
| DEC-008 | 2026-02-13 | Cross-workflow references become skill pointers | Active |
| DEC-009 | 2026-02-13 | Create command stubs for workflow-only files | Active |
| DEC-010 | 2026-02-13 | Parallel agents → sequential with warnings in Codex | Active |
