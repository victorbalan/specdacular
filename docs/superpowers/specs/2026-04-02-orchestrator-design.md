# Specdacular Orchestrator — Design Spec

## Overview

A long-running, config-driven autonomous agent orchestrator that wraps any CLI agent (Claude Code, Codex, etc.) and drives them through configurable pipelines to plan, implement, test, and review software tasks — unattended.

**Core value proposition:** Multi-agent orchestration where different CLI tools are assigned to different roles. Claude plans, Codex reviews, Playwright tests — all configured declaratively.

## Architecture

Four layers:

```
┌──────────────────────┐
│  CLI (minimal)       │  specdacular start [--port 3700]
│                      │  specdacular status
├──────────────────────┤
│  Orchestrator Daemon │  Config parser, file watcher, stage sequencer,
│                      │  retry logic, failure policies
├──────────────────────┤
│  Agent Runners       │  Spawn CLI subprocesses, stream output,
│                      │  parse structured JSON result blocks
├──────────────────────┤
│  State Manager       │  Reads/writes status.json, emits events
├──────────────────────┤
│  Web Dashboard       │  React app served on localhost,
│  + API               │  REST + WebSocket for live updates
└──────────────────────┘
```

## Project Structure

```
.specd/
  runner/
    config.yaml              # General settings (server, notifications)
    agents.yaml              # Agent definitions with system prompts
    pipelines.yaml           # Named pipelines (default + custom)
    status.json              # Runtime state (orchestrator writes, UI reads)
    tasks/
      001-user-auth.yaml     # Individual task files
      002-billing-api.yaml
      003-dashboard.yaml
    logs/                    # Agent output logs per task/stage
```

## Config Schema

### config.yaml — General settings

```yaml
server:
  port: 3700                    # default, overridable via --port

notifications:
  telegram:
    enabled: true
    bot_token: "${TELEGRAM_BOT_TOKEN}"   # env var reference
    chat_id: "${TELEGRAM_CHAT_ID}"
    notify_on:
      - task_complete
      - task_failed
      - needs_input              # agent requests human decision
      - run_summary              # daily/periodic summary

defaults:
  pipeline: default              # name of the pipeline to use
  failure_policy: skip           # default for non-critical stages
  timeout: 3600                  # 1 hour default per stage (seconds)
  stuck_timeout: 1800            # 30 min no output = kill (seconds)
  max_parallel: 1                # how many tasks run simultaneously
  use_worktrees: true            # isolate parallel tasks in git worktrees
```

### Parallel Execution

When `max_parallel > 1`, multiple tasks run simultaneously. Each parallel task gets its own **git worktree** — an isolated working copy of the repo so agents don't conflict with each other.

- `max_parallel: 1` — sequential (default, no worktrees needed)
- `max_parallel: 3` — up to 3 tasks run at once, each in its own worktree
- Worktrees are created at `.specd/runner/worktrees/<task-id>/` when a task starts
- Worktrees are cleaned up automatically when a task completes or fails
- `depends_on` is still respected — a dependent task won't start until its dependency finishes, even if parallel slots are available

### agents.yaml — Agent definitions with system prompt templates

System prompts are **templates** with runtime variables. The orchestrator replaces these before spawning the agent:

| Variable | Description |
|----------|-------------|
| `{{task.id}}` | Task filename stem (e.g., `001-user-auth`) |
| `{{task.name}}` | Task display name |
| `{{task.spec}}` | Resolved spec content |
| `{{pipeline.name}}` | Pipeline being used (e.g., `default`) |
| `{{stage.name}}` | Current stage (e.g., `implement`) |
| `{{stage.index}}` | Stage number (1-based) |
| `{{stage.total}}` | Total stages in pipeline |
| `{{status_file}}` | Path to status.json |
| `{{log_dir}}` | Path to logs directory |

