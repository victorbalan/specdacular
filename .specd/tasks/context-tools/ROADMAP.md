# Roadmap: context-tools

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 4 |
| Current Phase | 4 |
| Status | Phases 1-3 Complete |

---

## Phases

- [x] **Phase 1: Context Status Dashboard** — Read context files, extract timestamps, display staleness dashboard
- [x] **Phase 2: Context Review and Add** — Section-by-section review with edit/remove/re-map, guided content addition
- [x] **Phase 3: Toolbox Integration** — Wire workflows into /specd:toolbox menu, verify installation
- [ ] **Phase 4: Context Review Improvements** — Show all sections with assessment, use specd-codebase-mapper agent for re-mapping, consistent diff template

---

## Phase Details

### Phase 1: Context Status Dashboard

**Goal:** Users can see at a glance when each context file was generated, last reviewed, and last modified, with days-ago calculations.

**Creates:**
- `specdacular/workflows/context-status.md` — Status dashboard workflow

**Plan:** `phases/phase-01/PLAN.md`

**Success Criteria:**
1. Workflow reads all 4 context files and extracts timestamps
2. Dashboard displays Generated, Last Reviewed, Last Modified, section counts, USER_MODIFIED counts

**Dependencies:** None (first phase)

---

### Phase 2: Context Review and Add

**Goal:** Users can walk through context files section by section, editing, removing, or re-mapping sections with USER_MODIFIED tracking. Users can add new content to the right file and section.

**Creates:**
- `specdacular/workflows/context-review.md` — Guided review workflow
- `specdacular/workflows/context-add.md` — Guided content addition workflow

**Plan:** `phases/phase-02/PLAN.md`

**Success Criteria:**
1. Review walks both ## and ### levels with confirm/edit/remove/re-map options
2. Edits add USER_MODIFIED tags, re-mapping shows semantic diffs
3. Add workflow identifies correct file/section, checks for duplicates, confirms placement

**Dependencies:** Phase 1 complete (establishes timestamp patterns used by review/add)

---

### Phase 3: Toolbox Integration

**Goal:** All three context workflows are accessible from the `/specd:toolbox` menu and work through the standard installation flow.

**Modifies:**
- `commands/specd/toolbox.md` — Add context management category

**Plan:** `phases/phase-03/PLAN.md`

**Success Criteria:**
1. Toolbox shows "Task operations" and "Context management" as categories
2. Context submenu dispatches to all three workflows correctly
3. New files are installed correctly by existing `bin/install.js`

**Dependencies:** Phase 1 and Phase 2 complete

---

## Execution Order

```
Phase 1: Context Status Dashboard
└── PLAN.md (1 task)
    ↓
Phase 2: Context Review and Add
└── PLAN.md (2 tasks)
    ↓
Phase 3: Toolbox Integration
└── PLAN.md (2 tasks)
    ↓
Phase 4: Context Review Improvements
└── PLAN.md (3 tasks)
```

---

### Phase 4: Context Review Improvements

**Goal:** Every section is shown to the user with an up-to-date assessment (no auto-skipping). Re-mapping uses a dedicated `specd-codebase-mapper` agent with file-type-specific focus, matching the map-codebase process. Changes displayed using a consistent template.

**Creates:**
- `specdacular/templates/context-review-diff.md` — Consistent display template for section reviews and re-map diffs

**Modifies:**
- `specdacular/workflows/context-review.md` — Add assessment logic, use mapper agent, reference template

**Plan:** `phases/phase-04/PLAN.md`

**Success Criteria:**
1. Every section shown to user with ✅/⚠️/🔄 assessment
2. Re-mapping uses `specd-codebase-mapper` with correct focus (map/patterns/structure/concerns)
3. Diff display follows template for consistency

**Dependencies:** Phase 2 complete

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-003: Toolbox integration | Phase 3 modifies toolbox instead of creating new commands |
| DEC-009: ~~Inline Task for re-mapping~~ SUPERSEDED by DEC-011 | Phase 4 uses specd-codebase-mapper agent instead |
| DEC-011: Use specd-codebase-mapper for re-mapping | Phase 4 uses dedicated mapper agent with file-type focus |
| DEC-010: Skip task validation | All phases validate `.specd/codebase/` instead of task name |
| DEC-008: Git checkpoint | Phase 2 review workflow creates checkpoint before destructive ops |
