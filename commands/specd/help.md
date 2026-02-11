---
name: specd:help
description: Show all specdacular commands and usage guide
allowed-tools:
  - Read
---

<objective>
Display available specdacular commands and usage guidance.
</objective>

<output>
# Specdacular

**AI-optimized codebase documentation and feature planning for Claude.**

## Commands

### Codebase Documentation

| Command | Description |
|---------|-------------|
| `/specd:map-codebase` | Analyze codebase with parallel agents -> produce AI-optimized docs |

### Feature Commands

| Command | Description |
|---------|-------------|
| `/specd:feature:new [name]` | Initialize a feature, start first discussion |
| `/specd:feature:discuss [name]` | Continue/deepen feature discussion (can call many times) |
| `/specd:feature:research [name]` | Research implementation with parallel agents |
| `/specd:feature:plan [name]` | Create roadmap with phase overview |

### Phase Commands

| Command | Description |
|---------|-------------|
| `/specd:phase:prepare [feature] [phase]` | Discuss gray areas + optionally research patterns |
| `/specd:phase:research [feature] [phase]` | Research patterns for a phase (standalone) |
| `/specd:phase:plan [feature] [phase]` | Create detailed PLAN.md files for one phase |
| `/specd:phase:execute [feature] [plan]` | Execute a plan with progress tracking |
| `/specd:phase:review [feature] [phase]` | Review executed plans against actual code |
| `/specd:phase:insert [feature] [after] [desc]` | Insert a new phase after an existing one |
| `/specd:phase:renumber [feature]` | Renumber phases to clean integer sequence |

### Other

| Command | Description |
|---------|-------------|
| `/specd:init-config` | Create or update `.specd/config.json` with commit settings |
| `/specd:status [--all]` | Show feature status dashboard |
| `/specd:blueprint [name] [sub]` | Generate visual blueprint (wireframes, diagrams) |
| `/specd:update` | Update Specdacular to the latest version |
| `/specd:help` | Show this help |

---

## Feature Flow

The feature flow helps you plan features specific enough that an agent can implement without asking questions.

```
feature:new -> feature:discuss -> feature:research -> feature:plan (roadmap) ->
  [for each phase]
    phase:prepare? -> phase:plan -> phase:execute -> phase:review?
  phase:insert? -> phase:renumber?   <- mid-flight adjustments
```

**You control the rhythm:**
- `feature:new` — Creates structure, asks initial questions, starts first discussion
- `feature:discuss` — Can be called **many times** to refine understanding
- `feature:research` — Can be called **many times** to investigate
- `feature:plan` — Creates roadmap with phases (no detailed plans yet)
- `phase:prepare` — Discuss gray areas + optionally research (per phase)
- `phase:plan` — Create detailed PLAN.md files for one phase
- `phase:execute` — Execute plans with progress tracking
- `phase:review` — Review executed plans, generate corrective plans if needed
- `phase:insert` — Insert a new phase mid-flight with decimal numbering (e.g., Phase 3.1)
- `phase:renumber` — Clean up decimal phases to sequential integers

### Quick Start

```
/specd:feature:new user-dashboard
```

This creates `.specd/features/user-dashboard/` with:
- `FEATURE.md` — Technical requirements
- `CONTEXT.md` — Discussion context (accumulates)
- `DECISIONS.md` — User-driven decisions with dates and rationale
- `CHANGELOG.md` — Auto-captured implementation decisions during execution
- `STATE.md` — Progress tracking

After initialization, refine and plan:

```
/specd:feature:discuss user-dashboard    # Clarify gray areas
/specd:feature:research user-dashboard   # Research implementation
/specd:feature:plan user-dashboard       # Create roadmap
```

Then for each phase:

```
/specd:phase:prepare user-dashboard 1    # Discuss + optionally research
/specd:phase:plan user-dashboard 1       # Create detailed plans
/specd:phase:execute user-dashboard      # Execute with progress tracking
/specd:phase:review user-dashboard 1     # Review phase against actual code
```

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

### Philosophy

These docs are **for Claude, not humans**.

Each document answers a question Claude can't get from reading code:
- MAP.md -> "Where is X? What functions exist?"
- PATTERNS.md -> "How do I write code that fits?"
- STRUCTURE.md -> "Where do I put new code?"
- CONCERNS.md -> "What will bite me?"

**Principle:** Don't document what Claude can grep. Document tribal knowledge, gotchas, and patterns.

---

## Updating

When an update is available, you'll see `update available` in your statusline. Run:
```
/specd:update
```
Or manually: `npx specdacular@latest`

---

GitHub: https://github.com/vlad-ds/specdacular
</output>
