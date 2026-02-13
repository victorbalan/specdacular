# Decisions: tool-agnostic

**Feature:** tool-agnostic
**Created:** 2026-02-13
**Last Updated:** 2026-02-13

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
