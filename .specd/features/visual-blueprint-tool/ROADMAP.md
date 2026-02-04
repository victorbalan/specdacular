# Roadmap: visual-blueprint-tool

**Created:** 2026-02-04
**Feature:** Visual Blueprint Tool for Specdacular features
**Total Phases:** 3
**Total Plans:** 5

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

---

## Success Criteria

When all phases complete:

- [ ] `/specd:blueprint {feature}` generates a working HTML file
- [ ] Blueprint opens in browser with sidebar navigation
- [ ] All tabs functional: Overview, Decisions, Context, Plans
- [ ] Wireframes tab shows HTML/CSS mockups (when generated)
- [ ] Diagrams tab shows Mermaid diagrams (when generated)
- [ ] File:// protocol works without issues

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