```yaml
agents:
  claude-superpower-planner:
    cmd: "claude --print --dangerously-skip-permissions"
    prompt_flag: "-p"
    output_format: json_block
    system_prompt: |
      You are a feature planner working on: {{task.name}} ({{task.id}})
      Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})
      
      Use the /superpowers:writing-plans skill to create a detailed
      implementation plan. Before planning:
      1. Research the codebase to understand existing patterns
      2. Run /superpowers:brainstorming to explore the design space
      3. Identify best practices for the tech stack in use
      4. Create a phased plan with clear acceptance criteria
      
      Always research before proposing. Never assume — verify.
      
      ## Real-Time Progress
      As you work, emit progress updates frequently (after each logical step):
      
      ```specd-status
      {
        "task_id": "{{task.id}}",
        "stage": "{{stage.name}}",
        "progress": "researching existing auth patterns",
        "percent": 25,
        "files_touched": []
      }
      ```

  claude-implementer:
    cmd: "claude --print --dangerously-skip-permissions"
    prompt_flag: "-p"
    output_format: json_block
    system_prompt: |
      You are implementing: {{task.name}} ({{task.id}})
      Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})
      
      Follow the plan exactly. Write clean, tested code.
      Commit after each logical unit of work.
      If the plan is ambiguous, make a reasonable choice and document it.
      
      ## Real-Time Progress
      Emit progress updates after each logical step:
      
      ```specd-status
      {
        "task_id": "{{task.id}}",
        "stage": "{{stage.name}}",
        "progress": "writing auth middleware",
        "percent": 40,
        "files_touched": ["src/auth.ts"]
      }
      ```

  codex-reviewer:
    cmd: "codex --quiet"
    prompt_flag: "--prompt"
    output_format: json_block
    system_prompt: |
      You are reviewing: {{task.name}} ({{task.id}})
      Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})
      
      Review the implementation against the plan.
      Focus on: correctness, edge cases, security, performance.
      Be specific — reference file paths and line numbers.
      Flag issues by severity: critical, warning, suggestion.
      
      ## Real-Time Progress
      Emit progress updates as you review:
      
      ```specd-status
      {
        "task_id": "{{task.id}}",
        "stage": "{{stage.name}}",
        "progress": "reviewing auth middleware for security issues",
        "percent": 60,
        "files_touched": []
      }
      ```

  playwright:
    cmd: "npx playwright test"
    output_format: exit_code
```

### pipelines.yaml — Named pipelines

```yaml
pipelines:
  default:
    stages:
      - stage: plan
        agent: claude-superpower-planner
        critical: true
      - stage: review-plan
        agent: codex-reviewer
      - stage: implement
        agent: claude-implementer
        critical: true
      - stage: test
        cmd: "npm test"
        on_fail: retry
        max_retries: 3
      - stage: review
        agent: codex-reviewer
        on_fail: retry
        max_retries: 2

  bug-fix:
    stages:
      - stage: investigate
        agent: claude-superpower-planner
        critical: true
      - stage: fix
        agent: claude-implementer
        critical: true
      - stage: test
        cmd: "npm test"
        on_fail: retry
        max_retries: 5
      - stage: review
        agent: codex-reviewer

  quick-implement:
    stages:
      - stage: implement
        agent: claude-implementer
        critical: true
      - stage: test
        cmd: "npm test"
        on_fail: retry
        max_retries: 3
```

### Task files (e.g., tasks/001-user-auth.yaml)

```yaml
name: "Add user authentication"
status: ready                   # draft | ready | in_progress | done | failed
priority: 1
spec: "./specs/auth.md"         # path to spec file, or inline description
depends_on: []                  # task IDs (filename stems, e.g. "001-user-auth")
pipeline: default               # references a named pipeline from pipelines.yaml
```

Tasks can use custom pipelines or override stages:

```yaml
name: "Fix login redirect bug"
status: ready
priority: 0                     # high priority
description: "Users get 404 after OAuth redirect on mobile Safari"
pipeline: bug-fix               # use the bug-fix pipeline

name: "Add billing API"
status: ready
priority: 2
description: "Stripe integration with webhook handling"
depends_on: ["001-user-auth"]
pipeline: default
stage_overrides:                 # override specific stages
  test:
    cmd: "npm run test:billing"
    timeout: 7200               # 2 hours for this slow test suite
```

## Orchestrator Daemon

### Core Loop

