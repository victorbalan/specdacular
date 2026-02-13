# Feature: improved-status-command

## What This Is

Extends the `/specd:status` command to support orchestrator mode — detecting multi-project repos and displaying orchestrator-level features alongside per-project features in a grouped hierarchy.

## Technical Requirements

### Must Create

- [ ] `specdacular/workflows/status.md` — Updated workflow with orchestrator detection, sub-project scanning, and grouped output formatting

### Must Integrate With

- `commands/specd/status.md` — Existing command definition (may need updated description)
- `specdacular/workflows/status.md` — Current single-project workflow (being extended)
- `.specd/config.json` — Read `type` field to detect orchestrator mode and `projects` array for sub-project paths
- `.specd/features/*/config.json` — Per-feature config, check `orchestrator: true` and `projects` array
- `.specd/features/*/STATE.md` — Extract stage, plan progress, next action (existing logic)

### Constraints

- Single-project mode unchanged — No behavior changes when `config.json` type is not `orchestrator`
- No file writes — Status command is read-only, output only
- Sub-project paths come from `.specd/config.json` `projects` array — Don't scan filesystem for projects
- No Task agents — All data gathering happens inline in the workflow

---

## Success Criteria

- [ ] In single-project mode, output is identical to current behavior
- [ ] In orchestrator mode, detects orchestrator from `.specd/config.json` type field
- [ ] Orchestrator features display with sub-project features indented underneath (`└ project`)
- [ ] Standalone sub-project features (not tied to an orchestrator feature) show in a separate "Project Features" section grouped by project
- [ ] `--all` flag works for both orchestrator and project-level completed/abandoned features
- [ ] Features sorted by stage priority (execution > planning > research > discussion)

---

## Out of Scope

- [X] Modifying how features are created — That's `new-feature` workflow's job
- [X] Adding interactive elements — Status is display-only
- [X] Changing STATE.md or config.json formats — Read existing formats only

---

## Initial Context

### User Need
When working in an orchestrator repo with multiple sub-projects, `/specd:status` only shows root-level features. Users need to see the full picture: orchestrator features and all sub-project features in one dashboard.

### Integration Points
- `.specd/config.json` type field for orchestrator detection
- `.specd/config.json` projects array for sub-project paths
- Per-feature `config.json` with `orchestrator: true` and `projects` array for feature-to-project mapping
- Sub-project `.specd/features/*/` directories for project-local features

### Key Constraints
- Read-only command, no file mutations
- Must work with existing data formats produced by `new-feature` workflow
- Single-project behavior must be preserved exactly
