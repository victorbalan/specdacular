---
last_reviewed: 2026-03-16
generated_by: specd
---

# Development Guide

## Adding a New Command

1. Create command stub: `commands/specd.{name}.md`
   ```yaml
   ---
   name: specd.{name}
   description: Brief description
   argument-hint: "[optional-arg]"
   allowed-tools:
     - Read
     - Write
     - Bash
   ---
   ```
   Include `<execution_context>@~/.claude/specdacular/workflows/{name}.md</execution_context>`

2. Create workflow: `specdacular/workflows/{name}.md`
   - Use `<purpose>`, `<philosophy>`, `<process>` sections
   - Process contains `<step name="...">` blocks with bash commands and decision logic

3. Test locally: `node bin/install.js --local`, then run `/specd.{name}` in Claude Code

4. Update `commands/specd.help.md` with the new command

## Adding a New Agent

1. Create agent definition: `agents/specd-{name}.md`
   ```yaml
   ---
   name: specd-{name}
   description: What this agent does
   tools: Read, Write, Grep, Glob, Bash
   color: cyan
   ---
   ```
   Include `<role>`, `<process>` sections

2. Spawn from workflow using Agent tool with `subagent_type: "specd-{name}"`

3. Agents should write directly to files and return only confirmation

## Adding a New Hook

1. Create: `hooks/specd-{name}.js` (Node.js, built-ins only)
2. Update `bin/install.js` to configure the hook in `settings.json`
3. Test: `node hooks/specd-{name}.js`

## Adding a New Template

1. Create: `specdacular/templates/features/{TEMPLATE}.md`
2. Use `{placeholder}` syntax for values to be replaced by workflows
3. Reference from the workflow that fills it

## Installation System

`bin/install.js` handles both global (`~/.claude/`) and local (`./.claude/`) installs:

1. Copies commands, agents, workflows, templates to target
2. `copyWithPathReplacement()` rewrites `~/.claude/` → `./.claude/` for local installs
3. Configures `settings.json` with SessionStart hook and statusline
4. Writes VERSION file for update checking

**Key functions:**
- `getGlobalDir()` — Returns Claude config dir (respects `CLAUDE_CONFIG_DIR`)
- `copyWithPathReplacement(src, dest, prefix)` — Recursive copy with path rewriting in `.md` files
- `readSettings()` / `writeSettings()` — JSON with try-catch, 2-space indent

## Version & Update System

1. `bin/install.js` writes `VERSION` file during install
2. `hooks/specd-check-update.js` (SessionStart) spawns background process to check npm registry
3. Result cached at `~/.claude/cache/specd-update-check.json`
4. `hooks/specd-statusline.js` reads cache, shows `⬆ /specd.update` if newer available

## Testing

No automated tests exist. Manual testing checklist:

1. `npx . --global` — test global install
2. `npx . --local` — test local install
3. Run each `/specd.*` command in Claude Code
4. Test hooks: `node hooks/specd-statusline.js < test-input.json`

## Development Workflow

1. Edit source files in root directories (`commands/`, `specdacular/`, `hooks/`, `agents/`)
2. Run `node bin/install.js --local` to sync to `.claude/`
3. Test in Claude Code
4. Never edit `.claude/` directly — it's overwritten on install
