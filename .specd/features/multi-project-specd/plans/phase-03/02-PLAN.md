---
feature: multi-project-specd
phase: 3
plan: 02
depends_on:
  - phase-03/01-PLAN.md
creates: []
modifies:
  - specdacular/workflows/new-feature.md
---

# Plan 02: Orchestrator Feature Creation & Sub-Project Delegation

## Objective

Add orchestrator-level feature folder creation, sub-project feature delegation, and multi-project commit/completion — all as new steps in the new-feature workflow that follow the `route_projects` step from Plan 01.

## Context

**Reference these files:**
- `@specdacular/workflows/new-feature.md` — Workflow being modified (already has orchestrator detection + discussion from Plan 01)
- `@.specd/features/multi-project-specd/plans/phase-03/CONTEXT.md` — Phase discussion resolutions
- `@specdacular/templates/features/FEATURE.md` — Feature template (for sub-project delegation)
- `@specdacular/templates/features/CONTEXT.md` — Context template
- `@specdacular/templates/features/DECISIONS.md` — Decisions template
- `@specdacular/templates/features/STATE.md` — State template
- `@specdacular/templates/features/CHANGELOG.md` — Changelog template

**Relevant Decisions:**
- DEC-001: Sub-projects are unaware — delegation must produce normal-looking feature files
- DEC-006: Config.json type field
- DEC-008: Loose contracts in CONTRACTS.md, specific contracts per-feature in FEATURE.md

**From Phase Discussion:**
- Skip discussion for sub-projects — create files directly with translated requirements
- Orchestrator FEATURE.md has system view; sub-project FEATURE.md has project-specific requirements
- Same feature name across orchestrator and all sub-projects
- Orchestrator config.json includes `projects` mapping to feature paths
- Orchestrator STATE.md has "Sub-Project Features" section

---

## Tasks

### Task 1: Add create_orchestrator_feature step

**Files:** `specdacular/workflows/new-feature.md`

**Action:**
Add `create_orchestrator_feature` step after `route_projects`. This creates the orchestrator-level feature folder.

```markdown
<step name="create_orchestrator_feature">
Create orchestrator-level feature folder with system-view documents.

**Create feature directory:**
```bash
mkdir -p .specd/features/{feature-name}
```

**Write FEATURE.md (system view):**
Use template at `~/.claude/specdacular/templates/features/FEATURE.md` but adapt for system level:

- **What This Is:** System-level description from orchestrator discussion
- **Must Create:** List the involved projects and what each creates (high-level)
- **Must Integrate With:** Cross-project interactions, existing contracts affected
- **Constraints:** System-level constraints (cross-project coordination, contract alignment)
- **Success Criteria:** System-level observable behaviors (not project-level details)
- **Out of Scope:** Explicit exclusions from the discussion
- **Initial Context:**
  - User Need: from discussion
  - Projects Involved: list with responsibilities
  - Cross-Project Contracts: what needs to align between projects

**Write CONTEXT.md:**
Use template at `~/.claude/specdacular/templates/features/CONTEXT.md`

Fill in:
- **Discussion Summary:** System-level discussion summary
- **Resolved Questions:** Questions answered during orchestrator discussion
- **Deferred Questions:** Things to resolve during planning
- **Gray Areas Remaining:** Open areas

**Write DECISIONS.md:**
Use template at `~/.claude/specdacular/templates/features/DECISIONS.md`
Record any decisions made during the system-level discussion.

**Write CHANGELOG.md:**
Use template at `~/.claude/specdacular/templates/features/CHANGELOG.md`
Initialize empty.

**Write STATE.md:**
Use template at `~/.claude/specdacular/templates/features/STATE.md`

Initialize with:
- Stage: discussion
- Initial discussion complete: yes
- Add "Sub-Project Features" section:

```markdown
## Sub-Project Features

| Project | Path | Feature Path | Status |
|---------|------|--------------|--------|
| {project-name} | {project-path} | {project-path}/.specd/features/{feature-name}/ | initialized |
```

**Write config.json:**
```json
{
  "feature_name": "{name}",
  "created": "{date}",
  "stage": "discussion",
  "discussion_sessions": 1,
  "decisions_count": {N},
  "orchestrator": true,
  "projects": [
    {"name": "{project-name}", "path": "{project-path}", "responsibility": "{responsibility}"}
  ]
}
```

Continue to delegate_to_projects.
</step>
```

