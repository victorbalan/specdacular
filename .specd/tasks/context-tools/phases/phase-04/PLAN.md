---
task: context-tools
phase: 4
depends_on: [2]
creates:
  - specdacular/templates/context-review-diff.md
modifies:
  - specdacular/workflows/context-review.md
---

# Phase 4: Context Review Improvements

## Objective

Improve the context-review workflow: show every section to the user with an up-to-date assessment (no auto-skipping), use a dedicated `specd-codebase-mapper` agent for re-mapping (matching the map-codebase process per file type), and present changes using a consistent template.

## Context

**Reference these files:**
- `@specdacular/workflows/context-review.md` — Current review workflow to modify
- `@specdacular/workflows/map-codebase.md` — Map-codebase spawns 4 agents with file-type-specific prompts (map, patterns, structure, concerns). The re-map action must use the SAME agent type and focus-specific prompt for the file being reviewed.
- `@agents/specd-codebase-mapper.md` — The mapper agent definition

**Relevant Decisions:**
- DEC-002: USER_MODIFIED tagging with mapper awareness (still applies)
- DEC-005: Walk both ## and ### levels (still applies)
- DEC-007: Semantic diff summaries over raw line diffs (still applies — template formalizes this)
- DEC-009: SUPERSEDED — Was "inline Task prompt, general-purpose agent". Now changing to use `specd-codebase-mapper` agent with file-type-specific focus, matching map-codebase process.

**Key design change:**
The current workflow uses `subagent_type: "general-purpose"` for re-mapping. This phase changes it to `subagent_type: "specd-codebase-mapper"` with the correct focus parameter (map/patterns/structure/concerns) based on which file is being reviewed. This ensures the re-mapping agent uses the same analysis logic as the original mapper.

**File-to-focus mapping:**
- `MAP.md` → focus: `map`
- `PATTERNS.md` → focus: `patterns`
- `STRUCTURE.md` → focus: `structure`
- `CONCERNS.md` → focus: `concerns`

---

## Tasks

### Task 1: Create context-review-diff template

**Files:** `specdacular/templates/context-review-diff.md`

**Action:**
Create a template file that standardizes how section review results and re-mapping diffs are presented to the user. This template is used by the context-review workflow for consistent display.

The template should define two display formats:

**1. Section review display** (shown for every section):
```
───────────────────────────────────────────────────────
{## or ###} {Section Title}  [{current}/{total}]
{If USER_MODIFIED: "User modified: YYYY-MM-DD"}
───────────────────────────────────────────────────────

**Assessment:** {✅ Up to date | ⚠️ Potentially stale | 🔄 Changed since last review}

{section content, formatted for readability}
```

The assessment is Claude's quick analysis based on:
- Whether file paths mentioned in the section still exist
- Whether the section content appears to match current codebase state
- How old the section is relative to recent git activity

