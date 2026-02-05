---
name: specd:blueprint
description: Generate visual blueprint for a feature
argument-hint: "[feature-name] [wireframes|diagrams]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Generate a visual HTML blueprint for exploring feature artifacts.

**Base command:** `/specd:blueprint {feature}`
- Creates `.specd/features/{feature}/blueprint/index.html`
- Shows Overview, Decisions, Context, Plans tabs
- Opens in browser

**Subcommands:**
- `/specd:blueprint {feature} wireframes` — Add wireframes tab
- `/specd:blueprint {feature} diagrams` — Add diagrams tab with Mermaid

**Output:** Self-contained HTML file that opens in browser. Regenerate to update.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/blueprint.md
</execution_context>

<context>
Feature name: First argument ($ARGUMENTS before space)
Subcommand: Second argument (wireframes, diagrams, or empty)

**Load feature context:**
@.specd/features/{name}/FEATURE.md
@.specd/features/{name}/CONTEXT.md
@.specd/features/{name}/DECISIONS.md
@.specd/features/{name}/plans/ (if exists)

**Load codebase context (if available):**
@.specd/codebase/PATTERNS.md
</context>

<process>
1. **Parse Arguments** — Extract feature name and optional subcommand
2. **Validate** — Check feature exists with required files
3. **Route Subcommand:**
   - No subcommand → Generate base blueprint
   - `wireframes` → Generate/update with wireframes tab
   - `diagrams` → Generate/update with diagrams tab
4. **Generate HTML** — Read files, parse content, embed in template
5. **Open Browser** — Run `open` command to display
</process>

<success_criteria>
- [ ] Feature validated (exists, has FEATURE.md, CONTEXT.md, DECISIONS.md)
- [ ] HTML generated at `.specd/features/{name}/blueprint/index.html`
- [ ] All content properly embedded (decisions, context, plans if exist)
- [ ] Browser opens with the blueprint
- [ ] Wireframes/Diagrams tabs enabled if generated
</success_criteria>
