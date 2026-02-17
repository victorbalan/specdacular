---
feature: new-command-rearchitect
phase: 1
depends_on: []
creates:
  - specdacular/references/validate-task.md
  - specdacular/references/load-context.md
  - specdacular/references/record-decision.md
  - specdacular/references/spawn-research-agents.md
  - specdacular/references/synthesize-research.md
modifies: []
---

# Phase 1: Shared References

## Objective

Create 5 shared reference documents that eliminate duplicated patterns across workflows. These are the foundation all rewritten workflows will use.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Existing code patterns
- `@.specd/codebase/STRUCTURE.md` — Where files go
- `@specdacular/references/commit-docs.md` — Existing reference pattern to follow
- `@specdacular/references/commit-code.md` — Another existing reference

**Relevant Decisions:**
- DEC-007: Extract shared references to eliminate duplication
- DEC-001: Rename features to tasks (references use `.specd/tasks/` paths)

**From Investigation:**
- Validation block duplicated in 10+ workflows (~100 lines)
- Load context block duplicated in 8+ workflows (~400 lines)
- Decision recording template in 6+ workflows (~180 lines)
- Research agent spawning in 3 workflows (~300 lines)
- Research synthesis in 3 workflows (~200 lines)

---

## Tasks

### Task 1: Create validate-task.md

**Files:** `specdacular/references/validate-task.md`

**Action:**
Extract the common validation pattern from existing workflows. The reference should:
- Check task directory exists at `.specd/tasks/$TASK_NAME/`
- Check required files exist (FEATURE.md, CONTEXT.md, DECISIONS.md, STATE.md, config.json)
- Provide clear error messages with actionable next steps
- Be parameterizable: `$TASK_NAME` is the variable

Study the existing validation in these workflows for the pattern:
- `@specdacular/workflows/discuss-feature.md` (validate step)
- `@specdacular/workflows/plan-feature.md` (validate step)
- `@specdacular/workflows/execute-plan.md` (validate step)

**Verify:**
```bash
[ -f specdacular/references/validate-task.md ] && echo "exists"
```

**Done when:**
- [ ] File exists with validation logic
- [ ] Uses `.specd/tasks/` path (not features)
- [ ] Covers directory check + file existence checks
- [ ] Has clear error messages

---

### Task 2: Create load-context.md

**Files:** `specdacular/references/load-context.md`

**Action:**
Extract the standard context loading pattern. The reference should define:
- **Always load:** FEATURE.md, CONTEXT.md, DECISIONS.md, STATE.md, config.json
- **Load if exists:** RESEARCH.md, ROADMAP.md, CHANGELOG.md
- **Load if available:** `.specd/codebase/*.md` (MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md)
- **Optional phase context:** `phases/phase-NN/PLAN.md` (when `$PHASE` is specified)

Document what each file provides:
- FEATURE.md → requirements and constraints
- CONTEXT.md → discussion history and resolved questions
- DECISIONS.md → active decisions that constrain implementation
- RESEARCH.md → implementation patterns and pitfalls
- ROADMAP.md → phase overview and success criteria
- Codebase docs → code patterns, structure, concerns

Study the load_context steps in:
- `@specdacular/workflows/discuss-feature.md`
- `@specdacular/workflows/plan-feature.md`
- `@specdacular/workflows/execute-plan.md`

**Verify:**
```bash
[ -f specdacular/references/load-context.md ] && echo "exists"
```

**Done when:**
- [ ] File exists with complete context loading specification
- [ ] Uses `.specd/tasks/` paths
- [ ] Distinguishes required vs optional files
- [ ] Documents what each file provides

---

### Task 3: Create record-decision.md

**Files:** `specdacular/references/record-decision.md`

**Action:**
Extract the DEC-{NNN} recording pattern. The reference should include:
- The markdown template for a new decision
- How to determine the next DEC number (read DECISIONS.md, find highest, increment)
- How to update the Decision Log table
- How to update config.json decisions_count
- When to record decisions (technology choice, scope, approach, constraints)

Study the decision recording in:
- `@specdacular/workflows/discuss-feature.md` (record_decisions step)
- `@specdacular/workflows/research-feature.md` (synthesis section)
- `@specdacular/templates/features/DECISIONS.md` (template format)

**Verify:**
```bash
[ -f specdacular/references/record-decision.md ] && echo "exists"
```

**Done when:**
- [ ] File exists with complete decision recording spec
- [ ] Includes the DEC-{NNN} markdown template
- [ ] Covers numbering, log table update, config.json update

---

### Task 4: Create spawn-research-agents.md

**Files:** `specdacular/references/spawn-research-agents.md`

**Action:**
Extract the three-agent research spawn pattern. The reference should define:
- **Agent 1: Codebase Integration** (Explore agent) — Where to put code, what to reuse. Parameterized by `$TASK_CONTEXT` and `$CONSTRAINTS`.
- **Agent 2: External Patterns** (general-purpose agent) — Libraries, architecture patterns. Parameterized by `$TASK_TYPE` and `$TECH_STACK`.
- **Agent 3: Pitfalls** (general-purpose agent) — Common mistakes, gotchas. Parameterized by `$TASK_CONTEXT`.
- All agents use `run_in_background: true`
- Agent prompts should reference the feature-researcher agent definition: `@~/.claude/specdacular/agents/feature-researcher.md`

Study the spawning in:
- `@specdacular/workflows/research-phase.md` (spawn_agents step)
- `@specdacular/workflows/prepare-phase.md` (spawn_agents step)

**Verify:**
```bash
[ -f specdacular/references/spawn-research-agents.md ] && echo "exists"
```

**Done when:**
- [ ] File exists with three parameterized agent spawn definitions
- [ ] Each agent has clear prompt template with `$VARIABLE` placeholders
- [ ] Specifies `run_in_background: true` for all agents

---

### Task 5: Create synthesize-research.md

**Files:** `specdacular/references/synthesize-research.md`

**Action:**
Extract the RESEARCH.md synthesis pattern. The reference should define:
- How to collect agent outputs (read background task output files)
- RESEARCH.md template structure (Integration Points, Patterns to Follow, Pitfalls to Avoid, Library Decisions)
- How to merge findings from three agents into one document
- Confidence level handling (HIGH/MEDIUM/LOW)
- How to extract decisions from research for DECISIONS.md

Study the synthesis in:
- `@specdacular/workflows/research-phase.md` (synthesize step)
- `@specdacular/workflows/prepare-phase.md` (synthesis section)
- `@specdacular/templates/features/RESEARCH.md`

**Verify:**
```bash
[ -f specdacular/references/synthesize-research.md ] && echo "exists"
```

**Done when:**
- [ ] File exists with complete synthesis specification
- [ ] Includes RESEARCH.md template structure
- [ ] Covers agent output collection
- [ ] Handles confidence levels

---

## Verification

After all tasks complete:

```bash
# All 5 reference files exist
ls specdacular/references/validate-task.md \
   specdacular/references/load-context.md \
   specdacular/references/record-decision.md \
   specdacular/references/spawn-research-agents.md \
   specdacular/references/synthesize-research.md

# Each file has substantial content (>20 lines)
for f in specdacular/references/validate-task.md specdacular/references/load-context.md specdacular/references/record-decision.md specdacular/references/spawn-research-agents.md specdacular/references/synthesize-research.md; do
  lines=$(wc -l < "$f")
  echo "$f: $lines lines"
done
```

**Plan is complete when:**
- [ ] All 5 reference files exist
- [ ] Each file has >20 lines of content
- [ ] All use `.specd/tasks/` paths (not features)
- [ ] Existing references (`commit-docs.md`, `commit-code.md`) still work
