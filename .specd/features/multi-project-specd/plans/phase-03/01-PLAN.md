---
feature: multi-project-specd
phase: 3
plan: 01
depends_on: []
creates: []
modifies:
  - specdacular/workflows/new-feature.md
---

# Plan 01: Orchestrator Detection & System-Level Discussion

## Objective

Add orchestrator mode detection to `codebase_context`, a system-level discussion flow, and project routing — all as modifications and new steps in the existing new-feature workflow.

## Context

**Reference these files:**
- `@specdacular/workflows/new-feature.md` — Workflow being modified
- `@.specd/features/multi-project-specd/plans/phase-03/CONTEXT.md` — Phase discussion resolutions
- `@.specd/features/multi-project-specd/DECISIONS.md` — Active decisions
- `@specdacular/templates/orchestrator/CONTRACTS.md` — For understanding contract structure

**Relevant Decisions:**
- DEC-001: Sub-projects are unaware of multi-project setup
- DEC-006: Config.json type field for mode detection
- DEC-008: Loose contracts — CONTRACTS.md used for project routing suggestions

**From Phase Discussion:**
- Orchestrator detection merges into existing `codebase_context` step
- System-level probes: which projects, what crosses boundaries, contract implications
- Discussion ends with project list + per-project responsibility summary
- Project routing: suggest from discussion + CONTRACTS.md, user confirms

---

## Tasks

### Task 1: Add orchestrator detection to codebase_context step

**Files:** `specdacular/workflows/new-feature.md`

**Action:**
Modify the existing `codebase_context` step to detect orchestrator mode and load system-level docs when applicable.

After the existing config.json check, add orchestrator detection:

```markdown
**Check for orchestrator mode (DEC-006):**

Read `.specd/config.json` and check `"type"` field.

**If type = "orchestrator":**
Set mode = "orchestrator".

Read system-level codebase docs:
- `.specd/codebase/PROJECTS.md` — Project registry
- `.specd/codebase/TOPOLOGY.md` — Communication patterns
- `.specd/codebase/CONTRACTS.md` — Shared interfaces
- `.specd/codebase/CONCERNS.md` — System-level concerns

Read project list from config.json `"projects"` array.

```
Orchestrator mode detected. {N} projects registered.
I'll use system-level docs to understand cross-project architecture.
```

Continue to orchestrator_discussion.

**If type = "project" or absent:**
Set mode = "project".
Continue with existing flow (first_discussion).
```

The existing flow for single-project mode stays completely unchanged — the orchestrator branch is additive only.

**Verify:**
```bash
grep -c "orchestrator" specdacular/workflows/new-feature.md
```
Should return at least 3.

**Done when:**
- [ ] `codebase_context` detects orchestrator mode from config.json
- [ ] System-level codebase docs loaded in orchestrator mode
- [ ] Single-project flow unchanged (branches to existing `first_discussion`)
- [ ] Orchestrator flow branches to `orchestrator_discussion`

---

### Task 2: Add orchestrator_discussion step

**Files:** `specdacular/workflows/new-feature.md`

**Action:**
Add a new `orchestrator_discussion` step after `codebase_context`. This replaces `first_discussion` in orchestrator mode.

```markdown
<step name="orchestrator_discussion">
System-level feature discussion for orchestrator mode.

**Opening:**
```
Let's talk about what you're building across the system.

What's the {feature-name} feature? What system-level behavior does it add?
```

Wait for response.

**Follow the thread:**
Based on their response, ask follow-up questions that:
- Identify which projects are affected ("Which parts of the system does this touch?")
- Explore cross-project behavior ("How would data flow between projects for this?")
- Identify contract implications ("Does this change how projects communicate?")
- Understand project responsibilities ("What does each project need to do?")

**System-level probes (follow the conversation, don't march through):**
- "Which projects does this involve?"
- "What crosses project boundaries here?"
- "Does this change any existing communication patterns?"
- "What's each project's responsibility for this feature?"
- "Are there shared data structures or APIs that need to align?"
- "What's the simplest cross-project version that would work?"

**Use system-level context from codebase docs:**
- Reference PROJECTS.md for project responsibilities
- Reference TOPOLOGY.md for existing communication patterns
- Reference CONTRACTS.md for existing shared interfaces
- Reference CONCERNS.md for system-level gotchas that might apply

**Check understanding:**
After 4-6 exchanges, summarize with project involvement:
```
So if I understand correctly:
- This feature [system-level behavior]
- It involves these projects:
  - {project-1}: [responsibility]
  - {project-2}: [responsibility]
