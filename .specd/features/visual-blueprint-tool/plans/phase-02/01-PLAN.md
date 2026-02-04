---
feature: visual-blueprint-tool
phase: 2
plan: 01
depends_on:
  - phase-01/01-PLAN.md
  - phase-01/02-PLAN.md
creates:
  - specdacular/workflows/blueprint.md
modifies: []
---

# Plan 01: Create Main Blueprint Workflow

## Objective

Create the main workflow that generates the HTML blueprint by reading feature files, parsing content, embedding into templates, and opening in browser.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Workflow structure pattern
- `@specdacular/workflows/new-feature.md` — Example workflow with steps
- `@specdacular/workflows/plan-feature.md` — Example of file reading/writing
- `@.specd/features/visual-blueprint-tool/RESEARCH.md` — Parsing strategies

**Relevant Decisions:**
- DEC-002: Static HTML, no server required — Embed all content at generation
- DEC-004: Sidebar layout with accordion decisions — Parse DEC-XXX headers

**From Research:**
- Parse DECISIONS.md by splitting on `### DEC-` headers
- Extract fields line-by-line: Date, Status, Context, Decision, Rationale
- HTML-escape all content to prevent XSS
- Use relative paths only

---

## Tasks

### Task 1: Create Workflow File with Steps Structure

**Files:** `specdacular/workflows/blueprint.md`

**Action:**
Create the workflow file with the standard structure: `<purpose>`, `<philosophy>`, `<process>` with `<step>` blocks.

Follow pattern from `specdacular/workflows/new-feature.md`:
```markdown
<purpose>
{What the workflow does}
</purpose>

<philosophy>
{Key principles}
</philosophy>

<process>
<step name="step-name">
{Step instructions}
</step>
</process>
```

Create the workflow with these steps:
1. `parse_arguments` — Extract feature name and optional subcommand
2. `validate` — Check feature exists with required files
3. `load_context` — Read FEATURE.md, CONTEXT.md, DECISIONS.md
4. `check_optional` — Check for plans/, wireframes, diagrams
5. `parse_decisions` — Extract decision data from DECISIONS.md
6. `parse_context` — Extract resolved questions from CONTEXT.md
7. `parse_feature` — Extract description and stats from FEATURE.md
8. `generate_html` — Build HTML from template with embedded content
9. `write_output` — Write to blueprint/index.html
10. `open_browser` — Open in default browser

Create:
```markdown
<purpose>
Generate a visual HTML blueprint for exploring Specdacular feature artifacts.

Reads FEATURE.md, CONTEXT.md, DECISIONS.md, and plans/ to create a browsable
static HTML file with sidebar navigation and accordion decision viewer.

**Output:** `.specd/features/{name}/blueprint/index.html`
</purpose>

<philosophy>

## Self-Contained Output

The generated HTML must work when opened directly in a browser (file:// protocol).
All CSS and JS is inlined. Only external dependency is Mermaid.js CDN.

## Parse Defensively

Markdown files may have missing fields, multi-line values, or edge cases.
Always provide defaults and handle gracefully.

## HTML-Escape Everything

All content from markdown files must be HTML-escaped before embedding
to prevent XSS and layout breakage.

</philosophy>

<process>

<step name="parse_arguments">
Parse the command arguments.

**Input:** `$ARGUMENTS` (e.g., "my-feature wireframes")

**Extract:**
- Feature name: First word
- Subcommand: Second word (optional) — "wireframes", "diagrams", or empty

```bash
# Parse arguments
FEATURE_NAME=$(echo "$ARGUMENTS" | awk '{print $1}')
SUBCOMMAND=$(echo "$ARGUMENTS" | awk '{print $2}')

echo "Feature: $FEATURE_NAME"
echo "Subcommand: $SUBCOMMAND"
```

**If no feature name:**
```
Please provide a feature name: /specd:blueprint {feature-name}
```

Continue to validate.
</step>

<step name="validate">
Check feature exists and has required files.

```bash
# Check feature directory exists
[ -d ".specd/features/$FEATURE_NAME" ] || { echo "not found"; exit 1; }

