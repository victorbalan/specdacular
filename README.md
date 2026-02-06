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

Commands are organized into **feature** and **phase** namespaces.

### Codebase Documentation

| Command | Description |
|---------|-------------|
| `/specd:map-codebase` | Analyze codebase with parallel agents |

### Feature Commands (`feature:`)

Work with a feature as a whole — discuss, research, and create a roadmap.

| Command | Description |
|---------|-------------|
| `/specd:feature:new [name]` | Initialize a feature, start first discussion |
| `/specd:feature:discuss [name]` | Continue/deepen discussion (call many times) |
| `/specd:feature:research [name]` | Research implementation with parallel agents |
| `/specd:feature:plan [name]` | Create roadmap with phase overview |

### Phase Commands (`phase:`)

Work with individual phases — prepare, plan, and execute one at a time.

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

Creates `.specd/codebase/` with 4 AI-optimized documents. This gives Claude context about your codebase's architecture, patterns, structure, and gotchas.

### Plan a Feature

**Step 1: Initialize and discuss**

```
/specd:feature:new user-dashboard
```

Creates `.specd/features/user-dashboard/` and starts the first discussion. Claude asks what you're building, follows the thread, and captures technical requirements.

**Step 2: Refine understanding**

```
/specd:feature:discuss user-dashboard    # Clarify gray areas (call many times)
/specd:feature:research user-dashboard   # Research implementation approaches
```

Discussion and research are iterative — call them as many times as you need. Context accumulates across sessions.

**Step 3: Create a roadmap**

```
/specd:feature:plan user-dashboard
```

Creates `ROADMAP.md` with phases derived from dependency analysis (types -> API -> UI), plus empty phase directories. No detailed plans yet — those come next, per phase.

**Step 4: Prepare, plan, and execute each phase**

```
/specd:phase:prepare user-dashboard 1    # Discuss phase gray areas + optional research
/specd:phase:plan user-dashboard 1       # Create detailed PLAN.md files
/specd:phase:execute user-dashboard      # Execute with progress tracking
```

Repeat for each phase. Plans are created just-in-time so they stay fresh.

**Mid-flight adjustments:**

```
/specd:phase:insert user-dashboard 3 "Cache layer"  # Insert Phase 3.1
/specd:phase:renumber user-dashboard                 # Clean up to integers
```

---

## The Flow in Detail

### Feature-Level Commands

**`feature:new`** creates the feature folder and starts the first discussion. Output:
- `FEATURE.md` — Technical requirements from the conversation
- `CONTEXT.md` — Discussion context (accumulates over time)
- `DECISIONS.md` — Decisions with dates, rationale, and implications
- `STATE.md` — Progress tracking
- `config.json` — Feature configuration

**`feature:discuss`** continues the conversation. Can be called many times — each session adds to `CONTEXT.md` and `DECISIONS.md`. Claude identifies gray areas based on what's been discussed so far and probes until clear.

**`feature:research`** spawns 3 parallel agents to investigate:
1. **Codebase integration** — How does this fit with existing code?
2. **External patterns** — What libraries/approaches are standard?
3. **Pitfalls** — What commonly goes wrong?

Output: `RESEARCH.md` with prescriptive guidance.

**`feature:plan`** creates a roadmap with phases. Each phase has a goal, deliverables, and dependencies. Creates `ROADMAP.md` and empty `plans/phase-{NN}/` directories. Does **not** create detailed PLAN.md files — that happens per-phase with `phase:plan`.

### Phase-Level Commands

**`phase:prepare`** is the main pre-execution command. It:
1. Shows the phase overview (goal, deliverables, existing context)
2. Identifies gray areas based on phase type (Types, API, UI, etc.)
3. Probes until clear (4 questions max per area)
4. Records resolutions to phase `CONTEXT.md` and `DECISIONS.md`
5. **Offers research** — "Would you like to research implementation patterns?"
6. If yes, spawns 3 parallel research agents focused on the phase

This replaces the old two-step of discuss-phase then research-phase.

**`phase:research`** is the standalone research command. Use it when you want to research a phase without discussing first. Same research agents as `phase:prepare`, just without the discussion step.

**`phase:plan`** creates detailed PLAN.md files for one phase. Each plan is a self-contained prompt for an implementing agent with:
- Exact file paths to create/modify
- Code patterns to follow (from codebase docs)
- Verification commands to run
- Clear completion criteria

Plans are created just-in-time — right before execution — so they incorporate all context from preparation and earlier phases.

**`phase:execute`** executes plans with:
- Auto-fix for bugs/blockers (logged to `CHANGELOG.md`)
- User confirmation for architectural changes
- Verification after each task
- Commits after each task
- Progress tracking in `STATE.md`

**`phase:insert`** adds a new phase using decimal numbering (e.g., Phase 3.1 after Phase 3). The `(INSERTED)` marker in `ROADMAP.md` identifies mid-flight additions.

**`phase:renumber`** cleans up decimal phases to sequential integers after insertions stabilize.

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
│           ├── ROADMAP.md     # Phase overview (from feature:plan)
│           └── plans/
│               ├── phase-01/
│               │   ├── CONTEXT.md   # Phase discussion (from phase:prepare)
│               │   ├── RESEARCH.md  # Phase research (from phase:prepare or phase:research)
│               │   ├── 01-PLAN.md   # Detailed plans (from phase:plan)
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

## Migrating from v0.4

If you're upgrading from v0.4, here's what changed:

**Commands were renamed** into `feature:` and `phase:` namespaces:

| v0.4 | v0.5 |
|------|------|
| `/specd:new-feature` | `/specd:feature:new` |
| `/specd:discuss-feature` | `/specd:feature:discuss` |
| `/specd:research-feature` | `/specd:feature:research` |
| `/specd:plan-feature` | `/specd:feature:plan` |
| `/specd:discuss-phase` | `/specd:phase:prepare` |
| `/specd:research-phase` | `/specd:phase:research` |
| `/specd:execute-plan` | `/specd:phase:execute` |
| `/specd:insert-phase` | `/specd:phase:insert` |
| `/specd:renumber-phases` | `/specd:phase:renumber` |

**New commands:**
- `/specd:phase:prepare` — Replaces `discuss-phase`, adds optional research at the end
- `/specd:phase:plan` — Creates detailed plans for **one phase** (new command)

**Behavior changes:**
- `feature:plan` now creates only `ROADMAP.md` + empty phase directories. It no longer creates `PLAN.md` files for all phases upfront.
- Detailed `PLAN.md` files are created per-phase with `phase:plan`, right before execution. This prevents plans from going stale.
- `phase:prepare` combines the old discuss-phase + research-phase into a single command. Discussion always happens; research is offered as an optional step at the end.

**Existing `.specd/` data is fully compatible.** Your feature files, decisions, and roadmaps work with the new commands.

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
