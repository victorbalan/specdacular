<purpose>
Create a roadmap with phase overview and empty phase directories. Detailed PLAN.md files are created later per-phase with `/specd:phase:plan`.

**Key principles:**
- Roadmap defines phases with goals, deliverables, and dependencies
- Phases follow natural code dependencies (types->API->UI)
- Empty phase directories are created as scaffolding
- No PLAN.md files — those are created just-in-time per phase

**Output:** ROADMAP.md + empty `plans/phase-XX/` directories
</purpose>

<philosophy>

## Roadmap, Not Plans

The roadmap defines WHAT each phase does and WHY it's ordered that way. The HOW (detailed plans) comes later, per phase, when context is freshest.

## Dependency-Driven Phases

Phases follow natural code dependencies:
1. **Types first** — Shared type definitions
2. **Data layer** — Database schemas, API routes
3. **Business logic** — Hooks, utilities, services
4. **UI** — Components that consume the above

Each phase's output is input for the next.

## Just-in-Time Detail

Creating detailed plans for all phases upfront means later plans go stale as earlier phases deviate. Instead:
1. Create the roadmap (this workflow)
2. For each phase: prepare -> plan -> execute
3. Each phase's plans use the latest context

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

Run /specd:feature:new {name} to create it.
```

**If missing required files:**
```
Feature '{name}' is missing required context for planning:
- {missing file}

Run /specd:feature:discuss {name} to build more context.
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
Check if there's enough context to create a good roadmap.

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
/specd:feature:discuss {name} — Resolve remaining gray areas
/specd:feature:research {name} — Research implementation approach

Continue anyway? (Roadmap may need revision)
```

Use AskUserQuestion:
- header: "Plan Readiness"
- question: "How would you like to proceed?"
- options:
  - "Continue planning" — Create roadmap with current context
  - "Discuss first" — Run feature:discuss
  - "Research first" — Run feature:research

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

Continue to write_roadmap.
</step>

<step name="write_roadmap">
Write ROADMAP.md with phase overview.

**Use template at `~/.claude/specdacular/templates/features/ROADMAP.md`**

**Fill in:**

**Overview table:**
- Total phases
- Current phase: 1
- Status: Not Started

**Phase list:** Quick overview with one-liners

**Phase details:** For each phase:
- Goal
- Creates (file list)
- Modifies (file list)
- Success criteria
- Dependencies

**Execution order:** Visual representation

**Key decisions affecting roadmap:**
Reference decisions from DECISIONS.md that affect phase ordering

Continue to create_directories.
</step>

<step name="create_directories">
Create empty phase directories.

```bash
mkdir -p .specd/features/{feature-name}/plans/phase-01
mkdir -p .specd/features/{feature-name}/plans/phase-02
# ... for each phase
```

Continue to update_state.
</step>

<step name="update_state">
Update STATE.md with planning status.

**Update STATE.md:**
- Stage: discussion -> planned
- Roadmap created: yes
- Add planning session to history

**Update config.json:**
```json
{
  "stage": "planned",
  "phases": {
    "total": {N},
    "completed": 0,
    "current": 1
  }
}
```

Continue to commit.
</step>

<step name="commit">
Commit the roadmap.

```bash
git add .specd/features/{feature-name}/ROADMAP.md .specd/features/{feature-name}/plans/ .specd/features/{feature-name}/STATE.md .specd/features/{feature-name}/config.json
git commit -m "docs({feature-name}): create roadmap

Phases: {N}

Phase structure:
- Phase 1: {name}
- Phase 2: {name}
..."
```

Continue to completion.
</step>

<step name="completion">
Present what was created and how to proceed.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ROADMAP CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}

## Phases

**Phase 1:** {Name} — {Goal}
**Phase 2:** {Name} — {Goal}
...

## Files Created

- `.specd/features/{feature-name}/ROADMAP.md`
- `.specd/features/{feature-name}/plans/phase-01/`
- `.specd/features/{feature-name}/plans/phase-02/`
...

───────────────────────────────────────────────────────

## What's Next — Phase by Phase

For each phase, the flow is:

1. `/specd:phase:prepare {feature} {N}` — Discuss gray areas + optional research
2. `/specd:phase:plan {feature} {N}` — Create detailed task plans
3. `/specd:phase:execute {feature}` — Execute with progress tracking

**Start with Phase 1:**

/specd:phase:prepare {feature} 1 — Prepare the first phase

<sub>/clear first — fresh context window</sub>
```

End workflow.
</step>

</process>

<success_criteria>
- Feature validated with sufficient context
- All context loaded and analyzed
- Phases derived from dependency analysis
- ROADMAP.md provides clear phase overview
- Empty phase directories created
- No PLAN.md files created
- STATE.md updated to "planned" stage
- Committed to git
- User knows the per-phase flow: prepare -> plan -> execute
</success_criteria>
