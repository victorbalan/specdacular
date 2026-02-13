---
feature: tool-agnostic
phase: 3
plan: 01
depends_on: []
creates:
  - commands/specd/feature/discuss.md
  - commands/specd/feature/research.md
  - commands/specd/feature/plan.md
  - commands/specd/feature/review.md
  - commands/specd/phase/prepare.md
  - commands/specd/phase/plan.md
  - commands/specd/phase/research.md
  - commands/specd/phase/execute.md
  - commands/specd/phase/insert.md
modifies:
  - bin/build-codex.js
---

# Plan 01: Create Command Stubs + Extend Build Script

## Objective

Create 9 missing command files for workflows that currently lack them, and extend the build script to handle the full set of 18+ skills including parallel→sequential agent conversion.

## Context

**Reference these files:**
- `@commands/specd/feature/new.md` — Pattern for feature-level command files
- `@commands/specd/status.md` — Pattern for simple command files
- `@bin/build-codex.js` — Current build script

**Relevant Decisions:**
- DEC-009: Create command stubs for workflow-only files
- DEC-010: Parallel agents → sequential with warnings in Codex

**From Research:**
- Only map-codebase truly uses parallel agents (4 background)
- research-phase/prepare-phase describe agents but run sequentially
- Task tool references need prose-level translation

## Tasks

### Task 1: Create feature-level command stubs

**Files:** `commands/specd/feature/discuss.md`, `commands/specd/feature/research.md`, `commands/specd/feature/plan.md`, `commands/specd/feature/review.md`

**Action:**

Create 4 command stubs following the pattern from `commands/specd/feature/new.md`. Each command needs:
- YAML frontmatter: name, description, argument-hint, allowed-tools
- `<objective>` block describing what the command does
- `<execution_context>` referencing the workflow

**discuss.md:**
```markdown
---
name: specd:feature:discuss
description: Continue or deepen discussion about a feature
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Continue or deepen understanding of a feature through targeted discussion. Can be called many times — context accumulates across sessions.

Shows what's already been discussed, identifies remaining gray areas, probes until clear, and records decisions.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/discuss-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS
</context>
```

**research.md:**
```markdown
---
name: specd:feature:research
description: Research implementation patterns for a feature
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebSearch
  - WebFetch
---

<objective>
Research how to implement a feature by investigating codebase integration, external patterns, and common pitfalls. Produces RESEARCH.md.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/research-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS
</context>
```

**plan.md:**
```markdown
---
name: specd:feature:plan
description: Create roadmap with phase overview for a feature
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Create a roadmap with phase overview and empty phase directories. Phases follow natural code dependencies (types→API→UI). Detailed plans are created later per-phase.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/plan-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS
</context>
```

**review.md:**
```markdown
---
name: specd:feature:review
description: Review executed phase work and approve or request fixes
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
User-guided review of an executed phase. Shows what was built (git diff), provides test guidance, and takes user feedback to generate fix plans.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/review-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS
</context>
```

**Verify:**
```bash
ls commands/specd/feature/*.md
```

Expected: continue.md, discuss.md, new.md, plan.md, research.md, review.md, toolbox.md

**Done when:**
- [ ] 4 new command files created in commands/specd/feature/
- [ ] Each has valid YAML frontmatter
- [ ] Each references correct workflow in execution_context

---

### Task 2: Create phase-level command stubs

**Files:** `commands/specd/phase/prepare.md`, `commands/specd/phase/plan.md`, `commands/specd/phase/research.md`, `commands/specd/phase/execute.md`, `commands/specd/phase/insert.md`

**Action:**

Create `commands/specd/phase/` directory with 5 command stubs.

**prepare.md:**
```markdown
---
name: specd:phase:prepare
description: Prepare a phase by discussing gray areas and optionally researching
argument-hint: "[feature-name] [phase-number]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
  - WebSearch
  - WebFetch
---

<objective>
Prepare a phase for execution by discussing phase-specific gray areas and optionally researching implementation patterns. Single command replaces the discuss-then-research two-step.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/prepare-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (feature-name phase-number)
</context>
```

