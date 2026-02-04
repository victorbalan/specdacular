# Research: visual-blueprint-tool

**Researched:** 2026-02-04
**Feature:** Static HTML visualization for Specdacular feature artifacts
**Confidence:** HIGH

## Summary

Research across codebase integration, external patterns, and pitfalls confirms this feature is well-suited to Specdacular's existing architecture. The command/workflow pattern is established and templates go in `specdacular/templates/blueprint/`. The core technical approach (static HTML, sidebar navigation, accordions, Mermaid diagrams) is straightforward with vanilla HTML/CSS/JS.

Key implementation insights:
- Use HTML5 `<details>/<summary>` for accordions — zero JavaScript, fully accessible
- Mermaid.js via CDN script tag (not ES6 module) with `securityLevel: 'loose'` for file:// compatibility
- Parse DECISIONS.md by splitting on `### DEC-` headers, extract fields line-by-line
- All content must be HTML-escaped to prevent XSS
- Use relative paths only — no absolute paths or leading slashes

**Key recommendation:** Generate a single self-contained HTML file with all CSS/JS inlined. Read markdown files at generation time, parse and embed as HTML. This ensures maximum compatibility with file:// protocol.

---

## Codebase Integration

### Command Structure

**Location:** `commands/specd/blueprint.md`

Follow existing command pattern with YAML frontmatter:

```yaml
---
name: specd:blueprint
description: Generate visual blueprint for a feature
argument-hint: "[feature-name] [wireframes|diagrams]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---
```

Commands reference workflows via `<execution_context>`:
```markdown
<execution_context>
@~/.claude/specdacular/workflows/blueprint.md
</execution_context>
```

### Workflow Structure

**Location:** `specdacular/workflows/blueprint.md`

Use `<step>` blocks pattern from existing workflows:

```markdown
<step name="validate">
Check feature exists and has required files.
```bash
[ -d ".specd/features/$ARGUMENTS" ] || { echo "not found"; exit 1; }
```
</step>

<step name="load_context">
Read feature files for content extraction.
</step>
```

**Steps for blueprint workflow:**
1. `validate` — Check feature exists
2. `load_context` — Read FEATURE.md, CONTEXT.md, DECISIONS.md
3. `check_plans` — Check if plans/ directory exists
4. `parse_decisions` — Extract decision data from markdown
5. `generate_html` — Create blueprint/index.html
6. `open_browser` — Run `open` command

### Template Location

**Create:** `specdacular/templates/blueprint/`

```
specdacular/templates/blueprint/
├── index.html          # Main hub (single-page with all tabs)
├── styles.css          # Inlined at generation time
└── scripts.js          # Inlined at generation time (minimal)
```

**Note:** Generate a single HTML file, not multiple files per tab. Simpler and more portable.

### File Reading Pattern

Use Read tool (not Bash cat) to preserve line numbers:

```markdown
Read FEATURE.md, CONTEXT.md, DECISIONS.md from:
@.specd/features/{name}/FEATURE.md
@.specd/features/{name}/CONTEXT.md
@.specd/features/{name}/DECISIONS.md
```

### Browser Opening

```bash
open ".specd/features/{feature-name}/blueprint/index.html"
```

Works on macOS. Cross-platform alternative: `xdg-open` on Linux, `start` on Windows.

---

## Implementation Approach

### HTML Structure

Single-page app with sidebar navigation:

```html
<div class="blueprint-container">
  <nav class="blueprint-sidebar">
    <div class="sidebar-header">
      <h2>{feature-name}</h2>
    </div>
    <ul class="nav-tabs">
      <li><a href="#overview" class="tab-link active" data-tab="overview">Overview</a></li>
      <li><a href="#decisions" class="tab-link" data-tab="decisions">Decisions</a></li>
      <li><a href="#context" class="tab-link" data-tab="context">Context</a></li>
      <li><a href="#plans" class="tab-link" data-tab="plans">Plans</a></li>
      <li><a href="#wireframes" class="tab-link disabled" data-tab="wireframes">Wireframes</a></li>
      <li><a href="#diagrams" class="tab-link disabled" data-tab="diagrams">Diagrams</a></li>
    </ul>
  </nav>

  <main class="blueprint-content">
    <section id="overview" class="tab-content active">...</section>
    <section id="decisions" class="tab-content">...</section>
    <!-- etc -->
  </main>
</div>
```

### CSS Layout

Flexbox sidebar + content:

```css
.blueprint-container {
  display: flex;
  height: 100vh;
  margin: 0;
  overflow: hidden;
}

.blueprint-sidebar {
  width: 250px;
  min-width: 250px;
  background: #2c3e50;
  color: white;
  overflow-y: auto;
}

.blueprint-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: #f5f5f5;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

.tab-link.disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

### Accordion Pattern

Use HTML5 `<details>/<summary>` — no JavaScript required:

```html
<details class="decision-item">
  <summary class="decision-header">
    <span class="decision-id">DEC-001</span>
    <span class="decision-title">Command name is /specd:blueprint</span>
    <span class="decision-status status-active">Active</span>
    <span class="decision-date">2026-02-04</span>
  </summary>
  <div class="decision-content">
    <p><strong>Context:</strong> ...</p>
    <p><strong>Decision:</strong> ...</p>
    <p><strong>Rationale:</strong> ...</p>
  </div>
