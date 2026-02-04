# Roadmap: visual-blueprint-tool

**Created:** 2026-02-04
**Feature:** Visual Blueprint Tool for Specdacular features
**Total Phases:** 4
**Total Plans:** 8

---

## Overview

This roadmap outlines the implementation of the visual blueprint tool, which generates a browsable HTML frontend for exploring Specdacular feature artifacts.

**Command:** `/specd:blueprint {feature} [wireframes|diagrams]`

**Output:** `.specd/features/{feature}/blueprint/index.html`

---

## Phase 1: Foundation

**Goal:** Create HTML templates and command definition

| Plan | Title | Creates | Status |
|------|-------|---------|--------|
| 1.01 | Create HTML Template Structure | `specdacular/templates/blueprint/` (index.html, styles.css, scripts.js) | Pending |
| 1.02 | Create Command Definition | `commands/specd/blueprint.md`, update help.md | Pending |

**Dependencies:** None (can start immediately)

**Deliverables:**
- HTML template with sidebar navigation
- Tab structure for Overview, Decisions, Context, Plans, Wireframes, Diagrams
- Accordion-style decision viewer using `<details>/<summary>`
- Command file with subcommand routing

---

## Phase 2: Core Workflow

**Goal:** Create the main workflow that generates the blueprint

| Plan | Title | Creates | Status |
|------|-------|---------|--------|
| 2.01 | Create Main Blueprint Workflow | `specdacular/workflows/blueprint.md` | Pending |

**Dependencies:** Phase 1 complete (templates and command exist)

**Deliverables:**
- 10-step workflow: parse_arguments → validate → load_context → check_optional → parse_decisions → parse_context → parse_feature → generate_html → write_output → open_browser
- Markdown parsing logic for DECISIONS.md, CONTEXT.md, FEATURE.md
- HTML generation with placeholder replacement
- Browser opening via `open` command

---

## Phase 3: Extensions

**Goal:** Add wireframes and diagrams generation capabilities

| Plan | Title | Creates | Status |
|------|-------|---------|--------|
| 3.01 | Create Wireframes Extension | `specdacular/workflows/blueprint-wireframes.md` | Pending |
| 3.02 | Create Diagrams Extension | `specdacular/workflows/blueprint-diagrams.md` | Pending |

**Dependencies:** Phase 2 complete (main workflow exists)

**Deliverables:**
- Wireframes workflow: Generates HTML/CSS mockups from feature artifacts
- Diagrams workflow: Generates Mermaid flow and ER diagrams
- Both update the main blueprint to enable their respective tabs

---

## Phase 4: Phase-Centric Enhancement

**Goal:** Make content discoverable per phase, not just per feature

| Plan | Title | Modifies | Status |
|------|-------|----------|--------|
| 4.01 | Add Phase Tab Navigation to Template | `specdacular/templates/blueprint/` | Pending |
| 4.02 | Update Workflow to Group Content by Phase | `specdacular/workflows/blueprint.md` | Pending |
| 4.03 | Add Wireframes Scope Prompt | `specdacular/workflows/blueprint-wireframes.md` | Pending |

**Dependencies:** Phase 3 complete (wireframes/diagrams workflows exist)

**Deliverables:**
- Phase tabs within Decisions, Context, and Plans sections
- Decisions grouped by explicit `**Phase:** N` field
- Wireframes scope prompt (per-feature or per-phase)
- Per-phase wireframe files when requested

---

## Execution Order

```
Phase 1 ──────────────────────────────────────────────────────────
  ├── Plan 1.01: HTML templates (no dependencies)
  └── Plan 1.02: Command definition (no dependencies)

Phase 2 ──────────────────────────────────────────────────────────
  └── Plan 2.01: Main workflow (depends on 1.01, 1.02)

Phase 3 ──────────────────────────────────────────────────────────
  ├── Plan 3.01: Wireframes (depends on 2.01)
  └── Plan 3.02: Diagrams (depends on 2.01)

Phase 4 ──────────────────────────────────────────────────────────
  ├── Plan 4.01: Phase tab navigation (depends on 1.01)
  ├── Plan 4.02: Workflow phase grouping (depends on 4.01)
  └── Plan 4.03: Wireframes scope prompt (depends on 3.01)
```

**Note:** Within each phase, plans without dependencies on each other can be executed in parallel.

---

## Key Decisions

| ID | Summary | Impact |
|----|---------|--------|
| DEC-001 | Command name `/specd:blueprint` | All plans reference this command |
| DEC-002 | Static HTML, no server | Templates must be self-contained |
| DEC-003 | Mermaid.js via CDN | Diagrams plan uses external script |
| DEC-004 | Sidebar with accordion | Template structure in Plan 1.01 |
| DEC-005 | HTML/CSS wireframes | Wireframes plan generates visual mockups |
| DEC-006 | High-level diagrams | Diagrams plan focuses on happy path |
| DEC-007 | Phase tabs within sections | Phase 4 template and workflow changes |
| DEC-008 | Explicit Phase field in decisions | Workflow parses Phase for grouping |
| DEC-009 | Wireframes scope prompt | Phase 4 wireframes workflow changes |

---

## Success Criteria

When all phases complete:

- [ ] `/specd:blueprint {feature}` generates a working HTML file
- [ ] Blueprint opens in browser with sidebar navigation
- [ ] All tabs functional: Overview, Decisions, Context, Plans
- [ ] Wireframes tab shows HTML/CSS mockups (when generated)
- [ ] Diagrams tab shows Mermaid diagrams (when generated)
- [ ] File:// protocol works without issues
- [ ] Phase tabs filter content by phase in each section
- [ ] Decisions grouped by Phase field
- [ ] Wireframes scope prompt offers per-feature/per-phase choice

---

## Quick Reference

**Execute plans:**
```
/specd:execute-plan visual-blueprint-tool phase-01/01-PLAN.md
```

**Check status:**
```
Read .specd/features/visual-blueprint-tool/STATE.md
```

**Test blueprint:**
```
/specd:blueprint visual-blueprint-tool
```
