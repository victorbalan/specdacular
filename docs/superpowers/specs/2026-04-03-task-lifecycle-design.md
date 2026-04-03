# Task Lifecycle + Brainstorm Pipeline — Design Spec

## Overview

Replace the current 4-column kanban (Queued/Running/Done/Failed) with a full task lifecycle that starts from raw ideas, goes through AI-powered brainstorming and spec writing, then through human review before execution.

## Task Lifecycle

```
idea → planning → review → ready → in_progress → done
                    ↑                               |
                    └── re-plan ────────────────────┘
                                                failed
```

### Statuses

| Status | Column | Description |
|--------|--------|-------------|
| `idea` | Ideas | Raw idea, one-liner. Not planned, not queued. |
| `planning` | Planning | Brainstorm pipeline running — research + spec writing |
| `review` | Review | Spec ready for human review |
| `ready` | Queued | Approved, waiting for orchestrator to pick up |
| `in_progress` | Running | Default pipeline executing |
| `done` | Done | Completed successfully |
| `failed` | Failed | Failed at any stage |

## Quick Add

Text input field at the top of the Ideas column. User types an idea and hits Enter. Creates a task with:
- `name`: the typed text
- `status`: `idea`
- `pipeline`: none (manual advancement)

## Pipelines

### `brainstorm` pipeline

Runs when a user clicks "Plan" on an idea card. Two-stage process:

```json
{
  "name": "brainstorm",
  "stages": [
    {
      "stage": "research",
      "agent": "claude-researcher",
      "critical": true
    },
    {
      "stage": "brainstorm",
      "agent": "claude-brainstormer",
      "critical": true
    }
  ]
}
```

**Stage 1: research** — The research agent explores the codebase to understand context relevant to the idea. Outputs a research summary.

**Stage 2: brainstorm** — The brainstorm agent runs the Superpowers brainstorming skill non-interactively. It uses the research output to auto-answer clarifying questions. Outputs a spec document.

After completion, the task moves to `review` status (human gate — does NOT auto-advance).

### `default` pipeline

Runs when a task reaches `ready` status (after human approval in review).

```json
{
  "name": "default",
  "stages": [
    { "stage": "plan", "agent": "claude-planner", "critical": true },
    { "stage": "implement", "agent": "claude-implementer", "critical": true },
    { "stage": "review", "agent": "claude-reviewer", "on_fail": "retry", "max_retries": 2 }
  ]
}
```

### Agent Templates

**claude-researcher** — Explores the codebase based on the idea. Reads files, checks architecture, understands relevant patterns. Outputs structured research notes.

**claude-brainstormer** — Takes the idea + research context. Runs a non-interactive brainstorming session: considers approaches, makes design decisions, writes a spec. The spec is stored as the task's `spec` field.

**claude-planner**, **claude-implementer**, **claude-reviewer** — Unchanged from current defaults.

## Card Actions

| Column | Card Actions |
|--------|-------------|
| Ideas | **Plan** — triggers brainstorm pipeline, moves to `planning` |
| Planning | Shows live progress from brainstorm pipeline |
| Review | **Approve** — moves to `ready`. **Re-plan** — moves back to `planning` with feedback |
| Queued | Auto-picked up by orchestrator |
| Running | Shows stage progress + logs |
| Done | None |
| Failed | **Retry** — moves back to `ready` |

## Pipeline Viewer

New page accessible from sidebar navigation. Read-only view showing:

1. **Pipelines** — lists all pipeline JSON files from the templates directory. Shows file contents with formatting.
2. **Agents** — lists all agent JSON files from the templates directory. Shows file contents with formatting.

No editing — just a way to see what's configured.

## IPC Changes

New handlers:
- `create-idea(projectId, name)` — creates a task with status `idea`
- `advance-task(projectId, taskId, action)` — handles Plan, Approve, Re-plan actions
- `get-pipeline-files()` — returns pipeline template file contents
- `get-agent-files()` — returns agent template file contents

New preload channels: `create-idea`, `advance-task`, `get-pipeline-files`, `get-agent-files`

## UI Changes

### KanbanBoard
- 6 columns instead of 4: Ideas, Planning, Review, Queued, Running, Done/Failed
- Quick-add text input in Ideas column header
- Action buttons on cards based on column

### TaskDetailOverlay
- Shows spec content when in Review state
- Approve / Re-plan buttons in Review state
- Shows stage progress in Planning/Running states

### Sidebar
- Add "Pipelines" navigation item between Dashboard/Projects and Settings

### App
- Route to Pipelines page

## Orchestrator Changes

The orchestrator currently only picks up `ready` tasks. This stays the same. The brainstorm pipeline is triggered explicitly by the `advance-task` IPC handler, not by the orchestrator loop.

Flow:
1. User clicks "Plan" on idea card
2. IPC handler sets status to `planning` and runs the brainstorm pipeline
3. When brainstorm completes, status moves to `review`
4. User reviews spec, clicks "Approve"
5. IPC handler sets status to `ready`
6. Orchestrator loop picks it up and runs the default pipeline
