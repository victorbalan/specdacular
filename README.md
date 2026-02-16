# Specdacular

**AI-optimized feature planning and codebase documentation for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).**

Plan features specific enough that an agent can implement without asking questions.

```bash
npx specdacular
```

> [!NOTE]
> **Early Discovery Phase.** Commands and conventions may change between versions. Pin to a specific version if stability matters to you.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [Core Flow](#core-flow)
  - [Codebase Documentation](#codebase-documentation)
  - [Utilities](#utilities)
- [The Flow in Detail](#the-flow-in-detail)
- [How It Works](#how-it-works)
  - [Parallel Agents](#parallel-agents)
  - [Feature Flow](#feature-flow)
- [Multi-Project Support](#multi-project-support)
- [Project Structure](#project-structure)
- [Philosophy](#philosophy)
- [Updating](#updating)
- [Uninstalling](#uninstalling)
- [Contributing](#contributing)
- [License](#license)

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

For monorepos and multi-repo setups, it maps each sub-project in parallel, then produces system-level docs (`PROJECTS.md`, `TOPOLOGY.md`, `CONTRACTS.md`, `CONCERNS.md`) at the orchestrator level.

### 2. Plan Features

Three commands drive the entire feature lifecycle:

```
/specd:feature:new my-feature         # Initialize + first discussion
/specd:feature:continue my-feature    # Everything else — discussion, research, planning, execution, review
/specd:feature:toolbox my-feature     # Advanced operations menu
```

`feature:continue` reads your feature's current state and offers the natural next step. You never need to remember which command comes next.

`feature:toolbox` gives you direct access to advanced operations — discuss, research, plan, review, or insert a phase — when you want to jump to a specific action outside the normal flow.

Works with single projects and multi-project setups (monorepos, multi-repo). In multi-project mode, features are discussed at the system level and routed to the relevant sub-projects, with cross-project dependency tracking and contract validation.

---

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed and working
- Node.js >= 16.7.0
- Git (recommended — Specdacular commits progress automatically)

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

## Codex Support

Specdacular also supports [OpenAI Codex CLI](https://github.com/openai/codex).

### Install for Codex

```bash
npx specdacular --codex
```

This installs Codex skills to `.agents/skills/` and generates `AGENTS.md`.

### Available Codex Skills

All Specdacular commands work as Codex skills. Use `$specd-help` to see all commands, or `$specd-feature-continue` to drive the feature lifecycle.

### Development

When modifying workflows, regenerate Codex output:

```bash
npm run build:codex        # Regenerate codex/ directory
npm run check:codex        # Verify codex/ is up to date (for CI)
```

---

## Quick Start

### Map a Codebase

```
/specd:map-codebase
```

Creates `.specd/codebase/` with 4 AI-optimized documents. This gives Claude context about your codebase's architecture, patterns, structure, and gotchas. For multi-project setups, it detects sub-projects automatically and maps each one in parallel before producing system-level documentation.

### Plan a Feature

**Step 1: Initialize**

```
/specd:feature:new user-dashboard
```

Creates `.specd/features/user-dashboard/` and starts the first discussion. Claude asks what you're building, follows the thread, and captures technical requirements. When done, offers to continue discussing or stop.

**Step 2: Drive the lifecycle**

```
/specd:feature:continue user-dashboard
```

That's it. `feature:continue` reads the current state and guides you through each stage:

1. **Discussion** — Probes gray areas until clear
2. **Research** — Spawns parallel agents for patterns/pitfalls
3. **Planning** — Creates roadmap with phases
4. **Phase preparation** — Discusses phase-specific gray areas
5. **Phase planning** — Creates detailed PLAN.md files
6. **Phase execution** — Implements with progress tracking
7. **Phase review** — Compares plans against actual code

After each step, you can continue or stop. Resume anytime with `/specd:feature:continue`.

**No argument? It picks for you:**

```
/specd:feature:continue
```

Scans for in-progress features and shows a picker.

**Need a specific operation?**

```
/specd:feature:toolbox user-dashboard
```

Opens a menu with: Discuss, Research, Plan, Review, Insert phase. Useful when you want to jump to a specific action — like running research mid-execution or inserting a phase between existing ones.

---

## Commands

### Core Flow

| Command | Description |
|---------|-------------|
| `/specd:feature:new [name]` | Initialize a feature, start first discussion |
| `/specd:feature:continue [name]` | **Drive the entire lifecycle** — picks up where you left off |
| `/specd:feature:toolbox [name]` | Advanced operations: discuss, research, plan, review, insert |

### Codebase Documentation

| Command | Description |
|---------|-------------|
| `/specd:map-codebase` | Analyze codebase with parallel agents |

### Utilities

| Command | Description |
|---------|-------------|
| `/specd:config` | Configure auto-commit settings for docs and code |
| `/specd:status [--all]` | Show feature status dashboard |
| `/specd:help` | Show available commands |
| `/specd:update` | Update to latest version |

---

## The Flow in Detail

**`feature:new`** creates the feature folder and starts the first discussion. After initialization, offers to continue discussing or come back later with `feature:continue`. Output:
- `FEATURE.md` — Technical requirements from the conversation
- `CONTEXT.md` — Discussion context (accumulates over time)
- `DECISIONS.md` — Decisions with dates, rationale, and implications
- `STATE.md` — Progress tracking
- `config.json` — Feature configuration

**`feature:continue`** is the smart state machine. It reads `config.json` and `STATE.md` to determine where the feature is, shows a status summary, and offers the natural next step. After each action it loops back — you keep going until you choose to stop. Under the hood it delegates to these stages:

- **Discussion** — Probes gray areas, records decisions. Context accumulates across sessions.
- **Research** — Spawns 3 parallel agents: codebase integration, external patterns, and pitfalls. Output: `RESEARCH.md`.
- **Planning** — Creates `ROADMAP.md` with phases derived from dependency analysis, plus empty `plans/phase-{NN}/` directories.
- **Phase preparation** — Discusses phase-specific gray areas, records resolutions to phase `CONTEXT.md` and `DECISIONS.md`. Optionally spawns research agents focused on the phase.
- **Phase planning** — Creates detailed PLAN.md files. Each plan is a self-contained prompt for an implementing agent with exact file paths, code patterns, verification commands, and completion criteria. Plans are created just-in-time so they incorporate all context from preparation and earlier phases.
- **Phase execution** — Implements plans with auto-fix for bugs/blockers, user confirmation for architectural changes, verification after each task, commits, and progress tracking in `STATE.md`.
- **Phase review** — Reviews executed plans against actual code using git diff. Generates corrective plans if needed (fed back into execution). Review cycle tracked in `STATE.md`.

**`feature:toolbox`** provides direct access to advanced operations outside the normal flow:

- **Discuss** — Explore open questions at the feature or phase level
- **Research** — Spawn parallel agents for patterns/pitfalls
- **Plan** — Create implementation plans for a specific phase
- **Review** — Review executed work and report issues
- **Insert phase** — Add a phase mid-development using decimal numbering (e.g., Phase 3.1 after Phase 3)

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

```
/specd:feature:new        /specd:feature:continue
      │                           │
      ▼                           ▼
 Create feature          ┌─── Read state ◀──────────────┐
 First discussion        │    Show status                │
 Offer to continue       │    Offer next step            │
      │                  │         │                     │
      ▼                  │         ▼                     │
 "Keep discussing?"      │   ┌──────────────┐           │
  Yes → discuss loop     │   │  Execute the │           │
  No  → feature:continue │   │  next action │           │
                         │   └──────────────┘           │
                         │         │                     │
                         │    ┌────┴────┐                │
                         │    │ Discuss │ Research       │
                         │    │ Plan    │ Prepare phase  │
                         │    │ Execute │ Review phase   │
                         │    └────┬────┘                │
                         │         │                     │
                         │         ▼                     │
                         │   "Continue or stop?"         │
                         │    Continue ──────────────────┘
                         │    Stop → clean exit
                         │
                         └─── No features? → feature:new
```

**Under the hood,** `feature:continue` delegates to the same workflows as the toolbox operations:

```
discussion  → discuss-feature workflow
research    → research-feature workflow (3 parallel agents)
planning    → plan-feature workflow
phase prep  → prepare-phase workflow
phase plan  → plan-phase workflow
execution   → execute-plan workflow
review      → review-feature workflow
```

---

## Multi-Project Support

Specdacular supports monorepos and multi-repo setups through an orchestrator layer. All existing commands gain multi-project awareness automatically — no new commands to learn.

### Setup

```
/specd:map-codebase
```

When it detects multiple projects (via `package.json`, `go.mod`, `Cargo.toml`, etc.), it offers to enable multi-project mode. This:

1. Registers sub-projects in an orchestrator `.specd/config.json`
2. Spawns 4 mapper agents per sub-project in parallel
3. Runs an orchestrator mapper that produces system-level docs:

| Document | What It Answers |
|----------|-----------------|
| `PROJECTS.md` | What projects exist, their tech stacks and purposes? |
| `TOPOLOGY.md` | How do projects communicate? What's the data flow? |
| `CONTRACTS.md` | What are the cross-project relationships and shared domains? |
| `CONCERNS.md` | What are the system-level gotchas? |

### Feature Planning

`feature:new` conducts a system-level discussion, identifies which projects are involved, and creates per-project features with self-contained requirements. Each sub-project's `.specd/` works identically whether standalone or part of a multi-project setup.

Planning creates per-project roadmaps plus a cross-project dependency graph (`DEPENDENCIES.md`) with cycle validation.

### Execution & Scheduling

`feature:continue` schedules across projects, respecting cross-project dependencies. After each phase, it performs contract review — comparing what was implemented against system-level expectations and flagging deviations before they cascade to downstream projects.

```
/specd:feature:continue auth-system       # Auto-picks next unblocked phase across projects
/specd:feature:continue auth-system api   # Target a specific sub-project
```

---

## Project Structure

### Single Project

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
│           ├── ROADMAP.md     # Phase overview (from feature:plan)
│           └── plans/
│               ├── phase-01/
│               │   ├── CONTEXT.md   # Phase discussion
│               │   ├── RESEARCH.md  # Phase research
│               │   ├── 01-PLAN.md   # Detailed plans
│               │   └── 02-PLAN.md
│               └── phase-02/
│                   ├── CONTEXT.md
│                   ├── RESEARCH.md
│                   └── 01-PLAN.md
└── ...
```

### Multi-Project

```
monorepo/
├── .specd/                         # Orchestrator level
│   ├── config.json                 # type: "orchestrator", projects list
│   ├── codebase/                   # System-level docs
│   │   ├── PROJECTS.md
│   │   ├── TOPOLOGY.md
│   │   ├── CONTRACTS.md
│   │   └── CONCERNS.md
│   └── features/
│       └── auth-system/
│           ├── FEATURE.md          # System-level requirements
│           ├── DEPENDENCIES.md     # Cross-project dependency graph
│           └── STATE.md            # Cross-project progress
│
├── api/
│   └── .specd/                     # Sub-project (works standalone too)
│       ├── config.json             # type: "project"
│       ├── codebase/
│       │   ├── MAP.md
│       │   ├── PATTERNS.md
│       │   ├── STRUCTURE.md
│       │   └── CONCERNS.md
│       └── features/
│           └── auth-system/
│               ├── FEATURE.md      # Project-specific requirements
│               ├── ROADMAP.md      # Per-project phases
│               └── plans/...
│
└── web/
    └── .specd/                     # Another sub-project
        ├── config.json
        ├── codebase/...
        └── features/...
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

---

## Uninstalling

```bash
npx specdacular --global --uninstall
# or
npx specdacular --local --uninstall
```

---

## Contributing

Issues and pull requests are welcome at [github.com/victorbalan/specdacular](https://github.com/victorbalan/specdacular).

---

## License

MIT
