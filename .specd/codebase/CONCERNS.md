# Codebase Concerns

**Analysis Date:** 2026-02-04

## Gotchas

### Path Reference Gotcha: `~/.claude/` vs `.claude/`

**Issue:** Commands reference workflows using `@~/.claude/specdacular/workflows/` but install.js modifies paths based on install type.

- Files: `commands/specd/map-codebase.md`, `bin/install.js`
- How it works: During installation, `copyWithPathReplacement()` (line 107-129 in `bin/install.js`) replaces `~/.claude/` with either `~/.claude/` (global) or `./.claude/` (local)
- Safe modification: When adding new commands, always use `@~/.claude/specdacular/` in source files. The installer will rewrite paths during installation.
- Impact: If you hardcode `.claude/` instead of `~/.claude/`, local installs will break

### Dual Location Reality

**Issue:** Specdacular can be installed globally (`~/.claude/`) OR locally (`./.claude/`) and must work from both.

- Files: `bin/install.js`, `hooks/specd-check-update.js`, `hooks/specd-statusline.js`
- Critical code paths that check both:
  - `specd-check-update.js` lines 16-17: Checks project VERSION first, then global
  - `bin/install.js` line 66-71: `getGlobalDir()` respects `CLAUDE_CONFIG_DIR`
- Gotcha: When writing hook code, ALWAYS check project directory first (`./.claude/`), then global (`~/.claude/`)
- Impact: Hooks that only check one location will fail for the other install type

### VERSION File Is Critical But Easy to Break

**Issue:** The VERSION file at `.claude/specdacular/VERSION` is how update checks work. Missing = broken updates.

- Files: `bin/install.js` lines 349-353, `hooks/specd-check-update.js` lines 35-41
- How it breaks: If install.js fails to write VERSION, update checks show version "0.0.0" and suppress update notifications
- Detection: `cat ~/.claude/specdacular/VERSION` should show version like "0.2.5", not "0.0.0" or error
- Safe modification: Never delete VERSION file. Always write it after installation changes.

### Context Window Display Is Intentionally Misleading

**Issue:** The statusline shows context usage scaled to 80%, not actual 100%.

- File: `hooks/specd-statusline.js` lines 20-42
- Why: Line 26 comment: "Scale: 80% real usage = 100% displayed"
- Intentional behavior: At 80% real usage, shows "100%" to warn users earlier
- Don't "fix" this: It's designed to be conservative. Real 100% = death emoji (line 40)

### No Package Dependencies = Intentional

**Issue:** `package.json` has zero dependencies (lines 8-14).

- Files: `package.json`, `bin/install.js`, `hooks/*.js`
- Intentional: Specdacular uses only Node.js built-ins (`fs`, `path`, `os`, `child_process`, `readline`)
- Why: Zero install time, no dependency hell, works everywhere Node >=16.7.0 runs
- Don't add dependencies: If you need a feature, implement with Node built-ins or skip it

### Markdown Files Are Actually Prompts

**Issue:** All `.md` files in `commands/`, `workflows/`, `agents/`, `templates/` are NOT documentation—they're executable prompts for Claude.

- Files: All `.md` files in `commands/specd/`, `specdacular/workflows/`, `agents/`
- Format: YAML frontmatter + XML-like tags (`<purpose>`, `<step>`, `<process>`)
- Gotcha: These files are read by Claude Code's command system. Markdown formatting errors = broken commands
- Safe modification: Test every markdown change by running the command. A typo in `<execution_context>` breaks the entire workflow.

### Template Placeholders Must Match Exactly

**Issue:** Templates use placeholder syntax like `{name}`, `{feature-name}`, `DEC-XXX`, `[YYYY-MM-DD]`.

- Files: All files in `specdacular/templates/features/`
- Critical: Workflows depend on exact placeholder syntax for search/replace
- Don't change: `{name}` → `{feature_name}` will break every workflow that fills templates
- Impact: Mismatched placeholders = workflows write broken documents

