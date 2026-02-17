<shared name="select_task">

## Task Selection

Determine which task to work on.

**If $ARGUMENTS provided:**
Use as task name. Normalize to kebab-case (lowercase, hyphens).

```bash
[ -d ".specd/tasks/$ARGUMENTS" ] || { echo "not found"; exit 1; }
```

**If task not found:**
```
Task '{name}' not found.

Available tasks:
```

```bash
ls -d .specd/tasks/*/ 2>/dev/null | while read dir; do
  basename "$dir"
done
```

End workflow.

**If no arguments:**
Scan for in-progress tasks:

```bash
# List task directories with config.json
for dir in .specd/tasks/*/config.json; do
  [ -f "$dir" ] && echo "$dir"
done
```

Read each `config.json` and filter where `stage != "complete"`.

**If no tasks found:**
```
No tasks in progress.

Start one with /specd:new
```
End workflow.

**If tasks found:**
Use AskUserQuestion:
- header: "Task"
- question: "Which task would you like to work on?"
- options: List each task with its current stage (e.g., "my-task (discussion)", "other-task (execution)")

Use the selected task name.

</shared>
