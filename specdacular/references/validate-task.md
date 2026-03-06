<shared name="validate_task">

## Validate Task Exists

**Required:** `$TASK_NAME`

**Basic validation (all workflows):**

```bash
if [ -d ".specd/tasks/$TASK_NAME" ]; then
  TASK_DIR=".specd/tasks/$TASK_NAME"
elif [ -d ".specd/features/$TASK_NAME" ]; then
  TASK_DIR=".specd/features/$TASK_NAME"
else
  echo "not found"; exit 1
fi

[ -f "$TASK_DIR/FEATURE.md" ] || { echo "missing FEATURE.md"; exit 1; }
[ -f "$TASK_DIR/CONTEXT.md" ] || { echo "missing CONTEXT.md"; exit 1; }
[ -f "$TASK_DIR/DECISIONS.md" ] || { echo "missing DECISIONS.md"; exit 1; }
[ -f "$TASK_DIR/STATE.md" ] || { echo "missing STATE.md"; exit 1; }
[ -f "$TASK_DIR/config.json" ] || { echo "missing config.json"; exit 1; }
```

`$TASK_DIR` is now set — use it for all subsequent file references.

If not found, suggest `/specd.new {name}`. If files missing, suggest `/specd.discuss {name}`.

**Extended validation (for plan/execute/review):**

```bash
[ -d "$TASK_DIR/phases" ] || { echo "no phases"; exit 1; }
[ -f "$TASK_DIR/ROADMAP.md" ] || { echo "no roadmap"; exit 1; }
```

If no phases, suggest `/specd.plan {name}`.

**Optional checks (note existence, don't fail):**

```bash
[ -f "$TASK_DIR/RESEARCH.md" ] && echo "has_research"
[ -f "$TASK_DIR/ROADMAP.md" ] && echo "has_roadmap"
```

</shared>
