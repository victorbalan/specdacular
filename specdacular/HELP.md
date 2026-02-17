# Specdacular

**AI-optimized codebase documentation and feature planning for Claude.**

## Commands

### Core Flow

| Command | Description |
|---------|-------------|
| `/specd:new [name]` | Initialize a task, start first discussion |
| `/specd:continue [name] [--semi-auto\|--auto]` | Continue task lifecycle — picks up where you left off |

### Direct Access

| Command | Description |
|---------|-------------|
| `/specd:discuss [name]` | Deepen discussion — explore gray areas, record decisions |
| `/specd:research [name]` | Research implementation patterns with parallel agents |
| `/specd:plan [name]` | Create execution phases from task context |
| `/specd:execute [name]` | Execute the next phase's plan |
| `/specd:review [name]` | Review executed phase — inspect code, approve, or request fixes |

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

**You only need two commands:**

1. **`/specd:new [name]`** — Start here. Creates task folder, asks initial questions.
2. **`/specd:continue [name]`** — Picks up where you left off. Drives the entire lifecycle:
   - Discussion → Research → Planning → Phase Execution → Review
   - After each step, offers the next step or "stop for now"
   - Works across context windows — reads state fresh each time
   - Modes: interactive (default), `--semi-auto` (auto through planning, pause after review), `--auto` (run everything)

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
