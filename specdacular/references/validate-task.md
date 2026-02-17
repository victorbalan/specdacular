<shared name="validate_task">

## Validate Task Exists

Check that a task directory exists with required files.

**Before using this reference, you must have ready:**
- `$TASK_NAME` — the task name (from `$ARGUMENTS` or parsed)

**Basic validation (all workflows):**

```bash
# Check task directory exists (tasks/ preferred, features/ for backwards compat)
if [ -d ".specd/tasks/$TASK_NAME" ]; then
  TASK_DIR=".specd/tasks/$TASK_NAME"
elif [ -d ".specd/features/$TASK_NAME" ]; then
  TASK_DIR=".specd/features/$TASK_NAME"
else
  echo "not found"; exit 1
fi

# Check required files
[ -f "$TASK_DIR/FEATURE.md" ] || { echo "missing FEATURE.md"; exit 1; }
[ -f "$TASK_DIR/CONTEXT.md" ] || { echo "missing CONTEXT.md"; exit 1; }
[ -f "$TASK_DIR/DECISIONS.md" ] || { echo "missing DECISIONS.md"; exit 1; }
[ -f "$TASK_DIR/STATE.md" ] || { echo "missing STATE.md"; exit 1; }
[ -f "$TASK_DIR/config.json" ] || { echo "missing config.json"; exit 1; }
```

**`$TASK_DIR` is now set** — use it in all subsequent file references instead of hardcoding `.specd/tasks/$TASK_NAME`.

**If task not found:**
```
Task '{name}' not found.

Run /specd:new {name} to create it.
```

**If required files missing:**
```
Task '{name}' is missing required files:
- {missing file}

Run /specd:discuss {name} to rebuild context.
```

**Extended validation (for plan/execute/review):**

```bash
# Check phases exist (for execute/review)
[ -d "$TASK_DIR/phases" ] || { echo "no phases"; exit 1; }

# Check ROADMAP exists (for execute/review)
[ -f "$TASK_DIR/ROADMAP.md" ] || { echo "no roadmap"; exit 1; }
```

**If no phases:**
```
Task '{name}' has no phases yet.

Run /specd:plan {name} to create phases.
```

**Optional file checks (note existence, don't fail):**

```bash
# Check optional files
[ -f "$TASK_DIR/RESEARCH.md" ] && echo "has_research"
[ -f "$TASK_DIR/ROADMAP.md" ] && echo "has_roadmap"
```

</shared>
