# Specdacular

**AI-optimized codebase documentation and feature planning for Claude.**

## Commands

### Core Flow

| Command | Description |
|---------|-------------|
| `/specd.new [name]` | Initialize a task — full inception: discuss → research → plan |
| `/specd.new-project [name]` | Bootstrap a new project from idea to structured plan |
| `/specd.continue [name] [--interactive\|--auto]` | Continue task lifecycle — picks up where you left off |
| `/specd.research [name]` | Spawn parallel research agents for current task |
| `/specd.plan [name]` | Create roadmap or plan current phase |
| `/specd.execute [name]` | Execute next phase — implement and review |
| `/specd.context [name]` | Load task context and inject behavioral guardrails |
| `/specd.toolbox [name]` | Advanced operations: insert/skip/reset phase, view docs |

### Utilities

| Command | Description |
|---------|-------------|
| `/specd.codebase.map` | Analyze codebase with parallel agents → AI-optimized docs |
| `/specd.codebase.review` | Review and edit codebase context files section by section |
| `/specd.config` | Configure auto-commit settings for docs and code |
| `/specd.status [--all]` | Show task status dashboard |
| `/specd.help` | Show this help |
| `/specd.update` | Update Specdacular to the latest version |

---

## Task Flow

```
/specd.new → /specd.execute → execute → execute → done
```

**Granular control:**
```
/specd.new → /specd.research → /specd.plan → /specd.execute → done
```

**Full pipeline (all-in-one):**
```
/specd.continue [--auto]
```

**For new projects (greenfield):**
```
/specd.new-project → (questioning → research → requirements → roadmap → scaffold)
```

**Core commands:**

1. **`/specd.new [name]`** — Start here. Full inception: discuss → research → plan. Creates task folder, iterates until phases are ready.
2. **`/specd.execute [name]`** — Execute the next phase. Implements the PLAN.md, then reviews. One phase per run.
3. **`/specd.continue [name]`** — Full pipeline in one context. Drives the entire lifecycle automatically.
4. **`/specd.context [name]`** — Load task context mid-conversation. Injects behavioral guardrails. Re-runnable.

**Supporting commands:**

5. **`/specd.research [name]`** — Ad-hoc research. Spawns three parallel agents for patterns, pitfalls, and codebase integration.
6. **`/specd.plan [name]`** — Create roadmap or plan the current phase.
7. **`/specd.toolbox [name]`** — Advanced ops: insert/skip/reset phases, view docs, discuss.

### Quick Start

```
/specd.new user-dashboard
# (inception: discuss → research → plan)
/specd.execute
# (implements phase 1, reviews it)
/specd.execute
# (phase 2, etc.)
```

---

## The Brain

The `continue` command is powered by the **brain** — a config-driven orchestrator that reads `pipeline.json` and drives the entire task lifecycle. Step workflows are pure execution; the brain decides what comes next.

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

---

## RALPH — Autonomous Loop

RALPH is a Node.js script that drives the full task lifecycle by spawning fresh Claude CLI instances per step. Each step gets a clean context with guardrails injected automatically.

```bash
npx specdacular ralph
```

**How it works:**
1. Reads task state (`config.json`, `STATE.md`)
2. Determines the next step from the pipeline
3. Spawns `claude -p` with the step's prompt + guardrails
4. Checks results, updates state
5. Loops until complete or stopped

**Key features:**
- Fresh context per step — no context window buildup
- Guardrails injected automatically via `--append-system-prompt-file`
- Graceful Ctrl+C with state saved
- Process group cleanup (no orphaned Claude processes)

**RALPH vs `/specd.continue`:**

| | RALPH | `/specd.continue` |
|---|---|---|
| Context | Fresh per step | Single window |
| Best for | Long tasks, autonomous runs | Short tasks, interactive work |
| Runs via | Terminal (`npx`) | Claude Code (slash command) |

---

## Pipeline Configuration

The pipeline is defined in `pipeline.json` — nothing is hardcoded. The default pipeline ships with Specdacular and can be fully replaced by placing a `.specd/pipeline.json` in your project.

**Default pipeline:** `discuss → research → plan → phase-execution (execute → review → revise loop)`

**Customization options:**
- **Swap workflows:** Point any step's `workflow` to your own `.md` file
- **Add hooks:** Configure pre/post hooks per step or globally
- **Full replace:** Drop `.specd/pipeline.json` to replace the entire pipeline

---

## Hooks

Hooks are markdown workflow files that run before and after pipeline steps. They can read and modify task files just like any other workflow.

**Execution order:** Global pre-step → Step pre-hook → **Step runs** → Step post-hook → Global post-step

**Configuration in pipeline.json:**

```json
{
  "name": "execute",
  "workflow": "execute.md",
  "hooks": {
    "pre": { "workflow": ".specd/hooks/pre-execute.md", "mode": "inline" },
    "post": { "workflow": ".specd/hooks/post-execute.md", "mode": "subagent", "optional": true }
  }
}
```

**Hook modes:**
- **`inline`** — Runs in the brain's context (can see all state)
- **`subagent`** — Spawns a separate agent (fresh context, isolated)

**Convention fallback:** If no hooks are configured, the brain auto-discovers `.specd/hooks/pre-{step}.md` and `.specd/hooks/post-{step}.md`.

**Error handling:** Required hooks (`optional: false`, default) stop the pipeline on failure. Optional hooks log a warning and continue.

---

## Codebase Documentation

```
/specd.codebase.map
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
/specd.update
```
Or manually: `npx specdacular@latest`

---

GitHub: https://github.com/victorbalan/specdacular
