---
feature: visual-blueprint-tool
phase: 4
plan: 01
depends_on:
  - phase-01/01-PLAN.md
creates: []
modifies:
  - specdacular/templates/blueprint/index.html
  - specdacular/templates/blueprint/styles.css
  - specdacular/templates/blueprint/scripts.js
---

# Plan 01: Add Phase Tab Navigation to Template

## Objective

Update the HTML template to include phase tab sub-navigation within the Decisions, Context, and Plans sections, allowing users to filter content by phase.

## Context

**Reference these files:**
- `@specdacular/templates/blueprint/index.html` — Current template to modify
- `@specdacular/templates/blueprint/styles.css` — Current styles to extend
- `@specdacular/templates/blueprint/scripts.js` — Current JS to extend

**Relevant Decisions:**
- DEC-007: Phase tabs within sections for navigation
- DEC-008: Explicit Phase field in decisions (workflow will parse this)

**Design:**
- Decisions section: [All] [Phase 1] [Phase 2] ... tabs
- Context section: [All] [Phase 1] [Phase 2] ... tabs
- Plans section: [Phase 1] [Phase 2] ... tabs (no "All" needed)
- Phase tabs are generated dynamically based on `{phase-tabs}` placeholder

---

## Tasks

### Task 1: Update HTML Template with Phase Tabs

**Files:** `specdacular/templates/blueprint/index.html`

**Action:**
Add phase tab navigation inside the Decisions, Context, and Plans sections.

**Find the decisions section and update:**
```html
<section id="decisions" class="tab-content">
  <h1>Decisions</h1>
  <p class="section-intro">Click any decision to expand details.</p>
  <div class="phase-tabs">
    {decisions-phase-tabs}
  </div>
  <div class="decisions-list">
{decisions-content}
  </div>
</section>
```

**Find the context section and update:**
```html
<section id="context" class="tab-content">
  <h1>Discussion Context</h1>
  <div class="phase-tabs">
    {context-phase-tabs}
  </div>
  <div class="context-content">
{context-content}
  </div>
</section>
```

**Find the plans section and update:**
```html
<section id="plans" class="tab-content">
  <h1>Plans</h1>
  <div class="phase-tabs">
    {plans-phase-tabs}
  </div>
  <div class="plans-content">
{plans-content}
  </div>
</section>
```

**Verify:**
```bash
grep -q "phase-tabs" specdacular/templates/blueprint/index.html && echo "has phase-tabs"
grep -q "decisions-phase-tabs" specdacular/templates/blueprint/index.html && echo "has decisions-phase-tabs"
```

**Done when:**
- [ ] Decisions section has phase tabs placeholder
- [ ] Context section has phase tabs placeholder
- [ ] Plans section has phase tabs placeholder

---

### Task 2: Add Phase Tab Styles

**Files:** `specdacular/templates/blueprint/styles.css`

**Action:**
Add CSS for the phase tab sub-navigation.

**Add after the existing tab styles:**
```css
/* Phase Tabs (sub-navigation within sections) */
.phase-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
}

.phase-tab {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  font-size: 0.875rem;
  color: #666;
  transition: all 0.2s;
}

.phase-tab:hover {
  background: #e8e8e8;
}

.phase-tab.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.phase-tab.all-tab {
  font-weight: 500;
}

/* Phase content visibility */
.phase-content {
  display: none;
}

.phase-content.active {
  display: block;
}
```

**Verify:**
```bash
grep -q ".phase-tabs" specdacular/templates/blueprint/styles.css && echo "has phase-tabs style"
grep -q ".phase-tab.active" specdacular/templates/blueprint/styles.css && echo "has active state"
```

**Done when:**
- [ ] Phase tabs have flex layout
- [ ] Active state styled with blue background
- [ ] Phase content visibility controlled

---

### Task 3: Add Phase Tab JavaScript

**Files:** `specdacular/templates/blueprint/scripts.js`

**Action:**
Add JavaScript to handle phase tab switching within sections.

**Add after the existing tab switching code:**
```javascript
// Phase tab switching (within sections)
document.querySelectorAll('.phase-tabs').forEach(tabContainer => {
  const tabs = tabContainer.querySelectorAll('.phase-tab');
  const section = tabContainer.closest('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active from all phase tabs in this section
      tabs.forEach(t => t.classList.remove('active'));

      // Add active to clicked tab
      this.classList.add('active');

      // Get phase to show
      const phase = this.getAttribute('data-phase');

      // Hide all phase content in this section
      section.querySelectorAll('.phase-content').forEach(content => {
        content.classList.remove('active');
      });

      // Show selected phase content
      if (phase === 'all') {
        // Show all phase content
        section.querySelectorAll('.phase-content').forEach(content => {
          content.classList.add('active');
        });
      } else {
        // Show only matching phase
        const targetContent = section.querySelector(`.phase-content[data-phase="${phase}"]`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      }
    });
  });
});
```

**Verify:**
```bash
grep -q "phase-tab" specdacular/templates/blueprint/scripts.js && echo "has phase-tab JS"
grep -q "data-phase" specdacular/templates/blueprint/scripts.js && echo "has data-phase"
```

**Done when:**
- [ ] Phase tabs switch content within their section
- [ ] "All" tab shows all phase content
- [ ] Specific phase tab shows only that phase

---

## Verification

After all tasks complete:

```bash
# Check all files updated
grep -q "phase-tabs" specdacular/templates/blueprint/index.html && echo "HTML updated"
grep -q ".phase-tabs" specdacular/templates/blueprint/styles.css && echo "CSS updated"
grep -q "phase-tab" specdacular/templates/blueprint/scripts.js && echo "JS updated"
```

**Plan is complete when:**
- [ ] HTML template has phase tab placeholders in all 3 sections
- [ ] CSS has phase tab styling
- [ ] JS handles phase tab switching
- [ ] Template ready for workflow to populate

---

## Output

When this plan is complete:

1. Update `.specd/features/visual-blueprint-tool/STATE.md`:
   - Mark this plan as complete

2. Commit changes:
   ```bash
   git add specdacular/templates/blueprint/
   git commit -m "feat(blueprint): add phase tab navigation to template

   Plan 4.01 complete:
   - Added phase-tabs placeholders to HTML
   - Added phase tab CSS styling
   - Added phase tab switching JS"
   ```

3. Next plan: `phase-04/02-PLAN.md` (update workflow to group by phase)
