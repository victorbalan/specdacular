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

**AI-optimized codebase documentation for Claude.**

## Commands

| Command | Description |
|---------|-------------|
| `/specd:map-codebase` | Analyze codebase → produce 4 AI-optimized docs |
| `/specd:new-feature` | Initialize a feature with requirements and roadmap |
| `/specd:update` | Update Specdacular to the latest version |
| `/specd:help` | Show this help |

## Quick Start

```
/specd:map-codebase
```

This spawns 4 parallel agents to analyze your codebase and creates `.specd/codebase/`:

| Document | What it contains |
|----------|------------------|
| **MAP.md** | Navigation: modules, functions, entry points |
| **PATTERNS.md** | Code examples: services, errors, testing |
| **STRUCTURE.md** | Organization: where to put new code |
| **CONCERNS.md** | Warnings: gotchas, anti-patterns, debt |

## Philosophy

These docs are **for Claude, not humans**.

Each document answers a question Claude can't get from reading code:
- MAP.md → "Where is X? What functions exist?"
- PATTERNS.md → "How do I write code that fits?"
- STRUCTURE.md → "Where do I put new code?"
- CONCERNS.md → "What will bite me?"

**Principle:** Don't document what Claude can grep. Document tribal knowledge, gotchas, and patterns.

## Updating

When an update is available, you'll see `⬆ /specd:update` in your statusline. Run:
```
/specd:update
```
Or manually: `npx specdacular@latest`

---

GitHub: https://github.com/vlad-ds/specdacular
</output>
