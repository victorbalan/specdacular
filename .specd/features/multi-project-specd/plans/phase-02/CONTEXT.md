# Phase 2 Context: map-codebase Orchestrator Flow

**Feature:** multi-project-specd
**Phase Type:** Integration/Workflow
**Discussed:** 2026-02-11

## Phase Overview

Modify map-codebase workflow to detect multi-project setups, register projects, and produce orchestrator-level codebase docs (PROJECTS.md, TOPOLOGY.md, CONTRACTS.md, CONCERNS.md) in addition to per-project docs. Also introduces project-level `.specd/config.json` with version tracking for legacy detection.

## Resolved Questions

### Detection insertion point

**Question:** Where in the existing workflow does multi-project detection go?

**Resolution:** `detect_mode` is the very first step, before `check_existing`. Single-project continues the existing flow unchanged. Multi-project branches to its own flow that re-uses per-project steps.

**Details:**
- Flow: `detect_mode` → single-project (existing) OR multi-project (new branch)
- Multi-project branch: `register_projects` → per-project mapping → orchestrator mapping → commit
- The multi-project branch re-uses existing per-project steps (check_existing_docs, create_structure, spawn_agents) scoped to each project's directory

---

### Sub-project mapper scaling

**Question:** 4 agents per project means 12+ parallel agents for multi-project. Serialize or parallelize?

**Resolution:** All parallel — spawn all agents for all projects at once. This is a one-time operation (per DEC-007), so resource usage is acceptable.

**Details:**
- 3 projects × 4 agents = 12 parallel agents — within acceptable limits
- specd-codebase-mapper agents are designed for parallel execution
- If someone has 5+ projects, a cap can be added later (not v1)
- Each agent writes directly to its project's `.specd/codebase/` directory

---

### Orchestrator mapper design

**Question:** One agent or four for the orchestrator-level docs (PROJECTS, TOPOLOGY, CONTRACTS, CONCERNS)?

**Resolution:** One orchestrator mapper agent that reads all sub-project maps and writes all four orchestrator docs. Orchestrator docs are synthesis/summary, not deep analysis.

**Details:**
- PROJECTS → TOPOLOGY → CONTRACTS → CONCERNS have natural information flow
- One agent has full context to cross-reference across all sub-project findings
- The orchestrator also scans codebases directly for system-level artifacts (docker-compose, cross-project imports, shared configs, deployment topology)
- Agent type: `specd-codebase-mapper` with a custom prompt for orchestrator focus

---

### Project registration UX

**Question:** How does the user register projects during the multi-project setup?

**Resolution:** Smart suggestion with user confirmation. Claude scans immediate subdirectories for common project markers (package.json, go.mod, Cargo.toml, etc.), suggests found projects, user confirms/adjusts/adds descriptions.

**Details:**
- Scan for markers: `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `pom.xml`, `build.gradle`, `Makefile`, `Gemfile`
- Present found projects with directory names as default names
- User confirms, removes false positives, adds missing projects
- For each project: name (defaulted from directory), path (automatic), description (user provides one-liner)
- Combines DEC-005 (manual registration) with helpful auto-suggestion

---

### Legacy setup detection and version tracking

**Question:** How do existing users (with `.specd/` from before multi-project support) get prompted to re-map?

**Resolution:** map-codebase always creates `.specd/config.json` with `"type"` and `"specd_version"` fields at both orchestrator and project level. Legacy detection: no `.specd/config.json` = legacy. Outdated detection: `specd_version` < current = outdated. Both trigger a re-map prompt.

**Details:**
- Project config: `{"type": "project", "specd_version": 1}`
- Orchestrator config: `{"type": "orchestrator", "specd_version": 1, "projects": [...]}`
- Legacy detection at map-codebase entry: `.specd/` exists but no `.specd/config.json`
- Version detection: `specd_version` field exists but < current version
- Prompt: "Your codebase map was created with an older version. Re-mapping recommended — this will also ask about multi-project support."
- User can accept (re-map) or skip

**Related Decisions:** DEC-012

---

## Gray Areas Remaining

None — all resolved.

## Implications for Plans

- map-codebase.md needs 5 new steps: `detect_mode`, `register_projects`, `create_orchestrator_structure`, `spawn_per_project_agents`, `spawn_orchestrator_agent`
- Existing single-project flow gets one addition: writing `.specd/config.json` with `{"type": "project", "specd_version": 1}`
- `check_existing` step needs enhancement to detect legacy setups (no config.json)
- Project registration uses AskUserQuestion with auto-suggested projects from directory scan
- All per-project agents spawn in parallel (one batch), then orchestrator agent runs after