- Cross-project interaction: [how projects coordinate]
- Key constraint: [constraint]

Does that capture it, or should we dig into anything more?
```

**When to move on:**
- User confirms understanding is correct
- You have a clear project list with per-project responsibilities
- Cross-project behavior is understood

Continue to route_projects.
</step>
```

**Verify:**
```bash
grep -c "orchestrator_discussion" specdacular/workflows/new-feature.md
```
Should return at least 2.

**Done when:**
- [ ] `orchestrator_discussion` step exists
- [ ] System-level probes focus on projects, boundaries, contracts
- [ ] References codebase docs (PROJECTS, TOPOLOGY, CONTRACTS, CONCERNS)
- [ ] Summary includes project involvement list
- [ ] Follows same conversational philosophy as existing discussion

---

### Task 3: Add route_projects step

**Files:** `specdacular/workflows/new-feature.md`

**Action:**
Add a `route_projects` step after `orchestrator_discussion`. This formalizes the project selection.

```markdown
<step name="route_projects">
Confirm which projects are involved in this feature.

**Build project suggestion:**
From the discussion, identify involved projects. Cross-reference with:
- CONTRACTS.md — which projects have existing relationships relevant to this feature
- PROJECTS.md — project responsibilities that align with feature needs

**Present suggestion:**
```
Based on our discussion, these projects are involved:

{For each project:}
- **{project-name}** ({project-path}) — {responsibility for this feature}

{If any projects from config NOT included:}
Not involved: {project-name} — {brief reason}
```

Use AskUserQuestion:
- header: "Projects"
- question: "Are these the right projects for this feature?"
- options:
  - "Yes, looks right" — Continue with these projects
  - "I need to adjust" — Add or remove projects

**If "I need to adjust":**
Ask user which projects to add or remove. Update the list accordingly.

**Store project routing:**
Build routing data:
```json
{
  "projects": [
    {"name": "{project-name}", "path": "{project-path}", "responsibility": "{what this project does for the feature}"}
  ]
}
```

Continue to create_orchestrator_feature (Plan 02).
</step>
```

**Verify:**
```bash
grep -c "route_projects" specdacular/workflows/new-feature.md
```
Should return at least 2.

**Done when:**
- [ ] `route_projects` step exists
- [ ] Suggests projects from discussion + CONTRACTS.md
- [ ] AskUserQuestion for confirmation
- [ ] User can adjust project selection
- [ ] Stores project routing data for delegation

---

## Verification

After all tasks complete:

```bash
# Verify new steps exist
for step in orchestrator_discussion route_projects; do
  grep -q "$step" specdacular/workflows/new-feature.md && echo "✓ $step" || echo "✗ $step MISSING"
done

# Verify existing steps still exist (no regression)
for step in validate codebase_context first_discussion write_feature write_context initialize_decisions initialize_changelog initialize_state commit completion continuation_offer; do
  grep -q "$step" specdacular/workflows/new-feature.md && echo "✓ $step (existing)" || echo "✗ $step MISSING (REGRESSION)"
done

# Verify orchestrator detection in codebase_context
grep -q "orchestrator" specdacular/workflows/new-feature.md && echo "✓ orchestrator detection" || echo "✗ orchestrator detection MISSING"
```

**Plan is complete when:**
- [ ] Orchestrator detection added to `codebase_context`
- [ ] `orchestrator_discussion` step with system-level probes
- [ ] `route_projects` step with project suggestion + confirmation
- [ ] All 11 existing steps preserved (no regression)

---

## Output

When this plan is complete:

1. Update `.specd/features/multi-project-specd/STATE.md`:
   - Add this plan to completed plans table

2. Commit changes:
   ```bash
   git add specdacular/workflows/new-feature.md
   git commit -m "feat(multi-project-specd): add orchestrator detection and discussion to new-feature

   Plan phase-03/01 complete:
   - codebase_context: orchestrator mode detection from config.json
   - orchestrator_discussion: system-level probes with codebase doc references
   - route_projects: project suggestion from discussion + CONTRACTS.md"
   ```

3. Continue to Plan 02 (feature creation and delegation).

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/multi-project-specd/CHANGELOG.md`.

---

## Notes

{Space for the implementing agent to record discoveries during implementation.}