# Check required files
[ -f ".specd/features/$FEATURE_NAME/FEATURE.md" ] || { echo "missing FEATURE.md"; exit 1; }
[ -f ".specd/features/$FEATURE_NAME/CONTEXT.md" ] || { echo "missing CONTEXT.md"; exit 1; }
[ -f ".specd/features/$FEATURE_NAME/DECISIONS.md" ] || { echo "missing DECISIONS.md"; exit 1; }

# Check optional files
[ -d ".specd/features/$FEATURE_NAME/plans" ] && echo "has_plans"
[ -f ".specd/features/$FEATURE_NAME/blueprint/wireframes.html" ] && echo "has_wireframes"
[ -f ".specd/features/$FEATURE_NAME/blueprint/diagrams.html" ] && echo "has_diagrams"
```

**If feature not found:**
```
Feature '{name}' not found.

Run /specd:new-feature {name} to create it first.
```

Continue to load_context.
</step>

<step name="load_context">
Read all feature files.

**Read with Read tool:**
- `.specd/features/{name}/FEATURE.md`
- `.specd/features/{name}/CONTEXT.md`
- `.specd/features/{name}/DECISIONS.md`
- `.specd/features/{name}/STATE.md` (for stats)
- `.specd/features/{name}/config.json` (for counts)

**If plans/ exists:**
- List all plan files: `.specd/features/{name}/plans/phase-*/`
- Read ROADMAP.md if exists

Continue to parse_decisions.
</step>

<step name="parse_decisions">
Parse DECISIONS.md to extract decision data.

**Parsing strategy:**
1. Split content on `### DEC-` to find decision blocks
2. For each block:
   - Extract ID from heading: `### DEC-XXX: Title`
   - Parse `**Date:**` line for date
   - Parse `**Status:**` line for status
   - Parse `**Context:**` for context (may be multi-line)
   - Parse `**Decision:**` for decision text
   - Parse `**Rationale:**` for bullet points
   - Parse `**Implications:**` for bullet points

**Output format (for each decision):**
```
{
  id: "DEC-001",
  title: "Decision title",
  date: "2026-02-04",
  status: "Active",
  context: "Context text...",
  decision: "Decision text...",
  rationale: ["Reason 1", "Reason 2"],
  implications: ["Implication 1", "Implication 2"]
}
```

**Edge cases:**
- Missing fields → use empty string or "Unknown"
- Multi-line values → collect until next `**Field:**`
- Code blocks → skip parsing inside triple backticks

Continue to parse_context.
</step>

<step name="parse_context">
Parse CONTEXT.md to extract resolved questions.

**Parsing strategy:**
1. Find `## Resolved Questions` section
2. Split on `### ` to find question blocks
3. For each question:
   - Extract title from heading
   - Parse `**Question:**` for the question
   - Parse `**Resolution:**` for the answer
   - Parse `**Details:**` for bullet points

**Output format:**
```
{
  title: "Question title",
  question: "What was unclear?",
  resolution: "The answer",
  details: ["Detail 1", "Detail 2"]
}
```

Continue to parse_feature.
</step>

<step name="parse_feature">
Parse FEATURE.md to extract overview and stats.

**Extract:**
- `## What This Is` section → feature description
- Count items in `### Must Create` → files to create count
- `## Success Criteria` items → for progress indicators

**From config.json:**
- `discussion_sessions` count
- `decisions_count`

**From plans/:**
- Count phase directories
- Count plan files

Continue to generate_html.
</step>

<step name="generate_html">
Generate the HTML by filling in the template.

**Read templates:**
- `~/.claude/specdacular/templates/blueprint/index.html`
- `~/.claude/specdacular/templates/blueprint/styles.css`
- `~/.claude/specdacular/templates/blueprint/scripts.js`

**Replace placeholders:**
- `{feature-name}` → Feature name
- `{date}` → Current date (YYYY-MM-DD)
- `{feature-description}` → From FEATURE.md "What This Is"
- `{decisions-count}` → Number of decisions
- `{sessions-count}` → Number of discussion sessions
- `{plans-count}` → Number of plans
- `{styles}` → Contents of styles.css
- `{scripts}` → Contents of scripts.js

