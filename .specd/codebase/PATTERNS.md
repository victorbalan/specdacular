# Codebase Patterns
Generated: 2026-02-04

## Workflow/Command Pattern

Workflows are markdown files that define agent behaviors. Commands are thin wrappers that reference workflows.

**Command file structure:**
```markdown
// From commands/specd.map-codebase.md:1-24
---
name: specd.map-codebase
description: Analyze codebase with parallel agents to produce AI-optimized documentation
argument-hint: ""
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
---

<objective>
Analyze existing codebase using parallel mapper agents to produce 4 AI-optimized documents.

Each mapper agent explores a focus area and **writes documents directly** to `.specd/codebase/`. The orchestrator only receives confirmations, keeping context usage minimal.

Output: .specd/codebase/ folder with 4 documents designed for Claude consumption.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/map-codebase.md
</execution_context>
```

**Pattern:** Commands contain frontmatter + brief objective + reference to workflow. The workflow file (`@~/.claude/specdacular/workflows/map-codebase.md`) contains the detailed process.

## Agent Definition Pattern

Agents are defined in markdown with frontmatter.

```markdown
// From agents/specd-codebase-mapper.md:1-17
---
name: specd-codebase-mapper
description: Explores codebase and writes structured analysis documents. Spawned by map-codebase with a focus area. Writes documents directly to reduce orchestrator context load.
tools: Read, Bash, Grep, Glob, Write
color: cyan
---

<role>
You are a codebase mapper optimized for AI consumption. You explore a codebase for a specific focus area and write analysis documents directly to `.specd/codebase/`.

You are spawned by `/specd.map-codebase` with one of four focus areas:
- **map**: Create navigation map → write MAP.md
- **patterns**: Extract code patterns → write PATTERNS.md
- **structure**: Document organization → write STRUCTURE.md
- **concerns**: Find gotchas and problems → CONCERNS.md

Your job: Explore thoroughly, then write document directly. Return confirmation only.
</role>
```

**Pattern:** Agent files have `name`, `description`, `tools`, `color` frontmatter, then role description with structured sections like `<role>`, `<philosophy>`, `<process>`, etc.

## Workflow Structure Pattern

Workflows use XML-style tags to organize content.

```markdown
// From specdacular/workflows/map-codebase.md:25-48
<process>

<step name="check_existing">
Check if .specd/codebase/ already exists:

```bash
ls -la .specd/codebase/ 2>/dev/null
```

**If exists:**

Use the AskUserQuestion tool:

```json
{
  "questions": [{
    "question": "Codebase map already exists. What would you like to do?",
    "header": "Existing map",
    "options": [
      {
        "label": "Refresh - remap codebase",
        "description": "Delete existing docs and generate fresh analysis"
      }
    ]
  }]
}
```
```

**Pattern:** `<process>` contains multiple `<step name="...">` sections. Each step includes bash commands, tool usage examples, and decision logic with "If X then Y" flow control.

## Parallel Agent Spawning Pattern

Use Task tool with `run_in_background=true` for parallel agent execution.

```markdown
// From specdacular/workflows/map-codebase.md:123-163
**Agent 2: Patterns Focus**

Task tool parameters:
```
subagent_type: "specd-codebase-mapper"
model: "sonnet"
run_in_background: true
description: "Map codebase patterns"
```

Prompt:
```
Focus: patterns

Extract code patterns from this codebase for Claude to follow.

Write PATTERNS.md to .specd/codebase/ containing:
- Service/handler patterns (with real code examples)
- Error handling patterns (with real code examples)
- Testing patterns (with real code examples)
- Mocking patterns (with real code examples)
- Import conventions

Use ACTUAL code from the codebase, not generic examples. Include file paths and line numbers.
Return confirmation only when done.
```
```

**Pattern:** Spawn multiple Task calls with `run_in_background: true`, each with different `subagent_type`, `model`, and specific prompts. Agents write directly to files, orchestrator only receives confirmations.

