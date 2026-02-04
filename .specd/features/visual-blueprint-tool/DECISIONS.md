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
