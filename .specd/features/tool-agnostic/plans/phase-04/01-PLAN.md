---
feature: tool-agnostic
phase: 4
plan: 01
depends_on: []
creates:
  - codex/AGENTS.md
modifies:
  - bin/install.js
  - package.json
  - README.md
---

# Plan 01: Installation & Integration

## Objective

Add `--codex` flag to the installer, generate AGENTS.md for Codex projects, add pre-commit hook for staleness detection, and update README with Codex instructions.

## Context

**Reference these files:**
- `@bin/install.js` — Current installer with --global/--local flags
- `@bin/build-codex.js` — Build script that generates codex/ directory
- `@README.md` — Current docs (Claude Code focused)
- `@package.json` — Current package config

**Relevant Decisions:**
- DEC-003: Generated files committed to repository
- DEC-006: Pre-commit hook for staleness
- DEC-009: Command stubs created (18 skills available)

## Tasks

### Task 1: Add --codex flag to installer

**Files:** `bin/install.js`, `package.json`

**Action:**

Add `--codex` flag handling to `bin/install.js`. When `--codex` is used:

1. Parse `--codex` from args (alongside existing `--global`, `--local`)
2. Copy skills from `codex/skills/` to `.codex/skills/` in current directory
3. Generate `AGENTS.md` in current directory (if not exists or user confirms overwrite)
4. Print Codex-specific success message
5. Skip Claude Code-specific setup (hooks, statusline, settings.json)

Add to argument parsing:
```javascript
const hasCodex = args.includes('--codex');
```

Add to help text:
```
    ${cyan}--codex${reset}        Install Codex skills (to .codex/skills/)
```

Add codex install function:
```javascript
function installCodex() {
  const src = path.join(__dirname, '..', 'codex', 'skills');
  const destDir = path.join(process.cwd(), '.codex', 'skills');

  console.log(`  Installing Codex skills to ${cyan}.codex/skills/${reset}\n`);

  if (!fs.existsSync(src)) {
    console.error(`  ${yellow}✗${reset} Codex skills not found. Run 'npm run build:codex' first.`);
    process.exit(1);
  }

  // Copy each skill directory
  const skills = fs.readdirSync(src, { withFileTypes: true })
    .filter(e => e.isDirectory());

  for (const skill of skills) {
    const skillSrc = path.join(src, skill.name);
    const skillDest = path.join(destDir, skill.name);
    copyWithPathReplacement(skillSrc, skillDest, '.codex/');
  }

  console.log(`  ${green}✓${reset} Installed ${skills.length} Codex skills`);

  // Generate AGENTS.md
  generateAgentsMd();

  console.log(`
  ${green}Done!${reset} Codex skills installed.

  ${yellow}Next:${reset}
    codex         — Start Codex CLI
    $specd-help   — Show all specdacular commands
`);
}
```

Update main logic to route `--codex`:
```javascript
if (hasCodex) {
  installCodex();
} else if (hasGlobal || hasLocal) {
  install(hasGlobal);
} else {
  promptLocation();
}
```

Also update `package.json` `files` array to include `codex`:
```json
"files": [
  "bin",
  "commands",
  "agents",
  "specdacular",
  "codex",
  "hooks",
  "README.md"
]
```

**Verify:**
```bash
node bin/install.js --codex 2>&1 | head -20
ls .codex/skills/ | head -5
```

**Done when:**
- [ ] `--codex` flag parsed and routes to installCodex()
- [ ] Skills copied to .codex/skills/
- [ ] Help text updated
- [ ] package.json files array includes codex

---

### Task 2: Generate AGENTS.md

**Files:** `bin/install.js`

**Action:**

Add `generateAgentsMd()` function that creates an `AGENTS.md` file in the current project directory.

```javascript
function generateAgentsMd() {
  const agentsMdPath = path.join(process.cwd(), 'AGENTS.md');

  if (fs.existsSync(agentsMdPath)) {
    console.log(`  ${yellow}⚠${reset} AGENTS.md already exists — skipping`);
    return;
  }

  const content = `# Specdacular — AI Feature Planning

