---
feature: visual-blueprint-tool
phase: 1
plan: 01
depends_on: []
creates:
  - specdacular/templates/blueprint/index.html
  - specdacular/templates/blueprint/styles.css
  - specdacular/templates/blueprint/scripts.js
modifies: []
---

# Plan 01: Create HTML Template Structure

## Objective

Create the base HTML template with sidebar navigation, tab switching, and accordion components that will be populated with feature data at generation time.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Code patterns to follow
- `@.specd/codebase/STRUCTURE.md` — Where files go
- `@.specd/features/visual-blueprint-tool/RESEARCH.md` — HTML/CSS patterns

**Relevant Decisions:**
- DEC-002: Static HTML, no server required — All content embedded at generation time
- DEC-004: Sidebar layout with accordion decisions — Custom CSS, no frameworks
- DEC-003: Mermaid.js for diagrams — CDN script with securityLevel: 'loose'

**From Research:**
- Use HTML5 `<details>/<summary>` for accordions (zero JavaScript)
- Flexbox for sidebar + content layout
- Mermaid CDN: `https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js`
- Use relative paths only, no absolute paths

---

## Tasks

### Task 1: Create Template Directory

**Files:** `specdacular/templates/blueprint/`

**Action:**
Create the blueprint templates directory structure.

```bash
mkdir -p specdacular/templates/blueprint
```

**Verify:**
```bash
[ -d "specdacular/templates/blueprint" ] && echo "exists"
```

**Done when:**
- [ ] Directory `specdacular/templates/blueprint/` exists

---

### Task 2: Create HTML Template

**Files:** `specdacular/templates/blueprint/index.html`

**Action:**
Create the main HTML template with placeholders for dynamic content. Use `{placeholder}` syntax for values that will be replaced at generation time.

The template should include:
- Sidebar with navigation tabs: Overview, Decisions, Context, Plans, Wireframes, Diagrams
- Main content area with sections for each tab
- Placeholders for feature name, stats, and content
- Mermaid.js CDN script (for diagrams tab)
- Meta tags for no-cache (browser caching prevention)

Create:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <title>{feature-name} Blueprint</title>
  <style>
{styles}
  </style>
</head>
<body>
  <div class="blueprint-container">
    <nav class="blueprint-sidebar">
      <div class="sidebar-header">
        <h2>{feature-name}</h2>
        <span class="subtitle">Blueprint</span>
      </div>
      <ul class="nav-tabs">
        <li><a href="#overview" class="tab-link active" data-tab="overview">Overview</a></li>
        <li><a href="#decisions" class="tab-link" data-tab="decisions">Decisions</a></li>
        <li><a href="#context" class="tab-link" data-tab="context">Context</a></li>
        <li><a href="#plans" class="tab-link" data-tab="plans">Plans</a></li>
        <li><a href="#wireframes" class="tab-link {wireframes-disabled}" data-tab="wireframes">Wireframes</a></li>
        <li><a href="#diagrams" class="tab-link {diagrams-disabled}" data-tab="diagrams">Diagrams</a></li>
      </ul>
      <div class="sidebar-footer">
        <span class="generated">Generated: {date}</span>
      </div>
    </nav>

    <main class="blueprint-content">
      <section id="overview" class="tab-content active">
        <h1>Overview</h1>
        <div class="overview-description">
          {feature-description}
        </div>
        <div class="overview-stats">
          <div class="stat">
            <span class="stat-value">{decisions-count}</span>
            <span class="stat-label">Decisions</span>
          </div>
          <div class="stat">
            <span class="stat-value">{sessions-count}</span>
            <span class="stat-label">Discussion Sessions</span>
          </div>
          <div class="stat">
            <span class="stat-value">{plans-count}</span>
            <span class="stat-label">Plans</span>
          </div>
        </div>
        <div class="overview-timeline">
          <h2>Activity Timeline</h2>
          {timeline-content}
        </div>
      </section>

      <section id="decisions" class="tab-content">
        <h1>Decisions</h1>
        <p class="section-intro">Click any decision to expand details.</p>
        <div class="decisions-list">
{decisions-content}
        </div>
      </section>

      <section id="context" class="tab-content">
        <h1>Discussion Context</h1>
        <div class="context-content">
{context-content}
        </div>
      </section>

      <section id="plans" class="tab-content">
        <h1>Plans</h1>
        <div class="plans-content">
{plans-content}
        </div>
      </section>

      <section id="wireframes" class="tab-content">
        <h1>Wireframes</h1>
        <div class="wireframes-content">
{wireframes-content}
        </div>
      </section>

      <section id="diagrams" class="tab-content">
        <h1>Diagrams</h1>
        <div class="diagrams-content">
{diagrams-content}
        </div>
      </section>
    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
  <script>
{scripts}
  </script>
