# Codebase Structure

**Analysis Date:** 2026-02-04

## Quick Reference

| I want to add... | Put it in... |
|------------------|--------------|
| New slash command | `commands/specd.{command-name}.md` |
| Command workflow implementation | `specdacular/workflows/{workflow-name}.md` |
| New agent definition | `agents/{agent-name}.md` |
| Feature template document | `specdacular/templates/features/{TEMPLATE}.md` |
| Codebase template document | `specdacular/templates/codebase/{template-name}.md` |
| Hook script | `hooks/specd-{hook-name}.js` |
| Agent workflow | `specdacular/agents/{agent-name}.md` |
| Reference documentation | `specdacular/references/{topic}.md` |

## Directory Layout

```
specdacular/
├── bin/                    # Installation script (npm entry point)
│   └── install.js          # Copies to ~/.claude/ or ./.claude/
├── commands/               # User-facing slash commands
│   └── specd/              # /specd.* namespace
├── agents/                 # Top-level agent definitions
├── hooks/                  # Session hooks (update check, statusline)
├── specdacular/            # Core resources copied during install
│   ├── workflows/          # Command implementation logic
│   ├── agents/             # Agent-specific workflows
│   ├── templates/          # Document templates
│   │   ├── features/       # Feature planning templates
│   │   └── codebase/       # Codebase mapping templates
│   └── references/         # Shared reference docs (currently empty)
├── .claude/                # Local install artifacts (copied during dev)
│   ├── commands/specd.     # Installed commands
│   ├── agents/             # Installed agents
│   └── specdacular/        # Installed core
└── .specd/                 # User-generated documentation
    ├── codebase/           # From /specd.map-codebase
    └── features/           # From feature commands
```

## Directory Purposes

### `bin/` — Installation

Entry point for `npx specdacular`. Contains:
- `install.js`: Copies commands, agents, workflows, templates to target directory

**Do not add** runtime code here. This is purely for installation.

### `commands/specd.` — User Interface

Slash command definitions that appear in Claude Code's command palette.

**Format:** Markdown with YAML frontmatter
```yaml
---
name: specd.command-name
description: Brief description
argument-hint: "[optional-arg]"
allowed-tools:
  - Read
  - Write
---
```

**Key points:**
- Command file name should match command name (e.g., `map-codebase.md` → `/specd.map-codebase`)
- Include `<execution_context>` pointing to workflow: `@~/.claude/specdacular/workflows/{workflow}.md`
- Keep command files brief (2-3 screens max) — delegate to workflows
- Use `$ARGUMENTS` to access user-provided arguments

### `specdacular/workflows/` — Command Implementation

The actual logic for commands. Commands reference workflows via `<execution_context>`.

**Put here:**
- Step-by-step process definitions
- Decision trees and conditional logic
- Multi-step orchestration (e.g., spawning agents)
- Success criteria and validation rules

**Format:** Structured markdown with `<process>`, `<step>`, `<critical_rules>` sections

**Naming:** Match command name (e.g., `map-codebase.md` implements `/specd.map-codebase`)

### `agents/` — Agent Definitions

Agent role definitions spawned by commands or workflows.

**Currently contains:**
- `specd-codebase-mapper.md` — Spawned by map-codebase to analyze codebase

**Format:** Markdown with YAML frontmatter
```yaml
---
name: agent-name
description: What this agent does
tools: Read, Write, Grep, Glob, Bash
color: cyan
---
```

**When to add:**
- Parallel task execution (e.g., 4 mappers for different focus areas)
- Specialized deep-dive analysis
- Long-running operations with isolated context

### `specdacular/agents/` — Agent-Specific Workflows

Detailed workflows for agents defined in `agents/`. Not currently used but follows pattern.

**Use for:**
- Complex agent logic that needs separate documentation
- Multi-step agent processes
- Agent-specific reference material

### `specdacular/templates/` — Document Templates

#### `templates/features/` — Feature Planning Templates

Templates for feature documentation created by `/specd.new-feature`:
- `FEATURE.md` — Technical requirements
- `CONTEXT.md` — Discussion accumulation
- `DECISIONS.md` — Decision log with rationale
- `STATE.md` — Progress tracking
- `ROADMAP.md` — Phase breakdown
- `RESEARCH.md` — Research findings
- `PLAN.md` — Executable plans
- `CHANGELOG.md` — Implementation log
- `config.json` — Feature configuration

**Template format:** Markdown with placeholder sections. Filled by commands.

