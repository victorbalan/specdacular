---
name: specd:execute-plan
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

<objective>
Execute a plan from a feature, tracking progress and logging deviations.

**What it does:**
1. Load context — STATE.md, DECISIONS.md, RESEARCH.md, codebase patterns
2. Find next plan — First incomplete plan, or accept path as argument
3. Execute tasks with:
   - Auto-fix blockers/bugs → log to CHANGELOG.md
   - Ask about architectural changes → wait for user
   - Run verification after each task
   - Stop on verification failure → ask user (retry/skip/stop)
   - Commit after each task
4. Update progress — STATE.md with completed tasks
5. Suggest next — Next plan to execute
</objective>

<execution_context>
@~/.claude/specdacular/workflows/execute-plan.md
</execution_context>

<context>
Feature name: $ARGUMENTS (first argument)
Plan path: $ARGUMENTS (optional second argument)

**Load ALL feature context:**
@.specd/features/{name}/STATE.md — Progress tracking
@.specd/features/{name}/DECISIONS.md — Constraints to follow
@.specd/features/{name}/RESEARCH.md — Implementation notes (if exists)
@.specd/features/{name}/ROADMAP.md — Phase overview

**Load codebase context:**
@.specd/codebase/PATTERNS.md — Code patterns to follow
@.specd/codebase/STRUCTURE.md — Where files go
@.specd/codebase/MAP.md — System overview
</context>

<process>
1. **Validate** — Check feature exists with plans
2. **Load Context** — Read all feature and codebase docs
3. **Find Plan** — Next incomplete or specified plan
4. **Execute Tasks** — With verification and deviation handling
5. **Complete Plan** — Update STATE.md, suggest next
</process>

<success_criteria>
- [ ] Feature validated with plans
- [ ] Context loaded (feature, codebase)
- [ ] Tasks executed in order
- [ ] Verification run after each task
- [ ] Deviations logged to CHANGELOG.md
- [ ] STATE.md updated with progress
- [ ] Commits made after each task
- [ ] Next plan suggested
</success_criteria>