**Verify:**
```bash
grep -c "create_orchestrator_feature" specdacular/workflows/new-feature.md
```
Should return at least 2.

**Done when:**
- [ ] `create_orchestrator_feature` step exists
- [ ] Creates FEATURE.md with system-level view
- [ ] Creates CONTEXT.md, DECISIONS.md, CHANGELOG.md
- [ ] STATE.md includes Sub-Project Features table
- [ ] config.json includes `orchestrator: true` and `projects` array

---

### Task 2: Add delegate_to_projects step

**Files:** `specdacular/workflows/new-feature.md`

**Action:**
Add `delegate_to_projects` step. For each involved project, create a complete feature folder with project-specific requirements — no discussion, just translated requirements from the orchestrator conversation.

```markdown
<step name="delegate_to_projects">
Create feature folders in each involved sub-project with translated requirements.

For each project in the routing data:

**Create feature directory:**
```bash
mkdir -p {project-path}/.specd/features/{feature-name}
```

**Write FEATURE.md (project-specific):**
Use template at `~/.claude/specdacular/templates/features/FEATURE.md`

Translate the system-level requirements into project-specific requirements:
- **What This Is:** What this project specifically does for the feature (not the system-level description)
- **Must Create:** Specific files/components this project needs to create
- **Must Integrate With:** Existing code in THIS project + cross-project interfaces it must implement
- **Constraints:** Project-specific constraints + any contract requirements from the orchestrator
- **Success Criteria:** Project-specific observable behaviors
- **Out of Scope:** What this project does NOT handle (other projects' responsibilities)
- **Initial Context:**
  - User Need: project-specific slice of the system need
  - Integration Points: what this project exposes or consumes from other projects

**IMPORTANT (DEC-001):** The sub-project FEATURE.md must read like a normal, self-contained feature requirement. No references to "orchestrator," "multi-project," or other projects by name. Cross-project requirements should be phrased as external interface requirements:
- BAD: "API project must expose /auth/login for the UI project"
- GOOD: "Must expose /auth/login endpoint that returns JWT tokens"

**Write CONTEXT.md:**
Use template. Include:
- Discussion Summary: "Requirements defined as part of system-level {feature-name} feature planning."
- Resolved Questions: Any project-specific questions resolved during orchestrator discussion

**Write DECISIONS.md:**
Use template. Include any project-specific decisions from orchestrator discussion.

**Write CHANGELOG.md:**
Use template. Initialize empty.

**Write STATE.md:**
Use template. Initialize with stage: discussion, initial discussion complete: yes.

**Write config.json:**
```json
{
  "feature_name": "{name}",
  "created": "{date}",
  "stage": "discussion",
  "discussion_sessions": 0,
  "decisions_count": {N}
}
```

Note: `discussion_sessions: 0` because no per-project discussion happened — requirements came from orchestrator delegation.

After all projects processed, verify:
```bash
for project in {project-paths}; do
  echo "Checking $project..."
  ls "$project/.specd/features/{feature-name}/"
done
```

Continue to orchestrator_feature_commit.
</step>
```

**Verify:**
```bash
grep -c "delegate_to_projects" specdacular/workflows/new-feature.md
```
Should return at least 2.

**Done when:**
- [ ] `delegate_to_projects` step exists
- [ ] Creates complete feature folder per sub-project
- [ ] FEATURE.md has project-specific requirements (translated, not system-level)
- [ ] Sub-project files read as normal self-contained features (DEC-001)
- [ ] Verification checks all projects have feature files

---

### Task 3: Add orchestrator commit and completion steps

**Files:** `specdacular/workflows/new-feature.md`

**Action:**
Add commit, completion, and continuation offer steps for orchestrator mode.

**Step: orchestrator_feature_commit**

```markdown
<step name="orchestrator_feature_commit">
Commit orchestrator and all sub-project feature files.

```bash
# Add orchestrator feature files
git add .specd/features/{feature-name}/

# Add per-project feature files
{For each project:}
git add {project-path}/.specd/features/{feature-name}/

git commit -m "docs({feature-name}): initialize multi-project feature

Orchestrator:
- FEATURE.md: System-level requirements
- CONTEXT.md: Cross-project discussion
- DECISIONS.md: {N} decisions
- STATE.md: Sub-project tracking

Projects:
{For each project:}
- {project-name}: Project-specific requirements

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Continue to orchestrator_feature_completion.
</step>
```

**Step: orchestrator_feature_completion**

```markdown
<step name="orchestrator_feature_completion">
Present multi-project feature creation summary.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MULTI-PROJECT FEATURE INITIALIZED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}

