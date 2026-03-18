---
last_reviewed: 2026-03-16
generated_by: specd
---

# Project Structure

## Quick Reference

| I want to add... | Put it in... |
|------------------|--------------|
| New slash command | `commands/specd.{name}.md` |
| Command workflow | `specdacular/workflows/{name}.md` |
| New agent | `agents/specd-{name}.md` |
| Feature template | `specdacular/templates/features/{TEMPLATE}.md` |
| Hook script | `hooks/specd-{name}.js` |
| Reference doc | `specdacular/references/{topic}.md` |

## Directory Layout

```
specdacular/
├── bin/                        # Installation only (npm entry point)
│   └── install.js              # Copies to ~/.claude/ or ./.claude/
├── commands/                   # User-facing slash commands (stubs)
│   └── specd.*.md
├── agents/                     # Top-level agent definitions
│   └── specd-codebase-mapper.md
├── hooks/                      # Session hooks (Node.js, no deps)
│   ├── specd-check-update.js   # SessionStart: background npm check
│   └── specd-statusline.js     # Statusline: model/dir/context bar
├── specdacular/                # Core resources (copied during install)
│   ├── workflows/              # Command implementation logic
│   ├── agents/                 # Agent-specific workflows
│   ├── templates/              # Document templates
│   │   ├── features/           # FEATURE.md, CONTEXT.md, etc.
│   │   └── codebase/           # (empty, migration in progress)
│   └── references/             # Shared reference docs
├── .claude/                    # Generated install artifacts (don't edit)
└── .specd/                     # Generated codebase docs (don't commit source here)
    └── codebase/               # MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md
```

## Directory Purposes

### `bin/` — Installation Only
Entry point for `npx specdacular`. Contains `install.js` which copies commands, agents, workflows, hooks to target directory. **No runtime code here.**

### `commands/` — User Interface (Stubs)
Slash commands with YAML frontmatter + `<execution_context>` pointing to workflow. Keep brief — delegate to workflows.

### `specdacular/workflows/` — Implementation Logic
Step-by-step process definitions, decision trees, agent orchestration. Named to match commands.

### `agents/` — Agent Definitions
Markdown with `name`, `description`, `tools`, `color` frontmatter. Spawned by workflows for parallel work.

### `hooks/` — Session Hooks
Node.js scripts (built-ins only). Run by Claude Code hook system, not by commands.

### `specdacular/templates/` — Document Templates
Feature templates (`FEATURE.md`, `CONTEXT.md`, etc.) with `{placeholder}` syntax. Filled by workflows.

### `.claude/` — Don't Edit
Generated output from `bin/install.js`. Edit source files in root directories, then reinstall.

### `.specd/` — Don't Add Source Files
Created by commands in user projects. Contains `codebase/` (from map) and `tasks/` (from task commands).

## Generated Task Structure

```
.specd/tasks/{name}/
├── FEATURE.md          # Technical requirements
├── CONTEXT.md          # Discussion context (accumulates)
├── DECISIONS.md        # Decision log with rationale
├── STATE.md            # Progress tracking
├── RESEARCH.md         # Research findings (after research step)
├── ROADMAP.md          # Phase overview (after planning)
├── CHANGELOG.md        # Implementation log
├── config.json         # Task configuration + state
└── phases/
    ├── phase-01/
    │   └── PLAN.md     # Just-in-time detailed plan
    ├── phase-01.1/     # Fix phase from review
    │   └── PLAN.md
    └── phase-02/
        └── PLAN.md
```

## Where NOT to Put Code

| Don't put... | Here... | Instead... |
|--------------|---------|------------|
| Implementation logic | `commands/specd.*.md` | `specdacular/workflows/*.md` |
| Templates | Agent definitions | `specdacular/templates/` |
| Generated docs | Source directories | `.specd/` (in user projects) |
| Runtime code | `bin/` | `hooks/` or workflows |
| Dependencies | `package.json` | Keep zero-dependency |
