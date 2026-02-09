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

Two commands drive the entire feature lifecycle:

```
/specd:feature:new my-feature     # Initialize + first discussion
/specd:feature:next my-feature    # Everything else — discussion, research, planning, execution, review
```

`feature:next` reads your feature's current state and offers the natural next step. You never need to remember which command comes next.

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
| `/specd:feature:next [name]` | **Drive the entire lifecycle** — picks up where you left off |

### Phase Commands (`phase:`)

Work with individual phases — prepare, plan, and execute one at a time.

| Command | Description |
|---------|-------------|
| `/specd:phase:prepare [feature] [phase]` | Discuss gray areas + optionally research patterns |
| `/specd:phase:research [feature] [phase]` | Research patterns for a phase (standalone) |
| `/specd:phase:plan [feature] [phase]` | Create detailed PLAN.md files for one phase |
| `/specd:phase:execute [feature]` | Execute plans with progress tracking |
| `/specd:phase:review [feature] [phase]` | Review executed plans against actual code |
| `/specd:phase:insert [feature] [after] [desc]` | Insert a new phase after an existing one |
| `/specd:phase:renumber [feature]` | Renumber phases to clean integer sequence |

### Utilities

| Command | Description |
|---------|-------------|
| `/specd:status [--all]` | Show feature status dashboard |
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

**Step 1: Initialize**

```
/specd:feature:new user-dashboard
```

Creates `.specd/features/user-dashboard/` and starts the first discussion. Claude asks what you're building, follows the thread, and captures technical requirements. When done, offers to continue discussing or stop.

**Step 2: Drive the lifecycle**

```
/specd:feature:next user-dashboard
```

That's it. `feature:next` reads the current state and guides you through each stage:

1. **Discussion** — Probes gray areas until clear
2. **Research** — Spawns parallel agents for patterns/pitfalls
3. **Planning** — Creates roadmap with phases
4. **Phase preparation** — Discusses phase-specific gray areas
5. **Phase planning** — Creates detailed PLAN.md files
6. **Phase execution** — Implements with progress tracking
7. **Phase review** — Compares plans against actual code

After each step, you can continue or stop. Resume anytime with `/specd:feature:next`.

**No argument? It picks for you:**

```
/specd:feature:next
```

Scans for in-progress features and shows a picker.

**Mid-flight adjustments:**

```
/specd:phase:insert user-dashboard 3 "Cache layer"  # Insert Phase 3.1
/specd:phase:renumber user-dashboard                 # Clean up to integers
```

---

## The Flow in Detail

### Feature-Level Commands

**`feature:new`** creates the feature folder and starts the first discussion. After initialization, offers to continue discussing or come back later with `feature:next`. Output:
- `FEATURE.md` — Technical requirements from the conversation
- `CONTEXT.md` — Discussion context (accumulates over time)
- `DECISIONS.md` — Decisions with dates, rationale, and implications
- `STATE.md` — Progress tracking
- `config.json` — Feature configuration

**`feature:next`** is the smart state machine. It reads `config.json` and `STATE.md` to determine where the feature is, shows a status summary, and offers the natural next step. After each action it loops back — you keep going until you choose to stop. Under the hood it delegates to these stages:

- **Discussion** — Probes gray areas, records decisions. Context accumulates across sessions.
- **Research** — Spawns 3 parallel agents: codebase integration, external patterns, and pitfalls. Output: `RESEARCH.md`.
- **Planning** — Creates `ROADMAP.md` with phases derived from dependency analysis, plus empty `plans/phase-{NN}/` directories.

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

**`phase:review`** reviews executed plans against actual code:
- Claude inspects each plan's `creates`/`modifies` against actual files
- Per-plan status table with ✅/⚠️/❌/⏸️ icons
- User conversation captures additional issues
- Generates corrective plans if needed (fed back into `phase:execute`)
- Review cycle tracked in `STATE.md`

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

**The simple way** — two commands:

```
/specd:feature:new          /specd:feature:next
      │                           │
      ▼                           ▼
 Create feature          ┌─── Read state ◀──────────────┐
 First discussion        │    Show status                │
 Offer to continue       │    Offer next step            │
      │                  │         │                     │
      ▼                  │         ▼                     │
 "Keep discussing?"      │   ┌──────────────┐           │
  Yes → discuss loop     │   │  Execute the │           │
  No  → feature:next     │   │  next action │           │
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

**Under the hood,** `feature:next` delegates to the same workflows as the individual commands:

```
discussion  → discuss-feature workflow
research    → research-feature workflow (3 parallel agents)
planning    → plan-feature workflow
phase prep  → prepare-phase workflow
phase plan  → plan-phase workflow
execution   → execute-plan workflow
review      → review-phase workflow
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

## Migrating from v0.5

**New command: `/specd:feature:next`** — Drives the entire feature lifecycle from a single command. Reads current state and offers the next step automatically.

| Before (v0.5) | After (v0.6) |
|----------------|--------------|
| Remember command sequence: `discuss` → `research` → `plan` → `phase:prepare` → `phase:plan` → `phase:execute` → `phase:review` | Just run `/specd:feature:next` — it figures out what's next |
| `feature:new` ends with list of commands to try | `feature:new` offers to continue discussing or stop with `feature:next` |

**Existing `.specd/` data is fully compatible.** `feature:next` reads the same `config.json`, `STATE.md`, and other files.

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