## Error Handling Pattern

Use bash exit codes and inline error messaging.

```javascript
// From bin/install.js:133-151
function verifyInstalled(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}`);
    return false;
  }
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      console.error(`  ${yellow}✗${reset} Failed to install ${description}: empty`);
      return false;
    }
  } catch (e) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: ${e.message}`);
    return false;
  }
  return true;
}
```

**Pattern:** Functions return boolean success/failure. Errors use colored console output (`yellow` for warnings/errors, `green` for success). Try-catch wraps filesystem operations with specific error messages.

## File Path Handling Pattern

Always use path.join and handle tilde expansion.

```javascript
// From bin/install.js:66-81
function getGlobalDir() {
  if (process.env.CLAUDE_CONFIG_DIR) {
    return expandTilde(process.env.CLAUDE_CONFIG_DIR);
  }
  return path.join(os.homedir(), '.claude');
}

function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}
```

**Pattern:** Check environment variables first, fall back to defaults. Always expand tilde (`~/`) to full home directory path. Use `path.join()` for all path construction.

## Settings JSON Management Pattern

Read, modify, write with proper JSON formatting.

```javascript
// From bin/install.js:84-102
function readSettings(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function writeSettings(settingsPath, settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}
```

**Pattern:** Read settings with try-catch, return empty object on failure. Write with 2-space indent and trailing newline. Always parse before modifying.

## File Copy with Content Replacement Pattern

Copy files while replacing path references.

```javascript
// From bin/install.js:105-130
function copyWithPathReplacement(srcDir, destDir, pathPrefix) {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithPathReplacement(srcPath, destPath, pathPrefix);
    } else if (entry.name.endsWith('.md')) {
      let content = fs.readFileSync(srcPath, 'utf8');
      // Replace path references
      content = content.replace(/~\/\.claude\//g, pathPrefix);
      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
```

**Pattern:** Recursive copy with directory cleanup. For markdown files, replace path references (e.g., `~/.claude/` → `./.claude/` for local installs). Use `withFileTypes` for efficient type checking. Always create parent directories with `recursive: true`.

## CLI Banner Pattern

Use ANSI colors and ASCII art for branding.

```javascript
// From bin/install.js:8-36
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

const pkg = require('../package.json');

const banner = '\n' +
  cyan + '  ███████╗██████╗ ███████╗ ██████╗██████╗ \n' +
  '  ██╔════╝██╔══██╗██╔════╝██╔════╝██╔══██╗\n' +
  '  ███████╗██████╔╝█████╗  ██║     ██║  ██║\n' +
  '  ╚════██║██╔═══╝ ██╔══╝  ██║     ██║  ██║\n' +
  '  ███████║██║     ███████╗╚██████╗██████╔╝\n' +
  '  ╚══════╝╚═╝     ╚══════╝ ╚═════╝╚═════╝ ' + reset + '\n' +
  '\n' +
  '  Specdacular ' + dim + 'v' + pkg.version + reset + '\n' +
  '  Feature planning for existing codebases.\n';

console.log(banner);
```

**Pattern:** Define ANSI color codes as constants. Include version from package.json. Use `dim` for secondary info, `cyan` for brand color, `reset` to prevent color bleed.

## Background Process Pattern

Spawn detached background processes for non-blocking operations.

```javascript
// From hooks/specd-check-update.js:24-66
const child = spawn(process.execPath, ['-e', `
  const fs = require('fs');
  const { execSync } = require('child_process');

  const cacheFile = ${JSON.stringify(cacheFile)};
  const projectVersionFile = ${JSON.stringify(projectVersionFile)};
  const globalVersionFile = ${JSON.stringify(globalVersionFile)};

  // Check project directory first (local install), then global
  let installed = '0.0.0';
  try {
    if (fs.existsSync(projectVersionFile)) {
      installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
    } else if (fs.existsSync(globalVersionFile)) {
      installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
    }
  } catch (e) {}

  let latest = null;
  try {
    latest = execSync('npm view specdacular version', { encoding: 'utf8', timeout: 10000, windowsHide: true }).trim();
  } catch (e) {}

  const hasRealInstall = installed !== '0.0.0';
  const isNewer = latest && installed !== latest && latest > installed;

  const result = {
    update_available: hasRealInstall && isNewer,
    installed,
    latest: latest || 'unknown',
    checked: Math.floor(Date.now() / 1000)
  };

  fs.writeFileSync(cacheFile, JSON.stringify(result));
