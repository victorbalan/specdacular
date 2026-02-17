<shared name="commit_docs">

## Auto-Commit Docs

Commit `.specd/` documentation changes, respecting the user's auto-commit setting.

**Before using this reference, you must have ready:**
- `$FILES` — the files to `git add` (space-separated paths)
- `$MESSAGE` — the commit message
- `$LABEL` — short label for the skip message (e.g., "discussion updates", "plan complete", "feature completion")

**IMPORTANT — You MUST check the auto-commit setting BEFORE running any git commands. Do NOT skip this check.**

**Step 1: Read the setting (MANDATORY):**

```bash
cat .specd/config.json 2>/dev/null || echo '{"auto_commit_docs": true}'
```

Read the value of `auto_commit_docs` from the output.

**Step 2: If `auto_commit_docs` is `false` → STOP. Do NOT commit.**

Print this message and move on to the next workflow step:

```
Auto-commit disabled for docs — $LABEL not committed.
Modified files: $FILES
```

**Step 3: If `auto_commit_docs` is `true` or not set (default true) → commit:**

```bash
git add $FILES
git commit -m "$MESSAGE"
```

</shared>
