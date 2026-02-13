# Phase 2 Context: Easy Workflow Conversion

**Feature:** tool-agnostic
**Phase Type:** Build system / generation
**Discussed:** 2026-02-13

## Phase Overview

Convert 6 simple workflows into valid Codex skills. Extend build script with shared reference copying and cross-skill references.

## Resolved Questions

### Template handling

**Question:** Should the build script copy feature templates in Phase 2?
**Resolution:** Deferred to Phase 3. Templates are only used by new-feature and plan-phase workflows (complex), not by the 6 easy workflows.

---

### Shared references location

**Question:** Where should commit-docs.md and commit-code.md go?
**Resolution:** Per-skill copy. Each skill gets its own copy in `references/`. Self-contained, no relative path issues.

**Related Decisions:** DEC-007

---

### Cross-workflow references

**Question:** How should Codex skills reference other workflows?
**Resolution:** Replace `@workflow` references with "See skill: specd-{name}" pointers. Codex discovers skills by name.

**Related Decisions:** DEC-008

---

### Validation approach

**Question:** How to verify generated skills are correct?
**Resolution:** Keep grep-based checks from Phase 1. Simple, proven, sufficient.

---

## Gray Areas Remaining

None

## Implications for Plans

- Build script needs a shared references mechanism (copy commit-docs.md, commit-code.md per-skill)
- Cross-workflow `@path` references need a new translation rule → "See skill: specd-{name}"
- No template work needed in this phase
- Validation stays as grep-based post-build checks
