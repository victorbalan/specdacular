<purpose>
Create executable task plans that an agent can implement without asking clarifying questions.

**Key principles:**
- Plans are prompts, not documents
- Each task references specific files with exact paths
- Include code patterns from codebase
- Verification is executable commands
- Tasks sized for ~15-60 min agent execution

**Output:** ROADMAP.md + plans/phase-XX/YY-PLAN.md files
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

## Dependency-Driven Phases

Phases follow natural code dependencies:
1. **Types first** — Shared type definitions
2. **Data layer** — Database schemas, API routes
3. **Business logic** — Hooks, utilities, services
4. **UI** — Components that consume the above

Each phase's output is input for the next.

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

</philosophy>

<process>

<step name="validate">
Validate feature exists and has required context.

```bash
# Check feature exists
[ -d ".specd/features/$ARGUMENTS" ] || { echo "not found"; exit 1; }

# Check required files
[ -f ".specd/features/$ARGUMENTS/FEATURE.md" ] || { echo "missing FEATURE.md"; exit 1; }
[ -f ".specd/features/$ARGUMENTS/CONTEXT.md" ] || { echo "missing CONTEXT.md"; exit 1; }
[ -f ".specd/features/$ARGUMENTS/DECISIONS.md" ] || { echo "missing DECISIONS.md"; exit 1; }

# Check optional files
[ -f ".specd/features/$ARGUMENTS/RESEARCH.md" ] && echo "has_research"
```

**If feature not found:**
```
Feature '{name}' not found.

Run /specd:new-feature {name} to create it.
```

**If missing required files:**
```
Feature '{name}' is missing required context for planning:
- {missing file}

Run /specd:discuss-feature {name} to build more context.
```

Continue to load_context.
</step>

<step name="load_context">
Load ALL context.

**Read feature context:**
- `FEATURE.md` — Technical requirements, files to create
- `CONTEXT.md` — Resolved gray areas, code patterns discussed
- `DECISIONS.md` — All active decisions
- `RESEARCH.md` — If exists, implementation patterns and pitfalls

**Read codebase context (if available):**
- `PATTERNS.md` — Code patterns to follow
- `STRUCTURE.md` — Where files go
- `MAP.md` — System overview, integration points

**Extract key information:**
- Files that must be created (from FEATURE.md)
- Integration points (from FEATURE.md)
- Patterns to follow (from CONTEXT.md, RESEARCH.md, codebase)
- Decisions that affect implementation
- Pitfalls to avoid (from RESEARCH.md)

Continue to assess_readiness.
</step>

<step name="assess_readiness">
Check if there's enough context to create good plans.

**Required for planning:**
- [ ] Clear list of files to create
- [ ] Integration points identified
- [ ] Key decisions made (at least technology choices)

**Warning signs (insufficient context):**
- FEATURE.md has placeholder text
- CONTEXT.md has many unresolved gray areas
- No decisions in DECISIONS.md
- Major technical questions unanswered

**If insufficient:**
```
Feature '{name}' might benefit from more discussion before planning.

**Current state:**
- Files to create: {count or "unclear"}
- Integration points: {count or "unclear"}
- Decisions made: {count}
- Gray areas remaining: {count}

**Recommendation:**
/specd:discuss-feature {name} — Resolve remaining gray areas
/specd:research-feature {name} — Research implementation approach

Continue anyway? (Plans may need revision)
```

Use AskUserQuestion:
- header: "Plan Readiness"
- question: "How would you like to proceed?"
- options:
  - "Continue planning" — Create plans with current context
  - "Discuss first" — Run discuss-feature
  - "Research first" — Run research-feature

**If sufficient or user chooses to continue:**
Continue to derive_phases.
</step>

<step name="derive_phases">
Derive phases from dependency analysis.

**Analyze dependencies:**
1. What types/interfaces are needed? (Phase: Types)
2. What data layer changes are needed? (Phase: Data/API)
3. What business logic is needed? (Phase: Logic/Hooks)
4. What UI is needed? (Phase: Components)
5. What integration/wiring is needed? (Phase: Integration)

**Standard phase pattern:**
```
Phase 1: Foundation (types, schemas)
Phase 2: Data Layer (API routes, database)
Phase 3: Business Logic (hooks, services)
Phase 4: UI (components)
Phase 5: Integration (wiring, entry points)
```

**Adjust based on feature:**
- Small feature: might be 2-3 phases
- Large feature: might be 5+ phases
- Some features skip phases (no UI, no API, etc.)

**For each phase, identify:**
- Goal: What this phase achieves
- Creates: New files
- Modifies: Existing files
- Depends on: Previous phases or external dependencies

