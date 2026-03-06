<shared name="commit_docs">

## Auto-Commit Docs

**Required:** `$FILES` (space-separated paths), `$MESSAGE` (commit message), `$LABEL` (skip message label)

```bash
node ~/.claude/hooks/specd-utils.js commit --task-dir .specd/tasks/$TASK_NAME --type docs --files "$FILES" --message "$MESSAGE"
```

If `"committed": false`, auto-commit is disabled — mention "$LABEL not committed" and continue.

</shared>
