---
last_reviewed: 2026-03-16
generated_by: specd
---

# Architecture

## Command → Workflow → Agent Pattern

Specdacular has three layers:

1. **Commands** (`commands/specd.*.md`) — User-facing stubs with frontmatter + `<execution_context>` pointing to a workflow
2. **Workflows** (`specdacular/workflows/*.md`) — Full implementation logic with `<step>` blocks
3. **Agents** (`agents/*.md`) — Specialized roles spawned by workflows for parallel work

```
User runs /specd.new
    → commands/specd.new.md (stub)
        → @specdacular/workflows/new.md (logic)
            → spawns agents if needed
```

## The Brain

The brain (`brain.md`) is a config-driven orchestrator invoked by `/specd.continue`. It loops: read state → route → dispatch → update state → repeat.

```
Read State (config.json, STATE.md, CONTEXT.md)
    → Route (pick next step from routing table)
        → Pre-hooks → Step Workflow → Post-hooks
            → Update State → Loop
```

### Routing Table

The brain evaluates top-to-bottom, takes first match:

| State | Next Step | Pipeline |
|-------|-----------|----------|
| `stage=discussion`, gray areas > 0 | discuss | main |
| `stage=discussion`, gray areas = 0 | research | main |
| `stage=research`, no RESEARCH.md | research | main |
| `stage=research`, RESEARCH.md exists | plan | main |
| `stage=planning`, no ROADMAP.md | plan | main |
| `stage=planning`, ROADMAP.md exists | plan | phase-execution |
| `stage=execution`, pending, no PLAN.md | plan | phase-execution |
| `stage=execution`, pending, PLAN.md exists | execute | phase-execution |
| `stage=execution`, executing | execute | phase-execution |
| `stage=execution`, executed | review | phase-execution |
| `stage=execution`, completed | next phase or COMPLETE | phase-execution |

### State Fields (config.json)

```json
{
  "stage": "discussion | research | planning | execution | complete",
  "phases": {
    "current": 1,
    "current_status": "pending | executing | executed | completed",
    "total": 3,
    "completed": 0,
    "phase_start_commit": null
  }
}
```

Gray area count is read from `CONTEXT.md` (unchecked items in "Gray Areas Remaining").

## Pipeline Configuration

Defined in `pipeline.json` — nothing hardcoded. Two pipelines:

- **main**: discuss → research → plan → phase-execution
- **phase-execution**: plan → execute → review → revise (loops per phase)

Custom pipeline: place `.specd/pipeline.json` in project (full replace, not merge).

Step fields: `name`, `workflow`, `pipeline` (sub-pipeline ref), `pause` (default mode pausing), `hooks` (pre/post).

## Hooks

Hooks run around every step in this order:

1. Global pre-step hook (`pipeline.json → hooks.pre-step`)
2. Step pre-hook (config or `.specd/hooks/pre-{step}.md`)
3. **Step workflow**
4. Step post-hook (config or `.specd/hooks/post-{step}.md`)
5. Global post-step hook (`pipeline.json → hooks.post-step`)

Hook modes: `inline` (runs in brain context) or `subagent` (isolated). Convention fallback: brain auto-checks `.specd/hooks/pre-{step}.md` and `post-{step}.md`.

## Execution Modes

| Mode | Behavior |
|------|----------|
| Default | Auto-runs, pauses where `pause: true` |
| `--interactive` | Prompts at each stage transition |
| `--auto` | Runs everything, stops only on errors/completion |

## Phase Sub-Lifecycle

Each phase: `pending → executing → executed → review → completed` (or `→ revise → pending` loop).

Decimal fix phases (e.g., `phase-01.1/`) are created by revise and executed before advancing to the next integer phase.

## Parallel Agents

Mapper agents (`/specd.codebase.map`) spawn 4 agents with `run_in_background: true`:
- Map → MAP.md
- Patterns → PATTERNS.md
- Structure → STRUCTURE.md
- Concerns → CONCERNS.md

Research (`research.md`) spawns 3 agents: codebase integration, external patterns, pitfalls.

Each agent gets fresh 200k context. Agents write directly to files — orchestrator receives only confirmations.