1. Start daemon, load configs, scan `tasks/` directory
2. Watch `tasks/` for file changes (new files, status changes)
3. Pick up tasks where `status: ready`, respecting `depends_on` and `priority`
4. For each task, resolve its pipeline (from `pipelines.yaml`) and walk through stages
5. After each stage: update `status.json`, emit WebSocket event, send Telegram notification if configured
6. On completion: set task status to `done`
7. On failure: apply failure policy (retry, skip, or block)
8. Loop forever — pick up new ready tasks as they appear

### Spec Input

Supports two modes:
- **Existing spec:** Task points to a file via `spec:` field. Orchestrator reads it and passes to agents.
- **Generate spec:** Task has a `description:` field instead. The `plan` stage agent generates the spec from the description.

### Stuck Detection

The orchestrator monitors agent subprocess output in real-time:

- **Timeout:** Default 1 hour per stage. If exceeded, kill the process and treat as failure.
- **Stuck detection:** If no stdout output AND no `specd-status` updates for 30 minutes (configurable via `stuck_timeout`), the agent is considered stuck. Kill the process, log a stuck event, treat as failure.
- **Smart detection:** `specd-status` blocks reset the stuck timer, so an agent that's actively reporting progress won't be killed even if it's taking a long time. The stuck timer only fires when the agent goes completely silent — no output, no status updates, nothing.
- Both timeouts are configurable per-stage and in `config.yaml` defaults.
- On stuck/timeout: log the last 50 lines of output for debugging, send Telegram notification, then apply the stage's failure policy.

## Agent Communication

### Two-Block Protocol

Agents communicate with the orchestrator via two types of structured blocks in their stdout:

**1. `specd-status` — Real-time progress (many per stage)**

Emitted frequently as the agent works. Each one updates `status.json` immediately, pushes via WebSocket to the dashboard, and resets the stuck detection timer.

```json
{
  "task_id": "001-user-auth",
  "stage": "implement",
  "progress": "writing auth middleware",
  "percent": 40,
  "files_touched": ["src/auth.ts"]
}
```

**2. `specd-result` — Stage completion (one per stage)**

Emitted once when the agent finishes. Signals the orchestrator to advance, retry, or pause.

```json
{
  "status": "success" | "failure" | "needs_input",
  "summary": "what you did",
  "files_changed": ["src/auth.ts", "src/middleware.ts"],
  "issues": [],
  "next_suggestions": []
}
```

### Prompt Assembly

The orchestrator builds the full prompt sent to the agent:

1. **System prompt** — from `agents.yaml`, with `{{variables}}` replaced with runtime values
2. **Task spec/context** — from the task's `spec:` file or `description:` field
3. **Result contract** — instructions to emit `specd-result` when done

### Agent Runner Flow

1. Resolve system prompt template: replace `{{task.id}}`, `{{stage.name}}`, etc.
2. Build full prompt: system prompt + task spec + result contract
3. Spawn agent CLI as subprocess (using command from `agents.yaml`)
4. Stream stdout to log file (for web UI to display)
5. Scan stream in real-time for `specd-status` blocks → update `status.json` + WebSocket + reset stuck timer
6. Scan stream for `specd-result` block → stage completion signal
7. Parse result, return to orchestrator:
   - `success` → advance to next stage
   - `failure` → check retry policy, retry or mark failed
   - `needs_input` → pause task, notify via Telegram, wait for input

## State Management

### status.json

Updated after every stage transition. Source of truth for the web dashboard.

```json
{
  "started_at": "2026-04-02T22:00:00Z",
  "tasks": {
    "001-user-auth": {
      "name": "Add user authentication",
      "status": "in_progress",
      "current_stage": "implement",
      "pipeline": "default",
      "stages": [
        { "stage": "plan", "agent": "claude-superpower-planner", "status": "success", "duration": 133, "summary": "Created phased plan with 3 phases" },
        { "stage": "review-plan", "agent": "codex-reviewer", "status": "success", "duration": 108, "summary": "Plan approved, 2 suggestions" },
        {
          "stage": "implement",
          "agent": "claude-implementer",
          "status": "running",
          "started_at": "2026-04-02T22:05:00Z",
          "last_output_at": "2026-04-02T22:12:34Z",
          "live_progress": {
            "progress": "writing auth middleware",
            "percent": 40,
            "files_touched": ["src/auth.ts", "src/middleware.ts"]
          }
        }
      ]
    },
    "002-billing-api": {
      "name": "Add billing API",
      "status": "queued",
      "current_stage": null,
      "pipeline": "default",
      "stages": []
    }
  }
}
```

