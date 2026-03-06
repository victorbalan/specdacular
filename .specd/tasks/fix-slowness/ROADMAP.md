# Roadmap: fix-slowness

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 3 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Utility Script** — Create specd-utils.js and update commit/routing references
- [ ] **Phase 2: Workflow Integration** — Update execute.md, brain.md, revise.md to use script
- [ ] **Phase 3: Context & Bloat Reduction** — Add lean context loading, trim all workflow files

---

## Phase Details

### Phase 1: Utility Script

**Goal:** The specd-utils.js script exists and works, and the most-used references (commit-code, commit-docs, brain-routing) call it instead of manual multi-step logic.

**Creates:**
- `hooks/specd-utils.js` — CLI with 13 subcommands (already prototyped, needs finalization)

**Modifies:**
- `specdacular/references/commit-code.md` — Replace 3-step logic with single script call
- `specdacular/references/commit-docs.md` — Same
- `specdacular/references/brain-routing.md` — Replace state parsing with single script call

**Plan:** `phases/phase-01/PLAN.md`

**Success Criteria:**
1. `node hooks/specd-utils.js commit --type code --files "test.txt" --message "test"` works
2. `node hooks/specd-utils.js route --task-dir .specd/tasks/fix-slowness` returns valid JSON
3. commit-code.md and commit-docs.md are <10 lines each
4. brain-routing.md is <30 lines

**Dependencies:** None (first phase)

---

### Phase 2: Workflow Integration

**Goal:** execute.md, brain.md, and revise.md use specd-utils for all mechanical operations (config reads, state transitions, changelog entries, phase management).

**Modifies:**
- `specdacular/workflows/execute.md` — Use script for phase-info, record-start, log-changelog, state-add-phase, commits
- `specdacular/workflows/brain.md` — Use script for config-update, advance-phase, record-phase-start, commits
- `specdacular/workflows/revise.md` — Use script for next-decimal-phase, config-update, commits

**Plan:** `phases/phase-02/PLAN.md`

**Success Criteria:**
1. execute.md has zero `cat .specd/config.json` instructions
2. brain.md state transitions all use `specd-utils config-update` or `specd-utils advance-phase`
3. revise.md uses `specd-utils next-decimal-phase`

**Dependencies:** Phase 1 complete

---

### Phase 3: Context & Bloat Reduction

**Goal:** Reduce workflow token footprint by ~40-50%. Add lean context loading for execution mode. Remove bloat patterns across all files.

**Modifies:**
- `specdacular/references/load-context.md` — Add execution mode (skip CONTEXT.md, MAP.md, STRUCTURE.md, CONCERNS.md)
- `specdacular/references/execute-hooks.md` — Compress from 127 → ~40 lines
- `specdacular/references/validate-task.md` — Remove error message templates (~32 lines)
- `specdacular/workflows/execute.md` — Set execution mode for load-context
- All workflow files (13) — Remove `<success_criteria>` blocks
- All workflow files (12) — Remove/compress `<philosophy>` blocks (keep behavioral instructions inline)
- All reference files (9) — Remove "Before using this reference" preambles

**Plan:** `phases/phase-03/PLAN.md`

**Success Criteria:**
1. load-context.md has two modes: full and execution
2. execute-hooks.md is ≤50 lines
3. No `<success_criteria>` blocks in any workflow file
4. No "Before using this reference" preambles in any reference file
5. Total line count across all workflows+references reduced by ≥20%

**Dependencies:** Phase 2 complete

---

## Execution Order

```
Phase 1: Utility Script
└── PLAN.md
    ↓
Phase 2: Workflow Integration
└── PLAN.md
    ↓
Phase 3: Context & Bloat Reduction
└── PLAN.md
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Node.js for utility script | Phase 1 creates hooks/specd-utils.js |
| DEC-002: Include brain routing | Phase 1 includes route subcommand |
| DEC-003: Lean context loading | Phase 3 modifies load-context.md |
| DEC-004: Single file with subcommands | Phase 1 creates one file, not many |
