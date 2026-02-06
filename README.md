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
feature:new -> feature:discuss -> feature:research -> feature:plan (roadmap) ->
  [for each phase]
    phase:prepare? -> phase:plan -> phase:execute
  phase:insert? -> phase:renumber?   <- mid-flight adjustments
```

**You control the rhythm:**
- `feature:new` — Initialize and start first discussion
- `feature:discuss` — Refine understanding (call many times)
- `feature:research` — Investigate implementation approaches
- `feature:plan` — Create roadmap with phase overview
- `phase:prepare` — Discuss gray areas + optionally research patterns (per phase)
- `phase:plan` — Create detailed PLAN.md files for one phase
- `phase:execute` — Execute plans with progress tracking
- `phase:insert` — Insert a new phase mid-flight with decimal numbering (e.g., Phase 3.1)
- `phase:renumber` — Clean up decimal phases to sequential integers

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

### Feature Commands

| Command | Description |
|---------|-------------|
| `/specd:feature:new [name]` | Initialize a feature, start first discussion |
| `/specd:feature:discuss [name]` | Continue/deepen discussion (iterative) |
| `/specd:feature:research [name]` | Research implementation with parallel agents |
| `/specd:feature:plan [name]` | Create roadmap with phase overview |

### Phase Commands

| Command | Description |
|---------|-------------|
| `/specd:phase:prepare [feature] [phase]` | Discuss gray areas + optionally research patterns |
| `/specd:phase:research [feature] [phase]` | Research patterns for a phase (standalone) |
| `/specd:phase:plan [feature] [phase]` | Create detailed PLAN.md files for one phase |
| `/specd:phase:execute [feature]` | Execute plans with progress tracking |
| `/specd:phase:insert [feature] [after] [desc]` | Insert a new phase after an existing one |
| `/specd:phase:renumber [feature]` | Renumber phases to clean integer sequence |

### Utilities

| Command | Description |
|---------|-------------|
| `/specd:blueprint [name] [sub]` | Generate visual blueprint (wireframes, diagrams) |
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
/specd:feature:new user-dashboard
```

Creates `.specd/features/user-dashboard/` with:
- `FEATURE.md` — Technical requirements
- `CONTEXT.md` — Discussion context (accumulates)
- `DECISIONS.md` — Decisions with dates and rationale
- `STATE.md` — Progress tracking

Then refine and create a roadmap:
```
/specd:feature:discuss user-dashboard    # Clarify gray areas
/specd:feature:research user-dashboard   # Research implementation
/specd:feature:plan user-dashboard       # Create roadmap with phases
```

Then for each phase, prepare, plan, and execute:
```
/specd:phase:prepare user-dashboard 1    # Discuss + optionally research
/specd:phase:plan user-dashboard 1       # Create detailed task plans
/specd:phase:execute user-dashboard      # Execute with progress tracking
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
│  feature:new │ ──▶ │   feature:   │ ◀─▶ │   feature:   │
│              │     │   discuss    │     │   research   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  feature:plan│ (creates roadmap)
                     └──────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │     For each phase:         │
              │  ┌──────────┐               │
              │  │  phase:  │               │
              │  │ prepare  │               │
              │  └──────────┘               │
              │       │                     │
              │       ▼                     │
              │  ┌──────────┐               │
              │  │  phase:  │               │
              │  │   plan   │               │
              │  └──────────┘               │
              │       │                     │
              │       ▼                     │
              │  ┌──────────┐               │
              │  │  phase:  │               │
              │  │ execute  │               │
              │  └──────────┘               │
              │                             │
              │  Mid-flight adjustments:    │
              │  ┌──────────┐               │
              │  │  phase:  │ ──┐           │
              │  │  insert  │   │           │
              │  └──────────┘   │           │
              │          ┌──────▼────────┐  │
              │          │    phase:     │  │
              │          │   renumber   │  │
              │          └──────────────┘  │
              └─────────────────────────────┘
```

Each session updates:
- `CONTEXT.md` — Resolved questions accumulate
- `DECISIONS.md` — Decisions with rationale accumulate

**Phase-level commands:**
- `phase:prepare` — Just-in-time discussion + optional research for a specific phase
- `phase:plan` — Create detailed PLAN.md files for one phase (just-in-time, not upfront)
- `phase:execute` — Execute plans with deviation tracking
- `phase:insert` — Insert urgent work mid-flight as decimal phase (e.g., 3.1)
- `phase:renumber` — Clean up decimal numbering to sequential integers

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
│           ├── CONTEXT.md     # Feature-level discussion
│           ├── DECISIONS.md   # Decision log (feature + phase)
│           ├── STATE.md       # Progress tracking
│           ├── RESEARCH.md    # Feature-level research
│           ├── ROADMAP.md     # Phase overview
│           └── plans/         # Executable plans
│               ├── phase-01/
│               │   ├── CONTEXT.md   # Phase discussion (from phase:prepare)
│               │   ├── RESEARCH.md  # Phase research (from phase:prepare or phase:research)
│               │   ├── 01-PLAN.md   # From phase:plan
│               │   └── 02-PLAN.md
│               └── phase-02/
│                   ├── CONTEXT.md
│                   ├── RESEARCH.md
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

### Just-in-Time Planning

Detailed plans are created per-phase, not all at once. This keeps plans fresh — earlier phases inform later ones, and context doesn't go stale.

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