</body>
</html>
```

**Verify:**
```bash
[ -f "specdacular/templates/blueprint/index.html" ] && grep -q "{feature-name}" specdacular/templates/blueprint/index.html && echo "valid"
```

**Done when:**
- [ ] File exists at `specdacular/templates/blueprint/index.html`
- [ ] Contains placeholders: `{feature-name}`, `{styles}`, `{scripts}`, `{decisions-content}`
- [ ] Includes Mermaid CDN script tag
- [ ] Has sidebar with all 6 tabs

---

### Task 3: Create CSS Styles

**Files:** `specdacular/templates/blueprint/styles.css`

**Action:**
Create the CSS styles for the blueprint. These will be inlined into the HTML at generation time.

Include styles for:
- Flexbox sidebar + content layout
- Tab navigation (active states, disabled states)
- Accordion decisions using `<details>/<summary>`
- Stats display grid
- Timeline styling
- Responsive basics

Create:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
}

.blueprint-container {
  display: flex;
  height: 100vh;
}

/* Sidebar */
.blueprint-sidebar {
  width: 250px;
  min-width: 250px;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 1.5rem;
  background: #1a252f;
  border-bottom: 1px solid #34495e;
}

.sidebar-header h2 {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.sidebar-header .subtitle {
  font-size: 0.875rem;
  opacity: 0.7;
}

.nav-tabs {
  list-style: none;
  flex: 1;
  padding: 1rem 0;
}

.tab-link {
  display: block;
  padding: 0.875rem 1.5rem;
  color: white;
  text-decoration: none;
  transition: background 0.2s, border-left 0.2s;
  border-left: 4px solid transparent;
}

.tab-link:hover {
  background: #34495e;
}

.tab-link.active {
  background: #34495e;
  border-left-color: #3498db;
}

.tab-link.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  opacity: 0.6;
  border-top: 1px solid #34495e;
}

/* Main Content */
.blueprint-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

.tab-content h1 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.section-intro {
  color: #666;
  margin-bottom: 1.5rem;
}

/* Overview Stats */
.overview-description {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #3498db;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
}

/* Timeline */
.overview-timeline {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
}

.overview-timeline h2 {
  margin-bottom: 1rem;
  font-size: 1.125rem;
}

.timeline-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 1rem;
}

.timeline-item:last-child {
  border-bottom: none;
}

.timeline-date {
  color: #666;
  font-size: 0.875rem;
  min-width: 100px;
}

.timeline-event {
  flex: 1;
}

/* Decisions (Accordion) */
.decisions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.decision-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.decision-item summary {
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  list-style: none;
  user-select: none;
}

.decision-item summary::-webkit-details-marker {
  display: none;
}

.decision-item summary:hover {
  background: #f9f9f9;
}

.decision-id {
  font-family: monospace;
  background: #e8e8e8;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.decision-title {
  flex: 1;
  font-weight: 500;
}

.decision-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-superseded {
  background: #fff3cd;
  color: #856404;
}

.status-revoked {
  background: #f8d7da;
  color: #721c24;
}

.decision-date {
  font-size: 0.875rem;
  color: #666;
}

.decision-content {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.decision-content p {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.decision-content ul {
  margin-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.decision-content li {
  margin-bottom: 0.25rem;
}

/* Expand indicator */
.decision-item summary::after {
  content: '▶';
  font-size: 0.75rem;
  transition: transform 0.2s;
}

.decision-item[open] summary::after {
  transform: rotate(90deg);
}

/* Context */
.context-content {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
}

.context-section {
  margin-bottom: 2rem;
}

.context-section h3 {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #3498db;
}

.resolved-question {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.resolved-question h4 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

/* Plans */
.plans-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.phase-group {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.phase-header {
  padding: 1rem 1.5rem;
  background: #3498db;
  color: white;
  font-weight: 600;
}

.plan-item {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.plan-item:last-child {
  border-bottom: none;
}

.plan-title {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.plan-summary {
  font-size: 0.875rem;
  color: #666;
}

/* Wireframes */
.wireframes-content {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
}

.wireframe-placeholder {
  padding: 3rem;
  text-align: center;
  color: #999;
  border: 2px dashed #ddd;
  border-radius: 8px;
}

/* Diagrams */
.diagrams-content {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
}

.diagram-container {
  margin-bottom: 2rem;
}

.diagram-container h3 {
  margin-bottom: 1rem;
}

.mermaid {
  background: #fafafa;
  padding: 1rem;
  border-radius: 4px;
}

/* No content placeholders */
.no-content {
  padding: 3rem;
  text-align: center;
  color: #999;
}
```

