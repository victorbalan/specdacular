---
feature: new-command-rearchitect
phase: 3
depends_on:
  - phase-01
  - phase-02
creates:
  - specdacular/workflows/new.md
  - specdacular/workflows/continue.md
  - specdacular/workflows/discuss.md
  - specdacular/workflows/research.md
  - specdacular/workflows/plan.md
  - specdacular/workflows/execute.md
  - specdacular/workflows/review.md
modifies: []
---

# Phase 3: Core Workflows

## Objective

Rewrite all 7 main workflows with new naming, shared reference usage, deduplication, and the new review workflow. This is the largest phase — the heart of the rearchitecture.

## Context

**Reference these files:**
- `@specdacular/references/validate-task.md` — Shared validation (from Phase 1)
- `@specdacular/references/load-context.md` — Shared context loading (from Phase 1)
- `@specdacular/references/record-decision.md` — Shared decision recording (from Phase 1)
- `@specdacular/references/spawn-research-agents.md` — Shared research agents (from Phase 1)
- `@specdacular/references/synthesize-research.md` — Shared synthesis (from Phase 1)
- `@specdacular/references/commit-docs.md` — Existing commit reference
- `@specdacular/references/commit-code.md` — Existing commit reference
- `@.specd/codebase/PATTERNS.md` — Workflow structure pattern

**Relevant Decisions:**
- DEC-001: Paths use `.specd/tasks/`
- DEC-002: One `phases/phase-NN/PLAN.md` per phase
- DEC-003: Interactive default, `--semi-auto` and `--auto` flags
- DEC-005: Code review after every phase execution
- DEC-007: Use shared references
- DEC-008: Merged review workflow
- DEC-009: Research as proper step-based workflow
- DEC-011: No phase-specific command variants

**Source workflows to study (for logic, not to copy verbatim):**
- `@specdacular/workflows/new-feature.md` → `new.md`
- `@specdacular/workflows/continue-feature.md` → `continue.md`
- `@specdacular/workflows/discuss-feature.md` → `discuss.md`
- `@specdacular/workflows/research-feature.md` → `research.md`
- `@specdacular/workflows/plan-feature.md` → `plan.md`
- `@specdacular/workflows/execute-plan.md` → `execute.md`
- `@specdacular/workflows/review-feature.md` + `@specdacular/workflows/review-phase.md` → `review.md`

---

## Tasks

### Task 1: Write new.md workflow

**Files:** `specdacular/workflows/new.md`

**Action:**
Rewrite `new-feature.md` as `new.md`. Key changes:
- Use `@validate-task.md` for validation (check if task already exists)
- Use `.specd/tasks/{name}/` paths throughout
- Use `@record-decision.md` for decision recording
- Use `@commit-docs.md` for commit step
- Reference `templates/tasks/` for document creation
- **Remove orchestrator branches entirely** — those go in Phase 5
- Single-project flow only: validate → codebase_context → first_discussion → write files → commit → completion
- Offer continuation via `/specd:continue {task-name}`

The workflow should follow the same `<purpose>`, `<philosophy>`, `<process>` structure with `<step name="...">` blocks.

**Verify:**
```bash
[ -f specdacular/workflows/new.md ] && echo "exists"
grep -c "\.specd/tasks/" specdacular/workflows/new.md  # should be > 0
grep -c "\.specd/features/" specdacular/workflows/new.md  # should be 0
```

**Done when:**
- [ ] Workflow exists with proper step-based structure
- [ ] Uses shared references (validate-task, record-decision, commit-docs)
- [ ] No orchestrator branches (single-project only)
- [ ] All paths use `.specd/tasks/`
- [ ] References `templates/tasks/` for document creation

---

### Task 2: Write discuss.md workflow

**Files:** `specdacular/workflows/discuss.md`

**Action:**
Rewrite `discuss-feature.md` as `discuss.md`. Key changes:
- Use `@validate-task.md` for validation
- Use `@load-context.md` for context loading
- Use `@record-decision.md` for decision recording
- Use `@commit-docs.md` for commit
- All paths use `.specd/tasks/`
- Keep the collaborative discussion philosophy
- Keep the "4 questions then check" probe pattern

**Done when:**
- [ ] Workflow exists with proper step-based structure
- [ ] Uses shared references
- [ ] All paths use `.specd/tasks/`

---

### Task 3: Write research.md workflow

**Files:** `specdacular/workflows/research.md`

**Action:**
Rewrite `research-feature.md` as a proper step-based workflow (DEC-009). Key changes:
- Convert from intent document to `<step name="...">` format
- Use `@validate-task.md` for validation
- Use `@load-context.md` for context loading
- Use `@spawn-research-agents.md` for agent spawning
- Use `@synthesize-research.md` for synthesis
- Use `@record-decision.md` for decisions from research
- Use `@commit-docs.md` for commit

Steps: validate → load_context → spawn_agents → collect_results → synthesize → record_decisions → commit → completion

**Done when:**
- [ ] Workflow exists as proper step-based process
- [ ] Uses shared references for agents and synthesis
- [ ] Not an intent document — real executable steps

---

### Task 4: Write plan.md workflow

**Files:** `specdacular/workflows/plan.md`

