---
name: specd.runner-status
description: Show Specd Runner task status
---

<objective>
Fetch and display the current status of all tasks across all projects from the Specd Runner.
</objective>

<instructions>

## Step 1: Fetch status

```bash
curl -s "http://localhost:3700/api/status" 2>/dev/null
```

If the runner is not running, tell the user to start it with `specd runner`.

## Step 2: Display

Format the status as a readable table showing for each project:
- Project name
- Task list with status icons (done, running, failed, queued)
- Current stage and progress for running tasks

</instructions>
