# Runner Framework Design

## Problem

The Specd Runner is currently a monolithic Electron app with hand-coded orchestration tightly coupled to the Specdacular code-generation workflow. Users cannot define custom pipelines (research, marketing, data analysis) without modifying the engine itself. The orchestration logic (task queue, pipeline sequencing, state management, process spawning) is duplicated across methods and mixed with Specdacular-specific concerns like git worktrees and PR creation.

## Goal

Transform the Runner into a **config-driven workflow engine** that:

- Runs arbitrary pipelines defined in JSON
- Supports multiple agent types (Claude Code, Codex, shell scripts, HTTP calls)
- Provides reliable progress reporting without depending on LLM cooperation
- Ships with a UI that renders any pipeline automatically
- Keeps Specdacular-specific behaviors (git, PRs) as optional built-in actions

## Architecture

Three layers with clear boundaries:

```
+--------------------------------------------------+
|                    UI (separate process)          |
|  Connects via REST API + WebSocket               |
|  Renders any pipeline config as visual stages    |
|  Kanban board, journal viewer, log browser       |
+--------------------------------------------------+
                        |
                   API / WebSocket
                        |
+--------------------------------------------------+
|                 ENGINE (core)                     |
|  Task queue (priority, dependencies, concurrency)|
|  Pipeline runner (sequential stages, retry,      |
|    resume, snowball context)                      |
|  Agent process manager (spawn, parse, timeout)   |
|  State persistence (JSON files)                  |
|  Progress system (journal watch + inference)     |
|  REST API + WebSocket server                     |
+--------------------------------------------------+
                        |
                  action hooks
                        |
+--------------------------------------------------+
|              BUILT-IN ACTIONS (optional)          |
|  git-commit, git-pr, git-worktree, notify        |
|  Referenced in pipeline config, not hardcoded     |
+--------------------------------------------------+
```

### What the engine owns (not configurable)

- The task processing loop
- How state is persisted (JSON files on disk)
- The API shape (REST + WebSocket)
- The execution context structure (the snowball)
- Stage lifecycle: start -> running -> success/failure

### What users configure

- Pipeline definitions (stages, ordering, failure policies)
- Agent templates (command, output format, prompts, timeouts)
- Actions triggered on events (stage complete, pipeline complete, failure)
- Task properties (name, description, priority, dependencies, pipeline)

## Pipeline Configuration

A pipeline is a named sequence of stages. Each stage references an agent template and defines what prompt to send.

```json
{
  "name": "research",
  "description": "Research a topic and produce a report",
  "stages": [
    {
      "name": "gather",
      "agent": "claude-researcher",
      "prompt": "Research {{task.name}}: {{task.description}}\n\nFocus areas: {{task.focus}}",
      "critical": true,
      "on_fail": "stop",
      "max_retries": 1
    },
    {
      "name": "analyze",
      "agent": "claude-analyst",
      "prompt": "Given the research from the gather phase:\n\n{{stages.gather.output}}\n\nAnalyze findings and identify key insights.",
      "critical": true
    },
    {
      "name": "report",
      "agent": "shell-runner",
      "cmd": "pandoc {{artifacts.analysis_md}} -o report.pdf",
      "critical": false,
      "on_fail": "skip"
    }
  ],
  "on_stage_complete": ["git-commit"],
  "on_complete": ["git-pr", "notify"],
  "on_fail": ["notify"]
}
```

### Template variables

Prompts support `{{variable}}` substitution with access to:

- `{{task.*}}` — task properties (name, description, feedback, any custom fields)
- `{{stages.<name>.output}}` — output from a completed stage
- `{{stages.<name>.decisions}}` — decisions logged by that stage
- `{{stages.<name>.artifacts}}` — files/artifacts produced
- `{{all_previous_output}}` — concatenated output from all completed stages
- `{{artifacts.<key>}}` — named artifacts from any stage
- `{{git.branch}}` — current branch name (if git-worktree action is active)

## Agent Templates

An agent template defines how to spawn and communicate with an executor. The engine doesn't know what "Claude" or "Codex" is — it just knows how to run a command and parse its output.

```json
{
  "name": "claude-researcher",
  "cmd": "claude -p --output-format stream-json --dangerously-skip-permissions --verbose",
  "input_mode": "stdin",
  "output_format": "stream_json",
  "system_prompt": "You are a research agent working on: {{task.name}}\n\nPipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})\n\nWrite your decisions and reasoning to .specd/journal.json as you work.\n\nWhen done, emit your result.",
  "timeout": 3600,
  "stuck_timeout": 300
}
```

### Built-in output formats

The engine ships with parsers for:

- `stream_json` — Claude Code's streaming JSON format (tool calls, assistant messages)
- `jsonl` — One JSON object per line (generic, works for Codex and custom tools)
- `plain` — Raw text, treat exit code 0 as success

