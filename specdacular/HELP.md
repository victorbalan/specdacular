# Specdacular

**AI-optimized codebase documentation and feature planning for Claude.**

## Commands

### Core Flow

| Command | Description |
|---------|-------------|
| `/specd:new [name]` | Initialize a task, start first discussion |
| `/specd:continue [name] [--semi-auto\|--auto]` | Continue task lifecycle — picks up where you left off |

| `/specd:toolbox [name]` | Advanced operations: discuss, research, plan, execute, review |

### Utilities

| Command | Description |
|---------|-------------|
| `/specd:map-codebase` | Analyze codebase with parallel agents → AI-optimized docs |
| `/specd:config` | Configure auto-commit settings for docs and code |
| `/specd:status [--all]` | Show task status dashboard |
| `/specd:help` | Show this help |
| `/specd:update` | Update Specdacular to the latest version |

---

## Task Flow

```
/specd:new → /specd:continue → continue → continue → done
```

**You only need three commands:**

1. **`/specd:new [name]`** — Start here. Creates task folder, asks initial questions.
2. **`/specd:continue [name]`** — Picks up where you left off. Drives the entire lifecycle:
   - Discussion → Research → Planning → Phase Execution → Review
   - After each step, offers the next step or "stop for now"
   - Works across context windows — reads state fresh each time
   - Modes: interactive (default), `--semi-auto` (auto through planning, pause after review), `--auto` (run everything)
3. **`/specd:toolbox [name]`** — Advanced operations menu:
   - **Discuss** — Explore open questions, record decisions
   - **Research** — Spawn parallel agents for patterns/pitfalls
   - **Plan** — Create execution phases
   - **Execute** — Execute the next phase
   - **Review** — Review executed phase, approve or request fixes

### Quick Start

```
/specd:new user-dashboard
/specd:continue user-dashboard
```

After initialization, just keep running `continue`. It figures out what's next.

---

## Codebase Documentation

```
/specd:map-codebase
```

Spawns 4 parallel agents to analyze your codebase and creates `.specd/codebase/`:

| Document | What it contains |
|----------|------------------|
| **MAP.md** | Navigation: modules, functions, entry points |
| **PATTERNS.md** | Code examples: services, errors, testing |
| **STRUCTURE.md** | Organization: where to put new code |
| **CONCERNS.md** | Warnings: gotchas, anti-patterns, debt |

---

## Updating

When an update is available, you'll see `update available` in your statusline. Run:
```
/specd:update
```
Or manually: `npx specdacular@latest`

---

GitHub: https://github.com/victorbalan/specdacular
