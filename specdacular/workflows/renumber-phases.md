<purpose>
Renumber all phases to a clean integer sequence after decimal phases have been inserted.

**Key principles:**
- Always preview and confirm before renaming anything
- Rename directories highest-to-lowest to avoid collisions
- Update ALL references: directories, plan frontmatter, ROADMAP.md, STATE.md
- Remove `(INSERTED)` markers after renumbering

**Output:** Renamed phase directories, updated ROADMAP.md, STATE.md, config.json, plan frontmatter
</purpose>

<process>

<step name="validate">
Validate the feature exists and has the required structure.

1. Check feature directory exists:
```bash
[ -d ".specd/features/$feature" ] || { echo "Feature not found"; exit 1; }
```

2. Check plans directory exists:
```bash
[ -d ".specd/features/$feature/plans" ] || { echo "No plans directory"; exit 1; }
```

3. Check ROADMAP.md exists:
```bash
[ -f ".specd/features/$feature/ROADMAP.md" ] || { echo "No ROADMAP.md"; exit 1; }
```

**If feature not found:**
```
Feature '{name}' not found.

Available features:
{list .specd/features/*/}
```
</step>

<step name="collect_phases">
List all phase directories and build the renumbering mapping.

1. List all `phase-*` directories under `plans/`:
```bash
ls -d .specd/features/$feature/plans/phase-* 2>/dev/null | sort -V
```

2. Sort numerically — integers first, then decimals in order:
   - phase-01, phase-02, phase-03, phase-03.1, phase-03.2, phase-04, phase-05
   - Use version sort (`sort -V`) to get correct ordering

3. Build mapping: assign sequential integers starting from 01:
   ```
   phase-01   → phase-01 (unchanged)
   phase-02   → phase-02 (unchanged)
   phase-03   → phase-03 (unchanged)
   phase-03.1 → phase-04 (renumbered)
   phase-03.2 → phase-05 (renumbered)
   phase-04   → phase-06 (renumbered)
   phase-05   → phase-07 (renumbered)
   ```

4. Identify which directories actually need renaming (skip unchanged ones)

**If no decimal phases found:**
```
No decimal phases found — nothing to renumber.

All phases are already clean integers:
{list phases}
```
Exit workflow.
</step>

<step name="preview">
Show the user the renumbering mapping and ask for confirmation.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE RENUMBERING PREVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: {feature}

| Current | New | Status |
|---------|-----|--------|
| phase-01/ | phase-01/ | unchanged |
| phase-02/ | phase-02/ | unchanged |
| phase-03/ | phase-03/ | unchanged |
| phase-03.1/ | phase-04/ | renumbered |
| phase-04/ | phase-05/ | renumbered |

Directories to rename: {count}
Files to update: ROADMAP.md, STATE.md, config.json, plan frontmatter
```

Use AskUserQuestion:
- header: "Renumber"
- question: "Proceed with phase renumbering?"
- options:
  - "Yes, renumber" — Continue to rename_directories
  - "Cancel" — Exit workflow

**If user cancels:** Exit with "Renumbering cancelled. No changes made."
</step>

<step name="rename_directories">
Rename phase directories, processing from highest target number down to avoid collisions.

**Why highest-to-lowest?** If we rename phase-03.1 → phase-04 first, it would collide with the existing phase-04. By starting from the highest target number and working down, we avoid this:

1. Build list of renames needed, sorted by target number descending
2. For each rename (highest first):
```bash
mv ".specd/features/$feature/plans/phase-{old}" ".specd/features/$feature/plans/phase-{new}"
```

Example order:
```bash
# Process highest target first to avoid collisions
mv plans/phase-04/ plans/phase-05/    # 04 → 05 (no collision, 05 doesn't exist)
mv plans/phase-03.1/ plans/phase-04/  # 03.1 → 04 (no collision, 04 just moved)
```

3. Skip directories that don't change (e.g., phase-01 → phase-01)

4. Confirm each rename:
```
Renamed: phase-{old}/ → phase-{new}/
```
</step>

<step name="update_plan_frontmatter">
Update YAML frontmatter in every plan file under the renamed phases.

1. Find all plan files (`*.md`) in renamed phase directories:
```bash
find .specd/features/$feature/plans/ -name "*.md" -type f
```

2. For each plan file, read and update:
   - `phase:` field in YAML frontmatter — update to new integer phase number
   - `depends_on:` paths that reference renamed phases — update phase directory names
     (e.g., `phase-03.1/01-PLAN.md` → `phase-04/01-PLAN.md`)

3. Only modify files that actually contain references to renamed phases

**Example frontmatter update:**
```yaml
# Before:
phase: "03.1"
depends_on:
  - "phase-03/02-PLAN.md"

