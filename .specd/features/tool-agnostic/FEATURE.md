# Feature: tool-agnostic

## What This Is

A build system that generates Codex-compatible versions of Specdacular's workflows, commands, and agents from the existing Claude Code source files. Enables `npx specdacular --codex` installation and keeps pre-built Codex files in the repository.

## Technical Requirements

### Must Create

- [ ] `bin/build-codex.js` — Build script that reads Claude Code source files and generates Codex-compatible output into `codex/`
- [ ] `codex/` — Output directory containing generated Codex-compatible files:
  - [ ] `codex/skills/` — SKILL.md files generated from workflows + commands
  - [ ] `codex/commands/` — Slash command markdown files for Codex
  - [ ] `codex/agents.md` — AGENTS.md project instructions (equivalent of CLAUDE.md content)
  - [ ] `codex/config.toml` — Codex configuration template
- [ ] `codex/templates/` — Feature templates (these are mostly tool-agnostic already, may need minor adaptation)

### Must Integrate With

- `bin/install.js` — Add `--codex` flag that installs from `codex/` directory into `.codex/` or `~/.codex/`
- `commands/specd/*.md` — Read as input to generate Codex slash commands
- `specdacular/workflows/*.md` — Read as input to generate Codex skills
- `specdacular/templates/features/*.md` — Copy/adapt for Codex output
- `package.json` — Add `build:codex` script

### Constraints

- Zero dependencies — build script uses Node built-ins only, matching project convention
- Generated files committed to repo — `codex/` is checked in, not gitignored
- Claude Code remains source of truth — never edit `codex/` directly, always regenerate
- Tool translation is prose-level — workflows reference tools by name in natural language, not programmatic APIs. Translation means rewriting "use the Read tool" → "use `cat`", "use the Grep tool" → "use `rg`", etc.
- Agent spawning gap — Codex has no built-in parallel Task tool. Workflows that spawn agents run sequentially in Codex version, or are restructured as single-agent flows
- Codex uses `ask_user_question` — maps nearly 1:1 from Claude Code's `AskUserQuestion`

---

## Success Criteria

- [ ] `node bin/build-codex.js` reads Claude Code source and generates `codex/` directory
- [ ] Generated Codex skills are valid SKILL.md format with correct frontmatter
- [ ] Generated Codex slash commands work as `/command-name` in Codex CLI
- [ ] `npx specdacular --codex` installs Codex files to `.codex/` or appropriate location
- [ ] `codex/` directory is committed and stays in sync with source (running build produces no diff when up to date)
- [ ] Feature templates work in Codex context (FEATURE.md, CONTEXT.md, etc.)

---

## Out of Scope

- [X] Cursor support — deferred to future, focusing on Claude Code + Codex only
- [X] Universal abstraction layer — no intermediate format; direct Claude Code → Codex translation
- [X] Runtime tool detection — no auto-detecting which tool is running
- [X] Codex MCP/tmux orchestration — not building external agent orchestration for parallel tasks
- [X] Modifying Claude Code workflows — source files stay unchanged; this is output-only

---

## Initial Context

### User Need
Specdacular is currently Claude Code-only. Users want to use the same feature planning workflows in OpenAI's Codex CLI. Rather than maintaining two separate codebases, build a generator that produces Codex-compatible files from the Claude Code source.

### Integration Points
- `bin/install.js` — existing installer gets `--codex` flag
- All `commands/specd/*.md` — input for command generation
- All `specdacular/workflows/*.md` — input for skill generation
- `specdacular/templates/` — mostly portable, minor adaptation needed

### Key Constraints
- Zero dependencies (Node built-ins only)
- Claude Code is source of truth
- Generated Codex files are committed to repo
- No parallel agent support in Codex version (sequential fallback)