Adding a new format = adding a parser that implements: `feed(line)` -> emits `status`, `result`, `output` events.

### Shell executor shorthand

For non-LLM stages, use `cmd` directly without an agent template:

```json
{
  "name": "build",
  "cmd": "npm run build",
  "output_format": "plain"
}
```

## Execution Context (The Snowball)

The execution context is a growing document that accumulates across stages. Each stage receives the full context and adds to it. Stages pick what they need from the context via prompt templates.

```json
{
  "task": {
    "id": "idea-abc123",
    "name": "Research authentication patterns",
    "description": "Survey modern auth approaches for our API",
    "feedback": "Focus on OAuth2 and API keys",
    "priority": 5,
    "created_at": "2026-04-06T10:00:00Z"
  },
  "pipeline": {
    "name": "research",
    "total_stages": 3
  },
  "stages": {
    "gather": {
      "status": "success",
      "output": "Found 5 major patterns: OAuth2, API keys, JWT...",
      "decisions": [
        { "decision": "Excluded SAML — not relevant for API-only", "reason": "Task scope is API auth" }
      ],
      "artifacts": ["research-notes.md"],
      "started_at": "2026-04-06T10:01:00Z",
      "duration": 245
    },
    "analyze": {
      "status": "running",
      "journal": [
        { "progress": "Comparing OAuth2 vs API keys", "percent": 40 }
      ]
    }
  },
  "git": {
    "branch": "specd/idea-abc123",
    "worktree": "/tmp/specd-worktrees/myproject/idea-abc123",
    "commits": ["a1b2c3d", "e4f5g6h"]
  }
}
```

The context is persisted to disk after each stage completes. On resume, the engine loads the context and skips completed stages.

## Progress Reporting

Three layers, from most to least reliable:

### 1. Agent journal (primary — visible in UI)

Agents are instructed to write progress to `.specd/journal.json` in the working directory. The engine watches this file and pipes updates to the UI via WebSocket.

```json
[
  { "type": "progress", "message": "Reading existing auth code", "percent": 10 },
  { "type": "decision", "decision": "Using OAuth2 over API keys", "reason": "Better security model" },
  { "type": "progress", "message": "Writing implementation plan", "percent": 60 },
  { "type": "artifact", "path": "auth-plan.md", "description": "Authentication implementation plan" }
]
```

This depends on LLM cooperation but is more reliable than inline text blocks because writing a file is a concrete tool action the LLM takes seriously.

### 2. Engine inference (fallback — fills gaps)

Between journal updates, the engine checks:
- Has the agent made git commits? -> "Agent committed: {message}"
- Has the agent modified files? -> "Agent modified 3 files"
- Is the agent still producing output? -> "Agent active (last output 30s ago)"
- No output for a while? -> "Agent idle for 2 minutes"

This provides a heartbeat even when the agent forgets to journal.

### 3. Full conversation log (archive — available on demand)

The complete agent output (every tool call, every response) is saved to `logs/{taskId}.log`. Not shown in the UI by default, but available for debugging. Includes the raw streaming output for full replay.

## Built-in Actions

Actions are behaviors triggered by pipeline events. They are referenced by name in pipeline config and execute in order.

### Available actions

| Action | Trigger | What it does |
|--------|---------|-------------|
| `git-worktree` | pipeline start | Creates an isolated branch + worktree for the task |
| `git-commit` | stage complete | Commits any changes with stage name in message |
| `git-pr` | pipeline complete | Creates or updates a draft PR with pipeline summary |
| `notify` | any event | Sends webhook/telegram/slack notification |

### Action configuration

Actions can be configured globally or per-pipeline:

```json
{
  "actions": {
    "git-pr": {
      "draft": true,
      "title_template": "{{task.name}}"
    },
    "notify": {
      "type": "webhook",
      "url": "https://hooks.slack.com/..."
    }
  }
}
```

### Custom actions (escape hatch)

Reference a script path instead of a built-in name:

```json
{
  "on_complete": ["git-pr", "./scripts/deploy.sh"]
}
```

Custom action scripts receive the execution context as JSON on stdin and should exit 0 on success.

## Task Lifecycle

```
idea ──(plan)──> planning ──(auto)──> review ──(approve)──> ready
                    ^                    |                     |
                    |              (re-plan + feedback)        |
                    +--------------------+                     |
                                                              v
                                                         in_progress ──> done
                                                              |
                                                              v
                                                           failed
                                                              |
                                                    (retry / retry-feedback)
                                                              |
                                                              v
                                                            idea
```

- `idea`: Created by user, waiting for planning
- `planning`: Brainstorm pipeline running (optional — can skip to ready)
- `review`: Plan produced, waiting for user approval
- `ready`: Approved, queued for execution
- `in_progress`: Main pipeline running
- `done`: All stages passed
- `failed`: A critical stage failed

