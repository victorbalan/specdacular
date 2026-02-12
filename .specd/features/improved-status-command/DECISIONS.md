# Decisions: improved-status-command

**Feature:** improved-status-command
**Created:** 2026-02-11
**Last Updated:** 2026-02-11

---

## Active Decisions

### DEC-001: Grouped view for orchestrator features

**Date:** 2026-02-11
**Status:** Active
**Context:** Needed to decide how orchestrator features and their sub-project features display together
**Decision:** Use a grouped view — orchestrator feature as parent row, sub-project features indented with `└ project` prefix
**Rationale:**
- Preserves the orchestrator/sub-project hierarchy
- Makes cross-project coordination visible at a glance
- Flat view would repeat feature names with no clear relationship
**Implications:**
- Workflow must read per-feature config.json to get project list
- Output formatting needs tree-style indentation for sub-project rows

---

### DEC-002: Standalone sub-project features in separate section

**Date:** 2026-02-11
**Status:** Active
**Context:** Sub-projects may have features not tied to any orchestrator feature
**Decision:** Show standalone sub-project features in a "Project Features" section below orchestrator features, grouped by project
**Rationale:**
- Keeps orchestrator-coordinated work visually distinct from project-local work
- Projects may have their own independent features worth tracking
**Implications:**
- Workflow must scan all sub-project `.specd/features/` directories
- Must identify which sub-project features are already shown under orchestrator features to avoid duplicates

---

## Superseded Decisions

_None._

---

## Revoked Decisions

_None._

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-11 | Grouped view for orchestrator features | Active |
| DEC-002 | 2026-02-11 | Standalone sub-project features in separate section | Active |
