# Feature: workflow-validation

## What This Is

Pre-flight validation and structured error recovery for all Specdacular commands. Every command checks prerequisites before proceeding and provides specific recovery guidance when something is wrong. Adds a `specd:validate` command for comprehensive feature state checking. Replaces vague error messages with actionable diagnostics.

## Technical Requirements

### Must Create

- [ ] Pre-flight validation blocks in every workflow — Check feature exists, STATE.md stage is correct, required files present, dependencies met
- [ ] `commands/specd/validate.md` — New command definition for `specd:validate {feature}`
- [ ] `specdacular/workflows/validate-feature.md` — Comprehensive validation workflow that checks all feature state
- [ ] Structured deviation categories in `execute-plan.md` — Replace vague "auto-fix vs ask" with three-tier system (auto-fix / ask user / stop & diagnose)
- [ ] Recovery command suggestions in all error paths — "Phase 2 plans not found. Run `/specd:phase:plan {feature} 2`"

### Must Integrate With

- `specdacular/workflows/execute-plan.md` — Needs pre-flight checks and structured deviation categories
- `specdacular/workflows/plan-feature.md` — Needs prerequisite validation (research complete?)
- `specdacular/workflows/plan-phase.md` — Needs ROADMAP.md existence check, phase number validation
- `specdacular/workflows/discuss-feature.md` — Needs feature directory existence check
- `specdacular/workflows/research-*.md` — Needs feature directory and FEATURE.md existence check
- `.specd/features/{name}/STATE.md` — Source of truth for stage validation
- `.specd/features/{name}/ROADMAP.md` — Source for phase dependency checking
- `plans/phase-NN/NN-PLAN.md` frontmatter `depends_on` — Dependency validation

### Constraints

- **Fail fast, fail clear** — Validation errors must stop execution immediately with specific recovery instructions
- **No silent failures** — Every validation check either passes or produces a visible, actionable message
- **Workflow-only implementation** — Validation is instructions in workflow markdown, not code
- **Non-breaking for existing features** — Features without full state (e.g., missing optional files) should warn, not error

---

## Success Criteria

- [ ] `phase:execute` fails immediately if `phase:plan` hasn't been run, with message: "Plans not found. Run `/specd:phase:plan {feature} {N}` first."
- [ ] `specd:validate {feature}` checks: all required files exist, DECISIONS.md entries have required fields, ROADMAP.md phases match plan directories, STATE.md is consistent
- [ ] Every workflow has a "Prerequisites Check" section at the top
- [ ] Deviation categories during execution are explicit: auto-fix (missing import, path typo), ask user (new file not in plan, architecture change), stop & diagnose (dependency missing, API unavailable)
- [ ] All error messages include a recovery command or next step

---

## Out of Scope

- [X] Automated fixing — Validation reports problems, doesn't auto-fix them (except during execution deviation handling)
- [X] Schema enforcement — Don't enforce exact markdown structure, just check key fields exist
- [X] CI/CD integration — Validation is for interactive use, not pipeline checks

---

## Initial Context

### User Need
Commands don't validate prerequisites or enforce ordering. `phase:execute` can run without `phase:plan`. State files assume specific markdown structure but nothing enforces it. When something goes wrong, error messages are generic ("Feature not found") with no recovery guidance. This is the #1 source of "stuck" states.

### Integration Points
- Every workflow file (pre-flight validation blocks)
- STATE.md (stage checking)
- ROADMAP.md (phase dependency validation)
- Plan frontmatter (depends_on validation)
- New validate command and workflow

### Key Constraints
- Instructions in markdown, not code
- Must be helpful, not bureaucratic — warn on non-critical issues, error on blocking ones
- Recovery suggestions must reference actual Specdacular commands