## Orchestrator (.specd/features/{feature-name}/)

- FEATURE.md — System-level requirements
- CONTEXT.md — Cross-project discussion
- DECISIONS.md — {N} decisions recorded
- STATE.md — Sub-project tracking

## Projects

{For each project:}
**{project-name}** ({project-path}/.specd/features/{feature-name}/)
- FEATURE.md — {brief responsibility summary}
- Responsibility: {one-liner}

## Summary

{2-3 sentence system-level summary}
```

Continue to orchestrator_continuation_offer.
</step>
```

**Step: orchestrator_continuation_offer**

```markdown
<step name="orchestrator_continuation_offer">
Offer to continue or stop (same pattern as existing continuation_offer).

**If gray areas remain in orchestrator CONTEXT.md:**

Use AskUserQuestion:
- header: "Continue?"
- question: "Want to keep discussing the open areas, or come back later?"
- options:
  - "Keep discussing" — Dive into the gray areas now
  - "Stop for now" — Come back with /specd:feature:next {feature-name}

**If Keep discussing:**
Execute the discuss-feature workflow logic:
@~/.claude/specdacular/workflows/discuss-feature.md

After discussion completes, return to this step.

**If no gray areas remain:**

Use AskUserQuestion:
- header: "Continue?"
- question: "Discussion looks solid. Want to keep going or come back later?"
- options:
  - "Continue" — Move to the next step (research or planning)
  - "Stop for now" — Come back with /specd:feature:next {feature-name}

**If Continue:**
Hand off to next-feature workflow:
@~/.claude/specdacular/workflows/next-feature.md

**If Stop for now:**
```
───────────────────────────────────────────────────────

Progress saved. Pick up where you left off anytime:

/specd:feature:next {feature-name}
```

End workflow.
</step>
```

Also update the `<success_criteria>` section to include multi-project criteria.

**Verify:**
```bash
for step in orchestrator_feature_commit orchestrator_feature_completion orchestrator_continuation_offer; do
  grep -q "$step" specdacular/workflows/new-feature.md && echo "✓ $step" || echo "✗ $step MISSING"
done
```
All should return ✓.

**Done when:**
- [ ] `orchestrator_feature_commit` commits orchestrator + all sub-project files
- [ ] `orchestrator_feature_completion` shows multi-project summary
- [ ] `orchestrator_continuation_offer` follows existing continuation pattern
- [ ] Success criteria updated for multi-project mode

---

## Verification

After all tasks complete:

```bash
# Verify all new steps exist
for step in orchestrator_discussion route_projects create_orchestrator_feature delegate_to_projects orchestrator_feature_commit orchestrator_feature_completion orchestrator_continuation_offer; do
  grep -q "$step" specdacular/workflows/new-feature.md && echo "✓ $step" || echo "✗ $step MISSING"
done

# Verify existing steps still exist (no regression)
for step in validate codebase_context first_discussion write_feature write_context initialize_decisions initialize_changelog initialize_state commit completion continuation_offer; do
  grep -q "$step" specdacular/workflows/new-feature.md && echo "✓ $step (existing)" || echo "✗ $step MISSING (REGRESSION)"
done
```

**Plan is complete when:**
- [ ] All 7 new steps exist in the workflow
- [ ] All 11 existing steps still exist (no regression)
- [ ] Orchestrator flow: detect → discuss → route → create orchestrator feature → delegate → commit → complete
- [ ] Single-project flow unchanged

---

## Output

When this plan is complete:

1. Update `.specd/features/multi-project-specd/STATE.md`:
   - Mark both Phase 3 plans as complete
   - Mark Phase 3 as complete

2. Update `.specd/features/multi-project-specd/config.json`:
   - Increment completed phases to 3

3. Commit changes:
   ```bash
   git add specdacular/workflows/new-feature.md
   git commit -m "feat(multi-project-specd): add orchestrator feature creation and delegation to new-feature

   Plan phase-03/02 complete:
   - create_orchestrator_feature: system-level feature folder
   - delegate_to_projects: project-specific requirements (DEC-001 compliant)
   - orchestrator_feature_commit: multi-project commit
   - orchestrator_feature_completion: cross-project summary"
   ```

4. Phase 3 complete. Next: Phase 4 preparation.

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/multi-project-specd/CHANGELOG.md`.

---

## Notes

{Space for the implementing agent to record discoveries during implementation.}
