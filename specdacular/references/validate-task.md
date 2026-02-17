<shared name="validate_task">

## Validate Task Exists

Check that a task directory exists with required files.

**Before using this reference, you must have ready:**
- `$TASK_NAME` — the task name (from `$ARGUMENTS` or parsed)

**Basic validation (all workflows):**

```bash
# Check task directory exists
[ -d ".specd/tasks/$TASK_NAME" ] || { echo "not found"; exit 1; }

# Check required files
[ -f ".specd/tasks/$TASK_NAME/FEATURE.md" ] || { echo "missing FEATURE.md"; exit 1; }
[ -f ".specd/tasks/$TASK_NAME/CONTEXT.md" ] || { echo "missing CONTEXT.md"; exit 1; }
[ -f ".specd/tasks/$TASK_NAME/DECISIONS.md" ] || { echo "missing DECISIONS.md"; exit 1; }
[ -f ".specd/tasks/$TASK_NAME/STATE.md" ] || { echo "missing STATE.md"; exit 1; }
[ -f ".specd/tasks/$TASK_NAME/config.json" ] || { echo "missing config.json"; exit 1; }
```

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
[ -d ".specd/tasks/$TASK_NAME/phases" ] || { echo "no phases"; exit 1; }

# Check ROADMAP exists (for execute/review)
[ -f ".specd/tasks/$TASK_NAME/ROADMAP.md" ] || { echo "no roadmap"; exit 1; }
```

**If no phases:**
```
Task '{name}' has no phases yet.

Run /specd:plan {name} to create phases.
```

**Optional file checks (note existence, don't fail):**

```bash
# Check optional files
[ -f ".specd/tasks/$TASK_NAME/RESEARCH.md" ] && echo "has_research"
[ -f ".specd/tasks/$TASK_NAME/ROADMAP.md" ] && echo "has_roadmap"
```

</shared>
