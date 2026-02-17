<shared name="commit_code">

## Auto-Commit Code

Commit implementation code changes, respecting the user's auto-commit setting.

**Before using this reference, you must have ready:**
- `$FILES` — the files to `git add` (space-separated paths)
- `$MESSAGE` — the commit message

**IMPORTANT — You MUST check the auto-commit setting BEFORE running any git commands. Do NOT skip this check.**

**Step 1: Read the setting (MANDATORY):**

```bash
cat .specd/config.json 2>/dev/null || echo '{"auto_commit_code": true}'
```

Read the value of `auto_commit_code` from the output.

**Step 2: If `auto_commit_code` is `false` → STOP. Do NOT commit.**

Print this message and move on to the next workflow step:

```
Auto-commit disabled for code — changes not committed.
Modified files: $FILES
```

**Step 3: If `auto_commit_code` is `true` or not set (default true) → commit:**

```bash
git add $FILES
git commit -m "$MESSAGE"
```

</shared>
