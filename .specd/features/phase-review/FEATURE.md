# Feature: phase-review

## What This Is

A post-execution review command (`/specd.phase:review`) that creates an iterative loop: execute → review → fix → review → done. Claude inspects executed plans against actual code, surfaces deviations, captures decisions, and generates corrective plans when needed. A phase isn't complete until the review says it is.

## Technical Requirements

### Must Create

- [ ] `commands/specd.phase-review.md` — Command definition with frontmatter
- [ ] `specdacular/workflows/review-phase.md` — Workflow implementation

### Must Integrate With

- `.specd/features/{name}/plans/` — Reads executed plan files to know what was intended
- `.specd/features/{name}/STATE.md` — Updates phase completion status, tracks review cycles
- `.specd/features/{name}/DECISIONS.md` — Records new decisions discovered during review
- `.specd/features/{name}/CHANGELOG.md` — Records deviations from original plans
- `.specd/features/{name}/config.json` — Reads feature metadata
- `specdacular/workflows/execute-plan.md` — Review feeds back into execution loop
- `commands/specd.help.md` — Add new command to help output

### Constraints

- Read-heavy, write-light — Primary job is inspection and conversation, not bulk code changes
- Must work mid-phase — Can review after partial execution, not just after all plans complete
- Corrective plans use existing plan format — No new plan template needed
- Iterative — Supports multiple review cycles per phase (execute → review → execute → review)

---

## Success Criteria

- [ ] `/specd.phase:review {feature} {phase}` inspects code against executed plans and presents findings
- [ ] Deviations between planned and actual code are surfaced automatically
- [ ] User can flag additional issues beyond what Claude detects
- [ ] New decisions are captured in DECISIONS.md
- [ ] Deviations are logged in CHANGELOG.md
- [ ] Corrective plans are generated when issues are identified
- [ ] Phase is marked complete only when review passes clean
- [ ] STATE.md reflects review status (reviewed, needs-fixes, etc.)

---

## Out of Scope

- [X] Automated testing or linting — This is a human+AI review, not CI
- [X] Modifying code directly — Review generates plans, execution modifies code
- [X] Cross-phase review — Each review targets one phase at a time

---

## Initial Context

### User Need
After executing phase plans, reality diverges from the plan — the user makes modifications, on-the-fly decisions, dislikes certain implementations. Currently these changes go unrecorded and there's no mechanism to iterate until satisfied. The review step closes this gap.

### Integration Points
- Sits between `phase:execute` and phase completion in the feature flow
- Creates the loop: `phase:execute → phase:review → (corrective plans → phase:execute → phase:review)* → done`
- Reads plan files and inspects code those plans created/modified

### Key Constraints
- Claude inspects first (automated diff against plans), then asks user for input
- Must capture decisions and deviations in existing document formats
- Corrective plans should be appendable to the existing phase plan set
