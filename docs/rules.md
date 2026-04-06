---
last_reviewed: 2026-03-16
generated_by: specd
---

# Project Rules

> Always read this file first. These rules apply to every code change.

## Path Conventions

- Source files use `~/.claude/` prefix — the installer rewrites paths per install type
- Never hardcode `.claude/` in source markdown — use `~/.claude/` and let `copyWithPathReplacement()` handle it
- Always use `path.join()` for path construction in JavaScript
- Always expand tilde (`~/`) via `expandTilde()` before filesystem operations
- In agent prompts, use absolute paths only — agent threads reset cwd between bash calls

## File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Commands | `specd.{name}.md` | `specd.codebase.map.md` |
| Workflows | `{name}.md` | `map-codebase.md` |
| Agents | `specd-{name}.md` | `specd-codebase-mapper.md` |
| Hooks | `specd-{name}.js` | `specd-statusline.js` |
| Templates | `{DOCUMENT}.md` | `FEATURE.md`, `CONTEXT.md` |

## Markdown Files Are Prompts

- All `.md` files in `commands/`, `workflows/`, `agents/`, `templates/` are executable prompts, not documentation
- Format: YAML frontmatter + XML-like tags (`<purpose>`, `<step>`, `<process>`)
- Test every markdown change by running the command — a typo breaks the workflow

## Commands Are Stubs

- Commands contain frontmatter + brief objective + `<execution_context>` pointing to workflow
- Never put implementation logic in command files — delegate to `specdacular/workflows/`
- Every command must have `<execution_context>@~/.claude/specdacular/workflows/{workflow}.md</execution_context>`

## Don't Edit `.claude/` Directory

- `.claude/` is generated output from `bin/install.js`
- Source of truth: `commands/`, `specdacular/`, `hooks/`, `agents/` directories
- Run `node bin/install.js --local` to sync changes

## Template Placeholders

- Use `{placeholder}` syntax: `{name}`, `{feature-name}`, `{date}`
- Don't change placeholder names — workflows depend on exact syntax for replacement
- Use checkboxes `- [ ]` for trackable items

## Commit Messages

- Use conventional commits: `docs:`, `feat:`, `fix:`, etc.
- Heredoc format for multi-line: `cat <<'EOF'`
- Include `Co-Authored-By: Claude <noreply@anthropic.com>` for AI-assisted changes

## Agents

- Agents write directly to files, return only confirmation (minimal context transfer)
- Use `run_in_background: true` for parallel agent execution
- Never return full document content from agents to orchestrator — causes context pollution

## Git

- Git is assumed present but not validated — workflows use `git add`/`git commit` throughout
- Check both `.specd/tasks/` and `.specd/features/` for backwards compatibility

## JavaScript

- ES6 modules (`import`/`export`) — no CommonJS `require()`
- Read settings with try-catch, return empty object on failure
- Write JSON with 2-space indent and trailing newline
