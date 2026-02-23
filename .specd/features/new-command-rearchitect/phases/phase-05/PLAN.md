---
feature: new-command-rearchitect
phase: 5
depends_on:
  - phase-03
creates:
  - specdacular/workflows/orchestrator/new.md
  - specdacular/workflows/orchestrator/plan.md
modifies:
  - specdacular/workflows/new.md
  - specdacular/workflows/plan.md
---

# Phase 5: Orchestrator

## Objective

Extract orchestrator-specific logic from main workflows into dedicated files, keeping main workflows clean and focused on single-project flow.

## Context

**Reference these files:**
- `@specdacular/workflows/new-feature.md` — Current orchestrator branches to extract
- `@specdacular/workflows/plan-feature.md` — Current orchestrator branches to extract
- `@specdacular/workflows/new.md` — Main workflow to add branch to (from Phase 3)
- `@specdacular/workflows/plan.md` — Main workflow to add branch to (from Phase 3)

**Relevant Decisions:**
- DEC-010: Split orchestrator branches into separate files
- DEC-001: All paths use `.specd/tasks/`

---

## Tasks

### Task 1: Create orchestrator/new.md

**Files:** `specdacular/workflows/orchestrator/new.md`

**Action:**
Extract orchestrator-specific new-task logic from the old `new-feature.md`:
- `orchestrator_discussion` step — System-level discussion
- `route_projects` step — Identify involved projects
- `create_orchestrator_feature` step — Create orchestrator-level task folder
- `delegate_to_projects` step — Create per-project task folders
- `orchestrator_feature_commit` step
- `orchestrator_feature_completion` step
- `orchestrator_continuation_offer` step

Update all paths:
- `.specd/features/` → `.specd/tasks/`
- `/specd.feature:*` → `/specd.*`
- Use shared references where applicable

**Done when:**
- [ ] Orchestrator new-task logic is self-contained
- [ ] All paths updated
- [ ] Uses shared references

---

### Task 2: Create orchestrator/plan.md

**Files:** `specdacular/workflows/orchestrator/plan.md`

**Action:**
Extract orchestrator-specific planning logic from old `plan-feature.md`:
- Orchestrator phase derivation (system-level phases)
- Per-project plan delegation
- Cross-project dependency tracking
- Contract alignment checks

Update all paths and use shared references.

**Done when:**
- [ ] Orchestrator planning logic is self-contained
- [ ] All paths updated

---

### Task 3: Add orchestrator branch to main workflows

**Files:** `specdacular/workflows/new.md`, `specdacular/workflows/plan.md`

**Action:**
Add a mode detection step early in both workflows:

```markdown
<step name="detect_mode">
Check for orchestrator mode.

Read `.specd/config.json` if it exists. Check `"type"` field.

**If type = "orchestrator":**
Hand off to orchestrator workflow:
@~/.claude/specdacular/workflows/orchestrator/{workflow}.md

End main workflow (orchestrator handles everything).

**If type = "project" or absent:**
Continue with single-project flow.
</step>
```

This keeps the branch minimal — just a mode check and handoff.

**Done when:**
- [ ] Both workflows detect orchestrator mode
- [ ] Branch is a clean handoff (not inline logic)
- [ ] Single-project flow unchanged

---

## Verification

```bash
# Orchestrator files exist
ls specdacular/workflows/orchestrator/{new,plan}.md

# Main workflows have orchestrator detection
grep -l "orchestrator" specdacular/workflows/{new,plan}.md

# No old paths
grep -r "\.specd/features/" specdacular/workflows/orchestrator/ && echo "FAIL" || echo "PASS"
```

**Plan is complete when:**
- [ ] Orchestrator workflow files exist
- [ ] Main workflows have clean mode detection + handoff
- [ ] All paths updated to `.specd/tasks/`