**Present to user:**
```
Based on the requirements, here's the proposed phase structure:

**Phase 1: {Name}** — {Goal}
Creates: {file list}
Depends on: None

**Phase 2: {Name}** — {Goal}
Creates: {file list}
Depends on: Phase 1

...

Does this phasing make sense? Any adjustments?
```

Continue to break_into_tasks.
</step>

<step name="break_into_tasks">
Break each phase into tasks.

**For each phase:**

1. Group related files into tasks (2-3 tasks per phase)
2. Order tasks by internal dependencies
3. Define clear boundaries

**Task structure:**
- Files: Specific paths (1-3 files per task)
- Action: What to create/modify
- Pattern: Code pattern to follow (with example)
- Verify: Command to verify completion
- Done: Completion criteria checklist

**Example task breakdown:**

Phase 1: Types & Schema
- Task 1: Create type definitions
- Task 2: Create database schema

Phase 2: API Layer
- Task 1: Create API route handlers
- Task 2: Create API client functions

Phase 3: UI Components
- Task 1: Create core component
- Task 2: Create supporting components
- Task 3: Create styles/tests

Continue to write_plans.
</step>

<step name="write_plans">
Write PLAN.md files for each task.

**Create plans directory:**
```bash
mkdir -p .specd/features/{feature-name}/plans/phase-01
mkdir -p .specd/features/{feature-name}/plans/phase-02
# ... for each phase
```

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

**From Research:** (if RESEARCH.md exists)
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

Continue to write_roadmap.
</step>

<step name="write_roadmap">
Write ROADMAP.md with phase overview.

**Use template at `~/.claude/specdacular/templates/features/ROADMAP.md`**

**Fill in:**

**Overview table:**
- Total phases
- Total plans
- Current phase: 1
- Status: Not Started

**Phase list:** Quick overview with one-liners

**Phase details:** For each phase:
- Goal
- Creates (file list)
- Modifies (file list)
- Plans (with summaries)
- Success criteria
- Dependencies

**Execution order:** Visual representation

**Key decisions affecting roadmap:**
Reference decisions from DECISIONS.md that affect phase ordering

Continue to update_state.
</step>

<step name="update_state">
Update STATE.md with planning status.

**Update STATE.md:**
- Stage: planning → execution (ready)
- Planning complete: yes
- Add planning session to history

**Update config.json:**
```json
{
  "stage": "execution",
  "phases": {
    "total": {N},
    "completed": 0,
    "current": 1
  },
  "plans": {
    "total": {N},
    "completed": 0
  }
}
```

Continue to commit.
</step>

<step name="commit">
Commit the plans.

```bash
git add .specd/features/{feature-name}/ROADMAP.md .specd/features/{feature-name}/plans/ .specd/features/{feature-name}/STATE.md .specd/features/{feature-name}/config.json
git commit -m "docs({feature-name}): create implementation plans

Phases: {N}
Plans: {N}

Phase structure:
- Phase 1: {name}
- Phase 2: {name}
..."
```

Continue to completion.
</step>

<step name="completion">
Present what was created and how to execute.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PLANS CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}

## Structure

**Phases:** {N}
**Plans:** {N total}

### Phase 1: {Name}
- `plans/phase-01/01-PLAN.md` — {Summary}
- `plans/phase-01/02-PLAN.md` — {Summary}

### Phase 2: {Name}
- `plans/phase-02/01-PLAN.md` — {Summary}

...

## Files Created

- `.specd/features/{feature-name}/ROADMAP.md`
- `.specd/features/{feature-name}/plans/phase-01/01-PLAN.md`
- `.specd/features/{feature-name}/plans/phase-01/02-PLAN.md`
...

───────────────────────────────────────────────────────

## How to Execute

Each plan is a self-contained prompt. To execute:

**Option 1: Sequential execution**
Read each plan and implement:
```
cat .specd/features/{feature-name}/plans/phase-01/01-PLAN.md
```
Then implement what it describes.

**Option 2: Agent execution**
Give a plan to an implementing agent:
"Implement the plan in `.specd/features/{feature-name}/plans/phase-01/01-PLAN.md`"

**Start with Phase 1, Plan 01.**

───────────────────────────────────────────────────────

## Verification

After each plan:
1. Run the plan's verification commands
2. Commit the changes
3. Update STATE.md (or let agent do it)
4. Move to next plan

After all plans in a phase:
1. Run phase success criteria checks
2. Mark phase complete in STATE.md
3. Move to next phase
```

End workflow.
</step>

</process>

<success_criteria>
- Feature validated with sufficient context
- All context loaded and analyzed
- Phases derived from dependency analysis
- Tasks are specific (exact files, patterns, verification)
- Each PLAN.md is a self-contained agent prompt
- ROADMAP.md provides clear execution path
- STATE.md updated to execution stage
- Committed to git
- User knows how to execute plans
</success_criteria>
