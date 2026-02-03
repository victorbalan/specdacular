# Specdacular

**AI-optimized codebase documentation and feature planning for Claude.**

A Claude Code extension that helps you understand codebases and plan features specific enough that an agent can implement without asking questions.

```bash
npx specdacular
```

---

## What It Does

### 1. Map Your Codebase

Spawns 4 parallel agents to analyze your codebase and generate AI-optimized documentation:

| Document | What It Answers |
|----------|-----------------|
| `MAP.md` | Where is X? What functions exist? |
| `PATTERNS.md` | How do I write code that fits here? |
| `STRUCTURE.md` | Where do I put new code? |
| `CONCERNS.md` | What will bite me? Gotchas? Tech debt? |

### 2. Plan Features

A structured flow for planning features with enough detail for agent implementation:

```
new-feature → (discuss ↔ research)* → plan-feature
```

**You control the rhythm:**
- `new-feature` — Initialize and start first discussion
- `discuss-feature` — Refine understanding (call many times)
- `research-feature` — Investigate implementation approaches
- `plan-feature` — Create executable task plans

---

## Installation

```bash
npx specdacular
```

Choose:
- **Global** (`~/.claude/`) — Available in all projects
- **Local** (`./.claude/`) — This project only

### Verify Installation

In Claude Code:
```
/specd:help
```

---

## Commands

### Codebase Documentation

| Command | Description |
|---------|-------------|
| `/specd:map-codebase` | Analyze codebase with parallel agents |

### Feature Planning

| Command | Description |
|---------|-------------|
| `/specd:new-feature [name]` | Initialize a feature, start first discussion |
| `/specd:discuss-feature [name]` | Continue/deepen discussion (iterative) |
| `/specd:research-feature [name]` | Research implementation with parallel agents |
| `/specd:plan-feature [name]` | Create executable task plans |

### Utilities

| Command | Description |
|---------|-------------|
| `/specd:help` | Show available commands |
| `/specd:update` | Update to latest version |

---

## Quick Start

### Map a Codebase

```
/specd:map-codebase
```

Creates `.specd/codebase/` with 4 AI-optimized documents.

### Plan a Feature

```
/specd:new-feature user-dashboard
```

Creates `.specd/features/user-dashboard/` with:
- `FEATURE.md` — Technical requirements
- `CONTEXT.md` — Discussion context (accumulates)
- `DECISIONS.md` — Decisions with dates and rationale
- `STATE.md` — Progress tracking

Then refine and plan:
```
/specd:discuss-feature user-dashboard    # Clarify gray areas
/specd:research-feature user-dashboard   # Research implementation
/specd:plan-feature user-dashboard       # Create executable plans
```

---

## How It Works

### Parallel Agents

Specdacular spawns specialized agents that run simultaneously:

```
┌─────────────────────────────────────────────────────────┐
│                  /specd:map-codebase                    │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   Map    │   │ Patterns │   │Structure │   │ Concerns │
    │  Agent   │   │  Agent   │   │  Agent   │   │  Agent   │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘
          │               │               │               │
          ▼               ▼               ▼               ▼
      MAP.md       PATTERNS.md     STRUCTURE.md    CONCERNS.md
```

**Benefits:**
- Fresh 200k context per agent (no token pollution)
- Faster execution (parallel, not sequential)
- Agents write directly to files

### Feature Flow

The feature planning flow accumulates context over multiple sessions:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ new-feature  │ ──▶ │   discuss    │ ◀─▶ │   research   │
│              │     │   feature    │     │   feature    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ plan-feature │
                     │              │
                     └──────────────┘
                            │
                            ▼
                     Executable PLAN.md
                     files for agents
```

Each session updates:
- `CONTEXT.md` — Resolved questions accumulate
- `DECISIONS.md` — Decisions with rationale accumulate

Plans are prompts for implementing agents with:
- Specific file paths
- Code patterns to follow
- Verification commands
- Clear completion criteria

---

## Project Structure

After using Specdacular:

```
your-project/
├── .specd/
│   ├── codebase/              # From /specd:map-codebase
│   │   ├── MAP.md
│   │   ├── PATTERNS.md
│   │   ├── STRUCTURE.md
│   │   └── CONCERNS.md
│   │
│   └── features/              # From feature commands
│       └── user-dashboard/
│           ├── FEATURE.md     # Technical requirements
│           ├── CONTEXT.md     # Discussion context
│           ├── DECISIONS.md   # Decision log
│           ├── STATE.md       # Progress tracking
│           ├── RESEARCH.md    # Research findings
│           ├── ROADMAP.md     # Phase overview
│           └── plans/         # Executable plans
│               ├── phase-01/
│               │   ├── 01-PLAN.md
│               │   └── 02-PLAN.md
│               └── phase-02/
│                   └── 01-PLAN.md
└── ...
```

---

## Philosophy

### Documentation Is For Claude

These docs answer questions Claude can't get from reading code:
- Tribal knowledge
- Gotchas and pitfalls
- Patterns and conventions
- Where things go

**Principle:** Don't document what Claude can grep. Document what requires understanding.

### Plans Are Prompts

Each `PLAN.md` is literally what you'd send to an implementing agent. It contains everything needed to implement without asking questions.

### Decisions Are Permanent

Once recorded in `DECISIONS.md`, decisions aren't re-litigated. Each has date, context, rationale, and implications.

---

## Updating

```bash
npx specdacular@latest
```

Or in Claude Code:
```
/specd:update
```

## Uninstalling

```bash
npx specdacular --global --uninstall
# or
npx specdacular --local --uninstall
```

---

## License

MIT