**Generate decisions HTML:**
For each decision, create:
```html
<details class="decision-item">
  <summary class="decision-header">
    <span class="decision-id">{id}</span>
    <span class="decision-title">{title}</span>
    <span class="decision-status status-{status-lower}">{status}</span>
    <span class="decision-date">{date}</span>
  </summary>
  <div class="decision-content">
    <p><strong>Context:</strong> {context}</p>
    <p><strong>Decision:</strong> {decision}</p>
    <p><strong>Rationale:</strong></p>
    <ul>{rationale-items}</ul>
    <p><strong>Implications:</strong></p>
    <ul>{implication-items}</ul>
  </div>
</details>
```

**Generate context HTML:**
For each resolved question, create section with question/resolution/details.

**Generate plans HTML:**
For each phase, create a phase group with plan items.

**Generate timeline HTML:**
Combine decision dates and discussion session dates into chronological timeline.

**Tab states:**
- `{wireframes-disabled}` → "disabled" if no wireframes, empty if exists
- `{diagrams-disabled}` → "disabled" if no diagrams, empty if exists

**HTML-escape all content:**
```javascript
text.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
```

Continue to write_output.
</step>

<step name="write_output">
Write the generated HTML to the blueprint directory.

```bash
# Create blueprint directory
mkdir -p ".specd/features/$FEATURE_NAME/blueprint"
```

**Write file:**
Use Write tool to create `.specd/features/{name}/blueprint/index.html`
with the generated HTML content.

Continue to open_browser.
</step>

<step name="open_browser">
Open the blueprint in the default browser.

```bash
open ".specd/features/$FEATURE_NAME/blueprint/index.html"
```

**Present completion:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BLUEPRINT GENERATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}

## Stats
- {N} decisions
- {N} discussion sessions
- {N} plans

## Tabs
- Overview ✓
- Decisions ✓
- Context ✓
- Plans {✓ or ✗}
- Wireframes {✓ or "not generated"}
- Diagrams {✓ or "not generated"}

**File:** `.specd/features/{name}/blueprint/index.html`

───────────────────────────────────────────────────────

## To Update

Run `/specd:blueprint {name}` again to regenerate.

## To Add Wireframes

Run `/specd:blueprint {name} wireframes`

## To Add Diagrams

Run `/specd:blueprint {name} diagrams`
```

End workflow.
</step>

</process>

<success_criteria>
- [ ] Feature validated
- [ ] All files read and parsed
- [ ] HTML generated with all content embedded
- [ ] Output written to `.specd/features/{name}/blueprint/index.html`
- [ ] Browser opens with the blueprint
</success_criteria>
```

**Verify:**
```bash
[ -f "specdacular/workflows/blueprint.md" ] && grep -q "parse_decisions" specdacular/workflows/blueprint.md && echo "valid"
```

**Done when:**
- [ ] File exists at `specdacular/workflows/blueprint.md`
- [ ] Has all required steps
- [ ] Documents parsing strategies
- [ ] Includes HTML generation logic
- [ ] Opens browser on completion

---

## Verification

After all tasks complete, verify the plan is done:

```bash
# Check workflow file exists
[ -f "specdacular/workflows/blueprint.md" ] && echo "workflow exists"

# Check has all required steps
grep -q "parse_arguments" specdacular/workflows/blueprint.md && echo "has parse_arguments"
grep -q "parse_decisions" specdacular/workflows/blueprint.md && echo "has parse_decisions"
grep -q "generate_html" specdacular/workflows/blueprint.md && echo "has generate_html"
grep -q "open_browser" specdacular/workflows/blueprint.md && echo "has open_browser"
```

**Plan is complete when:**
- [ ] Workflow file exists
- [ ] All steps documented
- [ ] Parsing strategies clear
- [ ] HTML generation logic complete

---

## Output

When this plan is complete:

1. Update `.specd/features/visual-blueprint-tool/STATE.md`:
   - Mark this plan as complete
   - Mark Phase 2 as complete

2. Commit changes:
   ```bash
   git add specdacular/workflows/blueprint.md
   git commit -m "feat(blueprint): create main workflow

   Plan 2.01 complete:
   - Workflow with 10 steps
   - Parses DECISIONS.md, CONTEXT.md, FEATURE.md
   - Generates HTML with embedded content
   - Opens in browser"
   ```

3. Next plan: `phase-03/01-PLAN.md` (wireframes extension)
