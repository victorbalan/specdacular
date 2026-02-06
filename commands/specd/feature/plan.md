---
name: specd:feature:plan
description: Create roadmap with phase overview (no detailed plans)
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
Create a roadmap with phase overview and empty phase directories. Detailed PLAN.md files are created later per-phase with `/specd:phase:plan`.

**Creates:**
- `.specd/features/{name}/ROADMAP.md` — Phase overview with goals, deliverables, dependencies
- `.specd/features/{name}/plans/phase-{NN}/` — Empty phase directories

**Does NOT create PLAN.md files.** Those are created just-in-time with `/specd:phase:plan` before executing each phase.

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
4. **Derive Phases** — Based on dependencies (types->API->UI pattern)
5. **Write ROADMAP.md** — Phase overview with goals, deliverables, dependencies
6. **Create Phase Directories** — Empty `plans/phase-{NN}/` directories
7. **Update STATE.md** — Stage moves to "planned"
8. **Commit and Present**
</process>

<success_criteria>
- [ ] Feature validated with sufficient context
- [ ] All context loaded (feature, codebase, research)
- [ ] Phases derived from dependency analysis
- [ ] ROADMAP.md provides clear phase overview
- [ ] Empty phase directories created
- [ ] No PLAN.md files created (that's `/specd:phase:plan`)
- [ ] STATE.md updated to "planned" stage
- [ ] Committed to git
- [ ] User knows next step: `/specd:phase:prepare` or `/specd:phase:plan` for first phase
</success_criteria>
