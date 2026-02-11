---
feature: multi-project-specd
phase: 2
plan: 01
depends_on: []
creates: []
modifies:
  - specdacular/workflows/map-codebase.md
---

# Plan 01: Add Mode Detection, Legacy Handling, and Project Config

## Objective

Add `detect_mode` as the first step in map-codebase, enhance `check_existing` with legacy detection, and add project-level `.specd/config.json` creation to the single-project flow.

## Context

**Reference these files:**
- `@specdacular/workflows/map-codebase.md` — Current workflow to modify
- `@.specd/features/multi-project-specd/plans/phase-02/CONTEXT.md` — Phase discussion resolutions
- `@specdacular/templates/orchestrator/config.json` — Orchestrator config template

**Relevant Decisions:**
- DEC-006: Orchestrator mode detected via config.json type field
- DEC-012: Project-level config.json with specd_version at both orchestrator and project level

**From Phase Discussion:**
- `detect_mode` is the very first step, before `check_existing`
- Legacy: `.specd/` exists but no `.specd/config.json` → prompt to re-map
- Single-project flow gets `.specd/config.json` with `{"type": "project", "specd_version": 1}`

---

## Tasks

### Task 1: Add detect_mode step as first step

**Files:** `specdacular/workflows/map-codebase.md`

**Action:**
Insert a new `detect_mode` step BEFORE the existing `check_existing` step. This step asks the user whether they have a multi-project or single-project setup.

Insert after the `</philosophy>` closing tag and before `<step name="check_existing">`:

```markdown
<step name="detect_mode">
Determine if this is a single-project or multi-project setup.

Use AskUserQuestion:
- header: "Setup Mode"
- question: "Is this a multi-project setup (monorepo or multiple related projects)?"
- options:
  - "Single project" — One codebase, one .specd/ (most common)
  - "Multi-project" — Multiple projects that coordinate (monorepo, multi-repo)

**If Single project:**
Set mode = "project".
Continue to check_existing.

**If Multi-project:**
Set mode = "orchestrator".
Continue to check_existing.
</step>
```

Update the `check_existing` step to reference `detect_mode` at the start:
- After `check_existing` resolves (refresh or new), branch based on mode:
  - If mode = "project": continue to `check_existing_docs` (existing flow)
  - If mode = "orchestrator": continue to `register_projects` (new step in Plan 02)

**Verify:**
```bash
grep -c "detect_mode" specdacular/workflows/map-codebase.md
```
Should return at least 2 (step definition + reference).

**Done when:**
- [ ] `detect_mode` step exists before `check_existing`
- [ ] AskUserQuestion with single/multi-project options
- [ ] Mode branches flow correctly after `check_existing`

---

### Task 2: Add legacy detection to check_existing step

**Files:** `specdacular/workflows/map-codebase.md`

**Action:**
Enhance the existing `check_existing` step to detect legacy setups (`.specd/` exists but no `.specd/config.json`).

Add a new check at the beginning of `check_existing`:

```markdown
**First, check for legacy setup:**

```bash
# Check if .specd/ exists but has no config.json (legacy)
if [ -d ".specd" ] && [ ! -f ".specd/config.json" ]; then
  echo "legacy_setup"
fi
```

**If legacy_setup detected:**

```
Your codebase map was created with an older version of Specdacular.
Re-mapping is recommended — this will also ask about multi-project support.
```

Use AskUserQuestion:
- header: "Legacy Setup"
- question: "Re-map your codebase with the latest Specdacular?"
- options:
  - "Yes, re-map" — Re-run mapping with multi-project detection (recommended)
  - "Skip for now" — Keep existing map, continue without re-mapping

**If "Yes, re-map":** Continue with `detect_mode` flow (refresh existing).
**If "Skip for now":** Exit workflow.
```

Also add version check for existing config:

```markdown
**If .specd/config.json exists, check version:**

```bash
cat .specd/config.json 2>/dev/null
```

If `specd_version` is less than current version (1), offer to re-map with same legacy flow.
```

**Verify:**
```bash
grep -c "legacy" specdacular/workflows/map-codebase.md
```
Should return at least 2.

**Done when:**
- [ ] Legacy detection check exists at top of `check_existing`
- [ ] User prompted to re-map if legacy detected
- [ ] Version comparison check exists for existing configs

---

### Task 3: Add project-level config.json creation to single-project flow

**Files:** `specdacular/workflows/map-codebase.md`

**Action:**
Add `.specd/config.json` creation to the `create_structure` step so that single-project mode also gets a project config with version tracking.

In the `create_structure` step, after `mkdir -p .specd/codebase`, add:

```markdown
**Create project config (if mode = "project"):**

Write `.specd/config.json`:
```json
{
  "type": "project",
  "specd_version": 1,
  "created": "{YYYY-MM-DD}"
}
```

This enables future version detection and mode detection for all workflows.
```

Also update the `commit_codebase_map` step to include config.json:

```bash
git add .specd/codebase/*.md .specd/config.json
```

**Verify:**
```bash
grep "config.json" specdacular/workflows/map-codebase.md | wc -l
```
Should return at least 3 (creation, git add, and detection references).

**Done when:**
- [ ] `create_structure` step writes `.specd/config.json` for single-project mode
- [ ] Config contains `"type": "project"` and `"specd_version": 1`
- [ ] `commit_codebase_map` step includes config.json in git add

---

## Verification

After all tasks complete:

```bash
# Verify all new content exists in the workflow
grep "detect_mode" specdacular/workflows/map-codebase.md && echo "✓ detect_mode"
grep "legacy" specdacular/workflows/map-codebase.md && echo "✓ legacy detection"
grep "specd_version" specdacular/workflows/map-codebase.md && echo "✓ version tracking"
grep '"type": "project"' specdacular/workflows/map-codebase.md && echo "✓ project config"
```

**Plan is complete when:**
- [ ] `detect_mode` step is the first step in the workflow
- [ ] Legacy detection handles `.specd/` without config.json
- [ ] Single-project flow creates `.specd/config.json` with type and version
- [ ] Commit step includes config.json
- [ ] Existing single-project flow is unchanged except for config.json addition

---

## Output

When this plan is complete:

1. Update `.specd/features/multi-project-specd/STATE.md`:
   - Mark this plan as complete

2. Commit changes:
   ```bash
   git add specdacular/workflows/map-codebase.md
   git commit -m "feat(multi-project-specd): add mode detection and version tracking to map-codebase

   Plan phase-02/01 complete:
   - detect_mode step added as first step
   - Legacy setup detection (no config.json)
   - Project-level config.json with type and specd_version
   - Single-project flow enhanced, not changed"
   ```

3. Next plan: `phase-02/02-PLAN.md`

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/multi-project-specd/CHANGELOG.md`.

---

## Notes

{Space for the implementing agent to record discoveries during implementation.}
