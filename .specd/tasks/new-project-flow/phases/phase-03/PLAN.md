---
task: new-project-flow
phase: 3
depends_on: [2]
creates:
  - specdacular/templates/tasks/REQUIREMENTS.md
modifies:
  - specdacular/workflows/new-project.md
---

# Phase 3: Requirements & Roadmap Stages

## Objective

User scopes v1 features from research FEATURES.md via multi-select, gets REQUIREMENTS.md with REQ-IDs, then a ROADMAP.md with phases mapped to requirements. Replace the requirements and roadmap stubs in the workflow.

## Context

**Reference these files:**
- `specdacular/workflows/new-project.md` — Current workflow with requirements and roadmap stubs
- `specdacular/templates/tasks/ROADMAP.md` — Existing roadmap template (for task-level, adapt for project-level)

**Relevant Decisions:**
- DEC-007: Multi-select from research. Show features by category (table stakes, differentiators), user picks v1/later/out-of-scope. Write REQUIREMENTS.md from choices.
- DEC-001: System-level docs at `.specd/tasks/project/`

---

## Tasks

### Task 1: Create REQUIREMENTS.md template

**Files:** `specdacular/templates/tasks/REQUIREMENTS.md`

**Action:**
Create a template for scoped project requirements. This is different from FEATURE.md (which is per-task) — this captures project-wide requirements organized by category with REQ-IDs.

Template sections:
- **Project:** `{project-name}`
- **Scoped:** `{date}`
- **v1 Requirements** — Table with REQ-ID, category, feature name, description, complexity, dependencies
  - Categories: table-stakes, differentiator
  - REQ-IDs: `REQ-001`, `REQ-002`, etc.
- **v2+ (Deferred)** — Features explicitly deferred with rationale
- **Out of Scope** — Features explicitly excluded with rationale
- **Requirement Details** — Expanded description per REQ-ID with acceptance criteria
- **Dependencies** — Cross-requirement dependencies
- **Summary** — Counts: total v1, by category, estimated complexity distribution

Use `{placeholder}` syntax consistent with other templates.

**Verify:**
```bash
[ -f specdacular/templates/tasks/REQUIREMENTS.md ] && grep -q "REQ-" specdacular/templates/tasks/REQUIREMENTS.md && echo "OK"
```

**Done when:**
- [ ] Template exists with all sections
- [ ] REQ-ID format defined
- [ ] v1/v2/out-of-scope sections present

---

### Task 2: Implement requirements stage in workflow

**Files:** `specdacular/workflows/new-project.md`

**Action:**
Replace the `requirements` stub step with a functional requirements scoping stage.

**The requirements stage should:**

1. **Read research FEATURES.md:**
   Parse `.specd/tasks/project/research/FEATURES.md` to extract features by category (table stakes, differentiators, nice-to-have, anti-features).

