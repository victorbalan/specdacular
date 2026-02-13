# Phase 3 Context: Complex Workflow Conversion

**Feature:** tool-agnostic
**Phase Type:** Build system / generation + command creation
**Discussed:** 2026-02-13

## Phase Overview

Create missing command files for 9 workflows, extend build script to handle internal workflows, and generate all remaining Codex skills including parallel→sequential agent conversion.

## Resolved Questions

### Missing command files

**Question:** 9 workflows have no command files — how should the build script discover them?
**Resolution:** Both approaches: create command stubs for user-facing workflows AND extend build script to discover internal workflows directly.

**Details:**
- Command stubs make workflows invocable in both Claude Code and Codex
- Build script fallback catches any referenced-but-not-commanded workflows
- Commands go in `commands/specd/feature/` and `commands/specd/phase/` directories

**Related Decisions:** DEC-009

---

### Parallel agent conversion

**Question:** How should parallel agent workflows (map-codebase) work in Codex?
**Resolution:** Sequential execution with explicit warnings. Run agents one at a time, add timing note.

**Details:**
- Only map-codebase truly uses parallel agents (4 background)
- research-phase and prepare-phase describe 3 agents but already sequential
- Build script translates Task tool → sequential instructions + adds warning comment

**Related Decisions:** DEC-010

---

### Phase scope

**Question:** Should Phase 3 create command files or just improve the build script?
**Resolution:** Both. Create 9 command stubs + extend build script + generate all skills.

---

## Gray Areas Remaining

None

## Implications for Plans

- Need to create ~9 new command .md files in commands/specd/
- Build script needs a secondary discovery mode for internal workflows
- Task tool translations need special handling for parallel→sequential
- All 20+ workflows should produce Codex skills after Phase 3