The `live_progress` field is updated in real-time from `specd-status` blocks. The dashboard reads this to show what the agent is currently doing, not just "running...".

## Notifications — Telegram

Lightweight notification channel for unattended runs:

- **Bot setup:** User creates a Telegram bot via @BotFather, provides token and chat ID in config
- **Events:** task complete, task failed, stuck/timeout, needs_input, periodic summary
- **needs_input flow:** Agent returns `needs_input` → orchestrator pauses task → sends Telegram message with context → user replies → orchestrator resumes (v2: reply via Telegram; MVP: resume via web dashboard)
- Messages include: task name, stage, summary, link to dashboard

## Web Dashboard & API

### Local Server

Starts with the orchestrator daemon. Serves the React dashboard and API on the same port.

### REST API

- `GET /api/status` — full run state
- `GET /api/tasks` — list all tasks with current stage
- `GET /api/tasks/:id/logs` — stream logs for a task's current stage
- `POST /api/tasks/:id/retry` — retry a failed stage
- `POST /api/tasks/:id/skip` — skip current stage
- `POST /api/tasks/:id/pause` — pause a running task

### WebSocket

Pushes state changes, log lines, and stage transitions in real-time. Dashboard subscribes on connect.

### Dashboard (React)

- Task cards with status, current stage, progress indicator
- Click to expand: pipeline stages, logs, timing per stage
- Action buttons: retry, skip, pause, resume
- Color-coded status: green = done, yellow = running, red = failed, gray = queued

### Multi-Instance

- Fully local, zero deployment — everything on localhost
- `--port` flag: `specdacular start --port 3800`
- Multiple instances on different projects, different ports, no conflicts
- Each instance reads its own project's `.specd/runner/` directory

## Git Integration

Handled entirely by the agents, not the orchestrator. The orchestrator includes git instructions in the agent system prompts and stage templates:

- Branch naming convention
- PR target branch
- Commit message format

The git strategy (`stacked-pr`, `independent-pr`, `single-pr`) is prompt configuration passed to the agent, not orchestrator logic.

## Tech Stack

- **Runtime:** Node.js (>= 18)
- **CLI:** Commander or yargs
- **Web server:** Express or Fastify
- **WebSocket:** ws
- **Frontend:** React + Tailwind CSS (static build bundled into package)
- **File watching:** chokidar (or fs.watch)
- **Process management:** Node child_process.spawn
- **Config parsing:** js-yaml
- **Telegram:** node-telegram-bot-api (or raw HTTP to Bot API)

## MVP Scope

### In (v1):

1. Config parser (`config.yaml` + `agents.yaml` + `pipelines.yaml` + task files)
2. Daemon with file watcher (picks up new/ready tasks)
3. Agent runner (spawn subprocess, stream output, parse JSON result block)
4. Agent system prompts (from `agents.yaml`)
5. Named pipelines with default + custom pipelines
6. Stage sequencer with retry logic and failure policies (`critical`, `max_retries`, `on_fail`)
7. Timeout (1h default) + stuck detection (30 min no output)
8. `status.json` state management
9. REST API + WebSocket for live state
10. Web dashboard (task cards, stage progress, logs, retry/skip actions)
11. CLI: `specdacular start [--port]`, `specdacular status`
12. `depends_on` between tasks
13. Telegram notifications (task complete, failed, stuck)
14. Built-in agent: `claude-superpower-planner`

### Deferred (v2+):

- Stacked/cascading PR strategy (agent prompt templates)
- Reply via Telegram to provide input (MVP: web dashboard only)
- Add task from web UI
- Mobile-responsive dashboard
- `needs_input` resume via Telegram
- Plugin/hook system for custom stage logic
- Multi-repo support
- Task archiving to archive/ folder
