# Specdacular Runner — Global Daemon Refactor

## Decision

Split the runner into **project config** (in repo) and **global runtime** (in home).

## Project Side (`.specd/runner/` — checked into repo)

```
.specd/runner/
  config.yaml          # Project settings (timeouts, parallel, port)
  agents.yaml          # Agent definitions with system prompts
  pipelines.yaml       # Pipeline definitions
  tasks/               # Task specs (the "what to do")
    001-feature.yaml
    002-bugfix.yaml
```

These are shared with the team. Everyone uses the same agents, pipelines, and tasks.

## Home Side (`~/.specd/runner/` — personal, global)

```
~/.specd/runner/
  daemon.json          # Daemon state (PID, port, uptime)
  state.json           # All projects, all tasks, all statuses
  worktrees.json       # Active worktree registry
  config.yaml          # Personal settings (Telegram, default model, etc.)
  projects/
    smart-clipper/
      logs/            # Agent output logs per task
      status.json      # Per-project runtime state (for dashboard)
    other-project/
      logs/
      status.json
```

## How It Works

1. **`specd-runner daemon start`** — starts the global daemon once (runs in background)
   - Listens on a port (default 3700) for API + dashboard
   - Manages all registered projects

2. **`specd-runner register`** (from a project dir) — registers the project with the daemon
   - Daemon reads `.specd/runner/` config from the project
   - Starts watching `tasks/` for that project
   - Creates worktrees as needed

3. **`specd-runner add-task "description"`** — quick way to create a task YAML

4. **Dashboard** — shows all projects, all tasks across projects
   - Grouped by project
   - Filter by status, project, pipeline

## Key Benefits

- Single daemon, multiple projects
- Runtime state never pollutes the repo
- Team shares config, individuals have personal settings
- `specd-runner status` from anywhere shows everything
- Worktree registry is global — no orphaned worktrees

## Migration

- Move `status.json` and `logs/` out of `.specd/runner/` → `~/.specd/runner/projects/<name>/`
- Add `.specd/runner/status.json` and `.specd/runner/logs/` to `.gitignore`
- Orchestrator reads config from repo, writes state to home
