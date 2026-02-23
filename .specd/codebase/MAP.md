# Codebase Map
Generated: 2026-02-04

## Entry Points
<!-- AUTO_GENERATED: 2026-02-17 -->

**Installation & Setup**
- `bin/install.js` — CLI installer, handles global/local installation, hooks setup, settings.json configuration

**Claude Code Commands** (executed via `/specd.*`)
- `commands/specd.codebase.map.md` — Spawn 4 parallel mapper agents to analyze codebase
- `commands/specd.new.md` — Initialize a new task and start the first discussion
- `commands/specd.continue.md` — Continue task lifecycle, picks up where you left off (supports `--semi-auto`/`--auto`)
- `commands/specd.status.md` — Show feature status dashboard (supports `--all`)
- `commands/specd.toolbox.md` — Advanced task operations and context management
- `commands/specd.config.md` — Create or update `.specd/config.json` with commit settings
- `commands/specd.update.md` — Update specdacular to latest version
- `commands/specd.help.md` — Display all commands and usage guide

**Session Hooks**
- `hooks/specd-check-update.js` — SessionStart hook, checks npm for updates in background
- `hooks/specd-statusline.js` — Statusline hook, displays model/dir/context/updates

## Core Modules

### Installation System (`bin/install.js`)
<!-- AUTO_GENERATED: 2026-02-17 -->

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
1. Copies `commands/specd.` to `~/.claude/commands/specd.` or `.claude/commands/specd.`
2. Copies `agents/` to `~/.claude/agents/`
3. Copies `specdacular/` to `~/.claude/specdacular/`
4. Copies `hooks/` to `~/.claude/hooks/`
5. Configures `settings.json` with SessionStart hook and statusline
6. Writes VERSION file with package version

### Session Hooks (`hooks/`)
<!-- AUTO_GENERATED: 2026-02-17 -->

**Update Checker** (`specd-check-update.js`)
- `spawn()` — Spawns background node process to check npm registry
- Background process writes to `~/.claude/cache/specd-update-check.json`
- Cache format: `{update_available: boolean, installed: string, latest: string, checked: number}`
- VERSION file locations checked: `.claude/specdacular/VERSION`, `~/.claude/specdacular/VERSION`

**Statusline** (`specd-statusline.js`)
- Reads JSON from stdin (Claude Code statusline protocol)
- Displays: `[⬆ /specd.update │] model │ dirname [ctx-bar usage%]`
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
<!-- AUTO_GENERATED: 2026-02-17 -->

**new.md**
1. `validate` — Check name, kebab-case, check if exists in `.specd/tasks/` or `.specd/features/`
2. `codebase_context` — Read `.specd/config.json`; if orchestrator type, hand off to `orchestrator/new.md`; else check `.specd/codebase/*.md`
3. `first_discussion` — "What's the {task-name} task?" — conversational exploration, 4-6 exchanges
4. `write_feature` — Create `.specd/tasks/{name}/` with FEATURE.md, CONTEXT.md, DECISIONS.md, CHANGELOG.md, STATE.md, config.json
5. `commit` — Commit task folder
6. `continuation_offer` — Offer to keep discussing gray areas (inline) or stop; if continuing, hand off to `discuss.md`

**discuss.md**
1. `validate` — Check task exists
2. `load_context` — Read FEATURE.md, CONTEXT.md, DECISIONS.md, STATE.md, optionally RESEARCH.md
3. `show_state` — Display session number, decisions count, gray areas list
4. `identify_focus` — Pick highest-impact gray area (unblocking, risk, user interest)
5. `probe_area` — 4 questions then check, mark resolved or defer
6. `record_decisions` — Add DEC-{NNN} entries to DECISIONS.md immediately as discovered
7. `update_context` — Move resolved items out of gray areas, add discussion history entry
8. `update_state` — Increment discussion sessions, update gray areas, update config.json
9. `commit` — Commit CONTEXT.md, DECISIONS.md, STATE.md, config.json
10. `completion` — Present session summary (resolved count, new decisions, remaining)

**research.md**
- Spawns 3 parallel agents:
  1. Codebase Integration — Where to put code, what to reuse
  2. Implementation Patterns — Libraries, standard approaches
  3. Pitfalls — Common mistakes, gotchas
