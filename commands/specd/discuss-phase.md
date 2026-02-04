---
name: specd:discuss-phase
description: Discuss a specific phase before execution
argument-hint: "[feature-name] [phase-number]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Discuss a specific phase before executing it. Enables just-in-time clarification focused on the phase's scope rather than the entire feature.

**Updates:**
- `.specd/features/{name}/plans/phase-{NN}/CONTEXT.md` — Phase-specific discussion resolutions
- `.specd/features/{name}/DECISIONS.md` — Accumulates decisions with dates/rationale

**Why phase-level discussion?** Instead of researching/discussing the entire feature upfront, dive deeper into each phase's specifics right before executing it. Smaller context, more focused.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/discuss-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (expects: feature-name phase-number)

**Load feature context:**
@.specd/features/{name}/FEATURE.md
@.specd/features/{name}/CONTEXT.md
@.specd/features/{name}/DECISIONS.md
@.specd/features/{name}/ROADMAP.md

**Load phase context:**
@.specd/features/{name}/plans/phase-{NN}/*.md (plan files)

**Load codebase context (if available):**
@.specd/codebase/PATTERNS.md
@.specd/codebase/STRUCTURE.md
@.specd/codebase/MAP.md
</context>

<process>
1. **Validate** — Feature exists, phase exists in ROADMAP.md
2. **Load Context** — Phase details from ROADMAP.md, plans in phase, feature DECISIONS.md
3. **Identify Gray Areas** — Phase-type-specific concerns
4. **Probe Gray Areas** — 4 questions per area, then move on
5. **Record** — Save to `plans/phase-{NN}/CONTEXT.md`, update DECISIONS.md
6. **Commit**
</process>

<success_criteria>
- [ ] Feature and phase validated
- [ ] Phase context loaded (plans, goals, files to create/modify)
- [ ] Phase-type-specific gray areas identified
- [ ] User-selected areas discussed
- [ ] Decisions recorded with date, context, rationale
- [ ] Phase CONTEXT.md created/updated with resolved questions
- [ ] Committed to git
</success_criteria>
