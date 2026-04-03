# Specd Runner — Electron Desktop App

**Date:** 2026-04-03
**Status:** Approved

## Overview

Extract the Specdacular runner into a standalone Electron desktop app. All configuration and state lives in the app's data directory — zero footprint in user repositories. A project is a folder (single repo, multi-repo, or plain directory). The existing CLI is unified under a single `specd` command.

## Decisions

- **Approach:** Electron with embedded Node backend (orchestrator runs in main process)
- **Frontend:** React
- **Data format:** JSON (no YAML dependency)
- **Distribution:** npm package ships app code; Electron binary downloaded on first launch
- **Migration:** None. Clean break from current `.specd/runner/` setup.
- **Project model:** Folder-based, not repo-based. A project is a path on disk.

## 1. Data Layout

All state in `~/Library/Application Support/Specd/` (macOS) or `~/.config/specd/` (Linux).

```
~/Library/Application Support/Specd/
├── config.json                    # App-level settings (port, notifications, default model)
├── electron/                      # Downloaded Electron binary
├── templates/
│   ├── agents/                    # Global agent templates
│   │   ├── claude-planner.json
│   │   ├── claude-implementer.json
│   │   └── claude-reviewer.json
│   └── pipelines/                 # Global pipeline templates
│       └── default.json
├── projects/
│   ├── {project-id}/
│   │   ├── project.json           # Name, folder path, registered_at, settings
│   │   ├── agents/                # Per-project agent overrides (optional)
│   │   ├── pipelines/             # Per-project pipeline overrides (optional)
│   │   ├── tasks/
│   │   │   ├── {task-id}.json     # Task definition + status + history
│   │   │   └── ...
│   │   ├── status.json            # Runtime state (running tasks, stages)
│   │   └── logs/
│   │       ├── {task-id}.log
│   │       └── ...
│   └── ...
└── db.json                        # Project registry (id, name, path, active)
```

## 2. CLI Architecture

`specd` replaces `specdacular` as the single entry point. Installed via `npm install -g specdacular`.

```
specd llm-init              # Install commands/agents/workflows to ~/.claude/
specd llm-init --local      # Install to ./.claude/ (project-local)

specd runner                 # Launch the Electron app (or focus if already running)
specd runner register <path> # Register a folder as a project
specd runner unregister <id> # Remove a project
specd runner projects        # List registered projects
specd runner status          # Show all tasks across all projects (terminal output)
```

`specd runner` with no subcommand launches the app. If the Electron binary isn't present, it downloads it on first run to `~/Library/Application Support/Specd/electron/`.

The `specd` binary is a single Node.js script (`bin/specd.js`) that dispatches to install logic or runner logic based on the first argument.

## 3. Electron App Architecture

### Main Process

```
Main Process (Node.js)
├── Orchestrator           # Ported from current runner, manages task execution
│   ├── AgentRunner        # Spawns Claude/other agents as subprocesses
│   ├── StageSequencer     # Runs pipeline stages in sequence
│   ├── StateManager       # Reads/writes project state from app data dir
│   └── WorktreeManager    # Git worktrees for parallel execution
├── ProjectManager         # CRUD for projects, loads/saves project.json + db.json
├── TemplateManager        # Global agent/pipeline templates + per-project overrides
├── API Server (Express)   # HTTP on localhost:3700 for Claude Code skill communication
└── IPC Bridge             # Exposes backend to renderer via Electron IPC
```

### Renderer Process (React)

```
Renderer Process
├── Sidebar                # Project list, navigation
├── Dashboard              # Overview of all projects/tasks
├── Project View           # Tasks for one project, status, controls
├── Task Detail            # Logs, stage progress, retry/cancel
├── Settings               # Global config, agent templates, pipeline templates
└── Project Settings       # Per-project overrides for agents/pipelines
```

### Key changes from current runner

- No file-watching for tasks — tasks come from the API or UI
- ConfigLoader reads from app data dir, not `.specd/runner/` in repos
- PathResolver points everything to `~/Library/Application Support/Specd/`
- Express server runs on localhost:3700 for Claude Code skill communication

## 4. Project Registration & Multi-Repo Folders

A project is a folder path. It can be a single git repo, a folder with multiple repos, or a plain directory.

```json
// db.json
{
  "projects": [
    { "id": "abc123", "name": "smart-clipper", "path": "/Users/victor/work/smart-clipper", "active": true },
    { "id": "def456", "name": "work", "path": "/Users/victor/work", "active": true }
  ]
}
```

Tasks specify a `working_dir` relative to the project path:

```json
{
  "id": "task-001",
  "name": "Add dark mode",
  "project_id": "abc123",
  "working_dir": ".",
  "pipeline": "default",
  "status": "ready",
  "depends_on": []
}
```

For multi-repo folders, `working_dir` can target a subdirectory (e.g. `"repo-a"`). Worktree creation only happens if the resolved path is a git repo. Non-git directories run agents without worktree isolation.

## 5. Claude Code Skill Integration

### `/specd.new-runner-task`

1. User runs the skill in Claude Code
2. Skill asks for task name, description, priority, target working_dir
3. Skill auto-detects the project by matching `cwd` against registered project paths
4. Skill POSTs to `localhost:3700/projects/{id}/tasks`
5. App receives task, stores it, orchestrator picks it up

### Additional skills

- `/specd.runner-status` — GET status from API, display in terminal
- `/specd.runner-projects` — list registered projects

### API endpoints

```
GET    /projects                     # List projects
GET    /projects/{id}/status         # Project status
GET    /projects/{id}/tasks          # List tasks
GET    /projects/{id}/tasks/{id}     # Task detail
POST   /projects/{id}/tasks          # Create task
POST   /projects/{id}/tasks/{id}/retry  # Retry failed task
```

Skill files live in `commands/` (installed to `~/.claude/` via `specd llm-init`).

## 6. Electron Bootstrap & Packaging

`npm install -g specdacular` installs the app code (small). Electron binary downloads on first `specd runner` launch (~90MB one-time).

### npm package structure

```
specdacular/
├── bin/
│   └── specd.js              # Unified CLI entry point
├── runner/
│   ├── main/                 # Electron main process (ported orchestrator)
│   ├── renderer/             # React app (built to dist/)
│   ├── preload.js            # Electron preload script
│   └── package.json
├── commands/                 # Claude Code skills
├── agents/                   # Agent definitions
├── specdacular/              # Workflows
├── hooks/                    # Hooks
└── package.json              # bin: { "specd": "bin/specd.js" }
```

For development: `npx electron runner/`.

## MVP Scope (v1)

1. Electron app shell with React
2. Centralized data store in app data directory
3. Project registration (folder-based)
4. Global agent/pipeline templates + per-project overrides
5. Task management UI (create, view, status)
6. Orchestrator running in Electron main process (reuse existing logic)
7. Local HTTP API on localhost:3700 for Claude Code skills
8. `specd` CLI with `llm-init` and `runner` subcommands
9. `/specd.new-runner-task` skill
