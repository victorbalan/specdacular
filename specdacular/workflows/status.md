# Workflow: Feature Status Dashboard

## Input

- `$ARGUMENTS` — may contain `--all` flag

## Steps

### 1. Parse arguments

Check if `$ARGUMENTS` contains `--all`. If so, completed features will be shown in a separate section.

### 2. Check for features directory

Use Glob to check if `.specd/features/*/config.json` matches anything.

If no matches: output the following and stop:

```
No features found. Start one with `/specd:feature:new [name]`.
```

### 3. Gather feature data

For each feature directory in `.specd/features/`:

1. **Read `config.json`** — extract: `feature_name`, `created`, `stage`, `phases_count`, `plans_count`
2. **Read `STATE.md`** — extract:
   - **Authoritative stage**: Look for `**Stage:** <value>` in the Current Position section. This overrides `config.json` stage. A feature is complete when stage is `complete`.
   - **Plan completion**: From the `Plan Status` table, count rows with Status = `Complete` vs total rows. Format as `completed/total` (e.g. `5/8`). If no Plan Status table or no rows, use `—`.
   - **Next action**: Extract the first meaningful line from the `## Next Steps` section. Keep it short — take just the **Recommended:** line if present, otherwise the first line. Strip markdown formatting like `**Recommended:**` prefix. Truncate to ~50 chars if needed.

### 4. Sort features

Sort active features by stage priority (highest first), then by created date (oldest first):

1. `execution` (most advanced)
2. `planning`
3. `research`
4. `discussion` (least advanced)

### 5. Format output

**Count features:** Calculate total count and in-progress count (non-complete).

**Output header:**

```
# Feature Status

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

**If `--all` flag is NOT set and there are completed features:**

```
Run `/specd:status --all` to include completed features.
```

**If `--all` flag IS set and there are completed features, add:**

```
### Completed

| Feature | Plans | Completed |
|---------|-------|-----------|
| {name} | {completed}/{total} | {last_updated} |
```

Where `Completed` date comes from the `**Last Updated:**` field in STATE.md.

### 6. Output

Print the formatted dashboard directly. No file writes. No Task agents. No AskUserQuestion.
