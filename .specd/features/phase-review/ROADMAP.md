# Roadmap: phase-review

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 2 |
| Total Plans | 2 (Phase 1) + TBD (Phase 2) |
| Current Phase | 1 |
| Status | Phase 1 Planned |

---

## Phases

- [ ] **Phase 1: Command & Core Workflow** — Create the review command and full workflow implementation
- [ ] **Phase 2: Integration & Documentation** — Update help, README, templates, and feature flow diagrams

---

## Phase Details

### Phase 1: Command & Core Workflow

**Goal:** Create a working `/specd:phase:review` command that inspects executed plans against actual code, presents findings to the user, captures decisions and deviations, and generates corrective plans when needed.

**Creates:**
- `commands/specd/phase/review.md` — Command definition with frontmatter, objective, execution_context reference
- `specdacular/workflows/review-phase.md` — Full workflow with 11 steps: validate, load_context, filter_plans, inspect_phase, present_findings, gather_user_input, record_decisions, generate_correctives, update_state, update_changelog, commit_and_next

**Modifies:**
- None — this phase creates new files only

**Plans:**
1. `plans/phase-01/01-PLAN.md` — Create command definition (frontmatter, argument handling, workflow reference)
2. `plans/phase-01/02-PLAN.md` — Create review workflow (all 11 steps, deviation detection, output formatting, corrective plan generation, state tracking)

**Success Criteria:**
1. `/specd:phase:review {feature} {phase}` runs without error on a feature with executed plans
2. Review reads plan frontmatter (`creates`/`modifies`) and inspects actual files
3. Per-plan status table displayed with ✅/⚠️/❌/⏸️ icons
4. Expanded detail sections shown for deviations and incomplete items
5. User conversation phase captures additional issues and decisions
6. Corrective plans generated with sequential numbering and `corrects` frontmatter field
7. STATE.md Review Cycles section updated with cycle data
8. CHANGELOG.md updated with deviation entries
9. Partial execution review works (only inspects completed plans)

**Dependencies:** None (first phase)

---

### Phase 2: Integration & Documentation

**Goal:** Make the review command discoverable and update all documentation to reflect the new review loop in the feature flow.

**Creates:**
- None

**Modifies:**
- `commands/specd/help.md` — Add `phase:review` to Phase Commands table, update feature flow diagram
- `README.md` — Add `phase:review` to Phase Commands table, update Quick Start and Flow sections
- `specdacular/templates/features/STATE.md` — Add Review Cycles section template

**Plans:**
1. `plans/phase-02/01-PLAN.md` — Update help, README, and STATE.md template with review command and loop documentation

**Success Criteria:**
1. `/specd:help` shows `phase:review` in Phase Commands table
2. Feature flow in help.md shows the review loop: `execute → review → [fix → execute → review]*`
3. README.md Phase Commands table includes `phase:review`
4. README.md Quick Start shows review usage example
5. STATE.md template includes Review Cycles section placeholder

**Dependencies:** Phase 1 complete

---

## Execution Order

```
Phase 1: Command & Core Workflow
├── 01-PLAN.md: Command definition
└── 02-PLAN.md: Review workflow implementation
    ↓
Phase 2: Integration & Documentation
└── 01-PLAN.md: Help, README, templates
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Claude inspects first, then user weighs in | Phase 1 workflow must implement both inspection and conversation steps |
| DEC-003: Corrective plans continue sequence numbering | Phase 1 workflow generates plans with standard naming + `corrects` frontmatter |
| DEC-004: Review cycles tracked in STATE.md | Phase 1 updates STATE.md; Phase 2 updates template |
| DEC-005: Per-plan status table output | Phase 1 workflow implements progressive disclosure format |
| DEC-006: Partial execution review | Phase 1 workflow filters by plan completion status |

---

## Notes

Two phases keeps this feature tight. Phase 1 is the heavy lift — the entire command and workflow. Phase 2 is documentation updates that ensure the command is discoverable and the feature flow diagrams are accurate. The standard types→API→UI dependency pattern doesn't apply here since this is a workflow/command feature with no types, APIs, or UI components.
