# Workflow: Task Status Dashboard

## Input

- `$ARGUMENTS` — may contain `--all` flag

## Steps

### 1. Parse arguments

Check if `$ARGUMENTS` contains `--all`. If so, completed tasks will be shown in a separate section.

### 2. Detect orchestrator mode

Read `.specd/config.json` if it exists.

```bash
cat .specd/config.json 2>/dev/null
```

**If config exists and `type` equals `"orchestrator"`:**
- Set mode = orchestrator
- Read `projects` array from config.json — each entry has `name` and `path`
- Continue to step 3

**Otherwise (no config, or type != "orchestrator"):**
- Set mode = project
- Continue to step 3

### 3. Check for features directory

Use Glob to check if `.specd/tasks/*/config.json` or `.specd/features/*/config.json` matches anything (check both for backwards compatibility).

**If mode = orchestrator and no root features:**
Also check sub-project features — scan each project path for `{project-path}/.specd/tasks/*/config.json`. If features found in sub-projects, continue (there's something to show).

**If no features found anywhere:** output the following and stop:

```
No tasks found. Start one with `/specd.new [name]`.
```

### 4. Gather feature data

#### If mode = project (single-project, unchanged):

For each feature directory in `.specd/tasks/`:

1. **Read `config.json`** — extract: `task_name`, `created`, `stage`, `phases_count`, `plans_count`
2. **Read `STATE.md`** — extract:
   - **Authoritative stage**: Look for `**Stage:** <value>` in the Current Position section. This overrides `config.json` stage. A feature is complete when stage is `complete`.
   - **Plan completion**: From the `Plan Status` table, count rows with Status = `Complete` vs total rows. Format as `completed/total` (e.g. `5/8`). If no Plan Status table or no rows, use `—`.
   - **Next action**: Extract the first meaningful line from the `## Next Steps` section. Keep it short — take just the **Recommended:** line if present, otherwise the first line. Strip markdown formatting like `**Recommended:**` prefix. Truncate to ~50 chars if needed.

#### If mode = orchestrator:

**Step 4a: Gather root features (same as single-project).**

For each feature directory in `.specd/tasks/`, extract task_name, created, stage, plans, next_action using the same logic as single-project mode.

**Step 4b: For each root feature, check for sub-project features.**

Read each root feature's `config.json`. If it has a `projects` array (orchestrator feature):

For each project entry `{name, path}` in the feature's `projects` array:
1. Check if `{path}/.specd/tasks/{task_name}/` exists
2. If yes, read `{path}/.specd/tasks/{task_name}/config.json` and `{path}/.specd/tasks/{task_name}/STATE.md`
3. Extract the same fields: stage (from STATE.md `**Stage:**`), plan completion, next action
4. Store as a sub-feature of the parent orchestrator feature, tagged with the project name

Mark this root feature as an "orchestrator feature" (has sub-project children).

**Step 4c: Scan for standalone sub-project features.**

For each project in the repo-level `.specd/config.json` `projects` array:
1. Use Glob to find `{project-path}/.specd/tasks/*/config.json`
2. For each feature found, check if it was already captured as a sub-feature of an orchestrator feature in step 4b
3. If NOT already captured, gather its data (same extraction logic) and store as a standalone feature, grouped by project name/path

### 5. Sort features

Sort active features by stage priority (highest first), then by created date (oldest first):

1. `execution` (most advanced)
2. `planning`
3. `research`
4. `discussion` (least advanced)

**For orchestrator mode:** Apply the same sort to:
- Root/orchestrator features (the parent rows)
- Sub-project features within each orchestrator feature
- Standalone features within each project group

### 6. Format output

#### If mode = project (single-project, unchanged):

**Count features:** Calculate total count and in-progress count (non-complete).

**Output header:**

```
# Task Status

_{total} features, {in_progress} in progress_
```

**Active features table:**

```
| Feature | Stage | Plans | Created | Next Action |
|---------|-------|-------|---------|-------------|
| {name} | {stage} | {plans} | {created} | {next_action} |
```

- `Plans` shows the completed/total count from Plan Status table, or `—` if pre-planning
- `Next Action` is the extracted recommendation from STATE.md Next Steps

**If `--all` flag is NOT set and there are completed tasks:**

```
Run `/specd.status --all` to include completed tasks.
```

**If `--all` flag IS set and there are completed tasks, add:**

```
### Completed

| Feature | Plans | Completed |
|---------|-------|-----------|
| {name} | {completed}/{total} | {last_updated} |
```

Where `Completed` date comes from the `**Last Updated:**` field in STATE.md.

#### If mode = orchestrator:

**Count features:** Calculate total across root features + standalone sub-project features. In-progress = non-complete/non-abandoned.

**Output header:**

```
# Task Status

_{total} features, {in_progress} in progress — orchestrator mode_
```

**Active features table (orchestrator features with sub-projects):**

For each active root feature (not complete/abandoned, unless `--all`):

If it's an orchestrator feature (has sub-project children):

```
| Feature | Stage | Plans | Created | Next Action |
|---------|-------|-------|---------|-------------|
| {name} | {stage} | {plans} | {created} | {next_action} |
|  └ {project-name} | {stage} | {plans} | | {next_action} |
|  └ {project-name} | {stage} | {plans} | | {next_action} |
```

- Orchestrator feature is the parent row with full data
- Sub-project rows use `└ {project-name}` in the Feature column
- Sub-project rows leave Created empty (inherited from parent)
- Sort sub-project rows by stage priority (same as main sort)

If it's a plain root feature (no sub-project children), show it as a normal row (same as single-project).

**If standalone sub-project features exist, add a section:**

```
### Project Features
```

For each project that has standalone features:

```
**{project-name}** ({project-path})

| Feature | Stage | Plans | Created | Next Action |
|---------|-------|-------|---------|-------------|
| {name} | {stage} | {plans} | {created} | {next_action} |
```

Only show active standalone features (not complete/abandoned, unless `--all`).

**Completed/abandoned features with `--all` flag:**

**If `--all` flag is NOT set and there are completed/abandoned features (root or sub-project):**

```
Run `/specd.status --all` to include completed tasks.
```

**If `--all` flag IS set and there are completed/abandoned features, add:**

```
### Completed

| Feature | Plans | Completed |
|---------|-------|-----------|
| {name} | {completed}/{total} | {last_updated} |
|  └ {project-name} | {completed}/{total} | {last_updated} |
```

Show completed orchestrator features with their sub-project rows indented, and completed standalone sub-project features under their project heading.

### 7. Output

Print the formatted dashboard directly. No file writes. No Task agents. No AskUserQuestion.
