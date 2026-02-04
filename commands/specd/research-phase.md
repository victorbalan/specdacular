---
name: specd:research-phase
description: Research implementation patterns for a phase
argument-hint: "[feature-name] [phase-number]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Research implementation patterns for a specific phase before executing it. Spawns parallel research agents focused on the phase's scope.

**Output:** `.specd/features/{name}/plans/phase-{NN}/RESEARCH.md` with phase-specific guidance.

**Why phase-level research?** Instead of researching the entire feature upfront, investigate each phase's specifics right before executing it. Smaller scope, more focused, fresher context.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/research-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (expects: feature-name phase-number)

**Load feature context:**
@.specd/features/{name}/FEATURE.md
@.specd/features/{name}/DECISIONS.md
@.specd/features/{name}/ROADMAP.md
@.specd/features/{name}/RESEARCH.md (if exists, feature-level research)

**Load phase context:**
@.specd/features/{name}/plans/phase-{NN}/CONTEXT.md (if exists)
@.specd/features/{name}/plans/phase-{NN}/*.md (plan files)

**Load codebase context:**
@.specd/codebase/PATTERNS.md
@.specd/codebase/STRUCTURE.md
@.specd/codebase/MAP.md
</context>

<process>
1. **Validate** — Feature and phase exist
2. **Load Context** — Phase goals, files to create/modify, previous phase research
3. **Spawn Research Agents** — 3 parallel agents for phase-specific research
4. **Synthesize** — Combine into `plans/phase-{NN}/RESEARCH.md`
5. **Record Decisions** — Technology choices to DECISIONS.md
6. **Commit**
</process>

<success_criteria>
- [ ] Feature and phase validated
- [ ] Phase context loaded (goals, files, type)
- [ ] Research agents spawned (codebase, patterns, pitfalls)
- [ ] Results synthesized into phase RESEARCH.md
- [ ] Decisions recorded in DECISIONS.md
- [ ] Committed to git
</success_criteria>
