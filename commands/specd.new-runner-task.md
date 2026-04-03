---
name: specd.new-runner-task
description: Create a new task in the Specd Runner app
---

<objective>
Create a task in the Specd Runner by talking to its local API. Auto-detects the project from the current working directory.
</objective>

<instructions>

## Step 1: Detect project

Use Bash to find the matching project:

```bash
curl -s "http://localhost:3700/api/projects/by-path?path=$(pwd)" 2>/dev/null
```

If the runner is not running or no project matches, tell the user:
- "The Specd Runner doesn't seem to be running. Start it with `specd runner`."
- Or: "No project registered for this directory. Register with `specd runner register <path>`."

## Step 2: Gather task details

Ask the user for:
1. **Task name** — short description (e.g., "Add dark mode support")
2. **Description/spec** — what should be built (can be multi-line)

That's it. Don't ask for working directory, pipeline, or priority — use defaults.

## Step 3: Create the task

```bash
curl -s -X POST "http://localhost:3700/api/projects/{PROJECT_ID}/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TASK_NAME",
    "description": "DESCRIPTION",
    "spec": "SPEC_CONTENT"
  }'
```

## Step 4: Confirm

Show the user the created task ID and confirm it's queued for execution.

</instructions>
