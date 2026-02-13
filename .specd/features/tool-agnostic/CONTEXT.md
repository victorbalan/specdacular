# Context: tool-agnostic

**Last Updated:** 2026-02-13
**Sessions:** 1

## Discussion Summary

User wants Specdacular to work beyond Claude Code — specifically in OpenAI's Codex CLI. Researched Codex's instruction system (AGENTS.md, SKILL.md, slash commands, config.toml) and found strong overlap with Claude Code's model. Decided on a pragmatic approach: build a generator/transpiler that takes Claude Code source files and produces Codex-compatible output, rather than creating a universal abstraction layer.

---

## Resolved Questions

### How does Codex consume instructions?

**Question:** What's the Codex equivalent of Claude Code's commands, workflows, and agents?

**Resolution:** Codex uses SKILL.md files (in `.agents/skills/`), markdown slash commands, and AGENTS.md for project instructions. Config is TOML-based.

**Details:**
- SKILL.md with YAML frontmatter (name, description, metadata) → maps from workflows
- Slash commands are markdown files where filename becomes command name
- AGENTS.md is layered (global → project → subdirectory)
- `ask_user_question` exists and is similar to Claude Code's `AskUserQuestion`
- No built-in parallel agent spawning (requires external MCP/tmux orchestration)

**Related Decisions:** DEC-001, DEC-002

---

### What's the porting strategy?

**Question:** Build a universal abstraction or direct translation?

**Resolution:** Direct translation. Keep Claude Code as source of truth, build a generator that outputs Codex-compatible files. No intermediate format.

**Details:**
- Build script reads Claude Code files, outputs to `codex/` directory
- Tool references translated at prose level (Read → cat, Grep → rg, etc.)
- Generated files committed to repo for inspection and direct use
- `npx specdacular --codex` installs from pre-built output

**Related Decisions:** DEC-001

---

## Deferred Questions

### How exactly should workflows map to Codex skills?

**Reason:** Need to prototype the translation to understand edge cases
**Default for now:** One workflow → one SKILL.md, with tool references rewritten
**Revisit when:** During research/planning phase

### How to handle map-codebase parallel agents in Codex?

**Reason:** Codex lacks built-in parallel agent spawning
**Default for now:** Run mapper agents sequentially in Codex version
**Revisit when:** During planning — may need to restructure as single-pass analysis

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-13 | Tool-agnostic vision, Codex research, porting strategy | Decided on generator approach, scoped to Claude Code + Codex |

---

## Gray Areas Remaining

- [ ] Exact SKILL.md structure for complex multi-step workflows — need to prototype
- [ ] How Codex handles the `@path` file reference syntax — may need different approach
- [ ] Whether Codex slash commands support the same `$ARGUMENTS` pattern
- [ ] Build script architecture — single pass or per-file transformation

---

## Quick Reference

- **Feature:** `.specd/features/tool-agnostic/FEATURE.md`
- **Decisions:** `.specd/features/tool-agnostic/DECISIONS.md`
- **Research:** `.specd/features/tool-agnostic/RESEARCH.md` (if exists)
