---
feature: visual-blueprint-tool
phase: 1
plan: 02
depends_on: []
creates:
  - commands/specd/blueprint.md
modifies:
  - commands/specd/help.md
---

# Plan 02: Create Command Definition

## Objective

Create the `/specd:blueprint` command file that defines the command interface and references the workflow.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Command structure pattern
- `@.specd/codebase/STRUCTURE.md` — Where commands go
- `@commands/specd/new-feature.md` — Example command to follow

**Relevant Decisions:**
- DEC-001: Command name is `/specd:blueprint` — with subcommands for wireframes and diagrams

**From Research:**
- Command files use YAML frontmatter with `name`, `description`, `argument-hint`, `allowed-tools`
- Use `<execution_context>` to reference workflow
- Use `$ARGUMENTS` to access user-provided arguments

---

## Tasks

### Task 1: Create Command File

**Files:** `commands/specd/blueprint.md`

**Action:**
Create the command definition following the existing command pattern.

Follow pattern from `commands/specd/new-feature.md`:
```yaml
---
name: specd:new-feature
description: Initialize a new feature with technical questioning
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - ...
---
```

Create:
```markdown
---
name: specd:blueprint
description: Generate visual blueprint for a feature
argument-hint: "[feature-name] [wireframes|diagrams]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Generate a visual HTML blueprint for exploring feature artifacts.

**Base command:** `/specd:blueprint {feature}`
- Creates `.specd/features/{feature}/blueprint/index.html`
- Shows Overview, Decisions, Context, Plans tabs
- Opens in browser

**Subcommands:**
- `/specd:blueprint {feature} wireframes` — Add wireframes tab
- `/specd:blueprint {feature} diagrams` — Add diagrams tab with Mermaid

**Output:** Self-contained HTML file that opens in browser. Regenerate to update.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/blueprint.md
</execution_context>

<context>
Feature name: First argument ($ARGUMENTS before space)
Subcommand: Second argument (wireframes, diagrams, or empty)

**Load feature context:**
@.specd/features/{name}/FEATURE.md
@.specd/features/{name}/CONTEXT.md
@.specd/features/{name}/DECISIONS.md
@.specd/features/{name}/plans/ (if exists)

**Load codebase context (if available):**
@.specd/codebase/PATTERNS.md
</context>

<process>
1. **Parse Arguments** — Extract feature name and optional subcommand
2. **Validate** — Check feature exists with required files
3. **Route Subcommand:**
   - No subcommand → Generate base blueprint
   - `wireframes` → Generate/update with wireframes tab
   - `diagrams` → Generate/update with diagrams tab
4. **Generate HTML** — Read files, parse content, embed in template
5. **Open Browser** — Run `open` command to display
</process>

<success_criteria>
- [ ] Feature validated (exists, has FEATURE.md, CONTEXT.md, DECISIONS.md)
- [ ] HTML generated at `.specd/features/{name}/blueprint/index.html`
- [ ] All content properly embedded (decisions, context, plans if exist)
- [ ] Browser opens with the blueprint
- [ ] Wireframes/Diagrams tabs enabled if generated
</success_criteria>
```

**Verify:**
```bash
[ -f "commands/specd/blueprint.md" ] && grep -q "name: specd:blueprint" commands/specd/blueprint.md && echo "valid"
```

**Done when:**
- [ ] File exists at `commands/specd/blueprint.md`
- [ ] Has correct YAML frontmatter
- [ ] References workflow via `<execution_context>`
- [ ] Describes subcommand routing

---

### Task 2: Update Help Command

**Files:** `commands/specd/help.md`

**Action:**
Add the new `/specd:blueprint` command to the help documentation.

Find the feature planning commands table and add:

```markdown
| `/specd:blueprint [name] [sub]` | Generate visual blueprint (wireframes, diagrams) |
```

**Verify:**
```bash
grep -q "specd:blueprint" commands/specd/help.md && echo "found"
```

**Done when:**
- [ ] Help file includes `/specd:blueprint` command
- [ ] Description mentions wireframes and diagrams

---

## Verification

After all tasks complete, verify the plan is done:

```bash
# Check command file exists and is valid
[ -f "commands/specd/blueprint.md" ] && echo "command exists"
grep -q "name: specd:blueprint" commands/specd/blueprint.md && echo "has name"
grep -q "execution_context" commands/specd/blueprint.md && echo "has context"

# Check help updated
grep -q "blueprint" commands/specd/help.md && echo "in help"
```

**Plan is complete when:**
- [ ] Command file exists with correct structure
- [ ] Help documentation updated
- [ ] Command references workflow (even though workflow doesn't exist yet)

---

## Output

When this plan is complete:

1. Update `.specd/features/visual-blueprint-tool/STATE.md`:
   - Mark this plan as complete

2. Commit changes:
   ```bash
   git add commands/specd/blueprint.md commands/specd/help.md
   git commit -m "feat(blueprint): add command definition

   Plan 1.02 complete:
   - Created /specd:blueprint command
   - Added to help documentation
   - Supports wireframes and diagrams subcommands"
   ```

3. Next plan: `phase-02/01-PLAN.md` (main workflow)
