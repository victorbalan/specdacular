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
| `/specd:map-codebase` | Analyze codebase with parallel agents → produce AI-optimized docs |

### Feature Flow

| Command | Description |
|---------|-------------|
| `/specd:new-feature [name]` | Initialize a feature, start first discussion |
| `/specd:discuss-feature [name]` | Continue/deepen feature discussion (can call many times) |
| `/specd:research-feature [name]` | Research implementation with parallel agents |
| `/specd:plan-feature [name]` | Create executable task plans for agents |
| `/specd:discuss-phase [feature] [phase]` | Discuss a phase before execution |
| `/specd:research-phase [feature] [phase]` | Research patterns for a phase |
| `/specd:execute-plan [feature] [plan]` | Execute a plan with progress tracking |
| `/specd:insert-phase [feature] [after] [desc]` | Insert a new phase after an existing one |
| `/specd:renumber-phases [feature]` | Renumber phases to clean integer sequence |
| `/specd:blueprint [name] [sub]` | Generate visual blueprint (wireframes, diagrams) |

### Utilities

| Command | Description |
|---------|-------------|
| `/specd:update` | Update Specdacular to the latest version |
| `/specd:help` | Show this help |

---

## Feature Flow

The feature flow helps you plan features specific enough that an agent can implement without asking questions.

```
new-feature → discuss-feature → plan-feature →
  (discuss-phase? → research-phase? → execute-plan)* per phase
  insert-phase? → renumber-phases?   ← mid-flight adjustments
```

**You control the rhythm:**
- `new-feature` — Creates structure, asks initial questions, starts first discussion
- `discuss-feature` — Can be called **many times** to refine understanding
- `research-feature` — Can be called **many times** to investigate
- `plan-feature` — When satisfied, creates executable plans for an agent
- `discuss-phase` — Optional: dive deeper into phase specifics before execution
- `research-phase` — Optional: research patterns for a specific phase
- `execute-plan` — Execute plans with progress tracking and deviation logging
- `insert-phase` — Insert a new phase mid-flight with decimal numbering (e.g., Phase 3.1)
- `renumber-phases` — Clean up decimal phases to sequential integers

### Quick Start

```
/specd:new-feature user-dashboard
```

This creates `.specd/features/user-dashboard/` with:
- `FEATURE.md` — Technical requirements
- `CONTEXT.md` — Discussion context (accumulates)
- `DECISIONS.md` — User-driven decisions with dates and rationale
- `CHANGELOG.md` — Auto-captured implementation decisions during execution
- `STATE.md` — Progress tracking

After initialization, refine with discussion and research, then create plans:

```
/specd:discuss-feature user-dashboard    # Clarify gray areas
/specd:research-feature user-dashboard   # Research implementation
/specd:plan-feature user-dashboard       # Create executable plans
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
- MAP.md → "Where is X? What functions exist?"
- PATTERNS.md → "How do I write code that fits?"
- STRUCTURE.md → "Where do I put new code?"
- CONCERNS.md → "What will bite me?"

**Principle:** Don't document what Claude can grep. Document tribal knowledge, gotchas, and patterns.

---

## Updating

When an update is available, you'll see `⬆ /specd:update` in your statusline. Run:
```
/specd:update
```
Or manually: `npx specdacular@latest`

---

GitHub: https://github.com/vlad-ds/specdacular
</output>
