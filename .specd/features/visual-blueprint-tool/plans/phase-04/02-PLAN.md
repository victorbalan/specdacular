---
feature: visual-blueprint-tool
phase: 4
plan: 02
depends_on:
  - phase-04/01-PLAN.md
creates: []
modifies:
  - specdacular/workflows/blueprint.md
---

# Plan 02: Update Workflow to Group Content by Phase

## Objective

Update the main blueprint workflow to parse the `**Phase:**` field from decisions and group decisions, context, and plans by phase when generating HTML.

## Context

**Reference these files:**
- `@specdacular/workflows/blueprint.md` — Current workflow to modify
- `@.specd/features/visual-blueprint-tool/DECISIONS.md` — Example with Phase field

**Relevant Decisions:**
- DEC-007: Phase tabs within sections for navigation
- DEC-008: Explicit Phase field in decisions — Parse `**Phase:** N` from each decision

**Phase grouping logic:**
- Parse `**Phase:** N` from each decision (default to 0 if missing)
- Group decisions by phase number
- Generate phase tabs: [All] [Phase 0] [Phase 1] [Phase 2] ...
- Phase 0 = "Pre-planning" decisions
- Context questions grouped by related decision phase
- Plans inherently grouped by phase directory

---

## Tasks

### Task 1: Update parse_decisions Step

**Files:** `specdacular/workflows/blueprint.md`

**Action:**
Update the `parse_decisions` step to extract the Phase field from each decision.

**Find the parse_decisions step and update the parsing strategy:**

```markdown
<step name="parse_decisions">
Parse DECISIONS.md to extract decision data.

**Parsing strategy:**
1. Split content on `### DEC-` to find decision blocks
2. For each block:
   - Extract ID from heading: `### DEC-XXX: Title`
   - Parse `**Date:**` line for date
   - Parse `**Phase:**` line for phase (default: 0 if missing)
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
  phase: 1,  // NEW: phase number (0 = pre-planning)
  status: "Active",
  context: "Context text...",
  decision: "Decision text...",
  rationale: ["Reason 1", "Reason 2"],
  implications: ["Implication 1", "Implication 2"]
}
```

**Edge cases:**
- Missing Phase field → default to 0 (pre-planning)
- Phase: 0 → label as "Pre-planning"
- Multi-line values → collect until next `**Field:**`

Continue to parse_context.
</step>
```

**Verify:**
```bash
grep -q "Parse.*Phase.*line" specdacular/workflows/blueprint.md && echo "has phase parsing"
```

**Done when:**
- [ ] parse_decisions step includes Phase field extraction
- [ ] Default phase is 0 for missing field
- [ ] Output format includes phase number

---

### Task 2: Update generate_html Step for Phase Tabs

**Files:** `specdacular/workflows/blueprint.md`

**Action:**
Update the `generate_html` step to:
1. Group decisions by phase
2. Generate phase tab HTML for each section
3. Wrap content in phase-content divs

**Find the generate_html step and add phase grouping logic:**

```markdown
**Generate phase tabs HTML:**
Collect unique phases from decisions (sorted numerically).
For each section (Decisions, Context), generate:

```html
<button class="phase-tab all-tab active" data-phase="all">All</button>
<button class="phase-tab" data-phase="0">Pre-planning</button>
<button class="phase-tab" data-phase="1">Phase 1</button>
<button class="phase-tab" data-phase="2">Phase 2</button>
<!-- ... for each phase found -->
```

**Replace placeholders:**
- `{decisions-phase-tabs}` → Generated phase tabs for decisions
- `{context-phase-tabs}` → Generated phase tabs for context
- `{plans-phase-tabs}` → Generated phase tabs for plans (no "All" tab)

**Generate decisions HTML with phase grouping:**
Wrap decisions in phase-content divs:

```html
<div class="phase-content active" data-phase="0">
  <!-- Pre-planning decisions -->
  <details class="decision-item">...</details>
</div>
<div class="phase-content active" data-phase="1">
  <!-- Phase 1 decisions -->
  <details class="decision-item">...</details>
</div>
```

**Generate plans HTML with phase grouping:**
Plans are already grouped by phase directory, wrap each phase:

```html
<div class="phase-content active" data-phase="1">
  <div class="phase-group">
    <div class="phase-header">Phase 1: {title}</div>
    <div class="plan-item">...</div>
  </div>
</div>
<div class="phase-content active" data-phase="2">
  <div class="phase-group">
    <div class="phase-header">Phase 2: {title}</div>
    <div class="plan-item">...</div>
  </div>
</div>
```
```

**Verify:**
```bash
grep -q "phase-content" specdacular/workflows/blueprint.md && echo "has phase-content"
grep -q "decisions-phase-tabs" specdacular/workflows/blueprint.md && echo "has phase-tabs placeholder"
```

**Done when:**
- [ ] Decisions grouped by phase in divs
- [ ] Phase tabs generated for each section
- [ ] Plans wrapped in phase-content divs
- [ ] All phase content visible by default (active class)

---

### Task 3: Update Context Grouping

**Files:** `specdacular/workflows/blueprint.md`

**Action:**
Update the parse_context and generate_html to associate context items with phases based on their related decisions.

**In parse_context step, add:**
```markdown
**Associate with phase:**
- Check `**Related Decisions:** DEC-XXX` field
- Look up phase of referenced decision
- If no related decision, use phase 0
```

**In generate_html, generate context HTML with phase grouping:**
```html
<div class="phase-content active" data-phase="0">
  <!-- Pre-planning context -->
  <div class="resolved-question">...</div>
</div>
<div class="phase-content active" data-phase="1">
  <!-- Phase 1 context -->
  <div class="resolved-question">...</div>
</div>
```

**Verify:**
```bash
grep -q "Related Decisions" specdacular/workflows/blueprint.md && echo "has related decisions"
```

**Done when:**
- [ ] Context items associated with phases via related decisions
- [ ] Context wrapped in phase-content divs
- [ ] Default to phase 0 if no related decision

---

## Verification

After all tasks complete:

```bash
# Check workflow updated
grep -q "phase-content" specdacular/workflows/blueprint.md && echo "has phase grouping"
grep -q "decisions-phase-tabs" specdacular/workflows/blueprint.md && echo "has phase tabs"
grep -q "Phase.*line" specdacular/workflows/blueprint.md && echo "parses phase field"
```

**Plan is complete when:**
- [ ] parse_decisions extracts Phase field
- [ ] generate_html groups content by phase
- [ ] Phase tabs generated for all sections
- [ ] Content wrapped in phase-content divs

---

## Output

When this plan is complete:

1. Update `.specd/features/visual-blueprint-tool/STATE.md`:
   - Mark this plan as complete

2. Commit changes:
   ```bash
   git add specdacular/workflows/blueprint.md
   git commit -m "feat(blueprint): group content by phase in workflow

   Plan 4.02 complete:
   - Parse Phase field from decisions
   - Group decisions/context/plans by phase
   - Generate phase tabs HTML"
   ```

3. Next plan: `phase-04/03-PLAN.md` (wireframes scope prompt)