- Synthesizes findings into RESEARCH.md via `synthesize-research.md` reference
- Records library/pattern decisions in DECISIONS.md
- Updates STATE.md; commits

**plan.md**
1. `validate` — Check task exists
2. `load_context` — Read all context; if `"orchestrator": true` in config, hand off to `orchestrator/plan.md`
3. `assess_readiness` — Require FEATURE.md "Must Create" items and some resolved gray areas; warn if no RESEARCH.md
4. `derive_phases` — Order by dependencies (types→models→APIs→UI); 2-5 tasks per phase; create `.specd/tasks/{name}/phases/`
5. `write_plans` — Write `phases/phase-NN/PLAN.md` per phase (YAML frontmatter + tasks with verification)
6. `write_roadmap` — Write ROADMAP.md
7. `update_state` — Set stage to planning, set phases.total and phases.current in config.json
8. `commit` — Commit ROADMAP.md, phases/, STATE.md, config.json
9. `completion` — Present phase list with task counts and dependency diagram

**execute.md**
1. `validate` — Extended validation (phases and ROADMAP exist)
2. `load_context` — Read all context + global `.specd/config.json` for `auto_commit_code`/`auto_commit_docs`
3. `find_phase` — Read `phases.current` and `phases.current_status` from config.json; handle "executed" (trigger review), "completed" (advance); also checks for decimal fix phases
4. `record_start` — Store `phases.phase_start_commit`, set status to "executing", commit config update
5. `execute_tasks` — Implement each task, verify (max 2 fix attempts), log deviations to CHANGELOG.md, commit after each task
6. `phase_complete` — Mark status "executed", commit STATE.md + CHANGELOG.md, automatically trigger `review.md`

**review.md**
1. `validate` — Check `phases.current_status` = "executed" and `phase_start_commit` exists
2. `load_context` — Read current phase PLAN.md and `phase_start_commit` from config.json
3. `inspect_code` — `git diff {phase_start_commit}..HEAD`; per-task classify: ✅ Match / ⚠️ Deviation / ❌ Incomplete
4. `present_findings` — Show diff stat, per-task status icons, detail on deviations/incomplete
5. `gather_feedback` — AskUserQuestion: "Looks good" / "I want to revise" / "Stop for now"
6. `collect_feedback` — Free-form issue description from user
7. `create_fix_plan` — Create `phases/phase-{N.M}/PLAN.md` decimal fix phase; update ROADMAP.md; offer to execute immediately
8. `approve_phase` — Set status "completed", advance current phase, update STATE.md, commit

**continue.md** (main lifecycle driver)
- Modes: interactive (default), `--semi-auto`, `--auto`
- Reads state from config.json + STATE.md + CONTEXT.md, routes to appropriate workflow:
  - Gray areas remain → `discuss.md`
  - No gray areas, no research → `research.md`
  - Research done, no phases → `plan.md`
  - Phase pending → `execute.md`
  - Phase executing → resume `execute.md`
  - Phase executed → `review.md`
  - All phases complete → task complete
- Semi-auto: auto-advances discuss→research→plan, pauses after each execute + review
- Auto: runs everything, stops only on review issues or completion

**status.md**
- Reads `.specd/tasks/*/config.json` and STATE.md; checks `.specd/features/*/` for backwards compatibility
- Orchestrator mode: also scans sub-project features per `.specd/config.json` `projects` array
- Outputs task table: Feature, Stage, Plans (completed/total), Created, Next Action
- `--all` flag includes completed tasks section

## Agents

**specd-codebase-mapper** (`agents/specd-codebase-mapper.md`)
- Spawned by: `/specd.codebase.map`
- Focus areas: `map`, `patterns`, `structure`, `concerns`
- Writes documents directly to `.specd/codebase/`
- Returns confirmation only (minimal context transfer)

**feature-researcher** (`specdacular/agents/feature-researcher.md`)
- Spawned by: `/specd.research-feature`
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

**Commands** → `.claude/commands/specd.*.md`
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
6. Shows `⬆ /specd.update` if newer available