</details>
```

### Mermaid.js Integration

**CDN URL (pinned version):**
```html
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
```

**Initialization:**
```javascript
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose'  // Required for file:// protocol
});
```

**Diagram containers:**
```html
<pre class="mermaid">
graph TD
  A[Start] --> B[Process]
  B --> C[End]
</pre>
```

**For hidden tabs:** Re-initialize Mermaid when tab becomes visible:
```javascript
mermaid.init(undefined, document.querySelectorAll('#diagrams .mermaid'));
```

### JavaScript (Minimal)

Only needed for tab switching:

```javascript
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.tab-link:not(.disabled)').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      this.classList.add('active');
      document.getElementById(this.dataset.tab).classList.add('active');

      // Re-render Mermaid in newly visible tab
      const section = document.getElementById(this.dataset.tab);
      const diagrams = section.querySelectorAll('.mermaid');
      if (diagrams.length) mermaid.init(undefined, diagrams);
    });
  });
});
```

### Don't Hand-Roll

| Problem | Use Instead | Why |
|---------|-------------|-----|
| Accordion expand/collapse | `<details>/<summary>` | Native HTML, accessible, no JS |
| Diagram rendering | Mermaid.js CDN | Handles flowcharts, ER diagrams, edge cases |
| Markdown to HTML | Simple line-by-line parsing | Full markdown parser is overkill for structured content |
| CSS framework | Custom CSS (~100 lines) | No build step, self-contained |

---

## Parsing Strategy

### DECISIONS.md Parsing

1. Split content on `### DEC-` to find decision blocks
2. Extract ID from heading: `### DEC-001: Title`
3. Parse each field line-by-line:

```
Pattern: **Date:** YYYY-MM-DD → date field
Pattern: **Status:** Active|Superseded|Revoked → status field
Pattern: **Context:** ... → context field (may be multi-line)
Pattern: **Decision:** ... → decision field
Pattern: **Rationale:** → start collecting bullets until next **Field:**
Pattern: **Implications:** → start collecting bullets until next **Field:**
```

**Handle edge cases:**
- Missing fields → use "Unknown" or empty
- Multi-line values → collect until next `**Field:**` or next decision heading
- Code blocks inside decisions → track ``` state, don't parse inside

### CONTEXT.md Parsing

1. Find `## Resolved Questions` section
2. Split on `### ` subheaders
3. Extract Question/Resolution/Details for each

### FEATURE.md Parsing

1. Extract `## What This Is` section for overview
2. Count items in `### Must Create` for stats
3. Parse `## Success Criteria` for progress indicators

---

## Pitfalls

### Critical

**HTML injection from markdown content**
- Prevention: HTML-escape ALL content before embedding
- Use: `text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')`

**Mermaid.js not loading on file://**
- Prevention: Use script tag (not ES6 import), set `securityLevel: 'loose'`
- Fallback: Show raw syntax if Mermaid fails to load

**Hardcoded absolute paths**
- Prevention: Use only relative paths: `./styles.css` not `/blueprint/styles.css`

### Moderate

**Missing optional fields in decisions**
- Prevention: Check each field exists before accessing, provide defaults

**Unicode in decision titles breaking JavaScript**
- Prevention: Use `JSON.stringify()` for any content in script tags, or keep content in HTML

**Browser caching old HTML**
- Prevention: Add `<meta http-equiv="Cache-Control" content="no-cache">`

### Task-Specific Warnings

| When Implementing | Watch Out For | Prevention |
|-------------------|---------------|------------|
| Parsing decisions | Multi-line rationale with bullets | Collect lines until next `**Field:**` |
| Embedding content | Quotes in decision titles | HTML-escape all strings |
| Mermaid diagrams | Spaces in node IDs | Use camelCase: `StartNode` not `Start Node` |
| Wireframes/Diagrams tabs | Not yet generated | Show as greyed-out/disabled |
| Plan content | May not exist | Check if plans/ directory exists first |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase integration | HIGH | Clear patterns from existing commands/workflows |
| HTML/CSS layout | HIGH | Standard patterns, well-documented |
| Accordion pattern | HIGH | Native HTML5, no dependencies |
| Mermaid integration | HIGH | Pinned version, tested with file:// |
| Markdown parsing | MEDIUM | Edge cases exist, need defensive parsing |
| Cross-browser | MEDIUM | file:// behavior varies, test on Safari |

## Open Questions

1. **Plan display format** — Should plans show full content or just titles with links?
2. **Regeneration behavior** — Should `blueprint` command warn if already exists, or overwrite?
3. **Subcommand routing** — How to handle `blueprint wireframes` vs `blueprint diagrams` in single command file?

---

## Sources

### Codebase (from Explore)
- `commands/specd/new-feature.md` — Command structure pattern
- `specdacular/workflows/plan-feature.md` — Workflow step pattern
- `specdacular/templates/features/DECISIONS.md` — Decision format
- `.specd/features/visual-blueprint-tool/DECISIONS.md` — Real decision data

### External (verified)
- Mermaid.js v10.6.1 documentation
- HTML5 `<details>` specification
- CSS Flexbox layout patterns

### Implementation Notes
- Use Mermaid CDN: `https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js`
- Pin version to avoid breaking changes
- All CSS/JS should be inlined in final HTML for portability
