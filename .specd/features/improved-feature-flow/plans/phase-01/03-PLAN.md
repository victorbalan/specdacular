---
feature: improved-feature-flow
phase: 1
plan: 03
depends_on:
  - 01
  - 02
creates:
  - commands/specd/feature/toolbox.md
  - specdacular/workflows/toolbox.md
modifies: []
---

# Plan 03: Create Toolbox Command + Workflow

## Objective

Create the `/specd:feature:toolbox` command and workflow that presents a menu of advanced operations (discuss, research, plan, review, insert) with scope selection for discuss/research/plan.

## Context

**Reference these files:**
- `@commands/specd/feature/continue.md` — Pattern for command file structure (from Plan 02)
- `@specdacular/references/select-feature.md` — Shared feature selection (from Plan 01)
- `@specdacular/references/select-phase.md` — Shared phase selection (from Plan 01)
- `@.specd/features/improved-feature-flow/plans/phase-01/CONTEXT.md` — Toolbox dispatch design

**Relevant Decisions:**
- DEC-001: Group advanced operations under toolbox command
- DEC-007: Discuss/research/plan ask scope (feature vs phase)
- DEC-010: Use shared references

---

## Tasks

### Task 1: Create toolbox command file

**Files:** `commands/specd/feature/toolbox.md`

**Action:**
Create the command stub. Follow the exact pattern from `commands/specd/feature/continue.md`:

```markdown
---
name: specd:feature:toolbox
description: Advanced feature operations — discuss, research, plan, review, insert
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
Menu of advanced feature operations. Presents options and dispatches to the appropriate workflow.

**Operations:**
- Discuss — Explore open questions (feature or phase level)
- Research — Spawn parallel research agents (feature or phase level)
- Plan — Create implementation plans (feature or phase level)
- Review — Review executed work, report issues, generate fix plans
- Insert phase — Add a new phase with decimal numbering
</objective>

<execution_context>
@~/.claude/specdacular/workflows/toolbox.md
</execution_context>

<context>
Feature name: $ARGUMENTS

**Delegates to workflows:**
@~/.claude/specdacular/workflows/discuss-feature.md
@~/.claude/specdacular/workflows/research-feature.md
@~/.claude/specdacular/workflows/plan-feature.md
@~/.claude/specdacular/workflows/review-feature.md
@~/.claude/specdacular/workflows/insert-phase.md
@~/.claude/specdacular/workflows/prepare-phase.md
@~/.claude/specdacular/workflows/plan-phase.md
</context>

<success_criteria>
- [ ] Feature selected (from argument or picker)
- [ ] Menu presented with all 5 operations
- [ ] Selected operation executed via correct workflow
- [ ] Scope selection works for discuss/research/plan
</success_criteria>
```

**Verify:**
```bash
[ -f "commands/specd/feature/toolbox.md" ] && grep -c "specd:feature:toolbox" commands/specd/feature/toolbox.md
```

**Done when:**
- [ ] `commands/specd/feature/toolbox.md` exists
- [ ] Frontmatter has `name: specd:feature:toolbox`
- [ ] References `toolbox.md` workflow
- [ ] Lists all 5 operations in objective

---

### Task 2: Create toolbox workflow

**Files:** `specdacular/workflows/toolbox.md`

**Action:**
Create the toolbox workflow with these steps:

**Step 1: select_feature**
Use shared reference:
```markdown
<step name="select_feature">
@~/.claude/specdacular/references/select-feature.md

Continue to show_menu.
</step>
```

**Step 2: show_menu**
Present the 5 operations using AskUserQuestion:
```markdown
<step name="show_menu">
Use AskUserQuestion:
- header: "Toolbox"
- question: "What would you like to do with {feature-name}?"
- options:
  - label: "Discuss"
    description: "Explore open questions and gray areas about the feature"
  - label: "Research"
    description: "Spawn agents to research implementation patterns, libraries, and pitfalls"
  - label: "Plan"
    description: "Create phased implementation plans from feature context"
  - label: "Review"
    description: "Review executed work — report issues, generate fix plans"
  - label: "Insert phase"
    description: "Add a new phase to the roadmap (decimal numbering)"

Route based on selection:
- Discuss → select_scope (with operation=discuss)
- Research → select_scope (with operation=research)
- Plan → select_scope (with operation=plan)
- Review → dispatch_review
- Insert phase → dispatch_insert
</step>
```

