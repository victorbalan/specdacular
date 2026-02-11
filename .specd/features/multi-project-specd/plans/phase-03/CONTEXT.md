# Phase 3 Context: new-feature Orchestrator Flow

**Phase:** 3 — new-feature Orchestrator Flow
**Date:** 2026-02-11
**Status:** All gray areas resolved

---

## Resolved Questions

### 1. Orchestrator Detection & Codebase Context

**Question:** Where does orchestrator detection happen and how does the workflow load system-level docs?

**Resolution:** Merge detection into the existing `codebase_context` step — it already reads `.specd/config.json`. When `type = "orchestrator"`:
- Read system-level codebase docs (PROJECTS.md, TOPOLOGY.md, CONTRACTS.md, CONCERNS.md) instead of project-level docs
- This gives the discussion full system awareness before it starts
- If `type = "project"` or absent → existing flow unchanged

---

### 2. System-Level Discussion Probes

**Question:** What does the discussion look like in orchestrator mode?

**Resolution:** Same conversational philosophy, different probes. In orchestrator mode:
- Opening shifts to: "What system-level behavior does this feature add?"
- Probes focus on: which projects are affected, what crosses project boundaries, what contracts change
- After 4-6 exchanges, summarize with project involvement: "This touches api and ui. API handles X, UI handles Y."
- Present project routing (suggest involved projects from discussion + CONTRACTS.md) and ask user to confirm
- Discussion ends with a clear project list and per-project responsibility summary, not file-level details

---

### 3. Feature Delegation to Sub-Projects

**Question:** How do we create features in sub-projects?

**Resolution:** Skip discussion, create files directly with translated requirements:
- The system-level discussion already captured per-project responsibilities
- Running another discussion per sub-project would repeat what was just discussed
- The orchestrator writes each sub-project's FEATURE.md with project-specific requirements translated from the system-level conversation
- All standard files created (FEATURE.md, CONTEXT.md, DECISIONS.md, CHANGELOG.md, STATE.md, config.json) — generated from orchestrator context
- CONTEXT.md for each sub-project notes: "Created via orchestrator delegation from {feature-name}"

---

### 4. Orchestrator Feature State Tracking

**Question:** What does the orchestrator's feature folder look like and how does it track progress across sub-projects?

**Resolution:**
- Orchestrator feature folder gets: FEATURE.md (system view), CONTEXT.md, DECISIONS.md, CHANGELOG.md, STATE.md, config.json, and eventually DEPENDENCIES.md (created during planning)
- Orchestrator STATE.md has a "Sub-Project Features" section listing each project's feature state
- Each sub-project gets its own independent feature folder with its own STATE.md (per DEC-001)
- Orchestrator config.json includes a `projects` object mapping project names to their feature paths
- Same feature name across orchestrator and all sub-projects

---

## Key Decisions Referenced

- DEC-001: Sub-projects unaware — delegation must produce normal-looking feature files
- DEC-006: Config.json type field — `codebase_context` reads this for mode detection
- DEC-008: Loose contracts — CONTRACTS.md used for project routing suggestions

## Notes

No new decisions needed — all resolutions follow from existing decisions.