# After:
phase: "04"
depends_on:
  - "phase-03/02-PLAN.md"  # unchanged — phase-03 didn't move
```

Also scan plan files in phases that weren't renamed, in case they reference a renamed phase in their `depends_on`.
</step>

<step name="update_roadmap">
Rewrite phase headers and references in ROADMAP.md.

1. Read ROADMAP.md

2. For each phase in the mapping that changed:
   - Update phase headings: `## Phase {old}:` → `## Phase {new}:`
   - Remove `(INSERTED)` markers from renumbered phases
   - Update plan references within phase sections (e.g., "Plan 3.1.01" → "Plan 4.01")
   - Update cross-references to other phases that were renumbered

3. Preserve all other content exactly (descriptions, goals, plan details)

4. Write updated ROADMAP.md

**Example:**
```markdown
# Before:
## Phase 03.1: Architecture Update (INSERTED)

# After:
## Phase 04: Architecture Update
```
</step>

<step name="update_state">
Rewrite all phase references in STATE.md.

1. Read STATE.md

2. Update ALL phase references throughout the file:
   - **Stage Progress checkboxes:** `Phase {old}` → `Phase {new}`
   - **Plan Status table:** Phase column values
   - **Completed Plans table:** Plan paths containing phase directories
   - **Current Plan section:** If referencing a renamed phase
   - **Roadmap Evolution notes:** Update phase numbers in evolution history
   - **Session Notes:** Any phase references

3. For roadmap evolution, add a note about renumbering:
```markdown
- Phases renumbered to clean integer sequence: {mapping summary}
```

4. Write updated STATE.md
</step>

<step name="update_config">
Update config.json with the new phase count.

1. Read config.json
2. Set `phases_count` to the total number of integer phases (the final count after renumbering)
3. Write updated config.json
</step>

<step name="completion">
Present completion summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASES RENUMBERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: {feature}

**Renames:**
{For each rename:}
- phase-{old}/ → phase-{new}/

**Updated files:**
- ROADMAP.md — Phase headers and references updated
- STATE.md — All phase references updated
- config.json — phases_count = {new count}
- {N} plan files — Frontmatter updated

**Removed markers:** (INSERTED) tags cleaned up

───────────────────────────────────────────────────────

All phases now use clean integer numbering.
`/specd:phase:execute {feature}` to continue execution.
```

End workflow.
</step>

</process>

<safety>
- Always preview and confirm before any renames
- Process renames highest-to-lowest to avoid directory collisions
- Skip directories that don't change
- Update ALL references across all files before finishing
- If any rename fails, stop and report — don't leave partial state
</safety>

<success_criteria>
Renumbering is complete when:

- [ ] Feature validated with plans and ROADMAP.md
- [ ] All phase directories collected and sorted correctly
- [ ] Renumbering mapping previewed and confirmed by user
- [ ] Directories renamed without collisions (highest-to-lowest)
- [ ] Plan file frontmatter updated (phase, depends_on references)
- [ ] ROADMAP.md headers updated, `(INSERTED)` markers removed
- [ ] STATE.md phase references updated everywhere
- [ ] config.json `phases_count` set to final integer count
- [ ] Summary shown to user
</success_criteria>
