# Roadmap: context-tools

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 3 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Context Status Dashboard** — Read context files, extract timestamps, display staleness dashboard
- [ ] **Phase 2: Context Review and Add** — Section-by-section review with edit/remove/re-map, guided content addition
- [ ] **Phase 3: Toolbox Integration** — Wire workflows into /specd:toolbox menu, verify installation

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
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-003: Toolbox integration | Phase 3 modifies toolbox instead of creating new commands |
| DEC-009: Inline Task for re-mapping | Phase 2 uses general-purpose Task, no new agent file needed |
| DEC-010: Skip task validation | All phases validate `.specd/codebase/` instead of task name |
| DEC-008: Git checkpoint | Phase 2 review workflow creates checkpoint before destructive ops |