**Action:**
Rewrite `plan-feature.md` as `plan.md`. Key changes:
- Use shared references
- Create `phases/phase-NN/PLAN.md` (one per phase, DEC-002)
- No `plans/phase-NN/NN-PLAN.md` multi-plan structure
- Create ROADMAP.md with single-plan-per-phase layout
- Remove orchestrator branches (Phase 5)
- Reference `templates/tasks/PLAN.md` and `templates/tasks/ROADMAP.md`

Steps: validate → load_context → assess_readiness → derive_phases → write_plans → write_roadmap → update_state → commit → completion

**Done when:**
- [ ] Creates `phases/phase-NN/PLAN.md` structure
- [ ] ROADMAP.md uses single-plan-per-phase
- [ ] No orchestrator branches
- [ ] Uses shared references

---

### Task 5: Write execute.md workflow

**Files:** `specdacular/workflows/execute.md`

**Action:**
Rewrite `execute-plan.md` as `execute.md`. Key changes:
- Use shared references
- Execute `phases/phase-NN/PLAN.md` (single plan per phase)
- **After phase execution completes, automatically chain to review.md** (DEC-005)
- No orchestrator contract_review step (Phase 5)
- Track phase_start_commit for review git diff
- Commit after task completion within the phase

Steps: validate → load_context → find_phase → execute_tasks → commit_per_task → trigger_review

The trigger_review step should reference: `@specdacular/workflows/review.md`

**Done when:**
- [ ] Executes single PLAN.md per phase
- [ ] Chains to review.md after execution
- [ ] Tracks phase_start_commit
- [ ] No orchestrator branches

---

### Task 6: Write review.md workflow

**Files:** `specdacular/workflows/review.md`

**Action:**
Create the merged review workflow (DEC-008). Combines:
- **From review-phase.md:** Semantic inspection (Claude reads code vs plan intent, classifies deviations)
- **From review-feature.md:** Git diff presentation, user-driven approval, fix plans in decimal phases

Steps: validate → load_context → inspect_code → present_findings → gather_feedback → generate_fix_plans → update_state → commit

Key behavior:
1. Read the phase's PLAN.md and the actual code
2. Compare plan intent vs implementation (semantic, not literal)
3. Get git diff for the phase (using phase_start_commit)
4. Present: summary line, per-task status, git diff stats, deviations
5. User approves, discusses, or requests fixes
6. Fix plans go in decimal phases: `phases/phase-NN.M/PLAN.md`
7. After fix execution, loop back to review

**Done when:**
- [ ] Combines semantic inspection + git diff
- [ ] User can approve or request revisions
- [ ] Fix plans in decimal phases
- [ ] Review loop works (fix → re-review)

---

### Task 7: Write continue.md workflow

**Files:** `specdacular/workflows/continue.md`

**Action:**
Rewrite `continue-feature.md` as `continue.md`. This is the state machine that drives the entire lifecycle. Key changes:
- Use `@validate-task.md` and `@load-context.md`
- Parse `--semi-auto` and `--auto` from `$ARGUMENTS`
- All paths use `.specd/tasks/`
- Dispatch to new workflow names (discuss.md, research.md, plan.md, execute.md, review.md)
- No orchestrator scheduling

**Three modes (DEC-003):**

**Interactive (default):**
- Read state, determine next action
- Present recommendation with AskUserQuestion
- User chooses: proceed, skip, discuss, etc.
- Execute chosen workflow
- Loop back to state check

**Semi-auto (`--semi-auto`):**
- Auto-run discuss → research → plan without prompting
- Execute phase, then auto-trigger review
- Stop after review for user approval
- If approved, continue to next phase
- If fix needed, auto-execute fix plan, re-review

**Auto (`--auto`):**
- Run everything without stopping
- Only stop if review finds issues that can't be auto-fixed
- Or when all phases complete

Steps: parse_args → validate → read_state → determine_action → dispatch → (loop)

**Done when:**
- [ ] Supports three modes: interactive, --semi-auto, --auto
- [ ] Correctly dispatches to all 6 other workflows
- [ ] State machine logic handles all stage transitions
- [ ] No orchestrator branches

---

## Verification

```bash
# All 7 workflows exist
ls specdacular/workflows/{new,continue,discuss,research,plan,execute,review}.md

# No old path references
grep -r "\.specd/features/" specdacular/workflows/{new,continue,discuss,research,plan,execute,review}.md && echo "FAIL" || echo "PASS"

# No old command references
grep -r "specd:feature:" specdacular/workflows/{new,continue,discuss,research,plan,execute,review}.md && echo "FAIL" || echo "PASS"

# All use shared references
for f in specdacular/workflows/{new,continue,discuss,research,plan,execute,review}.md; do
  echo "$f references:"
  grep -c "@.*references/" "$f"
done
```

**Plan is complete when:**
- [ ] All 7 workflows exist with step-based structure
- [ ] Zero references to `.specd/features/` or `/specd:feature:*`
- [ ] Shared references used (no duplicated validation/context/decision blocks)
- [ ] continue.md supports --semi-auto and --auto
- [ ] execute.md chains to review.md
- [ ] review.md combines both review approaches
- [ ] research.md is proper step-based (not intent doc)