#### `templates/codebase/` — Codebase Analysis Templates

Currently empty. Templates would go here for codebase mapper agents to use.

**Note:** The mapper agent currently has templates embedded in its definition at `agents/specd-codebase-mapper.md` (lines 131-345).

### `hooks/` — Session Hooks

JavaScript files executed at session start or for statusline.

**Currently:**
- `specd-check-update.js` — Check for newer npm version (SessionStart)
- `specd-statusline.js` — Display feature state in statusline

**Format:** Node.js scripts (no dependencies beyond Node stdlib)

**Execution context:** Run by Claude Code hook system, not by commands

### `.specd/` — Generated Documentation

**DO NOT add source files here.** This directory is created by commands in user projects.

**Structure created by commands:**
- `.specd/codebase/` — Created by `/specd.map-codebase`
  - `MAP.md`, `PATTERNS.md`, `STRUCTURE.md`, `CONCERNS.md`
- `.specd/tasks/{name}/` — Created by `/specd.new`
  - Task planning documents

### `.claude/` — Local Install Artifacts

Generated during development install (`npx specdacular --local`). Mirror of installed structure.

**DO NOT commit** changes here. Edit source files in root directories instead.

## Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Commands | `{command-name}.md` | `map-codebase.md` |
| Workflows | `{command-name}.md` | `map-codebase.md` |
| Agents | `{namespace}-{agent-name}.md` | `specd-codebase-mapper.md` |
| Hooks | `{namespace}-{hook-name}.js` | `specd-statusline.js` |
| Templates | `{DOCUMENT}.md` | `FEATURE.md`, `CONTEXT.md` |

### Directories

- Lowercase with hyphens for multi-word: `specdacular/`, not `Specdacular/`
- Plural for collections: `commands/`, `agents/`, `workflows/`
- Match command namespace: `commands/specd.` matches `/specd.*`

## Where to Add New Code

### New Command

**Primary code:**
1. `commands/specd.{command-name}.md` — Command definition with frontmatter
2. `specdacular/workflows/{workflow-name}.md` — Implementation logic

**Steps:**
1. Create command file in `commands/specd.`
2. Create workflow file in `specdacular/workflows/`
3. Reference workflow in command: `@~/.claude/specdacular/workflows/{workflow}.md`
4. Test locally: `npx specdacular --local`
5. Update `commands/specd.help.md` with new command

### New Agent

**Primary code:**
1. `agents/{namespace}-{agent-name}.md` — Agent definition

**Optional:**
2. `specdacular/agents/{agent-name}.md` — Detailed workflow if complex

**Steps:**
1. Create agent definition in `agents/`
2. Include `<role>`, `<process>`, `<templates>` sections
3. Spawn from command/workflow using Task tool
4. Test with spawning command

### New Template

**For feature templates:**
- `specdacular/templates/features/{TEMPLATE}.md`

**For codebase templates:**
- `specdacular/templates/codebase/{template-name}.md`

**Steps:**
1. Create template file
2. Use placeholder syntax: `[YYYY-MM-DD]`, `[Description]`
3. Reference from workflow that fills it
4. Consider adding to install verification

### New Hook

**Primary code:**
- `hooks/specd-{hook-name}.js`

**Steps:**
1. Create Node.js script in `hooks/`
2. Make it executable: `chmod +x hooks/specd-{hook-name}.js`
3. Update `bin/install.js` to configure hook in settings.json
4. Test with `node hooks/specd-{hook-name}.js`

## Where NOT to Put Code

| Don't put... | Here... | Instead... |
|--------------|---------|------------|
| Implementation logic | `commands/specd.*.md` | `specdacular/workflows/*.md` |
| Templates | Agent definitions | `specdacular/templates/` |
| Generated docs | Source directories | `.specd/` (in user projects) |
| Runtime code | `bin/` | `hooks/` or workflows |
| User project files | Specdacular repo | User's `.specd/` directory |
| Dependencies | `package.json` | Keep zero-dependency |

## Active Migrations

**Templates location (in progress):**
- OLD: Templates embedded in agent definitions (e.g., `agents/specd-codebase-mapper.md` lines 131-345)
- NEW: `specdacular/templates/codebase/` (directory exists but empty)
- **Use NEW for all new templates**
- Migration tracked: Extract embedded templates to dedicated files

**Pattern:** Separate agent logic from document templates for reusability.

---

*Structure analysis: 2026-02-04*
