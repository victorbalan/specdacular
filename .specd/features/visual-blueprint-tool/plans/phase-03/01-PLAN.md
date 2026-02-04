---
feature: visual-blueprint-tool
phase: 3
plan: 01
depends_on:
  - phase-02/01-PLAN.md
creates:
  - specdacular/workflows/blueprint-wireframes.md
modifies: []
---

# Plan 01: Create Wireframes Extension Workflow

## Objective

Create the workflow that generates HTML/CSS wireframes for a feature and integrates them into the blueprint.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Workflow structure pattern
- `@specdacular/workflows/blueprint.md` — Main blueprint workflow (created in Phase 2)
- `@.specd/features/visual-blueprint-tool/RESEARCH.md` — Wireframe approach

**Relevant Decisions:**
- DEC-005: HTML/CSS wireframes — Combined view, PM-friendly, shows layout and button positions

**From Research:**
- Generate HTML/CSS mockups (not ASCII)
- Combined view showing full feature interface
- PM-friendly: visual representation of layout and interactions
- Embedded in blueprint as a tab

---

## Tasks

### Task 1: Create Wireframes Workflow File

**Files:** `specdacular/workflows/blueprint-wireframes.md`

**Action:**
Create the workflow file that generates wireframes based on feature artifacts.

Follow pattern from existing workflows with `<purpose>`, `<philosophy>`, `<process>` structure.

Create:
```markdown
<purpose>
Generate HTML/CSS wireframes for a Specdacular feature blueprint.

Reads FEATURE.md to understand UI requirements, generates visual mockups
showing layout, component placement, and interaction points.

**Output:** `.specd/features/{name}/blueprint/wireframes.html`

**Invoked by:** `/specd:blueprint {feature} wireframes`
</purpose>

<philosophy>

## PM-Friendly Output

Wireframes should be understandable by non-technical stakeholders.
Focus on layout, navigation flow, and button placement rather than
implementation details.

## Visual Over Text

Generate actual HTML/CSS mockups, not ASCII diagrams. Use boxes,
buttons, and placeholder text that resembles the final UI.

## Consistent Style

Use a consistent wireframe aesthetic:
- Gray backgrounds for containers
- Blue buttons for primary actions
- Dashed borders for optional/future elements
- Clear labels for all interactive elements

</philosophy>

<process>

<step name="validate">
Check feature exists and main blueprint was generated.

```bash
# Check feature directory exists
[ -d ".specd/features/$FEATURE_NAME" ] || { echo "Feature not found"; exit 1; }

# Check blueprint exists (wireframes extend the blueprint)
[ -f ".specd/features/$FEATURE_NAME/blueprint/index.html" ] || { echo "Run /specd:blueprint $FEATURE_NAME first"; exit 1; }
```

**If blueprint not found:**
```
Blueprint not generated yet.

Run `/specd:blueprint {name}` first, then add wireframes.
```

Continue to load_context.
</step>

<step name="load_context">
Read feature files to understand UI requirements.

**Read with Read tool:**
- `.specd/features/{name}/FEATURE.md` — UI requirements, components
- `.specd/features/{name}/DECISIONS.md` — UI-related decisions
- `.specd/features/{name}/CONTEXT.md` — Clarified requirements

**Extract from FEATURE.md:**
- `## What This Is` — Overall feature purpose
- `### Must Create` — Components and files (look for UI elements)
- `## Success Criteria` — User-facing requirements

Continue to analyze_ui.
</step>

<step name="analyze_ui">
Identify UI components from feature artifacts.

**Look for:**
- Commands/inputs the user will interact with
- Output displays (HTML pages, reports, visualizations)
- Navigation elements (tabs, menus, links)
- Action buttons (submit, generate, refresh)
- Data displays (lists, tables, cards)

**For each component, note:**
- Name and purpose
- Position in layout (header, sidebar, main, footer)
- Interaction type (click, input, select)
- Relationship to other components

Continue to generate_wireframe.
</step>

<step name="generate_wireframe">
Generate HTML/CSS wireframe mockup.