## Anti-patterns

### Don't Use Relative Paths in Agent Prompts

**Anti-pattern:**
```markdown
Focus: concerns

Write CONCERNS.md to ../codebase/
```

**Why it breaks:** Agent threads reset `cwd` between bash calls. Relative paths become unpredictable.

**Correct pattern:**
```markdown
Focus: concerns

Write CONCERNS.md to .specd/codebase/ containing:
```

- Evidence: `.claude/agents/specd-codebase-mapper.md` system reminder: "Agent threads always have their cwd reset between bash calls, as a result please only use absolute file paths."

### Don't Add `node_modules/` to Anything

**Anti-pattern:** Including `node_modules/` in grep/find commands.

**Why it breaks:** There IS no `node_modules/` in this project (no dependencies), but generated docs might be used in projects that do have it.

- Correct pattern: Always exclude in templates: `find . -not -path "*/node_modules/*"`
- Files showing correct usage: `agents/specd-codebase-mapper.md` lines 51, 87

### Don't Emit Document Contents from Mapper Agents

**Anti-pattern:** Mapper agent returns full document content to orchestrator.

**Why it breaks:** Context pollution. Each mapper has 200k fresh context. Returning full docs wastes orchestrator context.

- Files: `specdacular/workflows/map-codebase.md` lines 252-265, `agents/specd-codebase-mapper.md` lines 114-127
- Correct pattern: Agents write directly, return only confirmation with line count
- Impact: Wrong pattern = orchestrator context fills with codebase analysis, can't fit all 4 agent responses

### Don't Create Commands Without `execution_context`

**Anti-pattern:**
```markdown
---
name: specd:my-command
description: Does something
---

<process>
...
</process>
```

**Correct pattern:**
```markdown
---
name: specd:my-command
description: Does something
---

<execution_context>
@~/.claude/specdacular/workflows/my-command.md
</execution_context>
```

- Evidence: All commands in `commands/specd/*.md` have `<execution_context>` tag
- Why: Commands are stubs. Real logic lives in workflows. Missing `<execution_context>` = broken command.

## Tech Debt

### Duplicate Directory Structures

**Issue:** Commands and workflows exist in THREE locations:
1. `commands/specd/*.md` (npm package source)
2. `specdacular/workflows/*.md` (npm package source)
3. `.claude/commands/specd/*.md` (installed, with rewritten paths)
4. `.claude/specdacular/workflows/*.md` (installed, with rewritten paths)

- Files: `bin/install.js` lines 291-316
- Why it exists: Commands are stubs (frontmatter + execution_context), workflows are full logic. Separation allows reuse.
- Workaround: When editing, edit in `commands/` or `specdacular/`, never `.claude/`. Reinstall to test.
- Fix approach: Could consolidate, but current pattern works. Not worth refactor risk.

### No Automated Tests

**Issue:** Zero test files in entire codebase.

- Evidence: No `*.test.js`, `*.spec.js` files. No test framework in package.json.
- Impact: Installation bugs require manual testing. Regression risk on every change.
- Workaround: Manual test checklist:
  1. `npx . --global` (test global install)
  2. `npx . --local` (test local install)
  3. In Claude Code: Run each `/specd:*` command
  4. Check hooks: `node hooks/specd-statusline.js < test-input.json`
- Fix approach: Add integration tests that install to temp directory and verify files created

### Hook Command Paths Are Fragile

**Issue:** `settings.json` gets hook paths hardcoded based on install location.

- Files: `bin/install.js` lines 381-422
- Problem: Line 386 builds paths: `const hooksPath = isGlobal ? targetDir.replace(/\\/g, '/') + '/hooks/' : '.claude/hooks/';`
- Fragile: Windows paths, path escaping in JSON, quote handling
- Detection: If statusline stops working, check `~/.claude/settings.json` or `./.claude/settings.json` for malformed `statusLine.command`
- Workaround: Reinstall to regenerate settings
- Fix approach: Use relative paths for local, absolute for global. Better path escaping.