This project uses [Specdacular](https://github.com/victorbalan/specdacular) for feature planning and codebase documentation.

## Codebase Context

If \`.specd/codebase/\` exists, read these files for project understanding:
- \`.specd/codebase/MAP.md\` — System overview
- \`.specd/codebase/PATTERNS.md\` — Code patterns and conventions
- \`.specd/codebase/STRUCTURE.md\` — Directory layout

## Available Skills

### Core Flow
- \`$specd-feature-new\` — Initialize a new feature
- \`$specd-feature-continue\` — Continue feature lifecycle (picks up where you left off)
- \`$specd-feature-toolbox\` — Advanced operations (discuss, research, plan, review, insert)

### Feature Operations
- \`$specd-feature-discuss\` — Discuss and clarify feature requirements
- \`$specd-feature-research\` — Research implementation patterns
- \`$specd-feature-plan\` — Create roadmap with phases

### Phase Operations
- \`$specd-phase-prepare\` — Prepare a phase (discuss + optional research)
- \`$specd-phase-plan\` — Create detailed executable plans
- \`$specd-phase-execute\` — Execute plans with progress tracking
- \`$specd-phase-research\` — Research phase-specific patterns
- \`$specd-phase-insert\` — Insert a new phase into the roadmap

### Review
- \`$specd-feature-review\` — Review executed work, approve or request fixes

### Utilities
- \`$specd-help\` — Show all commands
- \`$specd-status\` — Feature status dashboard
- \`$specd-config\` — Configure settings
- \`$specd-map-codebase\` — Analyze and document codebase
- \`$specd-blueprint\` — Generate visual specifications

## Workflow

1. Map your codebase: \`$specd-map-codebase\`
2. Start a feature: \`$specd-feature-new my-feature\`
3. Drive the lifecycle: \`$specd-feature-continue my-feature\`

The continue command figures out what to do next — no need to remember individual commands.
`;

  fs.writeFileSync(agentsMdPath, content);
  console.log(`  ${green}✓${reset} Generated AGENTS.md`);
}
```

**Verify:**
```bash
node bin/install.js --codex 2>&1 | grep AGENTS
cat AGENTS.md | head -5
```

**Done when:**
- [ ] AGENTS.md generated in project root
- [ ] Under 32 KiB
- [ ] Lists all available skills
- [ ] Points to .specd/codebase/ docs
- [ ] Skips if AGENTS.md already exists

---

### Task 3: Add pre-commit staleness check and update README

**Files:** `package.json`, `README.md`

**Action:**

Add a `check:codex` script to package.json for CI and pre-commit usage:
```json
"scripts": {
  "build:codex": "node bin/build-codex.js",
  "check:codex": "node bin/build-codex.js && git diff --exit-code codex/"
}
```

Update README.md to add Codex installation section. Add after the existing Installation section:

```markdown
## Codex Support

Specdacular also supports [OpenAI Codex CLI](https://github.com/openai/codex).

### Install for Codex

```bash
npx specdacular --codex
```

This installs Codex skills to `.codex/skills/` and generates `AGENTS.md`.

### Available Codex Skills

All Specdacular commands work as Codex skills. Use `$specd-help` to see all commands, or `$specd-feature-continue` to drive the feature lifecycle.

### Development

When modifying workflows, regenerate Codex output:

```bash
npm run build:codex        # Regenerate codex/ directory
npm run check:codex        # Verify codex/ is up to date (for CI)
```
```

**Verify:**
```bash
grep "codex" package.json
grep -c "Codex" README.md
```

**Done when:**
- [ ] `check:codex` script added to package.json
- [ ] README has Codex installation section
- [ ] README has development/regeneration instructions

---

## Verification

After all tasks complete:

```bash
# Install works
node bin/install.js --codex
ls .codex/skills/ | wc -l  # should be 18
cat AGENTS.md | wc -c       # should be < 32768

# Check script works (should pass since we just built)
npm run check:codex

# README has Codex section
grep "Codex Support" README.md

# Help text shows --codex
node bin/install.js --help | grep codex
```

**Plan is complete when:**
- [ ] --codex flag installs skills to .codex/skills/
- [ ] AGENTS.md generated
- [ ] check:codex script works
- [ ] README updated
