<shared name="commit_code">

## Auto-Commit Code

**Required:** `$FILES` (space-separated paths), `$MESSAGE` (commit message)

```bash
node ~/.claude/hooks/specd-utils.js commit --task-dir .specd/tasks/$TASK_NAME --type code --files "$FILES" --message "$MESSAGE"
```

If `"committed": false`, auto-commit is disabled — mention uncommitted files and continue.

</shared>
