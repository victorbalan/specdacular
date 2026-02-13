<shared name="select_feature">

## Feature Selection

Determine which feature to work on.

**If $ARGUMENTS provided:**
Use as feature name. Normalize to kebab-case (lowercase, hyphens).

```bash
[ -d ".specd/features/$ARGUMENTS" ] || { echo "not found"; exit 1; }
```

**If feature not found:**
```
Feature '{name}' not found.

Available features:
```

```bash
ls -d .specd/features/*/ 2>/dev/null | while read dir; do
  basename "$dir"
done
```

End workflow.

**If no arguments:**
Scan for in-progress features:

```bash
# List feature directories with config.json
for dir in .specd/features/*/config.json; do
  [ -f "$dir" ] && echo "$dir"
done
```

Read each `config.json` and filter where `stage != "complete"`.

**If no features found:**
```
No features in progress.

Start one with /specd:feature:new
```
End workflow.

**If features found:**
Use AskUserQuestion:
- header: "Feature"
- question: "Which feature would you like to work on?"
- options: List each feature with its current stage (e.g., "my-feature (discussion)", "other-feature (execution)")

Use the selected feature name.

</shared>