2. **Present features for scoping:**
   Use AskUserQuestion with `multiSelect: true` to let user pick features per category.

   First, show table stakes:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    REQUIREMENTS SCOPING: {project-name}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   **Table Stakes** — Users expect these. Deselect only if you have a reason.
   ```
   AskUserQuestion (multiSelect): list table stakes features, all pre-selected as recommendations.

   Then differentiators:
   ```
   **Differentiators** — These set your project apart. Pick what matters for v1.
   ```
   AskUserQuestion (multiSelect): list differentiator features.

   Then nice-to-have:
   ```
   **Nice-to-Have** — These can wait. Pick any you want in v1.
   ```
   AskUserQuestion (multiSelect): list nice-to-have features.

   Note: If there are more than 4 features in a category, batch them into multiple AskUserQuestion calls (max 4 options per call).

3. **Write REQUIREMENTS.md:**
   Use template at `~/.claude/specdacular/templates/tasks/REQUIREMENTS.md`.
   Assign REQ-IDs sequentially. Selected features → v1. Unselected table-stakes/differentiators → v2+. Nice-to-have unselected → v2+. Anti-features → out of scope.

4. **Show summary:**
   ```
   **v1 Scope:**
   - {count} table stakes
   - {count} differentiators
   - {count} nice-to-haves
   Total: {count} requirements

   **Deferred to v2+:** {count}
   **Out of scope:** {count}
   ```

5. **Commit:**
   - $FILES: `.specd/tasks/project/REQUIREMENTS.md`
   - $MESSAGE: `docs(project): requirements scoped — {count} v1 requirements`
   - $LABEL: `requirements scoped`

Continue to roadmap step.

**Verify:**
```bash
grep -q "REQUIREMENTS" specdacular/workflows/new-project.md && \
grep -q "multiSelect" specdacular/workflows/new-project.md && \
grep -q "REQ-" specdacular/workflows/new-project.md && \
echo "OK"
```

**Done when:**
- [ ] Requirements stage reads research FEATURES.md
- [ ] Multi-select per category for user scoping
- [ ] REQUIREMENTS.md written with REQ-IDs
- [ ] Batching logic for >4 features per category

---

### Task 3: Implement roadmap stage in workflow

**Files:** `specdacular/workflows/new-project.md`

**Action:**
Replace the `roadmap` stub step with a functional roadmap generation stage.

**The roadmap stage should:**

1. **Read requirements and research:**
   Parse REQUIREMENTS.md (v1 requirements), ARCHITECTURE.md (service boundaries, suggested sub-projects), STACK.md (technology choices).

2. **Identify sub-projects:**
   From architecture research service boundaries + user input during questioning.
   Each sub-project becomes a directory that gets scaffolded in Phase 4.

3. **Generate roadmap phases:**
   Order by dependencies:
   - Setup/infrastructure phases first
   - Core data model / API next
   - Features by dependency order
   - Integration / polish last

   Map each phase to REQ-IDs it satisfies.

4. **Write ROADMAP.md:**
   Adapted from the existing ROADMAP.md template but project-level:
   ```markdown
   # Roadmap: {project-name}

   ## Sub-Projects
   | Name | Type | Technology |
   |------|------|-----------|

   ## Phases
   - [ ] Phase 1: {name} — {goal} (REQ-XXX, REQ-XXX)
   ...

   ## Phase Details
   ### Phase N: {name}
   **Goal:** ...
   **Sub-project:** ...
   **Requirements:** REQ-XXX, REQ-XXX
   **Creates:** ...
   **Dependencies:** ...
   ```

5. **Show roadmap summary and commit:**
   - $FILES: `.specd/tasks/project/ROADMAP.md .specd/tasks/project/config.json`
   - $MESSAGE: `docs(project): roadmap created — {N} phases, {N} sub-projects`
   - $LABEL: `roadmap created`

Continue to scaffold step (still stubbed for Phase 4).

**Update completion banner** to show after roadmap (since scaffold is still stubbed).

**Verify:**
```bash
grep -q "ROADMAP" specdacular/workflows/new-project.md && \
grep -q "sub-project" specdacular/workflows/new-project.md && \
echo "OK"
```

**Done when:**
- [ ] Roadmap stage reads requirements and research
- [ ] Sub-projects identified from architecture research
- [ ] Phases generated with dependency ordering
- [ ] REQ-IDs mapped to phases
- [ ] ROADMAP.md written and committed
- [ ] Completion banner shows after roadmap

---

## Verification

After all tasks complete:

```bash
[ -f specdacular/templates/tasks/REQUIREMENTS.md ] && \
grep -q "REQUIREMENTS" specdacular/workflows/new-project.md && \
grep -q "ROADMAP" specdacular/workflows/new-project.md && \
grep -q "multiSelect" specdacular/workflows/new-project.md && \
echo "Phase 3 complete"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] REQUIREMENTS.md template created
- [ ] Requirements stage uses multi-select from research
- [ ] Roadmap stage generates phases mapped to REQ-IDs

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/new-project-flow/CHANGELOG.md`.
