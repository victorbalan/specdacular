---
name: specd:phase:review
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