**2. Re-map diff display** (shown after re-mapping agent returns):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RE-MAP RESULTS: {section title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Note: AI regeneration may rephrase content even when
facts are unchanged. Focus on factual differences.

───── CURRENT ─────────────────────────────────────────

{current section content}

───── RE-MAPPED ───────────────────────────────────────

{agent's returned content}

───── KEY DIFFERENCES ─────────────────────────────────

- {factual difference 1}
- {factual difference 2}
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Verify:**
```bash
[ -f "specdacular/templates/context-review-diff.md" ] && echo "exists"
```

**Done when:**
- [ ] Template file exists with both display formats documented
- [ ] Template includes placeholder variables for dynamic content
- [ ] Template references the assessment criteria

---

### Task 2: Update context-review workflow — show every section with assessment

**Files:** `specdacular/workflows/context-review.md`

**Action:**
Modify the `walk_sections` step to remove the auto-skip logic and instead show every section to the user with an up-to-date assessment.

**Changes to the `walk_sections` step:**

1. **Before displaying each section**, perform a quick assessment:
   - Check if file paths mentioned in the section content still exist (use `ls` or `test -f`)
   - Check git log for recent changes to files mentioned in the section
   - Classify as:
     - ✅ **Up to date** — Referenced files exist, no significant recent changes
     - ⚠️ **Potentially stale** — Referenced files changed recently or paths don't exist
     - 🔄 **Changed since last review** — Section's referenced files modified since `Last Reviewed` date

2. **Display format**: Use the section review display format from the template (`specdacular/templates/context-review-diff.md`). Show the assessment prominently before the content.

3. **Always show every section** — never skip. The user decides what to do with each one.

4. **Keep "Confirm all remaining"** escape hatch but rename to "Approve all remaining" for clarity.

5. **Keep all existing options** (Confirm, Edit, Remove, Re-map, Approve all remaining) unchanged in behavior.

**Verify:**
```bash
grep -c "Assessment" specdacular/workflows/context-review.md
```

**Done when:**
- [ ] Every section is shown to the user (no auto-skipping)
- [ ] Each section includes an assessment (✅, ⚠️, or 🔄)
- [ ] Assessment checks file paths and git activity
- [ ] Display uses the template format
- [ ] "Confirm all remaining" renamed to "Approve all remaining"

---

### Task 3: Update context-review workflow — use specd-codebase-mapper agent for re-mapping

**Files:** `specdacular/workflows/context-review.md`

**Action:**
Replace the current re-mapping approach (general-purpose agent with inline prompt) with a dedicated `specd-codebase-mapper` agent call that matches the map-codebase process.

**Changes to the "Re-map" action in `walk_sections`:**

1. **Determine the focus** based on which file is being reviewed:
   - `MAP.md` → `focus: map`
   - `PATTERNS.md` → `focus: patterns`
   - `STRUCTURE.md` → `focus: structure`
   - `CONCERNS.md` → `focus: concerns`

   Store this mapping in the `select_file` step so it's available throughout.

2. **Replace the Task tool call** from:
   ```
   subagent_type: "general-purpose"
   model: "sonnet"
   ```
   To:
   ```
   subagent_type: "specd-codebase-mapper"
   model: "sonnet"
   ```

3. **Update the agent prompt** to match the map-codebase pattern. The prompt must:
   - Specify the focus (map/patterns/structure/concerns)
   - Scope to a SINGLE SECTION (not the whole file)
   - Tell the agent to explore the codebase for that section's topic
   - Tell the agent to return ONLY the section content (not write to file)
   - Include USER_MODIFIED context if present
   - Include other section headings as scope constraints

   **Prompt structure:**
   ```
   Focus: {focus}

   You are re-mapping a SINGLE SECTION of .specd/codebase/{file}.

   Section heading: {exact heading}
   Heading level: {## or ###}

   Current content of this section:
   {current section content}

   {If USER_MODIFIED:}
   This section was manually modified by the user on {date}.
   Preserve user additions that are still accurate.

   Other sections in this file (do NOT cover these topics):
   {list other section headings}

   Explore the codebase to verify and update what this section documents.
   Check that all file paths still exist. Add new items discovered. Remove items that no longer exist.

   Return ONLY the replacement section content as raw markdown.
   Do NOT include the heading line.
   Do NOT write to any file.
   ```

4. **Present diff using the template** from `specdacular/templates/context-review-diff.md`. Use the re-map diff display format.

5. **Keep the same user options** after diff: Accept new, Keep current, Edit manually.

**Verify:**
```bash
grep "specd-codebase-mapper" specdacular/workflows/context-review.md
```

**Done when:**
- [ ] Re-map uses `subagent_type: "specd-codebase-mapper"` instead of `"general-purpose"`
- [ ] Focus is determined from the file being reviewed (map/patterns/structure/concerns)
- [ ] Agent prompt matches map-codebase style with section scoping
- [ ] Diff display uses the template format
- [ ] USER_MODIFIED context still passed to agent
- [ ] Agent output is used directly (spawned as separate agent, output consumed)

---

## Verification

After all tasks complete:

```bash
# Template exists
[ -f "specdacular/templates/context-review-diff.md" ] && echo "template: OK"

# Workflow uses mapper agent
grep -q "specd-codebase-mapper" specdacular/workflows/context-review.md && echo "agent: OK"

# Workflow has assessment logic
grep -q "Assessment" specdacular/workflows/context-review.md && echo "assessment: OK"

# Template referenced in workflow
grep -q "context-review-diff" specdacular/workflows/context-review.md && echo "template-ref: OK"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] Template file created with both display formats
- [ ] Workflow shows every section with assessment
- [ ] Re-mapping uses specd-codebase-mapper agent with correct focus
- [ ] Diff display is consistent via template

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/context-tools/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
