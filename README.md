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
  - [The Brain](#the-brain)
  - [Pipeline Configuration](#pipeline-configuration)
  - [Hooks](#hooks)
  - [Parallel Agents](#parallel-agents)
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

Three commands drive the entire task lifecycle:

```
/specd:new my-feature              # Initialize + first discussion
/specd:continue my-feature         # Everything else — discussion, research, planning, execution, review
/specd:toolbox my-feature          # Advanced operations menu
```

`continue` reads your task's current state and offers the natural next step. You never need to remember which command comes next.

`toolbox` gives you direct access to advanced operations — discuss, research, plan, execute, review — and codebase context management (status dashboard, section-by-section review with edit/re-map/add).

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

## Quick Start

### Map a Codebase

```
/specd:map-codebase
```

Creates `.specd/codebase/` with 4 AI-optimized documents. This gives Claude context about your codebase's architecture, patterns, structure, and gotchas. For multi-project setups, it detects sub-projects automatically and maps each one in parallel before producing system-level documentation.

### Plan a Feature

**Step 1: Initialize**

```
/specd:new user-dashboard
```

Creates `.specd/tasks/user-dashboard/` and starts the first discussion. Claude asks what you're building, follows the thread, and captures technical requirements. When done, offers to continue discussing or stop.

**Step 2: Drive the lifecycle**

```
/specd:continue user-dashboard
```

That's it. `continue` reads the current state and guides you through each stage:

1. **Discussion** — Probes gray areas until clear
2. **Research** — Spawns parallel agents for patterns/pitfalls
3. **Planning** — Creates roadmap with phase goals
4. **Phase execution** — Plans each phase just-in-time, then implements with progress tracking
5. **Phase review** — Code review agent compares plans against actual code

After each step, you can continue or stop. Resume anytime with `/specd:continue`.

**Execution modes:**

```
/specd:continue user-dashboard                # Default — auto-runs, pauses at phase steps
/specd:continue user-dashboard --interactive  # Prompt at every step with skip/jump options
/specd:continue user-dashboard --auto         # Run everything, stop only on review issues
```

**No argument? It picks for you:**

```
/specd:continue
```

Scans for in-progress tasks and shows a picker.

**Need a specific operation?**

```
/specd:toolbox user-dashboard
```

Opens a menu with task operations (Discuss, Research, Plan, Execute, Review) and context management (Status, Review). Useful when you want to jump to a specific action outside the normal flow.

---

## Commands

### Core Flow

| Command | Description |
|---------|-------------|
| `/specd:new [name]` | Initialize a task, start first discussion |
| `/specd:continue [name] [--interactive\|--auto]` | **Drive the entire lifecycle** — picks up where you left off |
| `/specd:toolbox [tasks name\|context]` | Task operations or codebase context management |

### Codebase Documentation

| Command | Description |
|---------|-------------|
| `/specd:map-codebase` | Analyze codebase with parallel agents |
| `/specd:toolbox context` | Status dashboard or section-by-section review |

### Utilities

| Command | Description |
|---------|-------------|
| `/specd:config` | Configure auto-commit settings for docs and code |
| `/specd:status [--all]` | Show task status dashboard |
| `/specd:help` | Show available commands |
| `/specd:update` | Update to latest version |

---

## The Flow in Detail

**`new`** creates the task folder and starts the first discussion. After initialization, offers to continue discussing or come back later with `continue`. Output:
- `FEATURE.md` — Technical requirements from the conversation
- `CONTEXT.md` — Discussion context (accumulates over time)
- `DECISIONS.md` — Decisions with dates, rationale, and implications
- `STATE.md` — Progress tracking
- `config.json` — Task configuration

**`continue`** delegates to the brain — a config-driven orchestrator that reads `pipeline.json` and drives the lifecycle. It determines the next step from task state, executes pre-hooks → step workflow → post-hooks, updates state, and loops. The default pipeline stages:

- **Discussion** — Probes gray areas, records decisions. Context accumulates across sessions.
- **Research** — Spawns 3 parallel agents: codebase integration, external patterns, and pitfalls. Output: `RESEARCH.md`.
- **Planning** — Creates `ROADMAP.md` with phases derived from dependency analysis. Phase goals only — no detailed PLAN.md files yet.
- **Phase execution** — Nested sub-pipeline that loops per phase: plan → execute → review → revise. Each phase gets just-in-time planning (detailed PLAN.md from ROADMAP.md goal), then implementation with verification, commits per task, and progress tracking. Later phases can adapt based on earlier execution.
- **Phase review** — Code review agent inspects executed code against plan intent. Generates fix plans (decimal phases like `phase-01.1`) if needed.
- **Revise** — Collects feedback from review, creates fix plans, signals brain to re-execute.

**`toolbox`** provides direct access to advanced operations outside the normal flow. Two subdomains:

**Tasks** (`/specd:toolbox tasks my-feature`):
- **Discuss** — Explore open questions, record decisions
- **Research** — Spawn parallel agents for patterns/pitfalls
- **Plan** — Create execution phases from task context
- **Execute** — Execute the next phase's plan
- **Review** — Review executed phase, approve or request fixes

**Context** (`/specd:toolbox context`):
- **Status** — Dashboard showing all context files with freshness indicators
- **Review** — Section-by-section review of any context file: confirm, edit, remove, re-map (spawns a mapper agent to regenerate a section), or add new content. Sections are tracked with `AUTO_GENERATED` and `USER_MODIFIED` tags with dates.

---

## How It Works

### The Brain

The brain (`brain.md`) is a config-driven orchestrator that reads `pipeline.json` and drives the entire task lifecycle. Step workflows are pure execution — they do their work and return. The brain decides what comes next.

```
                        ┌─────────────────────┐
                        │       BRAIN         │
                        │  (config-driven     │
                        │   orchestrator)     │
                        └────────┬────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              Read State   Load Pipeline   Check Mode
                    │            │            │
                    └────────────┼────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      Main Pipeline      │
                    │                         │
                    │  discuss → research →   │
                    │  plan → phase-execution │
                    └────────────┬────────────┘
                                 │
                         ┌───────┴───────┐
                         ▼               │
              ┌─────────────────────┐    │
              │  Phase-Execution    │    │
              │  Sub-Pipeline       │    │
              │                     │    │
              │  plan → execute →   │    │
              │  review → revise   │    │
              │      ──loop──┘     │    │
              │                     │    │
              │  Per phase, repeats │    │
              │  until all phases   │    │
              │  complete           │    │
              └─────────────────────┘    │
                         │               │
                         └───────────────┘
                                 │
                                 ▼
                          TASK COMPLETE
```

**The brain loop:**
1. Read current state (`config.json`, `STATE.md`)
2. Determine next step from pipeline config
3. Execute pre-hooks → step workflow → post-hooks
4. Update state → loop back

**Execution modes:**

| Mode | Behavior |
|------|----------|
| **Default** | Auto-runs steps, pauses where `pause: true`. Smart-skips unnecessary steps. |
| **Interactive** (`--interactive`) | Prompts at each stage transition with skip/jump options |
| **Auto** (`--auto`) | Runs everything, only stops on errors or task completion |

### Pipeline Configuration

The pipeline is defined in `pipeline.json` — nothing is hardcoded. The default pipeline ships with Specdacular and can be fully replaced by placing a `.specd/pipeline.json` in your project (full replace, not merge).

**Default pipeline structure:**

```json
{
  "schema_version": "1.0",
  "pipelines": {
    "main": [
      { "name": "discuss",  "workflow": "discuss.md" },
      { "name": "research", "workflow": "research.md" },
      { "name": "plan",     "workflow": "plan.md" },
      { "name": "phase-execution", "pipeline": "phase-execution" }
    ],
    "phase-execution": [
      { "name": "plan",    "workflow": "phase-plan.md" },
      { "name": "execute", "workflow": "execute.md", "pause": true },
      { "name": "review",  "workflow": "review.md",  "pause": true },
      { "name": "revise",  "workflow": "revise.md",  "pause": true }
    ]
  },
  "hooks": { "pre-step": null, "post-step": null }
}
```

**Customization options:**
- **Swap workflows:** Point any step's `workflow` to your own `.md` file
- **Add hooks:** Configure pre/post hooks per step or globally
- **Full replace:** Drop `.specd/pipeline.json` to replace the entire pipeline

### Hooks

Hooks are markdown workflow files (`.md`) that run before and after pipeline steps. They can read and modify task files just like any other workflow.

```
  Global pre-step hook
         │
         ▼
  Step pre-hook
         │
         ▼
  ┌─────────────┐
  │  Step runs   │
  │  (discuss,   │
  │   execute,   │
  │   etc.)      │
  └──────┬──────┘
         │
         ▼
  Step post-hook
         │
         ▼
  Global post-step hook
```

**Configuration in pipeline.json:**

```json
{
  "name": "execute",
  "workflow": "execute.md",
  "hooks": {
    "pre": { "workflow": ".specd/hooks/pre-execute.md", "mode": "inline", "optional": false },
    "post": { "workflow": ".specd/hooks/post-execute.md", "mode": "subagent", "optional": true }
  }
}
```

**Hook modes:**
- **`inline`** — Runs in the brain's context (can see all state)
- **`subagent`** — Spawns a separate agent (fresh context, isolated)

**Convention fallback:** If no hooks are configured explicitly, the brain checks for `.specd/hooks/pre-{step}.md` and `.specd/hooks/post-{step}.md` automatically.

**Error handling:** Required hooks (`optional: false`) stop the pipeline on failure. Optional hooks log a warning and continue.

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

`new` conducts a system-level discussion, identifies which projects are involved, and creates per-project tasks with self-contained requirements. Each sub-project's `.specd/` works identically whether standalone or part of a multi-project setup.

Planning creates per-project roadmaps plus a cross-project dependency graph (`DEPENDENCIES.md`) with cycle validation.

### Execution & Scheduling

`continue` schedules across projects, respecting cross-project dependencies. After each phase, it performs contract review — comparing what was implemented against system-level expectations and flagging deviations before they cascade to downstream projects.

```
/specd:continue auth-system       # Auto-picks next unblocked phase across projects
/specd:continue auth-system api   # Target a specific sub-project
```

---

## Project Structure

### Single Project

```
your-project/
├── .specd/
│   ├── pipeline.json          # Optional — custom pipeline (full replace)
│   ├── hooks/                 # Optional — convention-based hooks
│   │   ├── pre-execute.md
│   │   └── post-review.md
│   │
│   ├── codebase/              # From /specd:map-codebase
│   │   ├── MAP.md
│   │   ├── PATTERNS.md
│   │   ├── STRUCTURE.md
│   │   └── CONCERNS.md
│   │
│   └── tasks/                 # From task commands
│       └── user-dashboard/
│           ├── FEATURE.md     # Technical requirements
│           ├── CONTEXT.md     # Discussion context
│           ├── DECISIONS.md   # Decision log
│           ├── STATE.md       # Progress tracking
│           ├── RESEARCH.md    # Research findings
│           ├── ROADMAP.md     # Phase overview
│           └── phases/
│               ├── phase-01/
│               │   └── PLAN.md
│               └── phase-02/
│                   └── PLAN.md
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
│   └── tasks/
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
│       └── tasks/
│           └── auth-system/
│               ├── FEATURE.md      # Project-specific requirements
│               ├── ROADMAP.md      # Per-project phases
│               └── phases/...
│
└── web/
    └── .specd/                     # Another sub-project
        ├── config.json
        ├── codebase/...
        └── tasks/...
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
