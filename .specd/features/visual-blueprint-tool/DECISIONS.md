# Decisions: visual-blueprint-tool

**Feature:** visual-blueprint-tool
**Created:** 2026-02-04
**Last Updated:** 2026-02-04

---

## Active Decisions

### DEC-001: Command name is `/specd:blueprint`

**Date:** 2026-02-04
**Status:** Active
**Context:** Needed a clear, memorable command name for the visual system. Initial candidate "generate-ui" felt too generic.
**Decision:** Use `/specd:blueprint` with subcommands for wireframes and diagrams.
**Rationale:**
- "Blueprint" describes what it is — a visual blueprint of the feature
- Natural fit: "I planned the feature, now let me see the blueprint"
- Clean subcommand structure: `blueprint`, `blueprint wireframes`, `blueprint diagrams`
**Implications:**
- Command file: `commands/specd/blueprint.md`
- Workflow files: `specdacular/workflows/blueprint*.md`
- Output directory: `.specd/features/{name}/blueprint/`

---

### DEC-002: Static HTML, no server required

**Date:** 2026-02-04
**Status:** Active
**Context:** Needed to decide how the visual system would be served/viewed.
**Decision:** Generate self-contained static HTML that opens directly in browser via `open` command.
**Rationale:**
- Zero dependencies — no Python, Node, or server setup
- Simple — just generate and open
- Works offline
- Fits CLI-first workflow
**Implications:**
- All content must be embedded at generation time
- MD files read and converted to HTML during generation
- CSS/JS inlined or co-located (no external CDN except Mermaid)
- To update, regenerate the blueprint

---

### DEC-003: Mermaid.js for diagrams

**Date:** 2026-02-04
**Status:** Active
**Context:** Needed a diagramming solution for flow and ER diagrams.
**Decision:** Use Mermaid.js loaded from CDN.
**Rationale:**
- Text-based diagrams (easy for Claude to generate)
- Supports flowcharts and ER diagrams
- Single CDN include, renders client-side
- Widely used, well-documented
**Implications:**
- Requires internet connection for initial load (Mermaid CDN)
- Diagrams defined as text in HTML, rendered by Mermaid
- Claude generates Mermaid syntax, not images

---

### DEC-004: Sidebar layout with accordion decisions

**Date:** 2026-02-04
**Status:** Active
**Context:** Needed to design the hub page layout and navigation approach.
**Decision:** Use sidebar navigation with custom CSS. Decisions view uses accordion pattern.
**Rationale:**
- Sidebar keeps navigation always visible
- Custom CSS avoids framework dependencies
- Accordion allows scanning decision list while showing details on demand
- Tabs: Overview, Decisions, Context, Plans, Wireframes, Diagrams
- Wireframes/Diagrams always visible, greyed out if not generated
**Implications:**
- Default view is Overview (feature description, stats, activity timeline)
- Decisions show ID, title, date, status collapsed; click to expand full details
- No Tailwind or other framework — just clean custom CSS

---

### DEC-005: HTML/CSS wireframes, combined view

**Date:** 2026-02-04
**Status:** Active
**Context:** Needed to decide wireframe format and level of detail.
**Decision:** Generate HTML/CSS mockups (not ASCII). One combined view per feature, PM-friendly.
**Rationale:**
- HTML/CSS is more visual and easier to understand than ASCII boxes
- Combined view shows overall layout and flow in one place
- PM-friendly: shows "what we're building" without developer details
- Easy for Claude to generate
**Implications:**
- Wireframes show layout, button positions, general flow
- Not pixel-perfect or component-specific
- Colored divs, placeholder boxes, annotations

---

### DEC-006: High-level happy-path diagrams

**Date:** 2026-02-04
**Status:** Active
**Context:** Needed to decide diagram detail level and scope.
**Decision:** Generate high-level diagrams focused on happy path. Feature-scoped, refinable through discussion.
**Rationale:**
- High-level is more useful for understanding than granular details
- Happy path covers the main flow; error flows only if significant
- Feature-scoped keeps diagrams focused and readable
- Can refine through follow-up discussion
**Implications:**
- Flow diagrams: key steps and decision points, not every detail
- ER diagrams: entities from FEATURE.md with key relationships
- User can request additions: "add cache layer", "show auth failure"

---

### DEC-007: Phase tabs within sections for navigation

**Date:** 2026-02-04
**Status:** Active
**Context:** Need to make decisions, context, and plans discoverable per phase, not just aggregated.
**Decision:** Use phase tabs within each section (Decisions, Context, Plans) rather than nested phase groups or a global filter.
**Rationale:**
- Preserves familiar flat structure
- "All" tab maintains current behavior
- Easy to drill into specific phase OR see everything
- Less visual clutter than nested phases
**Implications:**
- Decisions section gets tabs: [All] [Phase 1] [Phase 2] ...
- Context section gets tabs: [All] [Phase 1] [Phase 2] ...
- Plans section shows phases directly (inherently per-phase)
- Template needs updated HTML/CSS for tabbed sub-navigation

---

### DEC-008: Explicit Phase field in decisions

**Date:** 2026-02-04
**Status:** Active
**Context:** Need to associate decisions with their phase for filtering.
**Decision:** Add `**Phase:** N` field to each decision in DECISIONS.md.
**Rationale:**
- Unambiguous — no guessing from dates or references
- Easy to parse
- Pre-planning decisions use `**Phase:** 0`
**Implications:**
- Update decision template to include Phase field
- Blueprint workflow parses Phase field when grouping decisions
- All new decisions must include Phase

---

### DEC-009: Wireframes scope prompt

**Date:** 2026-02-04
**Status:** Active
**Context:** User wants option for per-phase wireframes, not just per-feature.
**Decision:** Always prompt when running wireframes subcommand. Default recommendation is per-feature, per-phase is optional.
**Rationale:**
- Per-feature is more common use case
- Per-phase useful for complex multi-phase features
- Explicit choice avoids assumptions
**Implications:**
- Prompt: "Per feature (recommended) or Per phase?"
- Per feature → single `wireframes.html`
- Per phase → `wireframes-phase-01.html`, `wireframes-phase-02.html`, etc.
- Phases without UI → generate diagrams instead

---

## Superseded Decisions

(none)

---

## Revoked Decisions

(none)

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-04 | Command name is `/specd:blueprint` | Active |
| DEC-002 | 2026-02-04 | Static HTML, no server required | Active |
| DEC-003 | 2026-02-04 | Mermaid.js for diagrams | Active |
| DEC-004 | 2026-02-04 | Sidebar layout with accordion decisions | Active |
| DEC-005 | 2026-02-04 | HTML/CSS wireframes, combined view | Active |
| DEC-006 | 2026-02-04 | High-level happy-path diagrams | Active |
| DEC-007 | 2026-02-04 | Phase tabs within sections for navigation | Active |
| DEC-008 | 2026-02-04 | Explicit Phase field in decisions | Active |
| DEC-009 | 2026-02-04 | Wireframes scope prompt | Active |
