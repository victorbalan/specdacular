<purpose>
Create detailed, executable PLAN.md files for a single phase.

**Key principles:**
- Plans are prompts, not documents
- Each task references specific files with exact paths
- Include code patterns from codebase
- Verification is executable commands
- Tasks sized for ~15-60 min agent execution

**Output:** `plans/phase-{NN}/{NN}-PLAN.md` files for one specific phase
</purpose>

<philosophy>

## Plans Are Prompts

Each PLAN.md is literally what you'd send to an implementing agent. It must contain everything needed to implement without asking questions:
- What files to create/modify
- What patterns to follow (with code examples)
- How to verify success
- When the task is done

## Specificity Over Abstraction

**Bad:** "Create a component for displaying items"
**Good:** "Create `src/components/ItemList/index.tsx` following pattern from `src/components/UserList/index.tsx`. Must export `ItemList` component that accepts `items: Item[]` prop..."

## Task Sizing

Each plan should contain 2-3 tasks. Each task should be:
- Completable in 15-60 minutes of agent execution
- Independently verifiable
- Focused on related files

Too big = agent loses context. Too small = overhead exceeds value.

## Verification Is Executable

**Bad:** "Make sure it works"
**Good:** `npx tsc --noEmit && npm test -- --grep "ItemList"`

Every task has a verification step. If you can't verify it with a command, add a specific manual check.

## Just-in-Time Planning

Plans are created per-phase, not all at once. This means:
- Plans use the latest context (phase discussions, research)
- Earlier phases' implementations inform later plans
- Plans don't go stale waiting to be executed

</philosophy>

<process>

<step name="validate">
Validate feature exists and phase is eligible for planning.

**Parse arguments:**
Split $ARGUMENTS into feature-name and phase-number.

```bash
# Check feature exists
[ -d ".specd/features/$FEATURE_NAME" ] || { echo "Feature not found"; exit 1; }

# Check ROADMAP.md exists
[ -f ".specd/features/$FEATURE_NAME/ROADMAP.md" ] || { echo "No roadmap. Run /specd:feature:plan first."; exit 1; }

# Check phase directory exists
PHASE_DIR=".specd/features/$FEATURE_NAME/plans/phase-$(printf '%02d' $PHASE_NUMBER)"
[ -d "$PHASE_DIR" ] || { echo "Phase not found"; exit 1; }
```

**Check phase not already executed:**
Read STATE.md — if this phase is marked as complete, warn user:
```
Phase {N} appears to be already executed.

Re-planning an executed phase will create new plans but existing implementation won't change.

Continue anyway?
```

**If feature not found:**
```
Feature '{name}' not found.

Run /specd:feature:new {name} to create it.
```

**If no roadmap:**
```
Feature '{name}' has no roadmap yet.

Run /specd:feature:plan {name} to create the roadmap.
```

Continue to load_context.
</step>

<step name="load_context">
Load ALL context for this phase.

**Read feature context:**
- `FEATURE.md` — Technical requirements
- `CONTEXT.md` — Feature-level resolutions
- `DECISIONS.md` — All active decisions
- `RESEARCH.md` — If exists, feature-level implementation patterns
- `ROADMAP.md` — Phase overview

**Read phase context:**
- `plans/phase-{NN}/CONTEXT.md` — If exists, phase-specific resolutions (from phase:prepare)
- `plans/phase-{NN}/RESEARCH.md` — If exists, phase-specific research (from phase:prepare or phase:research)

**Read codebase context (if available):**
- `PATTERNS.md` — Code patterns to follow
- `STRUCTURE.md` — Where files go
- `MAP.md` — System overview

**Extract key information:**
- Phase goal, deliverables, dependencies (from ROADMAP.md)
- Files to create/modify for this phase
- Patterns to follow (from codebase, research)
- Decisions affecting this phase
- Pitfalls to avoid (from research)

Continue to check_existing_plans.
</step>

<step name="check_existing_plans">
Check if plans already exist for this phase.

```bash
ls .specd/features/$FEATURE_NAME/plans/phase-$(printf '%02d' $PHASE_NUMBER)/*-PLAN.md 2>/dev/null
```

**If plans exist:**
Show existing plans:
```
Existing plans for Phase {N}:

- {01-PLAN.md}: {objective summary}
- {02-PLAN.md}: {objective summary}

These will be replaced with new plans.
```

