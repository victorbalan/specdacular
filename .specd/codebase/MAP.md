# Codebase Map
Generated: 2026-02-04

## Entry Points

**Installation & Setup**
- `bin/install.js` — CLI installer, handles global/local installation, hooks setup, settings.json configuration

**Claude Code Commands** (executed via `/specd:*`)
- `commands/specd/map-codebase.md` — Spawn 4 parallel mapper agents to analyze codebase
- `commands/specd/new-feature.md` — Initialize feature folder and start first discussion
- `commands/specd/discuss-feature.md` — Continue/deepen feature discussion (repeatable)
- `commands/specd/research-feature.md` — Spawn parallel research agents for implementation patterns
- `commands/specd/plan-feature.md` — Create executable task plans from feature context
- `commands/specd/discuss-phase.md` — Discuss specific phase before execution
- `commands/specd/research-phase.md` — Research patterns for specific phase
- `commands/specd/execute-plan.md` — Execute plan with progress tracking and deviation logging
- `commands/specd/update.md` — Update specdacular to latest version
- `commands/specd/help.md` — Display all commands and usage guide

**Session Hooks**
- `hooks/specd-check-update.js` — SessionStart hook, checks npm for updates in background
- `hooks/specd-statusline.js` — Statusline hook, displays model/dir/context/updates

## Core Modules

### Installation System (`bin/install.js`)

**Main Functions**
- `getGlobalDir(): string` — Returns Claude config directory (CLAUDE_CONFIG_DIR or ~/.claude)
- `expandTilde(filePath: string): string` — Expands ~/ to home directory
- `readSettings(settingsPath: string): object` — Read and parse settings.json
- `writeSettings(settingsPath: string, settings: object): void` — Write settings.json with formatting
- `copyWithPathReplacement(srcDir: string, destDir: string, pathPrefix: string): void` — Recursively copy directory, replacing path references in .md files
- `verifyInstalled(dirPath: string, description: string): boolean` — Verify directory exists and contains files
- `uninstall(isGlobal: boolean): void` — Remove commands, agents, hooks, clean settings.json
- `install(isGlobal: boolean): void` — Install commands, agents, hooks, configure settings.json
- `promptLocation(): void` — Interactive prompt for install location (global/local)

**What It Does**
1. Copies `commands/specd/` to `~/.claude/commands/specd/` or `.claude/commands/specd/`
2. Copies `agents/` to `~/.claude/agents/`
3. Copies `specdacular/` to `~/.claude/specdacular/`
4. Copies `hooks/` to `~/.claude/hooks/`
5. Configures `settings.json` with SessionStart hook and statusline
6. Writes VERSION file with package version

### Session Hooks (`hooks/`)

**Update Checker** (`specd-check-update.js`)
- `spawn()` — Spawns background node process to check npm registry
- Background process writes to `~/.claude/cache/specd-update-check.json`
- Cache format: `{update_available: boolean, installed: string, latest: string, checked: number}`
- VERSION file locations checked: `.claude/specdacular/VERSION`, `~/.claude/specdacular/VERSION`

**Statusline** (`specd-statusline.js`)
- Reads JSON from stdin (Claude Code statusline protocol)
- Displays: `[⬆ /specd:update │] model │ dirname [ctx-bar usage%]`
- Context display: Scaled to 80% limit (80% real = 100% displayed)
- Progress bar: 10 segments (█ filled, ░ empty)
- Colors: green <63%, yellow <81%, orange <95%, red+blinking ≥95%

## Workflows

### Codebase Mapping (`specdacular/workflows/map-codebase.md`)

**Process Steps**
1. `check_existing` — Check if .specd/codebase/ exists, prompt refresh/skip
2. `check_existing_docs` — Find README/ARCHITECTURE/docs, ask user for additional context
3. `create_structure` — Create .specd/codebase/ directory
4. `spawn_agents` — Spawn 4 parallel specd-codebase-mapper agents with `run_in_background=true`
   - Agent 1: map focus → MAP.md
   - Agent 2: patterns focus → PATTERNS.md
   - Agent 3: structure focus → STRUCTURE.md
   - Agent 4: concerns focus → CONCERNS.md
