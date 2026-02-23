# Phase 5 Context: Execution & Scheduling

**Phase:** 5 — Execution & Scheduling
**Date:** 2026-02-11
**Status:** All gray areas resolved

---

## Resolved Questions

### 1. Execute-plan Sub-Project Context Switching

**Question:** How does the orchestrator "run" execute-plan in a sub-project's context?

**Resolution:** No actual directory change needed — just prefix file paths with the project path:
1. Orchestrator identifies the target project and plan path from its state
2. Reads the plan from the sub-project's `.specd/`
3. Executes tasks against files in `{project-path}/`
4. Updates the sub-project's STATE.md (not orchestrator's)
5. After completion, returns to orchestrator level for contract review
- The existing execute-plan logic works unchanged, just with different file paths

---

### 2. Contract Validation After Phase Completion

**Question:** What does contract validation actually look like?

**Resolution:** Lightweight manual review by the agent, not automated tooling:
1. Read orchestrator-level FEATURE.md (system-level expectations)
2. Read what was implemented (sub-project CHANGELOG.md + files created/modified)
3. Check: does the output match what other projects' phases expect?
4. If deviations found, present impact analysis: "API changed endpoint shape. UI phase 2 depends on this."
5. User decides: accept deviation (update orchestrator notes) or trigger replan
6. Track replan cascade depth — after 2 cascading replans, force pause (DEC-010)

---

### 3. Next-feature Orchestrator State Aggregation

**Question:** How does next-feature read cross-project state?

**Resolution:** Add orchestrator detection to `read_state`:
1. Read orchestrator STATE.md for high-level progress
2. Read DEPENDENCIES.md for the cross-project dependency graph
3. For each project: read that project's feature STATE.md + config.json
4. Build combined state view: which phases are complete, in-progress, blocked, or ready
5. Pass combined state to scheduling steps

---

### 4. Cross-Project Scheduling & Selection

**Question:** How does the orchestrator present unblocked work?

**Resolution:** New `orchestrator_schedule` step:
1. Compute unblocked work from dependency graph
2. Show progress dashboard with all projects
3. One project unblocked → auto-suggest
4. Multiple projects unblocked → AskUserQuestion with options
5. Accept optional project argument: `/specd.feature:next feature-name project-name`
6. After selection, delegate to execute-plan for that project
7. Document one-session-at-a-time constraint (DEC-011)

---

## Additional Clarification: Direct Sub-Project Access

Users can always work directly in a sub-project without going through the orchestrator. Since sub-projects are fully independent (DEC-001):
- Navigate to a sub-project's directory
- Run `/specd.feature:next feature-name` directly
- Works as normal single-project flow — the sub-project's `.specd/` has all standard files
- Useful when the user knows a feature only affects one project

The orchestrator adds coordination but doesn't gatekeep. Sub-project work done directly is visible to the orchestrator on next state read.

---

## Key Decisions Referenced

- DEC-001: Sub-projects unaware — direct access always works
- DEC-004: Orchestrator as contract guardian — review after phase execution
- DEC-010: Replan cascade depth limit of 2
- DEC-011: One active orchestrator session at a time

## Notes

No new decisions needed.
