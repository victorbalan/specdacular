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

Continue to prompt_scope.
</step>

<step name="prompt_scope">
Prompt user for wireframe scope.

**Present choice using AskUserQuestion:**
```
question: "What scope for wireframes?"
header: "Scope"
options:
  - label: "Per feature (recommended)"
    description: "Single wireframe showing the complete feature UI"
  - label: "Per phase"
    description: "Separate wireframe for each phase (useful for complex multi-phase features)"
```

**Store response:**
- "Per feature" → scope = "feature"
- "Per phase" → scope = "phase"

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

**If scope is "phase":**
- List phase directories in `.specd/features/{name}/plans/`
- For each phase, note if it has UI-related content
- Phases are numbered: phase-01, phase-02, etc.

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

**If scope is "feature":**
Generate single combined wireframe as below.

**If scope is "phase":**
For each phase:
1. Analyze phase plans for UI components
2. If phase has UI elements:
   - Generate wireframe for that phase
   - Add phase number to header: "Phase N: {feature-name}"
3. If phase has NO UI elements:
   - Skip wireframe generation for this phase
   - Note: "Phase N has no UI — consider generating diagrams"

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
Write the wireframe HTML file(s).

**If scope is "feature":**
Use Write tool to create `.specd/features/{name}/blueprint/wireframes.html`
with the generated wireframe content.

**If scope is "phase":**
For each phase with UI elements:
- Write to `.specd/features/{name}/blueprint/wireframes-phase-{NN}.html`
- Example: `wireframes-phase-01.html`, `wireframes-phase-02.html`

Continue to update_blueprint.
</step>

<step name="update_blueprint">
Update the main blueprint to enable the wireframes tab.

**Read:** `.specd/features/{name}/blueprint/index.html`

**Find and update:**
- Change `class="tab-link disabled"` to `class="tab-link"` for wireframes tab
- Find `<section id="wireframes"` and update content:

**If scope is "feature":**
```html
<section id="wireframes" class="tab-content">
  <h2>Wireframes</h2>
  <p>Visual mockup of the feature interface.</p>
  <iframe src="wireframes.html" style="width: 100%; height: 600px; border: 1px solid #ddd;"></iframe>
  <p><a href="wireframes.html" target="_blank">Open in new tab</a></p>
</section>
```

**If scope is "phase":**
```html
<section id="wireframes" class="tab-content">
  <h2>Wireframes</h2>
  <p>Visual mockups of the feature interface.</p>
  <div class="phase-tabs">
    <button class="phase-tab active" data-wireframe="phase-01">Phase 1</button>
    <button class="phase-tab" data-wireframe="phase-02">Phase 2</button>
    <!-- ... for each phase with wireframes -->
  </div>
  <iframe id="wireframe-viewer" src="wireframes-phase-01.html" style="width: 100%; height: 600px; border: 1px solid #ddd;"></iframe>
  <script>
    document.querySelectorAll('[data-wireframe]').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('[data-wireframe]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('wireframe-viewer').src = 'wireframes-' + this.dataset.wireframe + '.html';
      });
    });
  </script>
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

**If scope is "feature":**
- Wireframe: `.specd/features/{name}/blueprint/wireframes.html`

**If scope is "phase":**
- Phase 1: `.specd/features/{name}/blueprint/wireframes-phase-01.html`
- Phase 2: `.specd/features/{name}/blueprint/wireframes-phase-02.html`
<!-- ... for each generated phase -->

**Phases without UI:**
- Phase N: No UI elements (consider `/specd:blueprint {name} diagrams`)

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
