---
name: specd:plan-feature
description: Create executable task plans for implementing a feature
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Create executable task plans that an agent can implement without asking clarifying questions.

**Creates:**
- `.specd/features/{name}/ROADMAP.md` — Phase overview with dependencies
- `.specd/features/{name}/plans/phase-{NN}/{NN}-PLAN.md` — Executable task plans

**Each PLAN.md is a prompt** for an implementing agent with:
- Files to create/modify with specific paths
- Code patterns to follow (from codebase)
- Verification commands
- Clear completion criteria

**Prerequisite:** Feature should have sufficient discussion context (FEATURE.md, CONTEXT.md, DECISIONS.md). Research (RESEARCH.md) recommended but optional.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/plan-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS

**Load ALL feature context:**
@.specd/features/{name}/FEATURE.md — Technical requirements
@.specd/features/{name}/CONTEXT.md — Resolved gray areas
@.specd/features/{name}/DECISIONS.md — Implementation decisions
@.specd/features/{name}/RESEARCH.md — Research findings (if exists)

**Load codebase context:**
@.specd/codebase/PATTERNS.md — Code patterns to follow
@.specd/codebase/STRUCTURE.md — Where files go
@.specd/codebase/MAP.md — System overview
</context>

<process>
1. **Validate** — Check feature exists, has required context
2. **Load Context** — Read ALL feature and codebase docs
3. **Assess Readiness** — Check if enough context to plan
4. **Derive Phases** — Based on dependencies (types→API→UI pattern)
5. **Break Into Tasks** — 2-3 tasks per plan, sized for agent execution
6. **Write PLAN Files** — As prompts for implementing agent
7. **Write ROADMAP.md** — Phase overview
8. **Commit and Present**
</process>

<success_criteria>
- [ ] Feature validated with sufficient context
- [ ] All context loaded (feature, codebase, research)
- [ ] Phases derived from dependency analysis
- [ ] Tasks are specific (files, actions, verification)
- [ ] PLAN.md files are self-contained prompts
- [ ] ROADMAP.md provides clear overview
- [ ] Committed to git
- [ ] User knows how to execute plans
</success_criteria>