The planning phase is optional. Simple tasks can go directly from `idea` to `ready`. The brainstorm pipeline is just another pipeline — if configured, the engine runs it before the main one.

## UI

The UI is a separate process that connects to the engine's REST API and WebSocket.

### What it renders

- **Dashboard**: All projects, task counts per status
- **Project view**: Kanban board with columns matching task statuses
- **Task detail**: Pipeline visualization (stages as connected boxes with status), journal entries, progress, logs
- **Pipeline editor**: View and edit pipeline JSON configs (optional, can use text editor)

### Pipeline visualization

Because pipelines are config-driven, the UI can render any pipeline automatically:

```
[gather] ──> [analyze] ──> [report]
   ✅            🔄           ⏳
 "Found 5      "Comparing    (waiting)
  patterns"     approaches"
```

Each box shows: stage name, status icon, latest journal entry or inferred status.

### Technology

- React (already in use)
- Connects via HTTP for initial state, WebSocket for real-time updates
- Can run in Electron (desktop) or standalone browser (just open localhost)

## Engine API

### REST endpoints

```
GET    /api/projects                        — list projects
GET    /api/projects/:id/tasks              — list tasks
POST   /api/projects/:id/tasks              — create task (from UI: name, description, pipeline)
POST   /api/projects/:id/tasks/:id/advance  — advance task (plan/approve/retry)
GET    /api/projects/:id/tasks/:id/context  — get execution context
GET    /api/projects/:id/tasks/:id/logs     — get conversation logs
GET    /api/pipelines                       — list available pipelines (global)
GET    /api/agents                          — list available agent templates (global)
PUT    /api/pipelines/:name                 — update pipeline definition (from UI)
PUT    /api/agents/:name                    — update agent template (from UI)
```

### WebSocket events

```
task_registered     — new task created
task_status_changed — task moved to new status
stage_started       — pipeline stage began
stage_completed     — pipeline stage finished
live_progress       — journal update or inferred progress
pr_created          — draft PR created/updated
```

## Start-on-Demand Lifecycle

No daemon. The engine starts, processes, and exits:

```bash
specd start                  # Start engine, process queue until empty, exit
specd start --watch          # Start engine, keep running until Ctrl+C
specd ui                     # Start UI (connects to running engine)
specd status                 # Show task statuses (no engine needed, reads JSON)
```

`specd start` boots the engine, processes all ready tasks, and exits when the queue is empty. `--watch` keeps it alive for new tasks (useful during active work sessions).

Task creation happens exclusively through the UI, where users select a project and pipeline from the available options. There is no CLI command for adding tasks.

## File Layout

All configuration lives in a single central location — the engine's DB directory. There are no project-local overrides; everything is managed through the UI.

```
~/.config/specd/
├── config.json                          — global config (server, defaults, notifications)
├── db.json                              — registered projects (path -> projectId mapping)
├── templates/
│   ├── agents/                          — agent templates (JSON)
│   │   ├── claude-planner.json
│   │   ├── claude-implementer.json
│   │   ├── codex-builder.json
│   │   └── shell-runner.json
│   └── pipelines/                       — pipeline definitions (JSON)
│       ├── default.json                 — code: plan -> implement -> review -> test
│       ├── brainstorm.json              — brainstorm: research -> plan
│       ├── research.json                — research: gather -> analyze -> report
│       └── marketing.json               — user-defined custom pipeline
├── actions/                             — custom action scripts (escape hatch)
└── projects/
    └── {projectId}/                     — folder name of the project (e.g. "specdacular")
        ├── project.json                 — project metadata + path + project-specific settings
        ├── tasks/                       — one JSON file per task
        ├── status.json                  — execution state
        └── logs/                        — conversation logs per task
```

### Project ID convention

The project ID is derived from the project's folder name. If `/Users/victor/work/specdacular` is registered, the project ID is `specdacular`. If a project with the same folder name already exists, append a numeric suffix starting at `-2`: `specdacular-2`, `specdacular-3`, etc.

```
/Users/victor/work/specdacular       → projectId: "specdacular"
/Users/victor/other/specdacular      → projectId: "specdacular-2"
/home/user/projects/specdacular      → projectId: "specdacular-3"
```

All templates, pipelines, actions, and project settings are managed from the UI and stored centrally. This keeps one source of truth and avoids config scattered across project directories.

## What's NOT In Scope

- **Daemon mode** — start on demand only, no background service
- **Graph workflows** — stages are sequential within a pipeline (can revisit later if needed)
- **Built-in LLM API calls** — the engine spawns processes, it doesn't call APIs directly
- **Authentication/multi-user** — single user, local machine
- **Plugin marketplace** — share templates as files, no registry
