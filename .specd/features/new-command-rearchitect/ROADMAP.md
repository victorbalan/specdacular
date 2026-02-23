# Roadmap: new-command-rearchitect

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 6 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Shared References** — Extract duplicated patterns into reusable reference docs
- [ ] **Phase 2: Templates** — Update templates for tasks/ structure and single-plan phases
- [ ] **Phase 3: Core Workflows** — Rewrite all workflows with new naming, deduplication, and review
- [ ] **Phase 4: Commands** — Create new command files pointing to renamed workflows
- [ ] **Phase 5: Orchestrator** — Split orchestrator branches into separate workflow files
- [ ] **Phase 6: Installer & Cleanup** — Update bin/install.js, help, remove old files

---

## Phase Details

### Phase 1: Shared References

**Goal:** Create the 5 shared reference documents that all workflows will use, eliminating duplicated logic.

**Creates:**
- `specdacular/references/validate-task.md` — Task existence and file validation
- `specdacular/references/load-context.md` — Standard context loading pattern
- `specdacular/references/record-decision.md` — DEC-{NNN} template
- `specdacular/references/spawn-research-agents.md` — Three-agent research pattern
- `specdacular/references/synthesize-research.md` — RESEARCH.md synthesis

**Plan:** `phases/phase-01/PLAN.md`

**Success Criteria:**
1. All 5 reference files exist with complete, parameterized content
2. Each reference is self-contained and referenceable via `@` path

**Dependencies:** None (first phase)

---

### Phase 2: Templates

**Goal:** Update all document templates for the new tasks/ structure and single-plan-per-phase layout.

**Creates:**
- `specdacular/templates/tasks/` — Full template set

**Modifies:**
- `STATE.md` template — References phases/phase-NN/PLAN.md
- `ROADMAP.md` template — Single plan per phase
- `PLAN.md` template — Simplified for one-per-phase
- `config.json` template — Updated paths

**Plan:** `phases/phase-02/PLAN.md`

**Success Criteria:**
1. `templates/tasks/` directory has all required templates
2. Templates reference `.specd/tasks/` not `.specd/features/`
3. STATE.md template tracks phases with single plans
4. PLAN.md template works for one-per-phase layout

**Dependencies:** Phase 1 (references exist for cross-referencing)

---

### Phase 3: Core Workflows

**Goal:** Rewrite all 7 main workflows with new naming, shared reference usage, and the new review workflow.

**Creates:**
- `specdacular/workflows/new.md` — New task workflow
- `specdacular/workflows/continue.md` — Continue with --semi-auto/--auto support
- `specdacular/workflows/discuss.md` — Discussion workflow
- `specdacular/workflows/research.md` — Proper step-based research workflow
- `specdacular/workflows/plan.md` — Planning with single PLAN.md per phase
- `specdacular/workflows/execute.md` — Execution with auto-review trigger
- `specdacular/workflows/review.md` — Merged review workflow

**Plan:** `phases/phase-03/PLAN.md`

**Success Criteria:**
1. All 7 workflows exist with proper step-based format
2. Workflows reference shared references instead of inline duplication
3. `continue.md` supports `--semi-auto` and `--auto` flags
4. `execute.md` chains to `review.md` after completion
5. `review.md` combines semantic inspection + git diff + fix plan generation
6. All references use `.specd/tasks/` paths

**Dependencies:** Phase 1 (shared references), Phase 2 (templates)

---

### Phase 4: Commands

**Goal:** Create new command files with updated names, pointing to new workflows.

**Creates:**
- `commands/specd.new.md`
- `commands/specd.continue.md`
- `commands/specd.discuss.md`
- `commands/specd.research.md`
- `commands/specd.plan.md`
- `commands/specd.execute.md`
- `commands/specd.review.md`

**Modifies:**
- `commands/specd.help.md` — Updated command list
- `commands/specd.status.md` — Read from `.specd/tasks/`
- `commands/specd.toolbox.md` — Updated references

**Plan:** `phases/phase-04/PLAN.md`

**Success Criteria:**
1. All 7 new command files exist with correct frontmatter
2. Each command references its corresponding workflow via `@` path
3. Help command lists new commands
4. Status command reads from `.specd/tasks/`

**Dependencies:** Phase 3 (workflows exist to reference)

---

### Phase 5: Orchestrator

**Goal:** Split orchestrator-specific logic from main workflows into dedicated files.

**Creates:**
- `specdacular/workflows/orchestrator/new.md`
- `specdacular/workflows/orchestrator/plan.md`

**Modifies:**
- `specdacular/workflows/new.md` — Add orchestrator branch
- `specdacular/workflows/plan.md` — Add orchestrator branch

**Plan:** `phases/phase-05/PLAN.md`

**Success Criteria:**
1. Orchestrator workflow files exist
2. Main workflows detect mode and branch to orchestrator files
3. Orchestrator logic references `.specd/tasks/` paths

**Dependencies:** Phase 3 (main workflows exist)

---

### Phase 6: Installer & Cleanup

**Goal:** Update the installer for new paths, remove old files, verify everything works end-to-end.

**Modifies:**
- `bin/install.js` — New command/workflow/template paths
- `hooks/specd-statusline.js` — Update if needed

**Removes:**
- Old command files (new-feature.md, continue-feature.md, etc.)
- Old workflow files (new-feature.md, continue-feature.md, etc.)
- Phase-specific files (discuss-phase.md, research-phase.md, etc.)
- `specdacular/templates/features/` directory

**Plan:** `phases/phase-06/PLAN.md`

**Success Criteria:**
1. `npx specdacular --local` installs new files correctly
2. Old command/workflow files removed
3. `templates/features/` removed
4. No broken `@` references in any workflow
5. `/specd.new test-task` works end-to-end

**Dependencies:** Phase 4 and 5 (all new files exist before removing old ones)

---

## Execution Order

```
Phase 1: Shared References
    ↓
Phase 2: Templates
    ↓
Phase 3: Core Workflows
    ↓
Phase 4: Commands
    ↓
Phase 5: Orchestrator
    ↓
Phase 6: Installer & Cleanup
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-002: One plan per phase | Each phase gets one PLAN.md — roadmap structure itself follows this |
| DEC-007: Shared references | Phase 1 creates foundation all other phases use |
| DEC-008: Merged review | Phase 3 creates single review.md instead of two |
| DEC-010: Split orchestrator | Phase 5 handles orchestrator as separate concern |
| DEC-011: Remove phase commands | Phase 6 removes more files than just renamed ones |