Use AskUserQuestion:
- header: "Replace Plans"
- question: "Replace existing plans for this phase?"
- options:
  - "Yes, replace" — Continue to break_into_tasks
  - "Cancel" — Exit workflow

**If no plans exist:** Continue to break_into_tasks.
</step>

<step name="break_into_tasks">
Break the phase into tasks.

**From the phase's ROADMAP.md section, identify:**
1. Files to create (group related files into tasks)
2. Files to modify (group with their related new files)
3. Internal dependencies (order tasks)

**Task structure:**
- 2-3 tasks per phase
- Each task handles 1-3 related files
- Tasks ordered by internal dependencies

**Example task breakdown:**

Phase: Types & Schema
- Task 1: Create type definitions
- Task 2: Create database schema

Phase: API Layer
- Task 1: Create API route handlers
- Task 2: Create API client functions

Phase: UI Components
- Task 1: Create core component
- Task 2: Create supporting components
- Task 3: Create styles/tests

Continue to write_plans.
</step>

<step name="write_plans">
Write PLAN.md files for each task.

**For each plan, use template at `~/.claude/specdacular/templates/features/PLAN.md`**

**Fill in plan content:**

**Frontmatter:**
```yaml
---
feature: {feature-name}
phase: {N}
plan: {NN}
depends_on: [list of previous plan IDs]
creates:
  - {exact/path/to/file.ts}
modifies:
  - {exact/path/to/existing.ts}
---
```

**Objective:**
One sentence: what this accomplishes and why.

**Context:**
```markdown
**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Code patterns
- `@{path/to/pattern/file}` — Pattern to follow

**Relevant Decisions:**
- DEC-XXX: {Decision affecting this plan}

**From Research:** (if phase RESEARCH.md or feature RESEARCH.md exists)
- {Key finding}
- {Pitfall to avoid}
```

**Tasks:**
For each task:
```markdown
### Task N: {Title}

**Files:** `{path/to/file}`

**Action:**
{Clear description with enough detail to implement}

Follow pattern from `{path/to/example}`:
```{language}
// Pattern to follow
{actual code from codebase}
```

Create:
```{language}
// What to create (scaffold or full example)
{code example}
```

**Verify:**
```bash
{verification command}
```

**Done when:**
- [ ] {Specific criterion}
- [ ] {Specific criterion}
```

**Verification section:**
```markdown
## Verification

After all tasks complete:

```bash
# Type check
npx tsc --noEmit

# Run tests
npm test -- --grep "{pattern}"
```

**Plan complete when:**
- [ ] All tasks done
- [ ] All verifications pass
```

Continue to update_roadmap.
</step>

<step name="update_roadmap">
Update ROADMAP.md to reflect that this phase is planned.

**In the phase's section of ROADMAP.md, add/update:**
- Plans list with summaries
- Mark as "Planned"

Continue to update_state.
</step>

<step name="update_state">
Update STATE.md with planning status for this phase.

**Add to STATE.md:**
- Planning session for phase {N} recorded
- Plans created count

Continue to commit.
</step>

<step name="commit">
Commit the plans.

```bash
git add .specd/features/{feature-name}/plans/phase-{NN}/*-PLAN.md
git add .specd/features/{feature-name}/ROADMAP.md
git add .specd/features/{feature-name}/STATE.md
git commit -m "docs({feature-name}): plan phase {N} - {phase title}

Plans: {count}
Tasks: {total tasks across plans}

Plan structure:
- {01-PLAN.md}: {summary}
- {02-PLAN.md}: {summary}"
```

Continue to completion.
</step>

<step name="completion">
Present what was created and how to execute.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE PLANS CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}
**Phase:** {N} — {Phase Title}

## Plans

- `plans/phase-{NN}/01-PLAN.md` — {Summary}
- `plans/phase-{NN}/02-PLAN.md` — {Summary}

## Tasks: {total count}

───────────────────────────────────────────────────────

## What's Next

/specd:phase:execute {feature} — Execute this phase

<sub>/clear first — fresh context window for execution</sub>
```

End workflow.
</step>

</process>

<success_criteria>
- Feature and phase validated
- Phase not already executed (or user confirmed re-plan)
- All context loaded (feature, phase, codebase)
- Tasks broken down from phase deliverables
- Each PLAN.md is self-contained agent prompt
- ROADMAP.md updated for this phase
- STATE.md updated
- Committed to git
- User knows next step is phase:execute
</success_criteria>
