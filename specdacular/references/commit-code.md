<shared name="commit_code">

## Auto-Commit Code

Commit implementation code changes, respecting the user's auto-commit setting.

**Before using this reference, you must have ready:**
- `$FILES` — the files to `git add` (space-separated paths)
- `$MESSAGE` — the commit message

**Check auto-commit setting:**

```bash
cat .specd/config.json 2>/dev/null || echo '{"auto_commit_code": true}'
```

**If `auto_commit_code` is `false`:**
Do NOT run git commands. Instead print:

```
Auto-commit disabled for code — changes not committed.
Modified files: $FILES
```

Then skip ahead to the next step in your workflow.

**If `auto_commit_code` is `true` or not set (default):**

```bash
git add $FILES
git commit -m "$MESSAGE"
```

</shared>
