# Roadmap: improved-feature-flow

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 4 |
| Total Plans | TBD (created per-phase) |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Rename + Toolbox** — Restructure command surface: rename next→continue, create toolbox menu
- [ ] **Phase 2: Review + State Machine** — User-guided review workflow and phase transition gating
- [ ] **Phase 3: Insert Workflow** — Decimal phase numbering for inserting phases mid-development
- [ ] **Phase 4: Cleanup + Installation** — Remove old commands, update installer and help

---

## Phase Details

### Phase 1: Rename + Toolbox

**Goal:** Replace the current command surface with the new simplified structure. After this phase, users interact with `continue` and `toolbox` instead of individual feature/phase commands.

**Creates:**
- `commands/specd/continue-feature.md` — Main flow driver command (replaces next-feature)
- `commands/specd/toolbox.md` — Command stub for toolbox menu
- `specdacular/workflows/toolbox.md` — Toolbox workflow: presents AskUserQuestion menu with discuss/research/plan/review/insert, dispatches to corresponding workflow
- `specdacular/workflows/continue-feature.md` — Renamed from next-feature.md with updated references

**Modifies:**
- `commands/specd/new-feature.md` — Update continuation references from `next` to `continue`
- `specdacular/workflows/new-feature.md` — Update references from `next` to `continue`
- `specdacular/templates/features/STATE.md` — Update resume command reference

**Success Criteria:**
1. `/specd:feature:continue` drives the lifecycle identically to current `next`
2. `/specd:feature:toolbox` presents menu with 5 options: discuss, research, plan, review, insert
3. Discuss, research, plan from toolbox ask scope (feature vs specific phase) before dispatching
4. All references to `next` updated to `continue`

**Dependencies:** None (first phase)

---

### Phase 2: Review + State Machine

**Goal:** Add user-guided review after phase execution and gate phase transitions on explicit user approval. After this phase, `continue` never skips review in fresh contexts.

**Creates:**
- `specdacular/workflows/review-feature.md` — Review workflow: shows files created/modified, test guidance, takes user feedback, generates fix plans with decimal numbering

**Modifies:**
- `specdacular/workflows/execute-plan.md` — Mark phase as `executed` (not `completed`) when all plans done
- `specdacular/workflows/continue-feature.md` — Check `executed` vs `completed` status, show review checkpoint for `executed` phases, gate transition on user approval
- `specdacular/templates/features/STATE.md` — Add `executed` phase status tracking

**Success Criteria:**
1. After all plans in a phase execute, phase status = `executed` (not `completed`)
2. `continue` on an `executed` phase shows: files created/modified, test guidance, "Is this OK?"
3. User approval moves phase to `completed` and advances to next phase
4. User revision feedback generates fix plans (decimal numbered: 6.1, 6.2)
5. `continue` in a fresh context lands on review for `executed` phases

**Dependencies:** Phase 1 complete (continue-feature.md must exist)

---

### Phase 3: Insert Workflow

**Goal:** Allow users to insert new phases mid-development using decimal numbering (6.1, 6.2) without renumbering existing phases.

**Creates:**
- `specdacular/workflows/insert-phase.md` — Insert workflow: asks where to insert, creates decimal-numbered phase directory, updates ROADMAP.md

**Modifies:**
- `specdacular/workflows/toolbox.md` — Wire up "Insert phase" option to insert-phase workflow

**Success Criteria:**
1. Insert after phase 6 creates `plans/phase-6.1/`
2. Subsequent inserts create 6.2, 6.3, etc.
3. No deeper nesting (no 6.1.1)
4. ROADMAP.md updated with new phase in correct position
5. Execution order respects decimal ordering: 6 → 6.1 → 6.2 → 7

**Dependencies:** Phase 1 complete (toolbox must exist)

---

### Phase 4: Cleanup + Installation

**Goal:** Remove all old command files and update the installer so autocomplete shows exactly 7 entries.

**Deletes:**
- `commands/specd/discuss-feature.md`
- `commands/specd/research-feature.md`
- `commands/specd/plan-feature.md`
- `commands/specd/next-feature.md` (replaced by continue-feature)
- `commands/specd/insert-phase.md`
- `commands/specd/renumber-phase.md`
- `commands/specd/review-phase.md`
- `commands/specd/research-phase.md`
- `commands/specd/prepare-phase.md`
- `commands/specd/plan-phase.md`
- `commands/specd/execute-plan.md`

**Modifies:**
- `bin/install.js` — Update file copy list to install only the 7 new commands
- `commands/specd/help.md` — Rewrite command reference for new surface

**Success Criteria:**
1. `commands/specd/` contains exactly 7 files: `new-feature.md`, `continue-feature.md`, `toolbox.md`, `map-codebase.md`, `status.md`, `help.md`, `update.md`
2. `bin/install.js` installs correct command set
3. `help.md` documents new command surface accurately
4. Local install (`npx specdacular --local`) produces correct autocomplete

**Dependencies:** Phases 1-3 complete (all new commands must be in place before removing old ones)

---

## Execution Order

```
Phase 1: Rename + Toolbox
├── Rename next → continue
├── Create toolbox command + workflow
└── Update all references
    ↓
Phase 2: Review + State Machine
├── Create review-feature workflow
├── Modify execute-plan (executed vs completed)
└── Modify continue (transition gating)
    ↓
Phase 3: Insert Workflow
├── Create insert-phase workflow
└── Wire into toolbox
    ↓
Phase 4: Cleanup + Installation
├── Delete ~11 old command files
├── Update install.js
└── Update help.md
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Toolbox command | Phase 1 — creates toolbox as single entry point |
| DEC-002: Remove phase commands | Phase 4 — cleanup happens last, after replacements exist |
| DEC-003: User-guided review | Phase 2 — new review workflow |
| DEC-004: Rename next→continue | Phase 1 — rename is first action |
| DEC-005: 7 autocomplete entries | Phase 4 — verified after cleanup |
| DEC-006: Decimal numbering | Phase 3 — insert workflow |
| DEC-007: Scope selection | Phase 1 — toolbox asks feature vs phase |
| DEC-008: Review summary + test guidance | Phase 2 — review workflow details |
| DEC-009: Phase transition gating | Phase 2 — state machine changes |

---

## Notes

Phases 2 and 3 are independent of each other (both depend on Phase 1 only). They could theoretically run in parallel, but sequential is simpler for a single-developer workflow. Phase 4 must be last — it removes old commands that are still functional until replacements are verified.
