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
| `/specd:new-feature` | Initialize a feature with requirements and roadmap |
| `/specd:update` | Update Specdacular to the latest version |
| `/specd:help` | Show this help |

## Quick Start

1. **Map your codebase first:**
   ```
   /specd:map-codebase
   ```
   This spawns 4 parallel agents to analyze your codebase and creates 7 documents in `.specd/codebase/`.

2. **Review the generated docs:**
   - `STACK.md` - Technologies and dependencies
   - `ARCHITECTURE.md` - System design and patterns
   - `STRUCTURE.md` - Directory layout
   - `CONVENTIONS.md` - Code style and patterns
   - `TESTING.md` - Test structure
   - `INTEGRATIONS.md` - External services
   - `CONCERNS.md` - Technical debt and issues

3. **Plan a new feature:**
   ```
   /specd:new-feature user-dashboard
   ```
   This starts a conversational workflow to define your feature, creating:
   - `FEATURE.md` - What this feature does
   - `REQUIREMENTS.md` - Scoped requirements with REQ-IDs
   - `ROADMAP.md` - Phases with success criteria
   - `STATE.md` - Progress tracking

## Updating

When an update is available, you'll see a yellow `⬆ /specd:update` in your statusline. Run:
```
/specd:update
```
Or manually: `npx specdacular@latest`

---

*More commands coming soon for phase planning and execution.*
</output>