5. `collect_confirmations` — Wait for agents, read output files
6. `verify_output` — Check all 4 documents exist and have >20 lines
7. `commit_codebase_map` — Commit .specd/codebase/*.md
8. `completion` — Present summary with line counts

### Feature Planning (`specdacular/workflows/`)

**new-feature.md**
1. `validate` — Check name, check if exists
2. `codebase_context` — Look for .specd/config.json or .specd/codebase/
3. `first_discussion` — "What are you building?"
4. `write_feature` — Write FEATURE.md with technical requirements
5. `write_context` — Write CONTEXT.md with discussion state
6. `initialize_decisions` — Write DECISIONS.md
7. `initialize_changelog` — Write CHANGELOG.md (for execution-time decisions)
8. `initialize_state` — Write STATE.md
9. `commit` — Commit feature folder
10. `completion` — Present options: discuss-feature, research-feature, plan-feature

**discuss-feature.md**
1. `validate` — Check feature exists
2. `load_context` — Read FEATURE.md, CONTEXT.md, DECISIONS.md, STATE.md, RESEARCH.md
3. `show_state` — Display what's established, previous discussions, active decisions
4. `identify_gray_areas` — Derive feature-specific unclear areas
5. `probe_area` — 4 questions then check, clarify until clear
6. `record_decisions` — Add new DEC-XXX entries to DECISIONS.md
7. `update_context` — Add resolved questions to CONTEXT.md
8. `update_state` — Increment discussion sessions, update gray areas count
9. `commit` — Commit updates
10. `completion` — Present session summary, next options

**research-feature.md**
- Spawns 3 parallel agents:
  1. Codebase Integration (Explore agent) — Where to put code, what to reuse
  2. External Patterns (feature-researcher agent) — Libraries, architecture patterns
  3. Pitfalls (feature-researcher agent) — Common mistakes, gotchas
- Synthesizes findings into RESEARCH.md
- Records library/pattern decisions in DECISIONS.md

**plan-feature.md**
1. `validate` — Check feature has sufficient context
2. `load_context` — Read FEATURE.md, CONTEXT.md, DECISIONS.md, RESEARCH.md, codebase docs
3. `assess_readiness` — Verify enough context to plan
4. `derive_phases` — Based on dependencies (types→API→UI pattern)
5. `break_into_tasks` — 2-3 tasks per plan, sized for agent execution
6. `write_plan_files` — Create .specd/tasks/{name}/plans/phase-{NN}/{NN}-PLAN.md
7. `write_roadmap` — Write ROADMAP.md with phase overview
8. `commit` — Commit plans
9. `completion` — Present execution instructions

**discuss-phase.md / research-phase.md**
- Phase-specific versions of discuss/research
- Dive deeper into specific phase before execution

**execute-plan.md**
1. `validate` — Check feature exists with plans
2. `load_context` — Read STATE.md, DECISIONS.md, RESEARCH.md, ROADMAP.md, codebase docs
3. `find_plan` — First incomplete or specified plan
4. `execute_tasks` — With verification and deviation handling
   - Auto-fix blockers/bugs → log to CHANGELOG.md
   - Ask about architectural changes → wait for user
   - Run verification after each task
   - Stop on verification failure → ask user (retry/skip/stop)
   - Commit after each task
5. `complete_plan` — Update STATE.md, suggest next

## Agents

**specd-codebase-mapper** (`agents/specd-codebase-mapper.md`)
- Spawned by: `/specd:map-codebase`
- Focus areas: `map`, `patterns`, `structure`, `concerns`
- Writes documents directly to `.specd/codebase/`
- Returns confirmation only (minimal context transfer)

**feature-researcher** (`specdacular/agents/feature-researcher.md`)
- Spawned by: `/specd:research-feature`
- Research types: external patterns, pitfalls
- Tool strategy: Context7 first, then WebFetch, then WebSearch with current year
- Confidence levels: HIGH (Context7/official), MEDIUM (verified), LOW (unverified)
- Returns structured markdown findings to orchestrator

## External Integrations

| Service | Client Location | Env Vars |
|---------|-----------------|----------|
| npm registry | `hooks/specd-check-update.js` | None (public API) |
| GitHub | Referenced in help/docs | None (passive reference) |

## Key Types & Configs

**Feature Configuration** (`.specd/tasks/{name}/config.json`)
```json
{
  "discussion_sessions": number,
  "decisions_count": number
}
```

**Update Check Cache** (`~/.claude/cache/specd-update-check.json`)
```json
{
  "update_available": boolean,
  "installed": string,
  "latest": string,
  "checked": number
}
```

**Settings.json Modifications**
- `settings.hooks.SessionStart[]` — Adds specd update check hook
- `settings.statusLine` — Adds specd statusline command

## File Structure Patterns

**Commands** → `.claude/commands/specd/*.md`
- YAML frontmatter with name, description, argument-hint, allowed-tools
- `<objective>`, `<execution_context>`, `<process>`, `<success_criteria>` sections

**Workflows** → `.claude/specdacular/workflows/*.md`
- `<purpose>`, `<philosophy>`, `<process>` sections
- Process contains `<step name="...">` blocks
- Reference templates from `.claude/specdacular/templates/`

**Agents** → `.claude/agents/*.md`
- YAML frontmatter with name, description, tools, color
- `<role>`, `<philosophy>`, execution sections
- Focused, single-purpose agents spawned by workflows

**Templates** → `.claude/specdacular/templates/`
- `features/` — FEATURE.md, CONTEXT.md, DECISIONS.md, CHANGELOG.md, STATE.md, RESEARCH.md, ROADMAP.md, PLAN.md
- `codebase/` — Empty (templates in agent definitions)

## Version Detection

**Package Version**
- Source: `package.json` → `version` field
- Current: Read by `bin/install.js` via `require('../package.json')`
- Installed: Written to `.claude/specdacular/VERSION` during install

**Update Check Flow**
1. SessionStart hook runs `specd-check-update.js`
2. Background process reads VERSION file
3. Checks `npm view specdacular version`
4. Writes result to cache
5. Statusline reads cache on every render
6. Shows `⬆ /specd:update` if newer available
