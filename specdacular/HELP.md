# Specdacular

**AI-optimized codebase documentation and feature planning for Claude.**

## Commands

### Core Flow

| Command | Description |
|---------|-------------|
| `/specd:feature:new [name]` | Initialize a feature, start first discussion |
| `/specd:feature:continue [name]` | Continue feature lifecycle — picks up where you left off |
| `/specd:feature:toolbox [name]` | Advanced operations: discuss, research, plan, review, insert |

### Utilities

| Command | Description |
|---------|-------------|
| `/specd:map-codebase` | Analyze codebase with parallel agents → AI-optimized docs |
| `/specd:status [--all]` | Show feature status dashboard |
| `/specd:help` | Show this help |
| `/specd:update` | Update Specdacular to the latest version |

---

## Feature Flow

```
/specd:feature:new → /specd:feature:continue → continue → continue → done
```

**You only need three commands:**

1. **`/specd:feature:new [name]`** — Start here. Creates feature folder, asks initial questions.
2. **`/specd:feature:continue [name]`** — Picks up where you left off. Drives the entire lifecycle:
   - Discussion → Research → Planning → Phase Execution → Review
   - After each step, offers the next step or "stop for now"
   - Works across context windows — reads state fresh each time
3. **`/specd:feature:toolbox [name]`** — Advanced operations menu:
   - **Discuss** — Explore open questions (feature or phase level)
   - **Research** — Spawn parallel agents for patterns/pitfalls
   - **Plan** — Create implementation plans
   - **Review** — Review executed work, report issues
   - **Insert phase** — Add a phase mid-development (decimal numbering)

### Quick Start

```
/specd:feature:new user-dashboard
/specd:feature:continue user-dashboard
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

GitHub: https://github.com/vlad-ds/specdacular
