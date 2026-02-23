<shared name="select_task">

## Task Selection

Determine which task to work on.

**If $ARGUMENTS provided:**
Use as task name. Normalize to kebab-case (lowercase, hyphens).

```bash
# Check tasks/ first, fall back to features/ for backwards compat
if [ -d ".specd/tasks/$ARGUMENTS" ]; then
  TASK_DIR=".specd/tasks/$ARGUMENTS"
elif [ -d ".specd/features/$ARGUMENTS" ]; then
  TASK_DIR=".specd/features/$ARGUMENTS"
else
  echo "not found"; exit 1
fi
```

**If task not found:**
```
Task '{name}' not found.

Available tasks:
```

```bash
{ ls -d .specd/tasks/*/ 2>/dev/null; ls -d .specd/features/*/ 2>/dev/null; } | while read dir; do
  basename "$dir"
done | sort -u
```

End workflow.

**If no arguments:**
Scan for in-progress tasks:

```bash
# List task directories with config.json (check both locations)
for dir in .specd/tasks/*/config.json .specd/features/*/config.json; do
  [ -f "$dir" ] && echo "$dir"
done
```

Read each `config.json` and filter where `stage != "complete"`.

**If no tasks found:**
```
No tasks in progress.

Start one with /specd.new
```
End workflow.

**If tasks found:**
Use AskUserQuestion:
- header: "Task"
- question: "Which task would you like to work on?"
- options: List each task with its current stage (e.g., "my-task (discussion)", "other-task (execution)")

Use the selected task name.

</shared>
