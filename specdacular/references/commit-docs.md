<shared name="commit_docs">

## Auto-Commit Docs

Commit `.specd/` documentation changes, respecting the user's auto-commit setting.

**Before using this reference, you must have ready:**
- `$FILES` — the files to `git add` (space-separated paths)
- `$MESSAGE` — the commit message
- `$LABEL` — short label for the skip message (e.g., "discussion updates", "plan complete", "feature completion")

**Check auto-commit setting:**

```bash
cat .specd/config.json 2>/dev/null || echo '{"auto_commit_docs": true}'
```

**If `auto_commit_docs` is `false`:**
Do NOT run git commands. Instead print:

```
Auto-commit disabled for docs — $LABEL not committed.
Modified files: $FILES
```

Then skip ahead to the next step in your workflow.

**If `auto_commit_docs` is `true` or not set (default):**

```bash
git add $FILES
git commit -m "$MESSAGE"
```

</shared>