`], {
  stdio: 'ignore',
  windowsHide: true
});

child.unref();
```

**Pattern:** Use `spawn()` with `-e` flag to execute inline JavaScript. Pass data via `JSON.stringify()`. Set `stdio: 'ignore'` and call `unref()` to detach. Write results to cache file for later reading. Use timeouts on external commands.

## Statusline Pattern

Read JSON from stdin, write formatted string to stdout.

```javascript
// From hooks/specd-statusline.js:9-59
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const model = data.model?.display_name || 'Claude';
    const dir = data.workspace?.current_dir || process.cwd();
    const remaining = data.context_window?.remaining_percentage;

    // Context window display (shows USED percentage scaled to 80% limit)
    let ctx = '';
    if (remaining != null) {
      const rem = Math.round(remaining);
      const rawUsed = Math.max(0, Math.min(100, 100 - rem));
      // Scale: 80% real usage = 100% displayed
      const used = Math.min(100, Math.round((rawUsed / 80) * 100));

      // Build progress bar (10 segments)
      const filled = Math.floor(used / 10);
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

      // Color based on scaled usage
      if (used < 63) {
        ctx = ` \x1b[32m${bar} ${used}%\x1b[0m`;
      } else if (used < 81) {
        ctx = ` \x1b[33m${bar} ${used}%\x1b[0m`;
      } else if (used < 95) {
        ctx = ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
      } else {
        ctx = ` \x1b[5;31m💀 ${bar} ${used}%\x1b[0m`;
      }
    }

    // Specdacular update available?
    let specdUpdate = '';
    const homeDir = os.homedir();
    const cacheFile = path.join(homeDir, '.claude', 'cache', 'specd-update-check.json');
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cache.update_available) {
          specdUpdate = '\x1b[33m⬆ /specd.update\x1b[0m │ ';
        }
      } catch (e) {}
    }

    // Output
    const dirname = path.basename(dir);
    process.stdout.write(`${specdUpdate}\x1b[2m${model}\x1b[0m │ \x1b[2m${dirname}\x1b[0m${ctx}`);
  } catch (e) {
    // Silent fail
  }
});
```

**Pattern:** Accumulate stdin, parse as JSON. Extract fields with optional chaining and defaults. Build colored output string with progress bar using Unicode characters. Silent fail on errors (no console output). Use `process.stdout.write()` for single-line output.

## Template File Structure Pattern

Templates use placeholders in braces for replacement.

```markdown
// From specdacular/templates/features/FEATURE.md:1-15
# Feature: {feature-name}

## What This Is

{1-2 sentences: what capability this adds. Technical focus, not marketing.}

## Technical Requirements

### Must Create

{Files and components that must be created for this feature to work.}

- [ ] `{path/to/file.ts}` — {What it does}
- [ ] `{path/to/file.tsx}` — {What it does}
- [ ] `{path/to/file.ts}` — {What it does}
```

**Pattern:** Use `{placeholder}` for values to be replaced. Use checkboxes `- [ ]` for trackable items. Include inline guidance in braces like `{1-2 sentences: ...}`. Always include file paths in backticks.

## Plan Template Pattern

Plans use YAML frontmatter + structured markdown.

```markdown
// From specdacular/templates/features/PLAN.md:1-34
---
feature: {feature-name}
phase: {N}
plan: {NN}
depends_on: []
creates:
  - {path/to/new/file.ts}
  - {path/to/new/file.tsx}
modifies:
  - {path/to/existing/file.ts}
---

# Plan {NN}: {Plan Title}

## Objective

{What this plan accomplishes and why. 1-2 sentences max.}

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Code patterns to follow
- `@.specd/codebase/STRUCTURE.md` — Where files go
- `@{path/to/pattern/file}` — Pattern to follow for this task

**Relevant Decisions:**
- DEC-XXX: {Decision that affects this plan}
- DEC-YYY: {Another relevant decision}

**From Research:** (if RESEARCH.md exists)
- {Key finding that affects implementation}
- {Pitfall to avoid}
```

**Pattern:** YAML frontmatter tracks metadata (feature, phase, dependencies, file changes). Use `@path` notation for file references Claude should read. Link to decisions and research findings.

## Import Conventions

**Workflow files:** Reference other markdown files with `@` prefix.

```markdown
// From commands/specd.map-codebase.md:22-24
<execution_context>
@~/.claude/specdacular/workflows/map-codebase.md
</execution_context>
```

**Node.js files:** Use require for CommonJS, relative paths for local modules.

```javascript
// From bin/install.js:3-6
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
```

**Pattern:** Workflows use `@` for markdown file references. JavaScript uses CommonJS `require()`. No ES6 imports in this codebase.

## Commit Message Pattern

Workflows specify commit messages in heredoc format.

```markdown
// From specdacular/workflows/map-codebase.md:288-304
<step name="commit_codebase_map">
Commit the codebase map:

```bash
git add .specd/codebase/*.md
git commit -m "$(cat <<'EOF'
docs: map codebase for Claude

- MAP.md - Navigation: modules, functions, integrations
- PATTERNS.md - Code examples: services, errors, testing
- STRUCTURE.md - Organization: where to put new code
- CONCERNS.md - Warnings: gotchas, anti-patterns, debt

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
```

**Pattern:** Use heredoc (`cat <<'EOF'`) for multi-line commit messages. Follow conventional commits format (`docs:`, `feat:`, etc.). Include `Co-Authored-By: Claude` for AI-assisted changes. Use bullet points to summarize changes.

## Config JSON Pattern

Feature config uses nested structure with execution settings.

```json
// From specdacular/templates/features/config.json:1-21
{
  "feature_name": "{name}",
  "feature_abbrev": "{ABBREV}",
  "created": "{date}",
  "mode": "interactive",
  "depth": "standard",
  "phases": {
    "total": 0,
    "completed": 0,
    "current": 1
  },
  "requirements": {
    "v1_count": 0,
    "v2_count": 0,
    "completed": 0
  },
  "execution": {
    "auto_commit": false
  }
}
```

**Pattern:** Track feature metadata, progress counters, and execution behavior. Use nested objects for related settings. `execution.auto_commit` controls whether plans auto-commit after each task.

## Validation Pattern (Workflows)

Workflows validate inputs at the start with bash conditionals.

```markdown
// From specdacular/workflows/execute-plan.md:49-77
<step name="validate">
Validate feature exists and has plans.

```bash
# Check feature exists
[ -d ".specd/tasks/$ARGUMENTS" ] || { echo "not found"; exit 1; }

# Check plans exist
[ -d ".specd/tasks/$ARGUMENTS/plans" ] || { echo "no plans"; exit 1; }

# Check ROADMAP exists
[ -f ".specd/tasks/$ARGUMENTS/ROADMAP.md" ] || { echo "no roadmap"; exit 1; }
```

**If feature not found:**
```
Feature '{name}' not found.

Run /specd.new-feature {name} to create it.
```

**If no plans:**
```
Feature '{name}' has no plans yet.

Run /specd.plan-feature {name} to create plans.
```
```

**Pattern:** Use bash test operators (`[ -d ]`, `[ -f ]`) with `||` for early exit. Provide clear error messages with actionable next steps. Reference commands user should run to fix the issue.