**plan.md:**
```markdown
---
name: specd:phase:plan
description: Create detailed executable plans for a phase
argument-hint: "[feature-name] [phase-number]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
Create detailed, executable PLAN.md files for a single phase. Plans are prompts — each contains everything needed to implement without asking questions.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/plan-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (feature-name phase-number)
</context>
```

**research.md:**
```markdown
---
name: specd:phase:research
description: Research implementation patterns for a specific phase
argument-hint: "[feature-name] [phase-number]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebSearch
  - WebFetch
---

<objective>
Research implementation patterns for a specific phase by investigating codebase integration, phase-type patterns, and pitfalls.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/research-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (feature-name phase-number)
</context>
```

**execute.md:**
```markdown
---
name: specd:phase:execute
description: Execute plans for a feature with progress tracking
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Execute a plan from a feature, tracking progress and logging deviations. Auto-fixes bugs/blockers, asks before architectural changes, stops on verification failure.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/execute-plan.md
</execution_context>

<context>
Feature name: $ARGUMENTS
</context>
```

**insert.md:**
```markdown
---
name: specd:phase:insert
description: Insert a new phase into the roadmap
argument-hint: "[feature-name] [after-phase]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Insert a new phase into an existing roadmap using decimal numbering (e.g., phase 2.1 between phases 2 and 3). Useful when review reveals needed additions.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/insert-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (feature-name after-phase-number)
</context>
```

**Verify:**
```bash
ls commands/specd/phase/*.md
```

Expected: execute.md, insert.md, plan.md, prepare.md, research.md

**Done when:**
- [ ] commands/specd/phase/ directory created with 5 files
- [ ] Each has valid YAML frontmatter
- [ ] Each references correct workflow

---

### Task 3: Rebuild and verify all skills generate

**Files:** `bin/build-codex.js`

**Action:**

Run the build script and verify it now discovers all 18 commands (9 existing + 9 new) and generates skills for each.

```bash
node bin/build-codex.js
```

Expected: 18 skills generated, 0 skipped.

Then run full verification:
```bash
# No Claude Code artifacts
grep -r "~/.claude/" codex/ && echo "FAIL" || echo "PASS"
grep -r "Read tool\|Write tool\|Grep tool\|Glob tool\|Bash tool" codex/ && echo "FAIL" || echo "PASS"

# Auto-generated headers
for f in $(find codex/ -name "*.md"); do head -1 "$f" | grep -q "AUTO-GENERATED" || echo "Missing: $f"; done

# Skill pointers present where expected
grep "see skill:" codex/skills/specd-feature-toolbox/references/workflow.md | head -3

# All expected skills exist
for s in specd-help specd-status specd-config specd-blueprint specd-map-codebase specd-update specd-feature-new specd-feature-continue specd-feature-toolbox specd-feature-discuss specd-feature-research specd-feature-plan specd-feature-review specd-phase-prepare specd-phase-plan specd-phase-research specd-phase-execute specd-phase-insert; do
  [ -d "codex/skills/$s" ] && echo "  ✓ $s" || echo "  ✗ MISSING: $s"
done
```

**Done when:**
- [ ] 18 skills generated (9 existing + 9 new)
- [ ] No Claude Code artifacts in output
- [ ] All expected skill directories exist
- [ ] Shared references copied where needed

---

## Verification

After all tasks complete:

```bash
node bin/build-codex.js
find codex/skills -maxdepth 1 -type d | wc -l  # should be 19 (18 + parent dir)
grep -r "~/.claude/" codex/ && echo "FAIL" || echo "PASS"
grep -r "Read tool\|Write tool" codex/ && echo "FAIL" || echo "PASS"
```

**Plan is complete when:**
- [ ] 9 new command files created
- [ ] Build generates 18 skills
- [ ] All verifications pass