### `config.json` Template Has Dead Fields

**Issue:** Template at `specdacular/templates/features/config.json` has fields that workflows don't use.

- File: `specdacular/templates/features/config.json`
- Dead fields:
  - `mode: "interactive"` (line 5) - nothing checks this
  - `depth: "standard"` (line 6) - nothing checks this
  - `requirements.v1_count`, `requirements.v2_count` (lines 13-14) - never read
- Active fields:
  - `execution.auto_commit` (line 18) - used by `execute-plan.md`
  - `phases` (lines 7-11) - used by STATE.md tracking
- Impact: Minimal. Templates write unused JSON. Wastes ~50 bytes per feature.
- Workaround: Ignore the fields. They're harmless.
- Fix approach: Remove dead fields from template, or implement features that use them

## Fragile Areas

### Parallel Agent Spawning

**Area:** `map-codebase` workflow spawning 4 agents with `run_in_background=true`

- Files: `specdacular/workflows/map-codebase.md` lines 123-247
- Why fragile: Depends on Task tool's background execution. If one agent hangs, orchestrator may timeout waiting
- What breaks it:
  - Agent hitting 200k context (shouldn't happen, but possible)
  - File write permissions on `.specd/codebase/`
  - Network issues during npm install check in agents
- Safe modification:
  1. Always verify agents completed: `ls -la .specd/codebase/` and check file sizes
  2. If one fails, check agent output file for errors
  3. Can manually run missing mapper: `/agents:specd-codebase-mapper` with focus area
- Test coverage: None. Requires manual testing of parallel execution.

### Installation Path Replacement

**Area:** `copyWithPathReplacement()` in install.js

- File: `bin/install.js` lines 107-129
- Why fragile: Regex replacement of `~/.claude/` in ALL `.md` files during copy
- What breaks it:
  - Markdown files that mention `~/.claude/` in code examples (gets replaced incorrectly)
  - Non-UTF8 files (crashes `readFileSync`)
  - Large markdown files (>1MB) could cause memory issues
- Safe modification:
  - Line 124: `content.replace(/~\/\.claude\//g, pathPrefix)` is greedy
  - Add escaping for code blocks: Check if inside ` ``` ` before replacing
  - Or: Use more specific pattern like `@~/.claude/` instead of bare `~/.claude/`
- Current workaround: Don't use `~/.claude/` in prose. Only use in `@` context references.

### Update Check Background Spawn

**Area:** SessionStart hook spawning background update check

- Files: `hooks/specd-check-update.js` lines 24-66
- Why fragile: Spawns Node process with stringified code (`spawn(process.execPath, ['-e', \`...\`])`)
- What breaks it:
  - npm registry down = hangs for 10 seconds (timeout at line 45)
  - JSON escaping in embedded code (lines 29-31)
  - File system permissions on cache directory
- Detection: If statusline stops showing updates, check:
  1. `ls ~/.claude/cache/specd-update-check.json` (should exist)
  2. `cat ~/.claude/cache/specd-update-check.json` (should have `update_available`, `checked` fields)
- Safe modification:
  - Don't touch the `spawn(['-e', ...])` pattern unless you understand shell escaping
  - Test changes by deleting cache file and starting new Claude session
  - Check `child.unref()` at line 66 - critical for non-blocking

### Feature Config Schema Drift

**Area:** Feature `config.json` written by `new-feature` vs read by `execute-plan`

- Files: `specdacular/templates/features/config.json`, `specdacular/workflows/execute-plan.md` lines 84
- Why fragile: No schema validation. If template changes structure, execute-plan breaks silently.
- Current coupling:
  - `execute-plan` reads `config.execution.auto_commit` (line 84)
  - Template provides `execution.auto_commit: false` (line 18-19)
- What breaks it:
  - Renaming `execution` → `exec` in template without updating execute-plan
  - Changing boolean to string (`"false"` instead of `false`)
- Detection: execute-plan silently falls back to no auto-commit if field missing
- Safe modification:
  1. Never remove fields, only add
  2. Always provide defaults in workflows that read config
  3. Test by running full flow: `new-feature` → `plan-feature` → `execute-plan`

## Dependency Notes

### Node.js Version Pinned to >=16.7.0

**Why:** `package.json` line 34: `"node": ">=16.7.0"`

- Reason: Requires `readline` with `rl.on('close')` pattern (used in `bin/install.js` line 459-465)
- Upgrade blocker: None. Can safely raise to >=18 (LTS). But >=16.7.0 maximizes compatibility.
- Don't lower: Node 14 and below lack stable readline promise support

### No External Dependencies Is By Design

**Philosophy:** Zero dependencies = zero install time = zero supply chain risk

- Evidence: `package.json` has no `dependencies` or `devDependencies`
- Trade-off: Must use Node built-ins only. No fancy CLI libraries, no chalk/ora/inquirer.
- What this blocks:
  - Rich terminal UI (no ink/blessed)
  - Progress bars (no ora)
  - Advanced git operations (no simple-git, must shell out)
- Workaround: ANSI escape codes for colors (see `bin/install.js` lines 8-13)
- Don't add: If you need a feature, implement with `child_process.spawn` and built-ins

### Git Required But Not Checked

**Assumption:** Git is installed and repository is initialized.

- Files: Workflows commit with `git add` and `git commit` throughout
- No validation: Nothing checks if `git` is in PATH or if `.git/` exists
- What breaks: `git commit` commands fail silently in non-git directories
- Impact: Users lose their work (feature docs exist but not committed)
- Workaround: Check in workflows: `git rev-parse --git-dir 2>/dev/null || echo "not a git repo"`
- Fix approach: Add git check to first command run (map-codebase, new-feature)

## Performance Notes

### Background Update Check Has 10s Timeout

**Issue:** Update check can block for up to 10 seconds if npm registry is slow.

- File: `hooks/specd-check-update.js` line 45
- Code: `execSync('npm view specdacular version', { timeout: 10000 })`
- Impact: First session after install may feel slow (one-time check)
- Mitigation: Runs in background via `child.unref()` (line 66), shouldn't block Claude UI
- Don't lower timeout: <5s causes spurious failures on slow networks

### Parallel Agents = 4x Context Usage

**Issue:** map-codebase spawns 4 agents simultaneously, each with 200k context.

- File: `specdacular/workflows/map-codebase.md`
- Total context: 4 × 200k = 800k tokens across agents
- Cost: ~$24 per full map-codebase run (at Sonnet 4.5 pricing)
- Trade-off: Speed vs cost. Parallel is 4x faster than sequential.
- Optimization: Could rewrite as sequential with context reuse, but loses speed benefit

### Large Codebases Will Hit Grep/Find Limits

**Issue:** Mapper agents use `head -N` to limit output, but very large codebases may still timeout.

- Files: `agents/specd-codebase-mapper.md` lines 51, 87
- Example: `find . -name "*.ts" | head -100` on 10k+ file repo
- Impact: Agents get partial view, miss important files
- Detection: Generated docs mention "many more files..." or seem incomplete
- Workaround: Use `$ARGUMENTS` to focus mapping on subdirectory (not yet implemented)
- Fix approach: Add codebase size detection, auto-focus on `src/` if >1000 files

### Install Script Has No Progress Indicator

**Issue:** `bin/install.js` copies files synchronously with no progress output.

- File: `bin/install.js` lines 107-129
- Impact: On slow filesystems (network drives), install feels frozen
- User sees: Banner, then long pause, then "✓ Installed" messages
- Workaround: None. Installation is fast enough (<1s) on local filesystems.
- Fix approach: Add console.log before each major copy operation

---

*Concerns audit: 2026-02-04*
