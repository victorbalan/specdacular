<shared name="commit_config">

## Commit Configuration

Read commit behavior settings from the feature's config.json.

**Read config:**
```bash
cat .specd/features/{feature-name}/config.json
```

Extract the `execution.auto_commit` field.

**If `auto_commit` = true:**
After each task completes successfully, commit changes automatically without asking the user.

Commit message format:
```
feat({feature-name}): {brief task description}

Plan {phase}.{plan}, Task {N}
```

**If `auto_commit` = false (default):**
After each task completes successfully, present the changes and ask the user before committing:

Use AskUserQuestion:
- header: "Commit?"
- question: "Task complete. Commit these changes?"
- options:
  - "Commit" — Commit with auto-generated message
  - "Commit with custom message" — Let user provide message
  - "Skip commit" — Continue without committing (changes stay staged)

**If field is missing or config.json doesn't have `execution` section:**
Default to `auto_commit = false` (always ask).

</shared>
