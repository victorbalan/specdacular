# Context: tool-agnostic

**Last Updated:** 2026-02-13
**Sessions:** 2

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

## Resolved Questions (Session 2)

### How do workflows map to Codex skills?

**Question:** Should complex workflows be one SKILL.md, split into multiple skills, or use file inclusion?

**Resolution:** Each workflow becomes a skill directory with a brief SKILL.md entry point and a `references/workflow.md` containing the full logic.

**Details:**
- Codex does NOT support `@path` file references in skill files
- Codex DOES support a `references/` folder pattern — files linked via standard markdown
- SKILL.md recommended under 500 lines; references loaded on demand
- This maps directly to our current command → workflow split

**Structure:**
```
.agents/skills/specd-new-feature/
├── SKILL.md              ← Brief entry point
├── references/
│   └── workflow.md       ← Full workflow logic (translated)
```

**Related Decisions:** DEC-004

---

### How does Codex handle arguments and file references?

**Question:** Do Codex skills support `$ARGUMENTS` and `@path` syntax?

**Resolution:** `$ARGUMENTS` exists in deprecated custom prompts. Skills use explicit invocation (`$skill-name arg`) or implicit matching. No `@path` syntax — only standard markdown links.

**Details:**
- `@` in Codex is interactive-only (fuzzy file picker), not a static reference
- `/mention` is runtime-only, cannot be used in instruction files
- AGENTS.md has 32 KiB combined limit, no file imports
- Skills are invoked explicitly (`$specd-new-feature my-feature`) or implicitly by description match

---

## Deferred Questions

### How to handle map-codebase parallel agents in Codex?

**Reason:** Codex lacks built-in parallel agent spawning
**Default for now:** Run mapper agents sequentially in Codex version
**Revisit when:** During planning — may need to restructure as single-pass analysis

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-13 | Tool-agnostic vision, Codex research, porting strategy | Decided on generator approach, scoped to Claude Code + Codex |
| 2026-02-13 | Codex file reference research, skill structure | Resolved skill directory pattern, no @path support, references/ folder |

---

## Gray Areas Remaining

- [ ] Build script architecture — single pass or per-file transformation (planning concern)

---

## Quick Reference

- **Feature:** `.specd/features/tool-agnostic/FEATURE.md`
- **Decisions:** `.specd/features/tool-agnostic/DECISIONS.md`
- **Research:** `.specd/features/tool-agnostic/RESEARCH.md` (if exists)
