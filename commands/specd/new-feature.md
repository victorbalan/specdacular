---
name: specd:new-feature
description: Initialize a new feature with technical questioning and start the first discussion
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - AskUserQuestion
---

<objective>
Initialize a feature folder and start the first discussion. Creates structure, asks initial questions about what's being built, and writes technical requirements.

**Creates:**
- `.specd/features/{name}/FEATURE.md` — Technical requirements from discussion
- `.specd/features/{name}/CONTEXT.md` — Discussion context (accumulates over time)
- `.specd/features/{name}/DECISIONS.md` — Memory file for decisions with rationale
- `.specd/features/{name}/STATE.md` — Progress tracking
- `.specd/features/{name}/config.json` — Feature configuration

**This is the entry point.** After this, user controls the loop with discuss/research/plan.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/new-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS

**Codebase context discovery:**
1. Check for `.specd/config.json` — if exists, read `codebase_docs` path
2. If no config, check for `.specd/codebase/` (default location)
3. If neither found, offer `/specd:map-codebase`

**Referenced docs (when available):**
- `ARCHITECTURE.md` or `MAP.md` — System structure
- `CONVENTIONS.md` or `PATTERNS.md` — Code patterns
- `STRUCTURE.md` — Directory layout
</context>

<process>
1. **Validate** — Check name, check if exists
2. **Codebase Context** — Look for codebase docs (offer map-codebase if missing)
3. **First Discussion** — "What are you building?"
4. **Follow the Thread** — Collaborative, not interrogative
5. **Probe Until Clear** — What creates, what integrates with, constraints
6. **Write FEATURE.md** — Technical requirements
7. **Write CONTEXT.md** — Initial discussion state
8. **Initialize DECISIONS.md** — With any decisions made so far
9. **Initialize STATE.md** — Feature created, ready for more discussion
10. **Commit and Present Options**
</process>

<success_criteria>
- [ ] Feature folder created at `.specd/features/{name}/`
- [ ] FEATURE.md captures technical requirements
- [ ] CONTEXT.md initialized with discussion context
- [ ] DECISIONS.md initialized (possibly with initial decisions)
- [ ] STATE.md tracks current position
- [ ] config.json created
- [ ] Committed to git
- [ ] User knows next options: discuss-feature, research-feature, or continue talking
</success_criteria>
