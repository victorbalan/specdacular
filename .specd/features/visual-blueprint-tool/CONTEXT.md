# Context: visual-blueprint-tool

**Last Updated:** 2026-02-04
**Sessions:** 1

## Discussion Summary

Discussed creating a visual system for exploring Specdacular feature artifacts. User has an existing blueprint skill (from a friend) that renders visual specs, but wants a custom version specifically for Specdacular that shows decisions, discussions, and plans. Also wants auto-generation of wireframes (for frontend features) and diagrams (for backend features).

---

## Resolved Questions

### Command naming

**Question:** What should the command be called? Initial thought was "generate-ui" but felt too generic.

**Resolution:** Use `/specd:blueprint` with subcommands.

**Details:**
- `/specd:blueprint` — Base visual system (decisions, context, plans)
- `/specd:blueprint wireframes` — Adds wireframes tab
- `/specd:blueprint diagrams` — Adds diagrams tab

**Related Decisions:** DEC-001

---

### How to serve the visual system

**Question:** Should this require a server, or just open files locally?

**Resolution:** Static HTML that opens directly in browser. No server needed.

**Details:**
- Use `open` command (macOS) to launch in default browser
- Embed all content at generation time (read MD files, bake into HTML)
- CSS/JS inlined or co-located
- Zero external dependencies except Mermaid.js CDN for diagrams

**Related Decisions:** DEC-002

---

### Wireframe and diagram generation

**Question:** Should wireframes/diagrams be generated automatically or interactively?

**Resolution:** Auto-generate initially, then allow interactive refinement.

**Details:**
- Wireframes: Claude reads FEATURE.md to understand UI requirements, generates HTML specs
- Diagrams: Claude reads FEATURE.md/DECISIONS.md for backend context, generates Mermaid
- User can refine through follow-up discussion ("make sidebar collapsible", "add cache layer")

---

### Diagram types

**Question:** What kinds of diagrams for backend features?

**Resolution:** Flow diagrams and entity-relationship diagrams using Mermaid.

**Details:**
- Flow diagrams for processes/sequences
- ER diagrams for data models
- Mermaid.js handles both

---

## Deferred Questions

### Template customization

**Reason:** Not critical for v1
**Default for now:** Use sensible default styling
**Revisit when:** Users request theming/customization

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-04 | Command name, serving approach, auto-generation, diagram types | Named `/specd:blueprint`, static HTML, auto-gen with refinement, Mermaid diagrams |

---

## Gray Areas Remaining

- [ ] Exact HTML template structure — Need to design hub layout, tab navigation
- [ ] How to parse DECISIONS.md for timeline — Need to extract dates and structure
- [ ] Wireframe generation prompting — What Claude needs to generate good wireframes
- [ ] Mermaid diagram prompting — What Claude needs to generate good ER/flow diagrams

---

## Quick Reference

- **Feature:** `.specd/features/visual-blueprint-tool/FEATURE.md`
- **Decisions:** `.specd/features/visual-blueprint-tool/DECISIONS.md`
- **Research:** `.specd/features/visual-blueprint-tool/RESEARCH.md` (if exists)
