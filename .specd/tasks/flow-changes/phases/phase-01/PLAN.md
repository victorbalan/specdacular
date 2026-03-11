---
task: flow-changes
phase: 1
depends_on: []
creates:
  - specdacular/references/resolve-task.md
modifies:
  - commands/specd.continue.md
  - commands/specd.toolbox.md
  - commands/specd.status.md
  - specdacular/workflows/new.md
---

# Phase 1: State File & Task Resolution

## Objective

Every specd command can determine the current task without explicit arguments, using a committed `.specd/state.json` file as fallback. A shared `resolve-task.md` reference centralizes the resolution logic.

## Context

**Reference these files:**
- `@specdacular/references/validate-task.md` — Existing task validation (directory + required files check)
- `@specdacular/references/resolve-pipeline.md` — Pattern for shared reference files
- `@commands/specd.continue.md` — Primary consumer, currently requires explicit task name
- `@commands/specd.toolbox.md` — Currently has its own task resolution (single task auto-pick, multi-task ask)
- `@specdacular/workflows/new.md` — Task creation workflow, needs to write state.json

**Relevant Decisions:**
- DEC-001: `.specd/state.json` is committed (not gitignored). Travels with branches. Merge conflicts accepted.
- DEC-005: Command vocabulary — new/research/plan/execute. All use state.json fallback.

**From Research:**
- All commands should delegate task resolution to a shared reference to avoid duplicated logic
- state.json format: `{"current_task": "task-name"}` — minimal content reduces merge conflict surface
- Every command that runs should update state.json to keep it current

---

## Tasks

### Task 1: Create resolve-task.md Reference

**Files:** `specdacular/references/resolve-task.md`

**Action:**
Create a shared reference file that implements the task name resolution chain:

1. **Explicit argument:** If `$TASK_NAME` is non-empty and not a flag (doesn't start with `--`), use it directly.
2. **state.json fallback:** Read `.specd/state.json`. If it exists and has `current_task`, use that value.
3. **Single-task auto-pick:** List `.specd/tasks/` directories. If exactly one task exists, use it.
4. **Ask user:** If multiple tasks exist, use AskUserQuestion to let user pick.
5. **No tasks:** Error — "No tasks found. Create one with /specd.new"

After resolution, set `$TASK_NAME` and `$TASK_DIR` variables. Also update `.specd/state.json` with the resolved task (so state stays current regardless of how the task was resolved).

Follow the `<shared>` tag pattern used by other references (validate-task.md, resolve-pipeline.md). Include the state.json write-back step.

**Verify:**
```bash
cat specdacular/references/resolve-task.md | grep -q "state.json" && echo "OK"
```

**Done when:**
- [ ] resolve-task.md exists with full resolution chain (argument → state.json → single-task → ask)
- [ ] Follows existing reference file patterns (`<shared>` tag structure)
- [ ] Includes state.json write-back after resolution

---

### Task 2: Update commands/specd.continue.md to Use resolve-task.md

**Files:** `commands/specd.continue.md`

**Action:**
Replace the current task name handling with a reference to `resolve-task.md`.

Currently, `specd.continue.md` passes `$ARGUMENTS` directly as "Task name and flags" in its context section. Modify so that:

1. Before passing to the brain, invoke `@~/.claude/specdacular/references/resolve-task.md` to resolve the task name from arguments
2. The resolved `$TASK_NAME` (plus any flags like `--auto`, `--interactive`) gets passed through to the brain
3. The command still accepts explicit task names — resolve-task.md handles the fallback chain

Keep the existing structure (YAML frontmatter, execution_context pointing to continue.md workflow). Only change how the task name argument is documented/resolved.

**Verify:**
```bash
cat commands/specd.continue.md | grep -q "resolve-task" && echo "OK"
```

**Done when:**
- [ ] specd.continue.md references resolve-task.md for task resolution
- [ ] Still accepts explicit task name as first argument
- [ ] Flags (--auto, --interactive) still work

---

### Task 3: Update commands/specd.toolbox.md to Use resolve-task.md

**Files:** `commands/specd.toolbox.md`

**Action:**
Replace the inline task resolution logic in specd.toolbox.md with a reference to resolve-task.md.

Currently, toolbox has its own resolution: parse `$ARGUMENTS` → check `.specd/tasks/` → single task auto-pick → ask user. This duplicated logic should be replaced with:

```
@~/.claude/specdacular/references/resolve-task.md
```

Remove the inline resolution logic and replace with the shared reference.

**Verify:**
```bash
cat commands/specd.toolbox.md | grep -q "resolve-task" && echo "OK"
```

**Done when:**
- [ ] specd.toolbox.md uses resolve-task.md reference instead of inline resolution
- [ ] Existing toolbox functionality preserved (menu of operations)

---

### Task 4: Update commands/specd.status.md to Show Current Task

**Files:** `commands/specd.status.md`

**Action:**
Add current task indication to the status dashboard. The status command currently scans all tasks — add a visual indicator for which task is the "current" one per state.json.

1. Read `.specd/state.json` to get `current_task`
2. In the dashboard output, mark the current task with a visual indicator (e.g., `→` prefix or `(current)` label)
3. If state.json doesn't exist, show all tasks without indicator

This is a display-only change — status doesn't need the full resolve-task.md chain since it shows all tasks anyway.

**Verify:**
```bash
cat commands/specd.status.md | grep -q "state.json" && echo "OK"
```

**Done when:**
- [ ] Status dashboard shows current task indicator from state.json
- [ ] Works gracefully when state.json doesn't exist

---

### Task 5: Update workflows/new.md to Write state.json

**Files:** `specdacular/workflows/new.md`

**Action:**
After creating a new task, write `.specd/state.json` with the new task as current.

In the `commit` or `completion` step of new.md, add:
1. Write `.specd/state.json` with content: `{"current_task": "{task-name}"}`
2. Include state.json in the git commit alongside the other task files

This ensures that after `/specd.new my-task`, the task is immediately set as current and `/specd.continue` works without arguments.

**Verify:**
```bash
cat specdacular/workflows/new.md | grep -q "state.json" && echo "OK"
```

**Done when:**
- [ ] new.md writes state.json after task creation
- [ ] state.json is included in the initial commit
- [ ] Format matches DEC-001: `{"current_task": "task-name"}`

---

## Verification

After all tasks complete:

```bash
# resolve-task.md exists and has correct structure
[ -f "specdacular/references/resolve-task.md" ] && echo "resolve-task: OK"

# All commands reference resolve-task or state.json
grep -l "resolve-task\|state.json" commands/specd.continue.md commands/specd.toolbox.md commands/specd.status.md specdacular/workflows/new.md | wc -l | grep -q "4" && echo "all-updated: OK"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] resolve-task.md provides consistent task resolution across all commands

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/flow-changes/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