**Verify:**
```bash
[ -f "specdacular/templates/blueprint/styles.css" ] && grep -q ".blueprint-container" specdacular/templates/blueprint/styles.css && echo "valid"
```

**Done when:**
- [ ] File exists at `specdacular/templates/blueprint/styles.css`
- [ ] Contains sidebar layout styles
- [ ] Contains accordion/details styles
- [ ] Contains stats grid styles

---

### Task 4: Create JavaScript

**Files:** `specdacular/templates/blueprint/scripts.js`

**Action:**
Create minimal JavaScript for tab switching and Mermaid initialization.

Create:
```javascript
// Initialize Mermaid for diagrams
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose'
});

// Tab switching
document.addEventListener('DOMContentLoaded', function() {
  const tabLinks = document.querySelectorAll('.tab-link:not(.disabled)');

  tabLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      // Remove active class from all tabs and content
      document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      this.classList.add('active');
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');

      // Re-render Mermaid diagrams in newly visible tab
      const section = document.getElementById(tabId);
      const diagrams = section.querySelectorAll('.mermaid');
      if (diagrams.length > 0) {
        mermaid.init(undefined, diagrams);
      }
    });
  });
});
```

**Verify:**
```bash
[ -f "specdacular/templates/blueprint/scripts.js" ] && grep -q "mermaid.initialize" specdacular/templates/blueprint/scripts.js && echo "valid"
```

**Done when:**
- [ ] File exists at `specdacular/templates/blueprint/scripts.js`
- [ ] Initializes Mermaid with `securityLevel: 'loose'`
- [ ] Has tab switching logic
- [ ] Re-initializes Mermaid on tab switch

---

## Verification

After all tasks complete, verify the plan is done:

```bash
# Check all files exist
[ -d "specdacular/templates/blueprint" ] && echo "directory exists"
[ -f "specdacular/templates/blueprint/index.html" ] && echo "index.html exists"
[ -f "specdacular/templates/blueprint/styles.css" ] && echo "styles.css exists"
[ -f "specdacular/templates/blueprint/scripts.js" ] && echo "scripts.js exists"

# Verify key content
grep -q "{feature-name}" specdacular/templates/blueprint/index.html && echo "has placeholders"
grep -q ".blueprint-sidebar" specdacular/templates/blueprint/styles.css && echo "has sidebar styles"
grep -q "mermaid.initialize" specdacular/templates/blueprint/scripts.js && echo "has mermaid init"
```

**Plan is complete when:**
- [ ] All 3 template files exist
- [ ] HTML has all required placeholders
- [ ] CSS has sidebar + accordion styles
- [ ] JS initializes Mermaid and handles tab switching

---

## Output

When this plan is complete:

1. Update `.specd/features/visual-blueprint-tool/STATE.md`:
   - Mark this plan as complete
   - Note any discoveries or decisions made

2. Commit changes:
   ```bash
   git add specdacular/templates/blueprint/
   git commit -m "feat(blueprint): create HTML template structure

   Plan 1.01 complete:
   - Created index.html with sidebar and tabs
   - Created styles.css with flexbox layout
   - Created scripts.js with Mermaid init"
   ```

3. Next plan: `phase-01/02-PLAN.md`
