---
feature: phase-review
phase: 2
plan: 01
depends_on:
  - phase-01/01-PLAN.md
  - phase-01/02-PLAN.md
creates: []
modifies:
  - commands/specd.help.md
  - README.md
  - specdacular/templates/features/STATE.md
---

# Plan 01: Update Help, README, and STATE.md Template

## Objective

Make the `/specd.phase:review` command discoverable in help and README, update feature flow diagrams to show the review loop, and add a Review Cycles section to the STATE.md template.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Documentation patterns
- `@.specd/codebase/STRUCTURE.md` — Where files go
- `@commands/specd.help.md` — Current help output (modify)
- `@README.md` — Current README (modify)
- `@specdacular/templates/features/STATE.md` — Current STATE template (modify)

**Relevant Decisions:**
- DEC-002: Command named `phase:review` — consistent naming in all docs
- DEC-004: Review Cycles tracked in STATE.md — template needs section
- DEC-005: Per-plan status table with icons — referenced in help description

**From Research:**
- Help integration point: add between execute and insert in Phase Commands table
- Feature flow diagram needs review loop: `execute → review → [fix → execute → review]*`
- STATE.md template needs Review Cycles section after Execution Progress

---

## Tasks

### Task 1: Update help.md with phase:review command

**Files:** `commands/specd.help.md`

**Action:**
Add `/specd.phase:review` to the Phase Commands table and update the Feature Flow diagram.

**1. In the Phase Commands table (after `phase:execute`, before `phase:insert`):**

Find:
```markdown
| `/specd.phase:execute [feature] [plan]` | Execute a plan with progress tracking |
| `/specd.phase:insert [feature] [after] [desc]` | Insert a new phase after an existing one |
```

Insert between them:
```markdown
| `/specd.phase:review [feature] [phase]` | Review executed plans against actual code |
```

**2. In the Feature Flow diagram, update the phase loop:**

Find:
```
    phase:prepare? -> phase:plan -> phase:execute
```

Replace with:
```
    phase:prepare? -> phase:plan -> phase:execute -> phase:review?
```

**3. In the flow description list, add after `phase:execute`:**

Find:
```markdown
- `phase:execute` — Execute plans with progress tracking
```

Add after:
```markdown
- `phase:review` — Review executed plans, generate corrective plans if needed
```

**4. In the Quick Start section, add review step after execute:**

Find:
```
/specd.phase:execute user-dashboard      # Execute with progress tracking
```

Add after:
```
/specd.phase:review user-dashboard 1     # Review phase against actual code
```

**Verify:**
```bash
grep "phase:review" commands/specd.help.md | wc -l
# Should be at least 4 (table + flow + description + quick start)
```

**Done when:**
- [ ] `phase:review` appears in Phase Commands table between execute and insert
- [ ] Feature Flow diagram shows review step
- [ ] Flow description list includes phase:review
- [ ] Quick Start includes review example

---

### Task 2: Update README.md with phase:review command

**Files:** `README.md`

**Action:**
Add `/specd.phase:review` to README Phase Commands table, update Feature Flow, and add review to Quick Start.

**1. In Phase Commands table (after `phase:execute`, before `phase:insert`):**

Find:
```markdown
| `/specd.phase:execute [feature]` | Execute plans with progress tracking |
| `/specd.phase:insert [feature] [after] [desc]` | Insert a new phase after an existing one |
```

Insert between them:
```markdown
| `/specd.phase:review [feature] [phase]` | Review executed plans against actual code |
```

**2. In the feature flow diagram at the top (What It Does section):**

Find:
```
    phase:prepare? -> phase:plan -> phase:execute
```

Replace with:
```
    phase:prepare? -> phase:plan -> phase:execute -> phase:review?
```

**3. In "Step 4: Prepare, plan, and execute each phase" in Quick Start:**

Find:
```
/specd.phase:execute user-dashboard      # Execute with progress tracking
```

Add after:
```
/specd.phase:review user-dashboard 1     # Review phase against actual code
```

