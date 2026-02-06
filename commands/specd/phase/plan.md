---
name: specd:phase:plan
description: Create detailed PLAN.md files for one phase
argument-hint: "[feature-name] [phase-number]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Create detailed, executable PLAN.md files for a single phase. Each plan is a prompt for an implementing agent.

**Creates:**
- `.specd/features/{name}/plans/phase-{NN}/{NN}-PLAN.md` — Executable task plans

**Each PLAN.md is a prompt** for an implementing agent with:
- Files to create/modify with specific paths
- Code patterns to follow (from codebase)
- Verification commands
- Clear completion criteria

**Prerequisite:** Phase should exist in ROADMAP.md. Phase preparation (`/specd:phase:prepare`) recommended but optional.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/plan-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (expects: feature-name phase-number)

**Load feature context:**
@.specd/features/{name}/FEATURE.md — Technical requirements
@.specd/features/{name}/CONTEXT.md — Resolved gray areas
@.specd/features/{name}/DECISIONS.md — Implementation decisions
@.specd/features/{name}/RESEARCH.md — Research findings (if exists)
@.specd/features/{name}/ROADMAP.md — Phase overview

**Load phase context:**
@.specd/features/{name}/plans/phase-{NN}/CONTEXT.md (if exists, from phase:prepare)
@.specd/features/{name}/plans/phase-{NN}/RESEARCH.md (if exists, from phase:research)

**Load codebase context:**
@.specd/codebase/PATTERNS.md — Code patterns to follow
@.specd/codebase/STRUCTURE.md — Where files go
@.specd/codebase/MAP.md — System overview
</context>

<process>
1. **Validate** — Feature exists, phase exists, phase not already executed
2. **Load Context** — Read ALL feature, phase, and codebase docs
3. **Check Existing Plans** — If plans exist, show them and confirm replace
4. **Break Into Tasks** — 2-3 tasks per plan, sized for agent execution
5. **Write PLAN Files** — As prompts for implementing agent
6. **Update ROADMAP** — Mark this phase as planned
7. **Update STATE.md** — Record planning for this phase
8. **Commit and Present** — Points to `/specd:phase:execute`
</process>

<success_criteria>
- [ ] Feature and phase validated
- [ ] Phase not already executed
- [ ] All context loaded (feature, phase, codebase)
- [ ] Tasks are specific (files, actions, verification)
- [ ] PLAN.md files are self-contained prompts
- [ ] ROADMAP.md updated for this phase
- [ ] Committed to git
- [ ] User knows next step: `/specd:phase:execute`
</success_criteria>
