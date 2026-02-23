# Specdacular

**AI-optimized codebase documentation and feature planning for Claude.**

## Commands

### Core Flow

| Command | Description |
|---------|-------------|
| `/specd.new [name]` | Initialize a task, start first discussion |
| `/specd.continue [name] [--interactive\|--auto]` | Continue task lifecycle — picks up where you left off |

| `/specd.toolbox [<name>]` | Advanced task operations |

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
/specd.new → /specd.continue → continue → continue → done
```

**You only need three commands:**

1. **`/specd.new [name]`** — Start here. Creates task folder, asks initial questions.
2. **`/specd.continue [name]`** — Picks up where you left off. Drives the entire lifecycle:
   - Discussion → Research → Planning → Phase Execution → Review
   - After each step, offers the next step or "stop for now"
   - Works across context windows — reads state fresh each time
   - Modes: default (auto-runs, pauses at phase steps), `--interactive` (prompt at each step), `--auto` (run everything)
3. **`/specd.toolbox [name]`** — Direct access to task operations: Discuss, Research, Plan, Execute, Review
4. **`/specd.codebase.review`** — Review and edit codebase context files section by section

### Quick Start

```
/specd.new user-dashboard
/specd.continue user-dashboard
```

After initialization, just keep running `continue`. It figures out what's next.

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
