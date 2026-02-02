# Specdacular

**Feature planning for existing codebases.**

A Claude Code extension that analyzes your codebase and generates structured documentation. Understand any codebase before planning new features.

```bash
npx specdacular
```

---

## What It Does

Specdacular spawns 4 parallel AI agents to analyze your codebase and generate 7 structured documents:

| Document | What It Answers |
|----------|-----------------|
| `STACK.md` | What languages, frameworks, dependencies? |
| `ARCHITECTURE.md` | What patterns? How does data flow? |
| `STRUCTURE.md` | Where do files go? How is it organized? |
| `CONVENTIONS.md` | How should code be written? Naming? Style? |
| `TESTING.md` | How are tests structured? What to mock? |
| `INTEGRATIONS.md` | What external services (DB, APIs, auth)? |
| `CONCERNS.md` | What's broken? Tech debt? Risks? |

Output goes to `.specd/codebase/` in your project.

---

## Installation

```bash
npx specdacular
```

Choose:
- **Global** (`~/.claude/`) - Available in all projects
- **Local** (`./.claude/`) - This project only

### Verify Installation

In Claude Code:
```
/specd:help
```

---

## Usage

### Map Your Codebase

```
/specd:map-codebase
```

This:
1. Creates `.specd/codebase/` directory
2. Spawns 4 parallel agents (tech, architecture, quality, concerns)
3. Each agent explores and writes documents directly
4. Commits the codebase map

### Review Generated Docs

```bash
cat .specd/codebase/STACK.md
cat .specd/codebase/ARCHITECTURE.md
# etc.
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/specd:map-codebase` | Analyze codebase and generate documentation |
| `/specd:help` | Show available commands |

---

## How It Works

### Parallel Agents

Instead of one agent doing everything, Specdacular spawns 4 specialized agents that run simultaneously:

```
┌─────────────────────────────────────────────────────────┐
│                  /specd:map-codebase                    │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   Tech   │   │   Arch   │   │ Quality  │   │ Concerns │
    │  Agent   │   │  Agent   │   │  Agent   │   │  Agent   │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
          │               │               │               │
          ▼               ▼               ▼               ▼
     STACK.md        ARCH.md         CONV.md        CONCERNS.md
     INTEG.md       STRUCT.md       TESTING.md
```

**Benefits:**
- Fresh 200k context per agent (no token pollution)
- Faster execution (parallel, not sequential)
- Agents write directly to files (minimal context transfer)

---

## Updating

```bash
npx specdacular@latest
```

## Uninstalling

```bash
npx specdacular --global --uninstall
# or
npx specdacular --local --uninstall
```

---

## Project Structure

After running `/specd:map-codebase`:

```
your-project/
├── .specd/
│   └── codebase/
│       ├── STACK.md
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md
│       ├── CONVENTIONS.md
│       ├── TESTING.md
│       ├── INTEGRATIONS.md
│       └── CONCERNS.md
└── ...
```

---

## License

MIT