**Wireframe template structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Wireframe: {feature-name}</title>
  <style>
    /* Wireframe styles */
    body { font-family: system-ui, sans-serif; background: #f0f0f0; margin: 0; padding: 20px; }
    .wireframe-container { max-width: 1200px; margin: 0 auto; }
    .wireframe-header { background: #e0e0e0; padding: 20px; border: 2px solid #999; margin-bottom: 20px; }
    .wireframe-section { background: white; border: 2px solid #ccc; padding: 20px; margin-bottom: 20px; }
    .wireframe-button { background: #4a90d9; color: white; padding: 10px 20px; border: none; cursor: pointer; }
    .wireframe-button.secondary { background: #888; }
    .wireframe-input { border: 2px solid #ccc; padding: 10px; width: 200px; }
    .wireframe-placeholder { background: #f5f5f5; border: 2px dashed #ccc; padding: 40px; text-align: center; color: #888; }
    .wireframe-label { font-size: 12px; color: #666; margin-bottom: 5px; }
    .wireframe-nav { display: flex; gap: 10px; margin-bottom: 20px; }
    .wireframe-nav-item { padding: 10px 15px; background: #ddd; border: 1px solid #999; }
    .wireframe-nav-item.active { background: #4a90d9; color: white; }
  </style>
</head>
<body>
  <div class="wireframe-container">
    <div class="wireframe-header">
      <h1>{feature-name}</h1>
      <p class="wireframe-label">Feature Wireframe - Generated {date}</p>
    </div>

    <!-- Generated wireframe content -->
    {wireframe-content}

  </div>
</body>
</html>
```

**Generate content based on feature type:**

For command-based features:
```html
<div class="wireframe-section">
  <p class="wireframe-label">Command Input</p>
  <code>/{command-name} {arguments}</code>
</div>

<div class="wireframe-section">
  <p class="wireframe-label">Output Display</p>
  <div class="wireframe-placeholder">
    {output-description}
  </div>
</div>
```

For UI-based features:
```html
<div class="wireframe-nav">
  <div class="wireframe-nav-item active">Tab 1</div>
  <div class="wireframe-nav-item">Tab 2</div>
</div>

<div class="wireframe-section">
  <p class="wireframe-label">Main Content Area</p>
  <!-- Component mockups -->
</div>
```

Continue to write_wireframe.
</step>

<step name="write_wireframe">
Write the wireframe HTML file.

**Write file:**
Use Write tool to create `.specd/features/{name}/blueprint/wireframes.html`
with the generated wireframe content.

Continue to update_blueprint.
</step>

<step name="update_blueprint">
Update the main blueprint to enable the wireframes tab.

**Read:** `.specd/features/{name}/blueprint/index.html`

**Find and update:**
- Change `class="tab-link disabled"` to `class="tab-link"` for wireframes tab
- Find `<section id="wireframes"` and update content:

```html
<section id="wireframes" class="tab-content">
  <h2>Wireframes</h2>
  <p>Visual mockup of the feature interface.</p>
  <iframe src="wireframes.html" style="width: 100%; height: 600px; border: 1px solid #ddd;"></iframe>
  <p><a href="wireframes.html" target="_blank">Open in new tab</a></p>
</section>
```

**Write updated blueprint.**

Continue to present_completion.
</step>

<step name="present_completion">
Present wireframes completion.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 WIREFRAMES GENERATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}

## Components Visualized
- {list of UI components}

## Files
- Wireframe: `.specd/features/{name}/blueprint/wireframes.html`
- Blueprint updated: Wireframes tab now enabled

───────────────────────────────────────────────────────

**View:** Open blueprint in browser to see wireframes tab.

**Regenerate:** Run `/specd:blueprint {name} wireframes` again to update.
```

End workflow.
</step>

</process>

<success_criteria>
- [ ] Feature validated
- [ ] UI components identified from artifacts
- [ ] Wireframe HTML generated
- [ ] Main blueprint updated with wireframes tab enabled
</success_criteria>
```

**Verify:**
```bash
[ -f "specdacular/workflows/blueprint-wireframes.md" ] && grep -q "generate_wireframe" specdacular/workflows/blueprint-wireframes.md && echo "valid"
```

**Done when:**
- [ ] File exists at `specdacular/workflows/blueprint-wireframes.md`
- [ ] Has all required steps
- [ ] Documents wireframe generation approach
- [ ] Includes HTML/CSS template
- [ ] Updates main blueprint

---

## Verification

After all tasks complete, verify the plan is done:

```bash
# Check workflow file exists
[ -f "specdacular/workflows/blueprint-wireframes.md" ] && echo "workflow exists"

# Check has required steps
grep -q "analyze_ui" specdacular/workflows/blueprint-wireframes.md && echo "has analyze_ui"
grep -q "generate_wireframe" specdacular/workflows/blueprint-wireframes.md && echo "has generate_wireframe"
grep -q "update_blueprint" specdacular/workflows/blueprint-wireframes.md && echo "has update_blueprint"
```

**Plan is complete when:**
- [ ] Workflow file exists
- [ ] All steps documented
- [ ] Wireframe template included
- [ ] Blueprint update logic complete

---

## Output

When this plan is complete:

1. Update `.specd/features/visual-blueprint-tool/STATE.md`:
   - Mark this plan as complete

2. Commit changes:
   ```bash
   git add specdacular/workflows/blueprint-wireframes.md
   git commit -m "feat(blueprint): add wireframes workflow

   Plan 3.01 complete:
   - Workflow for generating HTML/CSS wireframes
   - Analyzes feature artifacts for UI components
   - Updates blueprint with wireframes tab"
   ```

3. Next plan: `phase-03/02-PLAN.md` (diagrams workflow)
