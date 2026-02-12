# Roadmap: improved-status-command

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 1 |
| Total Plans | TBD |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Add orchestrator support to status workflow** — Extend status workflow with orchestrator detection, sub-project scanning, and grouped output formatting

---

## Phase Details

### Phase 1: Add orchestrator support to status workflow

**Goal:** The status command detects orchestrator mode and displays a grouped dashboard showing orchestrator features with sub-project features indented underneath, plus standalone sub-project features in a separate section.

**Creates:**
- None

**Modifies:**
- `specdacular/workflows/status.md` — Add orchestrator mode detection, sub-project feature scanning, grouped output with tree-style indentation, standalone project features section

**Plans:**
1. `plans/phase-01/01-PLAN.md` — Update status workflow with orchestrator support

**Success Criteria:**
1. In single-project mode (no config.json or type != orchestrator), output is identical to current behavior
2. In orchestrator mode, reads `.specd/config.json` type field and projects array
3. Orchestrator features display with sub-project features indented (`└ project`) underneath
4. Standalone sub-project features (not tied to orchestrator features) appear in a "Project Features" section grouped by project
5. `--all` flag works for orchestrator and project-level completed/abandoned features
6. Features sorted by stage priority within each section

**Dependencies:** None (first and only phase)

---

## Execution Order

```
Phase 1: Add orchestrator support to status workflow
└── 01-PLAN.md: Update status workflow
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Grouped view for orchestrator features | Defines the output format — orchestrator features as parent rows with indented sub-project rows |
| DEC-002: Standalone sub-project features in separate section | Requires scanning all sub-project feature directories and de-duplicating against orchestrator features |

---

## Notes

Single-phase feature because the entire change is confined to one workflow file (`status.md`). No new files, no type changes, no API changes.
