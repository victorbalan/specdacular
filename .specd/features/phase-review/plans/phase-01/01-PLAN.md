---
feature: phase-review
phase: 1
plan: 01
depends_on: []
creates:
  - commands/specd.phase/review.md
modifies: []
---

# Plan 01: Create Review Command Definition

## Objective

Create the `/specd.phase:review` command definition file that follows the existing phase command pattern and references the review workflow.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Command definition patterns
- `@.specd/codebase/STRUCTURE.md` — Where command files go
- `@commands/specd.phase/execute.md` — Primary pattern to follow (closest sibling command)
- `@commands/specd.phase/prepare.md` — Secondary pattern reference

**Relevant Decisions:**
- DEC-001: Claude inspects first, then user weighs in — command must invoke workflow that does both
- DEC-002: Command named `phase:review` — file is `commands/specd.phase/review.md`
- DEC-006: Partial execution review supported — argument-hint reflects optional phase number

**From Research:**
- Command follows thin-command pattern: frontmatter + objective + execution_context + context + process + success_criteria
- Allowed tools must include Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion (review is read-heavy but writes corrective plans and updates STATE.md)

---

## Tasks

### Task 1: Create the review command file

**Files:** `commands/specd.phase/review.md`

**Action:**
Create the command definition following the exact pattern from `commands/specd.phase/execute.md`. The command is a thin wrapper that references the review workflow.

Follow pattern from `commands/specd.phase/execute.md`:
```yaml
---
name: specd.phase:execute
description: Execute a feature plan with progress tracking
argument-hint: "[feature-name] [plan-path]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
```

Create `commands/specd.phase/review.md`:
```markdown
---
name: specd.phase:review
description: Review executed plans against actual code and identify deviations
argument-hint: "[feature-name] [phase-number]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Review executed plans for a phase, comparing intended changes against actual code. Surfaces deviations, captures decisions, and generates corrective plans when needed.

**What it does:**
1. Load context — STATE.md, plans, DECISIONS.md, codebase docs
2. Filter plans — Only review plans with status Complete (DEC-006)
3. Inspect each plan — Compare creates/modifies frontmatter against actual files
4. Present findings — Per-plan status table with expandable details (DEC-005)
5. Gather user input — Ask about satisfaction, additional issues (DEC-001)
6. Record decisions — New decisions to DECISIONS.md
7. Generate correctives — Corrective plans if issues found (DEC-003)
8. Update state — Review Cycles in STATE.md (DEC-004)
9. Commit and suggest next steps
</objective>

<execution_context>
@~/.claude/specdacular/workflows/review-phase.md
</execution_context>

<context>
Feature name: $ARGUMENTS (first argument)
Phase number: $ARGUMENTS (second argument)

**Load ALL feature context:**
@.specd/features/{name}/STATE.md — Progress tracking, completed plans
@.specd/features/{name}/DECISIONS.md — Existing decisions
@.specd/features/{name}/RESEARCH.md — Implementation notes (if exists)
@.specd/features/{name}/ROADMAP.md — Phase overview
@.specd/features/{name}/CHANGELOG.md — Existing deviations (if exists)

**Load plan files for the phase:**
@.specd/features/{name}/plans/phase-{NN}/*.md — All plan files

**Load codebase context:**
@.specd/codebase/PATTERNS.md — Code patterns
@.specd/codebase/STRUCTURE.md — File locations
@.specd/codebase/MAP.md — System overview
</context>

<process>
1. **Validate** — Feature exists, phase exists, has execution history
2. **Load Context** — Read all feature, plan, and codebase docs
3. **Filter Plans** — Get only completed plans for this phase
4. **Inspect Phase** — Compare each plan's intent against actual code
5. **Present Findings** — Per-plan status table + deviation details
6. **Gather User Input** — Ask about satisfaction, additional issues
7. **Record Decisions** — Save new decisions to DECISIONS.md
8. **Generate Correctives** — Create corrective plans if needed
9. **Update State** — Update Review Cycles section in STATE.md
10. **Update Changelog** — Log deviations to CHANGELOG.md
11. **Commit and Next** — Commit changes, suggest next steps
</process>

<success_criteria>
- [ ] Feature and phase validated with execution history
- [ ] All completed plans inspected against actual code
- [ ] Per-plan status table displayed (✅/⚠️/❌/⏸️)
- [ ] Deviations surfaced with planned vs actual comparison
- [ ] User input captured (satisfaction, additional issues)
- [ ] New decisions recorded in DECISIONS.md
- [ ] Corrective plans generated if issues identified
- [ ] Review Cycles section updated in STATE.md
- [ ] Deviations logged in CHANGELOG.md
- [ ] Changes committed
- [ ] Next steps suggested
</success_criteria>
```

**Verify:**
```bash
# File exists and has correct frontmatter
head -5 commands/specd.phase/review.md | grep "name: specd.phase:review"
```

**Done when:**
- [ ] `commands/specd.phase/review.md` exists
- [ ] Frontmatter has correct name, description, argument-hint, allowed-tools
- [ ] Has `<objective>`, `<execution_context>`, `<context>`, `<process>`, `<success_criteria>` sections
- [ ] `<execution_context>` references `@~/.claude/specdacular/workflows/review-phase.md`
- [ ] Context section loads all required feature and codebase docs
- [ ] Process lists all 11 steps from research

---

## Verification

After all tasks complete, verify the plan is done:

```bash
# File exists with correct structure
grep -c "<objective>\|<execution_context>\|<context>\|<process>\|<success_criteria>" commands/specd.phase/review.md
# Should output: 5

# Correct workflow reference
grep "review-phase.md" commands/specd.phase/review.md

# Correct command name
grep "specd.phase:review" commands/specd.phase/review.md
```

**Plan is complete when:**
- [ ] Command file created at correct path
- [ ] Follows existing phase command pattern exactly
- [ ] References review-phase workflow
- [ ] All verification commands pass

---

## Output

When this plan is complete:

1. Update `.specd/features/phase-review/STATE.md`:
   - Mark this plan as complete
   - Note any discoveries or decisions made

2. Commit changes:
   ```bash
   git add commands/specd.phase/review.md
   git commit -m "feat(phase-review): create review command definition

   Plan 1.01 complete:
   - Created /specd.phase:review command definition
   - Follows existing phase command pattern (execute, prepare)
   - References review-phase workflow"
   ```

3. Next plan: `phase-01/02-PLAN.md`

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/phase-review/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach

**Format:**
```markdown
### {YYYY-MM-DD} - Plan phase-01/01

**{Brief title}**
- **What:** {What you decided/changed}
- **Why:** {Reason for the change}
- **Files:** `{affected files}`
```

**Don't log:**
- Minor implementation details
- Standard coding patterns
- Things working as planned

---

## Notes