**4. In the detailed Feature Flow diagram (ASCII art), add review step after execute in the phase loop:**

Find the phase loop in the ASCII art diagram and add a `phase:review` box after `phase:execute`. The loop should show:
```
              │  ┌──────────┐               │
              │  │  phase:  │               │
              │  │ execute  │               │
              │  └──────────┘               │
              │       │                     │
              │       ▼                     │
              │  ┌──────────┐               │
              │  │  phase:  │               │
              │  │  review  │               │
              │  └──────────┘               │
```

**5. In "The Flow in Detail" section, add after the `phase:execute` description:**

After the `**\`phase:execute\`**` paragraph, add:
```markdown
**`phase:review`** reviews executed plans against actual code:
- Claude inspects each plan's `creates`/`modifies` against actual files
- Per-plan status table with ✅/⚠️/❌/⏸️ icons
- User conversation captures additional issues
- Generates corrective plans if needed (fed back into `phase:execute`)
- Review cycle tracked in `STATE.md`
```

**Verify:**
```bash
grep "phase:review" README.md | wc -l
# Should be at least 5 (table + flow + quick start + diagram + description)
```

**Done when:**
- [ ] `phase:review` appears in Phase Commands table
- [ ] Feature flow diagrams (text + ASCII) show review step
- [ ] Quick Start includes review example
- [ ] "Flow in Detail" describes phase:review

---

### Task 3: Update STATE.md template with Review Cycles section

**Files:** `specdacular/templates/features/STATE.md`

**Action:**
Add a Review Cycles section to the STATE.md template. This section is where the review workflow (DEC-004) records review cycle data.

**After the "Execution Progress" section (after the Completed Plans table), before "Discussion Sessions", add:**

Find:
```markdown
---

## Discussion Sessions
```

Insert before it:
```markdown
## Review Cycles

| Phase | Cycle | Date | Findings | Corrective Plans | Status |
|-------|-------|------|----------|------------------|--------|

---

```

**Verify:**
```bash
grep "Review Cycles" specdacular/templates/features/STATE.md
# Should find the section header
```

**Done when:**
- [ ] Review Cycles section exists in STATE.md template
- [ ] Table has correct columns: Phase, Cycle, Date, Findings, Corrective Plans, Status
- [ ] Section is positioned after Execution Progress, before Discussion Sessions

---

## Verification

After all tasks complete, verify the plan is done:

```bash
# help.md has phase:review
grep -c "phase:review" commands/specd.help.md
# Should be >= 4

# README has phase:review
grep -c "phase:review" README.md
# Should be >= 5

# STATE.md template has Review Cycles
grep "Review Cycles" specdacular/templates/features/STATE.md

# All files modified
git diff --name-only | sort
# Should show: README.md, commands/specd.help.md, specdacular/templates/features/STATE.md
```

**Plan is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] `/specd.help` shows `phase:review` in Phase Commands
- [ ] Feature flow diagrams show review loop
- [ ] STATE.md template includes Review Cycles section

---

## Output

When this plan is complete:

1. Update `.specd/features/phase-review/STATE.md`:
   - Mark this plan as complete
   - Mark Phase 2 as complete
   - Update feature stage to complete

2. Commit changes:
   ```bash
   git add commands/specd.help.md README.md specdacular/templates/features/STATE.md
   git commit -m "docs(phase-review): add review command to help, README, and templates

   Plan 2.01 complete:
   - Added /specd.phase:review to help.md Phase Commands table
   - Updated feature flow diagrams with review loop
   - Added phase:review to README commands and Quick Start
   - Added Review Cycles section to STATE.md template"
   ```

3. Feature complete! All phases done.

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/phase-review/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach

**Format:**
```markdown
### {YYYY-MM-DD} - Plan phase-02/01

**{Brief title}**
- **What:** {What you decided/changed}
- **Why:** {Reason for the change}
- **Files:** `{affected files}`
```

**Don't log:**
- Minor implementation details
- Standard coding patterns
- Things working as planned

---

## Notes

