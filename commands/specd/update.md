---
name: specd:update
description: Update Specdacular to the latest version
allowed-tools:
  - Bash
  - Read
---

<objective>
Update Specdacular to the latest version and show what changed.
</objective>

<process>
1. Check current version:
```bash
cat ~/.claude/specdacular/VERSION 2>/dev/null || cat .claude/specdacular/VERSION 2>/dev/null || echo "unknown"
```

2. Check latest version:
```bash
npm view specdacular version
```

3. If already on latest, inform user and exit.

4. If update available, run the installer:
```bash
npx specdacular@latest --global
```

5. Show new version:
```bash
cat ~/.claude/specdacular/VERSION 2>/dev/null || cat .claude/specdacular/VERSION 2>/dev/null
```

6. Clear the update cache:
```bash
rm -f ~/.claude/cache/specd-update-check.json
```

7. Inform user the update is complete and they may want to restart Claude Code to pick up any new commands.
</process>
