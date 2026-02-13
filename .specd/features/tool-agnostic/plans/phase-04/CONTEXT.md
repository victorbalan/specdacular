# Phase 4 Context: Installation & Integration

**Feature:** tool-agnostic
**Phase Type:** Integration / installer
**Discussed:** 2026-02-13

## Resolved Questions

### Install flow

**Resolution:** `--codex` flag installs to `.codex/skills/` (local project directory). No global option for Codex initially. Generates AGENTS.md and offers config.toml.

---

### AGENTS.md content

**Resolution:** Brief project-level instructions (~1-2 KB). Points to .specd/codebase/ docs, lists available skills. Must stay under 32 KiB.

---

### Pre-commit hook

**Resolution:** `npm run build:codex && git diff --exit-code codex/` — deterministic, uses existing build script.

---

### README update

**Resolution:** Add Codex installation section to README.md.

---

## Gray Areas Remaining

None