**Step 3: select_scope** (for discuss/research/plan only)
```markdown
<step name="select_scope">
Use AskUserQuestion:
- header: "Scope"
- question: "Work on the whole feature or a specific phase?"
- options:
  - label: "Whole feature"
    description: "Feature-level {operation}"
  - label: "Specific phase"
    description: "Focus on one phase"

**If Whole feature:**
Route to feature-level workflow:
- discuss → @~/.claude/specdacular/workflows/discuss-feature.md
- research → @~/.claude/specdacular/workflows/research-feature.md
- plan → @~/.claude/specdacular/workflows/plan-feature.md

**If Specific phase:**
@~/.claude/specdacular/references/select-phase.md

Then route to phase-level workflow:
- discuss → @~/.claude/specdacular/workflows/prepare-phase.md (discussion part)
- research → @~/.claude/specdacular/workflows/prepare-phase.md (research part)
- plan → @~/.claude/specdacular/workflows/plan-phase.md

Pass feature name and phase number as arguments.
</step>
```

**Step 4: dispatch_review**
```markdown
<step name="dispatch_review">
Execute the review-feature workflow:
@~/.claude/specdacular/workflows/review-feature.md

Pass feature name as argument.
</step>
```

**Step 5: dispatch_insert**
```markdown
<step name="dispatch_insert">
Execute the insert-phase workflow:
@~/.claude/specdacular/workflows/insert-phase.md

Pass feature name as argument.
</step>
```

The full workflow file should use `<purpose>`, `<philosophy>`, `<process>` tags following the pattern in other workflow files.

**Verify:**
```bash
[ -f "specdacular/workflows/toolbox.md" ] && echo "exists"

# Has all required steps
for step in select_feature show_menu select_scope dispatch_review dispatch_insert; do
  grep -q "$step" specdacular/workflows/toolbox.md && echo "✓ $step" || echo "✗ $step MISSING"
done

# References all sub-workflows
for wf in discuss-feature research-feature plan-feature review-feature insert-phase prepare-phase plan-phase; do
  grep -q "$wf" specdacular/workflows/toolbox.md && echo "✓ $wf" || echo "✗ $wf MISSING"
done
```

**Done when:**
- [ ] `specdacular/workflows/toolbox.md` exists
- [ ] Has 5 steps: select_feature, show_menu, select_scope, dispatch_review, dispatch_insert
- [ ] Menu presents all 5 operations with descriptions
- [ ] Scope selection asks feature-vs-phase for discuss/research/plan
- [ ] Uses shared `select-feature.md` and `select-phase.md` references
- [ ] All 7 sub-workflows referenced correctly

---

## Verification

After all tasks complete:

```bash
# Both files exist
ls commands/specd/feature/toolbox.md specdacular/workflows/toolbox.md

# Command references workflow
grep "toolbox.md" commands/specd/feature/toolbox.md

# Workflow has all steps
grep -c "step name=" specdacular/workflows/toolbox.md
```

**Plan is complete when:**
- [ ] Command file created with correct frontmatter
- [ ] Workflow file created with all 5 steps
- [ ] Menu has all 5 operations
- [ ] Scope selection works for discuss/research/plan
- [ ] Shared references used for feature and phase selection

---

## Output

When this plan is complete:

1. Update `.specd/features/improved-feature-flow/STATE.md`:
   - Mark this plan as complete
   - Mark Phase 1 as complete

2. Commit changes:
   ```bash
   git add commands/specd/feature/toolbox.md specdacular/workflows/toolbox.md
   git commit -m "feat(improved-feature-flow): create toolbox command + workflow

   Plan 1.03 complete:
   - Toolbox command with 5 operations menu
   - Scope selection (feature vs phase) for discuss/research/plan
   - Uses shared references for feature and phase selection"
   ```

3. Phase 1 complete. Next: Phase 2 (Review + State Machine)

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/improved-feature-flow/CHANGELOG.md`.

---

## Notes

Review workflow (`review-feature.md`) and insert workflow (`insert-phase.md`) don't exist yet — they're created in Phases 2 and 3. The toolbox references them but they'll only work after those phases. This is fine — the toolbox menu will show all options, but review and insert will error gracefully until their workflows exist.
