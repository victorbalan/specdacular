---
name: specd:phase:prepare
description: Discuss gray areas and optionally research patterns for a phase
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
Prepare a phase for execution by discussing gray areas and optionally researching implementation patterns. Combines discussion and research into a single flow.

**Discussion always happens.** Research is offered as an optional step at the end.

**Updates:**
- `.specd/features/{name}/plans/phase-{NN}/CONTEXT.md` — Phase-specific discussion resolutions
- `.specd/features/{name}/DECISIONS.md` — Accumulates decisions with dates/rationale
- `.specd/features/{name}/plans/phase-{NN}/RESEARCH.md` — Phase research (if opted in)

**Why merged?** Discussing a phase often reveals what needs researching. Single command, natural flow.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/prepare-phase.md
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
3. **Show Phase State** — Present phase overview and existing context
4. **Identify Gray Areas** — Phase-type-specific concerns
5. **Probe Gray Areas** — 4 questions per area, then move on
6. **Record Discussion** — Save to phase CONTEXT.md, update DECISIONS.md
7. **Offer Research** — "Would you like to research implementation patterns?"
8. If yes: **Spawn Research Agents** — 3 parallel agents for phase-specific research
9. If yes: **Synthesize Research** — Combine into phase RESEARCH.md
10. If yes: **Record Research Decisions** — Technology choices to DECISIONS.md
11. **Commit and Complete** — Points to `/specd:phase:plan` or `/specd:phase:execute`
</process>

<success_criteria>
- [ ] Feature and phase validated
- [ ] Phase context loaded (plans, goals, files to create/modify)
- [ ] Phase-type-specific gray areas identified
- [ ] User-selected areas discussed
- [ ] Decisions recorded with date, context, rationale
- [ ] Phase CONTEXT.md created/updated with resolved questions
- [ ] Research completed (if user opted in)
- [ ] Committed to git
- [ ] User knows next steps: `/specd:phase:plan` or `/specd:phase:execute`
</success_criteria>
