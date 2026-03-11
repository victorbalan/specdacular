<shared name="resolve_task">

## Resolve Task Name

Determine the current task from arguments, state file, or directory scan. Centralizes task resolution so all commands use the same fallback chain.

**Before using this reference, you must have ready:**
- `$ARGUMENTS` — raw arguments string (may include flags like `--auto`, `--interactive`, `--all`)

### Resolution Chain

**Step 1: Parse arguments for task name.**

Extract the task name from `$ARGUMENTS`:
- Skip any flags (tokens starting with `--`)
- The first non-flag token is the task name candidate
- Remaining flags are preserved for the caller

```
$TASK_NAME = first non-flag token from $ARGUMENTS (or empty)
$FLAGS = all flag tokens from $ARGUMENTS
```

**Step 2: If `$TASK_NAME` is set, use it.**

Continue to validation.

**Step 3: If no task name, check state.json.**

```bash
cat .specd/state.json 2>/dev/null
```

If file exists and has `current_task`:
```
$TASK_NAME = current_task value
```

Continue to validation.

**Step 4: If no state.json, scan for tasks.**

```bash
ls .specd/tasks/ 2>/dev/null
```

- If exactly one task directory exists → use it as `$TASK_NAME`
- If multiple tasks exist → use AskUserQuestion:
  - header: "Select Task"
  - question: "Multiple tasks found. Which one?"
  - options: list of task directory names
- If no tasks exist:
  ```
  No tasks found. Create one with /specd.new
  ```
  End workflow.

### Validation

After resolving `$TASK_NAME`, validate the task exists:

```bash
if [ -d ".specd/tasks/$TASK_NAME" ]; then
  TASK_DIR=".specd/tasks/$TASK_NAME"
elif [ -d ".specd/features/$TASK_NAME" ]; then
  TASK_DIR=".specd/features/$TASK_NAME"
else
  echo "not found"
fi
```

If not found:
```
Task '{name}' not found.

Run /specd.new {name} to create it.
```
End workflow.

### Update state.json

After successful resolution, update `.specd/state.json` so state stays current regardless of how the task was resolved:

```bash
mkdir -p .specd
```

Write `.specd/state.json`:
```json
{"current_task": "{task-name}"}
```

**Do NOT commit state.json here** — the calling workflow handles commits.

### Output

After this reference completes, these variables are set:
- `$TASK_NAME` — resolved task name
- `$TASK_DIR` — path to task directory (`.specd/tasks/$TASK_NAME` or `.specd/features/$TASK_NAME`)
- `$FLAGS` — any flags from original arguments

</shared>
