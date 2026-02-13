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

3. Always run the installer to ensure old commands are cleaned up and replaced with fresh ones (even if versions match):
```bash
npx specdacular@latest --global
```

4. Show new version:
```bash
cat ~/.claude/specdacular/VERSION 2>/dev/null || cat .claude/specdacular/VERSION 2>/dev/null
```

5. Clear the update cache:
```bash
rm -f ~/.claude/cache/specd-update-check.json
```

6. If versions were the same, inform user commands were refreshed. If version changed, inform user of the update. Suggest restarting Claude Code to pick up any command changes.
</process>
