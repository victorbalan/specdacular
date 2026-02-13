---
feature: improved-status-command
phase: 1
plan: 01
depends_on: []
creates: []
modifies:
  - specdacular/workflows/status.md
---

# Plan 01: Update status workflow with orchestrator support

## Objective

Extend the status workflow to detect orchestrator mode and display features in a grouped hierarchy — orchestrator features with indented sub-project features, plus standalone sub-project features in a separate section.

## Context

**Reference these files:**
- `@specdacular/workflows/status.md` — Current workflow to modify
- `@.specd/codebase/PATTERNS.md` — Workflow structure patterns
- `@specdacular/workflows/new-feature.md` — Shows orchestrator detection pattern (codebase_context step)

**Relevant Decisions:**
- DEC-001: Grouped view — orchestrator features as parent rows, sub-project features indented with `└ project` prefix
- DEC-002: Standalone sub-project features in separate "Project Features" section grouped by project

**Phase Context:**
- Feature matching: same feature name across orchestrator and sub-projects
- Detection: check `.specd/config.json` for `type: "orchestrator"`
- Sub-project paths: from `.specd/config.json` `projects` array
- Per-feature project list: from feature's `config.json` `projects` array
- `--all` flag: hides orchestrator + sub-project rows together

---

## Tasks

### Task 1: Add orchestrator detection step

**Files:** `specdacular/workflows/status.md`

**Action:**
Add a new step between "1. Parse arguments" and "2. Check for features directory" that detects orchestrator mode.

After parsing arguments, add:

```markdown
### 1b. Detect orchestrator mode

Read `.specd/config.json` if it exists. Check if `type` equals `"orchestrator"`.

If orchestrator mode:
- Set mode = orchestrator
- Read `projects` array from config.json to get sub-project paths (each has `name` and `path`)
- Continue to step 2 (same check applies — need at least some features somewhere)

If not orchestrator (no config, or type != "orchestrator"):
- Set mode = project
- Continue to step 2 (unchanged behavior)
```

**Verify:**
Read the updated file and confirm the new step exists between argument parsing and feature directory check.

**Done when:**
- [ ] New step 1b exists in the workflow
- [ ] Step reads `.specd/config.json` and checks `type` field
- [ ] Step extracts `projects` array with name/path pairs
- [ ] Step sets mode variable for downstream logic

---

### Task 2: Add orchestrator feature gathering logic

**Files:** `specdacular/workflows/status.md`

**Action:**
Modify step 3 "Gather feature data" to handle orchestrator mode. When in orchestrator mode, the workflow needs to:

1. **Gather root features** (same as today) — read `.specd/features/*/config.json` and `STATE.md`
2. **For each root feature with `orchestrator: true` in its config.json** (or that has a `projects` array):
   - Read the feature's `config.json` to get its `projects` array
   - For each project in that array, check if `{project-path}/.specd/features/{feature-name}/` exists
   - If it exists, read that sub-project feature's `config.json` and `STATE.md` using the same extraction logic (stage, plans, next action)
   - Store these as children of the orchestrator feature
3. **Scan for standalone sub-project features:**
   - For each project in the repo-level config.json `projects` array, scan `{project-path}/.specd/features/*/config.json`
   - Any feature found that was NOT already captured as a child of an orchestrator feature is a standalone feature
   - Group standalone features by project

Add this as a conditional branch within step 3:

