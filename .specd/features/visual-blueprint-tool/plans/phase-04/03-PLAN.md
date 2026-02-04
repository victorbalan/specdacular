---
feature: visual-blueprint-tool
phase: 4
plan: 03
depends_on:
  - phase-03/01-PLAN.md
creates: []
modifies:
  - specdacular/workflows/blueprint-wireframes.md
---

# Plan 03: Add Wireframes Scope Prompt

## Objective

Update the wireframes workflow to prompt users for per-feature or per-phase wireframe generation, with per-feature as the recommended default.

## Context

**Reference these files:**
- `@specdacular/workflows/blueprint-wireframes.md` — Current workflow to modify
- `@.specd/features/visual-blueprint-tool/DECISIONS.md` — DEC-009

**Relevant Decisions:**
- DEC-009: Wireframes scope prompt — Always prompt, per-feature default

**Scope logic:**
- Prompt: "Per feature (recommended) or Per phase?"
- Per feature → single `wireframes.html`
- Per phase → `wireframes-phase-01.html`, `wireframes-phase-02.html`, etc.
- Phases without UI → generate diagrams instead

---

## Tasks

### Task 1: Add Scope Prompt Step

**Files:** `specdacular/workflows/blueprint-wireframes.md`

**Action:**
Add a new step after `validate` that prompts the user for wireframe scope.

**Add after the validate step:**

```markdown
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
```

**Verify:**
```bash
grep -q "prompt_scope" specdacular/workflows/blueprint-wireframes.md && echo "has scope prompt"
```

**Done when:**
- [ ] New step `prompt_scope` added after validate
- [ ] User choice stored as scope variable
- [ ] Per feature is first/recommended option

---

### Task 2: Update Load Context for Phase-Aware Loading

**Files:** `specdacular/workflows/blueprint-wireframes.md`

**Action:**
Update load_context to also read phase information when scope is "phase".

**Update the load_context step to include:**

```markdown
**If scope is "phase":**
- List phase directories in `.specd/features/{name}/plans/`
- For each phase, note if it has UI-related content
- Phases are numbered: phase-01, phase-02, etc.
```

**Verify:**
```bash
grep -q "scope.*phase" specdacular/workflows/blueprint-wireframes.md && echo "handles phase scope"
```

**Done when:**
- [ ] load_context handles both scope types
- [ ] Phase directories identified for per-phase mode

---

### Task 3: Update Generate Step for Per-Phase Output

**Files:** `specdacular/workflows/blueprint-wireframes.md`

**Action:**
Update generate_wireframe and write_wireframe steps to handle per-phase output.

**Update generate_wireframe step:**

```markdown
**If scope is "feature":**
Generate single combined wireframe as before.

**If scope is "phase":**
For each phase:
1. Analyze phase plans for UI components
2. If phase has UI elements:
   - Generate wireframe for that phase
   - Add phase number to header: "Phase N: {feature-name}"
3. If phase has NO UI elements:
   - Skip wireframe generation for this phase
   - Note: "Phase N has no UI — consider generating diagrams"
```

**Update write_wireframe step:**

```markdown
**If scope is "feature":**
Write to `.specd/features/{name}/blueprint/wireframes.html`

**If scope is "phase":**
For each phase with UI:
- Write to `.specd/features/{name}/blueprint/wireframes-phase-{NN}.html`
- Example: `wireframes-phase-01.html`, `wireframes-phase-02.html`
```

**Verify:**
```bash
grep -q "wireframes-phase" specdacular/workflows/blueprint-wireframes.md && echo "has per-phase output"
```

**Done when:**
- [ ] Generate handles both scopes
- [ ] Per-phase writes separate files
- [ ] Phases without UI are skipped

---

### Task 4: Update Blueprint Integration for Multiple Files

**Files:** `specdacular/workflows/blueprint-wireframes.md`

**Action:**
Update the update_blueprint step to handle multiple wireframe files.

**Update the update_blueprint step:**

```markdown
**If scope is "feature":**
Enable wireframes tab with single iframe as before.

**If scope is "phase":**
Enable wireframes tab with phase sub-navigation:

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
```

**Verify:**
```bash
grep -q "wireframe-viewer" specdacular/workflows/blueprint-wireframes.md && echo "has phase wireframe viewer"
```

**Done when:**
- [ ] Single file mode works as before
- [ ] Per-phase mode shows phase tabs
- [ ] Iframe src switches between phase wireframes

---

### Task 5: Update Completion Message

**Files:** `specdacular/workflows/blueprint-wireframes.md`

**Action:**
Update present_completion to reflect scope choice and files generated.

**Update the completion output:**

```markdown
**If scope is "feature":**
```
## Files
- Wireframe: `.specd/features/{name}/blueprint/wireframes.html`
```

**If scope is "phase":**
```
## Files
- Phase 1: `.specd/features/{name}/blueprint/wireframes-phase-01.html`
- Phase 2: `.specd/features/{name}/blueprint/wireframes-phase-02.html`
<!-- ... for each generated phase -->

**Phases without UI:**
- Phase N: No UI elements (consider `/specd:blueprint {name} diagrams`)
```
```

**Done when:**
- [ ] Completion lists all generated files
- [ ] Per-phase mode shows each file
- [ ] Phases without UI mentioned with diagrams suggestion

---

## Verification

After all tasks complete:

```bash
# Check workflow updated
grep -q "prompt_scope" specdacular/workflows/blueprint-wireframes.md && echo "has scope prompt"
grep -q "wireframes-phase" specdacular/workflows/blueprint-wireframes.md && echo "has per-phase files"
grep -q "wireframe-viewer" specdacular/workflows/blueprint-wireframes.md && echo "has phase viewer"
```

**Plan is complete when:**
- [ ] Scope prompt step added
- [ ] Per-feature generates single file
- [ ] Per-phase generates separate files per phase
- [ ] Blueprint integrates multiple wireframe files
- [ ] Phases without UI skipped with suggestion

---

## Output

When this plan is complete:

1. Update `.specd/features/visual-blueprint-tool/STATE.md`:
   - Mark this plan as complete

2. Commit changes:
   ```bash
   git add specdacular/workflows/blueprint-wireframes.md
   git commit -m "feat(blueprint): add wireframes scope prompt

   Plan 4.03 complete:
   - Prompt for per-feature or per-phase wireframes
   - Per-phase generates separate files
   - Blueprint shows phase tabs for multiple wireframes"
   ```

3. Phase 4 complete. All phase-centric enhancements implemented.
