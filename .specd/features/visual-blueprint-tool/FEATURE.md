# Feature: visual-blueprint-tool

## What This Is

A visual system for exploring Specdacular feature artifacts. Adds `/specd:blueprint` command that generates a browsable HTML frontend showing decisions, discussions, plans, and optionally wireframes or diagrams.

## Technical Requirements

### Must Create

- [ ] `commands/specd/blueprint.md` — Command definition with subcommand routing
- [ ] `specdacular/workflows/blueprint.md` — Main workflow (base generation)
- [ ] `specdacular/workflows/blueprint-wireframes.md` — Wireframe generation workflow
- [ ] `specdacular/workflows/blueprint-diagrams.md` — Diagram generation workflow
- [ ] `specdacular/templates/blueprint/index.html` — Hub page template
- [ ] `specdacular/templates/blueprint/styles.css` — Shared styling
- [ ] `specdacular/templates/blueprint/decisions.html` — Decision timeline viewer
- [ ] `specdacular/templates/blueprint/context.html` — Discussion explorer
- [ ] `specdacular/templates/blueprint/plans.html` — Plan viewer
- [ ] `specdacular/templates/blueprint/wireframes.html` — Wireframe tab template
- [ ] `specdacular/templates/blueprint/diagrams.html` — Diagram tab template

### Must Integrate With

- `specdacular/workflows/new-feature.md` — Reads FEATURE.md created here
- `specdacular/workflows/discuss-feature.md` — Reads CONTEXT.md, DECISIONS.md
- `specdacular/workflows/plan-feature.md` — Reads plans/ directory
- `.specd/features/{name}/FEATURE.md` — Source for feature description
- `.specd/features/{name}/CONTEXT.md` — Source for discussions
- `.specd/features/{name}/DECISIONS.md` — Source for decision timeline
- `.specd/features/{name}/plans/` — Source for plan content

### Constraints

- **Static HTML only** — No server required. All content embedded at generation time. Opens via `open` command in browser.
- **Self-contained** — CSS/JS inlined or co-located. No external dependencies.
- **Mermaid for diagrams** — Use Mermaid.js (CDN) for flow and ER diagrams.
- **Regenerate to update** — No live sync. Run command again to refresh content.

---

## Success Criteria

- [ ] `/specd:blueprint {feature}` generates `.specd/features/{feature}/blueprint/index.html` and opens it
- [ ] Hub page shows tabs for Decisions, Context, Plans
- [ ] Decision viewer shows timeline with dates and rationale from DECISIONS.md
- [ ] Context viewer allows exploring discussions from CONTEXT.md
- [ ] Plan viewer shows plans from plans/ directory
- [ ] `/specd:blueprint {feature} wireframes` adds Wireframes tab with auto-generated UI specs
- [ ] `/specd:blueprint {feature} diagrams` adds Diagrams tab with Mermaid flow/ER diagrams
- [ ] Wireframes and diagrams can be refined through follow-up discussion

---

## Out of Scope

- [X] Server/hosting — Just static files opened locally
- [X] Real-time sync — Regenerate to update
- [X] Generic blueprint skill — This is Specdacular-specific, not reusing existing blueprint
- [X] PDF/image export — View in browser only

---

## Initial Context

### User Need
Visualize Specdacular feature planning artifacts (decisions, discussions, plans) in a browsable frontend. Auto-generate wireframes for UI features and diagrams for backend features.

### Integration Points
- Reads all feature files: FEATURE.md, CONTEXT.md, DECISIONS.md, plans/
- Outputs to: `.specd/features/{name}/blueprint/`
- Opens with system browser via `open` command

### Key Constraints
- Zero dependencies (static HTML)
- Auto-generation with interactive refinement
- Mermaid.js for diagramming