```markdown
**If mode = orchestrator:**

For each root feature, also check its `config.json` for a `projects` array.

**If feature has `projects` array (orchestrator feature):**
For each project entry `{name, path}`:
1. Check if `{path}/.specd/features/{feature_name}/` exists
2. If yes, read `{path}/.specd/features/{feature_name}/config.json` and `{path}/.specd/features/{feature_name}/STATE.md`
3. Extract same fields: stage (from STATE.md `**Stage:**`), plan completion, next action
4. Store as sub-feature of the parent orchestrator feature with project name

**After processing all root features, scan for standalone sub-project features:**
For each project in repo-level `.specd/config.json` `projects` array:
1. Use Glob to find `{project-path}/.specd/features/*/config.json`
2. For each found feature, check if it was already captured as a sub-feature above
3. If not, gather its data (same extraction) and store as standalone, grouped by project

**If mode = project:**
Use existing logic unchanged.
```

**Verify:**
Read the updated file and confirm the orchestrator gathering logic exists with both sub-feature and standalone feature paths.

**Done when:**
- [ ] Orchestrator features have their sub-project features gathered
- [ ] Standalone sub-project features are identified and grouped by project
- [ ] Single-project mode gathering is unchanged
- [ ] De-duplication prevents a feature from appearing as both orchestrator sub-feature and standalone

---

### Task 3: Add orchestrator output formatting

**Files:** `specdacular/workflows/status.md`

**Action:**
Modify step 5 "Format output" to handle orchestrator mode output. The output should show:

1. **Header** — Same format, but counts reflect all features (root + sub-project)
2. **Orchestrator features table** — Parent rows with indented sub-project rows using `└ project-name` prefix
3. **Project Features section** — Standalone sub-project features grouped by project
4. **`--all` handling** — Completed/abandoned orchestrator features AND their sub-project rows hidden unless `--all`

Add orchestrator-specific formatting:

```markdown
**If mode = orchestrator:**

**Active features table (orchestrator features with sub-projects):**

```
| Feature | Stage | Plans | Created | Next Action |
|---------|-------|-------|---------|-------------|
| {name} | {stage} | {plans} | {created} | {next_action} |
|  └ {project} | {stage} | {plans} | | {next_action} |
|  └ {project} | {stage} | {plans} | | {next_action} |
```

- Orchestrator feature row shows system-level stage and plans
- Sub-project rows are indented with `└ {project-name}` in the Feature column
- Sub-project rows omit the Created column (inherited from parent)
- Sort sub-project rows by stage priority (same as main sort)

**If standalone sub-project features exist, add:**

```
### Project Features

**{project-name}** ({project-path})

| Feature | Stage | Plans | Created | Next Action |
|---------|-------|-------|---------|-------------|
| {name} | {stage} | {plans} | {created} | {next_action} |
```

Repeat for each project that has standalone features.

**Completed/abandoned handling with `--all`:**
- When not showing `--all`: hide completed/abandoned orchestrator features AND all their sub-project rows
- When showing `--all`: show them in a "Completed" section (same as current but include sub-project rows indented)
- Standalone completed sub-project features: hide unless `--all`, shown under their project heading

**If mode = project:**
Use existing output logic unchanged.
```

**Verify:**
Read the updated file and confirm the orchestrator output formatting exists with grouped view, standalone section, and `--all` handling.

**Done when:**
- [ ] Orchestrator features display with indented sub-project rows
- [ ] Standalone sub-project features appear in "Project Features" section grouped by project
- [ ] `--all` flag hides/shows completed features correctly in orchestrator mode
- [ ] Single-project output is unchanged

---

## Verification

After all tasks complete, verify the plan is done:

```bash
# Check the workflow file exists and has orchestrator-related content
grep -c "orchestrator" specdacular/workflows/status.md
```

**Plan is complete when:**
- [ ] All tasks marked done
- [ ] `specdacular/workflows/status.md` contains orchestrator detection logic
- [ ] `specdacular/workflows/status.md` contains sub-project gathering logic
- [ ] `specdacular/workflows/status.md` contains grouped output formatting
- [ ] Single-project mode behavior is preserved (step 3 and step 5 have `If mode = project` branches)

---

## Output

When this plan is complete:

1. Update `.specd/features/improved-status-command/STATE.md`:
   - Mark this plan as complete
   - Note any discoveries or decisions made

2. Commit changes:
   ```bash
   git add specdacular/workflows/status.md
   git commit -m "feat(status): add orchestrator mode support

   Plan 1.01 complete:
   - Detect orchestrator mode from .specd/config.json
   - Gather sub-project features for orchestrator features
   - Scan for standalone sub-project features
   - Grouped output: orchestrator features with indented sub-project rows
   - Separate Project Features section for standalone features
   - --all flag works for orchestrator mode"
   ```

3. No next plan — this is the only plan for Phase 1.

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/improved-status-command/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach

---

## Notes

This plan modifies a markdown workflow file, not code. The "verification" is reading the file and confirming the sections exist. There are no type checks or tests to run — this is a prompt/workflow definition.
