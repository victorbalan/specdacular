---
name: specd:help
description: Show all specdacular commands and usage guide
allowed-tools:
  - Read
---

<objective>
Display available specdacular commands and usage guidance.
</objective>

<output>
# Specdacular

**Feature planning for existing codebases.**

## Commands

| Command | Description |
|---------|-------------|
| `/specd:map-codebase` | Analyze codebase and generate documentation |
| `/specd:help` | Show this help |

## Quick Start

1. **Map your codebase first:**
   ```
   /specd:map-codebase
   ```
   This spawns 4 parallel agents to analyze your codebase and creates 7 documents in `.planning/codebase/`.

2. **Review the generated docs:**
   - `STACK.md` - Technologies and dependencies
   - `ARCHITECTURE.md` - System design and patterns
   - `STRUCTURE.md` - Directory layout
   - `CONVENTIONS.md` - Code style and patterns
   - `TESTING.md` - Test structure
   - `INTEGRATIONS.md` - External services
   - `CONCERNS.md` - Technical debt and issues

## Updating

```bash
npx specdacular@latest
```

---

*More commands coming soon for feature planning workflows.*
</output>
