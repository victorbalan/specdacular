---
name: specd.new
description: Initialize a new task and start the first discussion
argument-hint: "[task-name]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - AskUserQuestion
---

<objective>
Initialize a task and drive the full inception flow: discuss → research → plan. Creates task structure, asks initial questions, and iterates through discussion/research until ready to produce phases.

**Creates:**
- `.specd/tasks/{name}/FEATURE.md` — Technical requirements from discussion
- `.specd/tasks/{name}/CONTEXT.md` — Discussion context (accumulates over time)
- `.specd/tasks/{name}/DECISIONS.md` — Memory file for decisions with rationale
- `.specd/tasks/{name}/CHANGELOG.md` — Implementation log
- `.specd/tasks/{name}/STATE.md` — Progress tracking
- `.specd/tasks/{name}/config.json` — Task configuration

**Full inception:** After initial discussion, offers to research, plan, discuss more, or stop. Iterates until phases are ready or user stops.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/new.md
</execution_context>

<context>
Task name: $ARGUMENTS

**Codebase context discovery:**
1. Check for `.specd/config.json` — if exists, read `codebase_docs` path
2. If no config, check for `.specd/codebase/` (default location)
3. If neither found, offer `/specd.codebase.map`

**Referenced docs (when available):**
- `MAP.md` — System structure
- `PATTERNS.md` — Code patterns
- `STRUCTURE.md` — Directory layout

**Behavioral guardrails:**
@~/.claude/specdacular/guardrails/specd-rules.txt
</context>

<process>
1. **Validate** — Check name, check if exists
2. **Codebase Context** — Look for codebase docs (offer map-codebase if missing)
3. **First Discussion** — "What are you building?"
4. **Follow the Thread** — Collaborative, not interrogative
5. **Probe Until Clear** — What creates, what integrates with, constraints
6. **Write Documents** — FEATURE.md, CONTEXT.md, DECISIONS.md, CHANGELOG.md, STATE.md, config.json
7. **Commit and Present Options**
</process>

<success_criteria>
- [ ] Task folder created at `.specd/tasks/{name}/`
- [ ] FEATURE.md captures technical requirements
- [ ] CONTEXT.md initialized with discussion context
- [ ] DECISIONS.md initialized (possibly with initial decisions)
- [ ] STATE.md tracks current position
- [ ] config.json created
- [ ] Committed to git
- [ ] User offered to continue with `/specd.continue`
</success_criteria>
