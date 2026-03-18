---
task: best-practices-docs
phase: 1
depends_on: []
creates:
  - commands/specd.best-practices.md
  - specdacular/workflows/best-practices.md
modifies: []
---

# Phase 1: Command & Tech Detection

## Objective

Create the `/specd.best-practices` command stub and workflow with tech stack detection and user focus area prompting. The workflow should have all step placeholders ready for agent integration in Phase 2.

## Context

**Reference these files:**
- `@commands/specd.docs.md` — Command stub pattern (YAML frontmatter + execution_context)
- `@specdacular/workflows/docs.md` — Workflow structure pattern (steps, agent spawning, output writing)
- `@specdacular/workflows/new-project.md` — AskUserQuestion and agent spawn patterns

**Relevant Decisions:**
- DEC-001: Present options, don't prescribe — output doc shows tradeoffs, not single choices
- DEC-002: Output stays separate from CLAUDE.md — workflow does NOT modify CLAUDE.md
- DEC-003: Ask user for focus areas before research — AskUserQuestion step before agents
- DEC-006: Detect and research all stacks — enumerate all detected stacks, ask user if 3+

**From Research:**
- Command auto-discovery: `install.js` picks up all `specd.*.md` in `commands/` — no registration needed
- Tech detection: marker files (package.json, pyproject.toml, go.mod, etc.) + dependency parsing for frameworks
- Monorepo false-positive risk: weight source file volume over config file presence, ask user to confirm when 3+ stacks detected
- Use `@~/.claude/` in source paths — installer rewrites automatically

---

## Tasks

### Task 1: Create Command Stub

**Files:** `commands/specd.best-practices.md`

**Action:**
Create the command stub following the exact pattern from `commands/specd.docs.md`:
- YAML frontmatter with `name: specd.best-practices`, `description` about generating best practices docs, `argument-hint: ""`
- `allowed-tools`: Read, Bash, Glob, Grep, Write, Edit, Agent, AskUserQuestion, WebSearch, WebFetch (agents need web access)
- `<objective>` section describing what the command does
- `<execution_context>` pointing to `@~/.claude/specdacular/workflows/best-practices.md`
- `<context>` section with key principles
- `<when_to_use>` section
- `<process>` section with numbered high-level steps
- `<success_criteria>` checklist

**Verify:**
```bash
head -5 commands/specd.best-practices.md | grep -q "name: specd.best-practices" && echo "OK" || echo "FAIL"
```

**Done when:**
- [ ] Command stub exists with correct frontmatter
- [ ] execution_context points to workflow file
- [ ] allowed-tools includes WebSearch and WebFetch for agent research

---

### Task 2: Create Workflow Skeleton

**Files:** `specdacular/workflows/best-practices.md`

**Action:**
Create the main workflow file with the full step structure. Use the `<purpose>`, `<philosophy>`, `<process>` pattern from existing workflows like `docs.md`.

Steps to include:
1. `detect_stack` — Run bash commands to check for marker files and parse dependencies (see Research: Tech Stack Detection table). Output a structured list of detected stacks with frameworks.
2. `present_stacks` — Show detected stacks to user. If 3+ stacks detected, use AskUserQuestion to let user select which to focus on.
3. `ask_focus` — Use AskUserQuestion to ask user for focus areas (DEC-003). Options: "Everything", "Project structure & patterns", "Claude Code tools (MCP, skills, hooks)", "Tooling & DX (linting, testing, CI)", or free-text.
4. `spawn_agents` — Placeholder step that will spawn 3 agents in Phase 2. For now, include the step with a clear comment marking where agent spawning goes, and define the 3 agent roles per DEC-007.
5. `collect_results` — Placeholder for collecting agent outputs from temp files.
6. `merge_and_write` — Placeholder for merging agent outputs into `docs/best-practices.md` per DEC-005 output structure.
7. `completion` — Show summary to user.

**For the `detect_stack` step, implement the full detection logic:**
- Check for marker files: package.json, pyproject.toml, requirements.txt, go.mod, Cargo.toml, pom.xml, build.gradle, Gemfile, composer.json, *.csproj, mix.exs
- For each found marker, parse dependencies to detect frameworks (e.g., package.json → look for react, next, express in dependencies)
- Count source files by extension to weight detection (avoid false positives from build tool configs)
- Store results in variables for later steps

**Verify:**
```bash
grep -c '<step name=' specdacular/workflows/best-practices.md
```

**Done when:**
- [ ] Workflow has all 7 steps defined
- [ ] detect_stack step has full marker file detection logic
- [ ] ask_focus step uses AskUserQuestion with focus area options
- [ ] Agent spawn step has clear placeholder with agent role definitions
- [ ] Output doc structure matches DEC-005 categories

---

### Task 3: Verify End-to-End Structure

**Files:** `commands/specd.best-practices.md`, `specdacular/workflows/best-practices.md`

**Action:**
Verify that:
1. The command stub's execution_context correctly references the workflow
2. The workflow's step flow is complete (no dangling "Continue to..." references)
3. All `@~/.claude/` paths are used consistently (installer will rewrite them)
4. The detect_stack bash commands are syntactically valid
5. AskUserQuestion usage follows the pattern from existing workflows

Run a dry check by reading both files and confirming structural integrity.

**Verify:**
```bash
# Check command references workflow
grep -q "best-practices.md" commands/specd.best-practices.md && echo "ref OK" || echo "ref FAIL"
# Check workflow has all expected steps
for step in detect_stack present_stacks ask_focus spawn_agents collect_results merge_and_write completion; do
  grep -q "name=\"$step\"" specdacular/workflows/best-practices.md && echo "$step OK" || echo "$step FAIL"
done
```

**Done when:**
- [ ] Command → workflow reference is correct
- [ ] All 7 workflow steps are present and connected
- [ ] Bash commands in detect_stack are syntactically valid

---

## Verification

After all tasks complete:

```bash
# Command stub exists with correct name
grep -q "name: specd.best-practices" commands/specd.best-practices.md
# Workflow exists with all steps
test -f specdacular/workflows/best-practices.md
# Workflow has detection for key marker files
grep -q "package.json" specdacular/workflows/best-practices.md
grep -q "pyproject.toml" specdacular/workflows/best-practices.md
grep -q "go.mod" specdacular/workflows/best-practices.md
echo "Phase 1 verification passed"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/best-practices-docs/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
