---
last_reviewed: 2026-03-16
generated_by: specd
---

# Gotchas & Concerns

## Gotchas

### Path References: `~/.claude/` vs `.claude/`
Commands use `@~/.claude/specdacular/workflows/` but `install.js` rewrites paths based on install type. Always use `~/.claude/` in source files — the installer handles the rest. Hardcoding `.claude/` breaks local installs.

### Dual Location Install
Specdacular works from both `~/.claude/` (global) and `./.claude/` (local). Hook code must check project directory first, then global. See `specd-check-update.js` lines 16-17.

### VERSION File
`.claude/specdacular/VERSION` drives update checks. If missing, updates show "0.0.0" and suppress notifications. Never delete this file.

### Context Window Display Is Scaled
Statusline shows usage scaled to 80% — at 80% real usage it shows "100%". This is intentional (conservative warning). Don't "fix" it.

### Template Placeholders Are Exact
Workflows depend on exact `{placeholder}` syntax. Changing `{name}` to `{feature_name}` breaks every workflow that fills templates.

## Anti-Patterns

### Don't use relative paths in agent prompts
Agent threads reset cwd between bash calls. Use `.specd/codebase/` not `../codebase/`.

### Don't return document content from mapper agents
Agents write directly to files, return only confirmation. Returning full docs pollutes orchestrator context (200k per agent).

### Don't create commands without `<execution_context>`
Commands are stubs — all logic lives in workflows. Missing `<execution_context>` = broken command.

### Don't add npm dependencies
Zero dependencies is by design. Use Node.js built-ins only.

### Don't include `node_modules/` in search commands
This project has none, but templates may run in projects that do. Always exclude: `find . -not -path "*/node_modules/*"`

## Fragile Areas

### Parallel Agent Spawning (`map-codebase`)
Spawns 4 agents with `run_in_background: true`. If one hangs, orchestrator may timeout. Verify with `ls -la .specd/codebase/` and check file sizes. Can manually re-run a failed mapper.

### Installation Path Replacement
`copyWithPathReplacement()` does greedy regex `~/.claude/` → prefix on ALL `.md` files. Can incorrectly replace mentions in prose/code blocks. Workaround: only use `~/.claude/` in `@` context references.

### Update Check Background Spawn
Uses `spawn(process.execPath, ['-e', ...])` with stringified code. 10s timeout on npm registry. Don't touch the spawn pattern without understanding shell escaping. Test by deleting cache and starting new session.

### Feature Config Schema Drift
No schema validation between what `new` writes to `config.json` and what `execute` reads. Never remove fields, only add. Always provide defaults in workflows that read config.

## Tech Debt

### No Automated Tests
Zero test files. Regression risk on every change. Manual testing required for install and command flows.

### Duplicate Directory Structures
Source files exist in `commands/` and `specdacular/`, installed copies in `.claude/commands/` and `.claude/specdacular/`. Edit source only, reinstall to test.

### Dead Fields in config.json Template
`mode`, `depth`, `requirements.v1_count`, `requirements.v2_count` are never read by any workflow. Harmless but noisy.

### Hook Paths Are Fragile
`settings.json` hook paths are hardcoded during install. Windows paths and quote handling can break. Reinstall to fix.

## Performance Notes

- **Update check**: 10s timeout on npm registry, runs in background via `child.unref()`
- **Parallel agents**: 4 × 200k context = ~$24 per full codebase map (Sonnet pricing)
- **Large codebases**: Mapper agents use `head -N` limits — may miss files in 10k+ file repos
- **Install**: Synchronous file copy, no progress indicator — fast on local filesystems (<1s)

## Dependency Notes

- **Node.js >=16.7.0**: Required for stable `readline` support. Can safely raise to >=18.
- **Git**: Required but not validated. Workflows commit throughout — fails silently in non-git dirs.
