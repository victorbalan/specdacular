---
name: specd:new-feature
description: Initialize a new feature with deep questioning, requirements, and roadmap
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
Initialize a feature folder with structured planning documents through a conversational workflow.

Creates `.specd/features/{feature-name}/` with:
- FEATURE.md - What this feature does, core value, constraints
- REQUIREMENTS.md - Scoped requirements with REQ-IDs (v1/v2/out-of-scope)
- ROADMAP.md - Phases with success criteria and requirement mapping
- STATE.md - Project memory, current position, decisions
- config.json - Mode (yolo/interactive), depth (quick/standard/comprehensive)
</objective>

<execution_context>
@~/.claude/specdacular/workflows/new-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS

**Codebase context discovery:**
1. Check for `.specd/config.json` - if exists, read `codebase_docs` path
2. If no config, check for `.specd/codebase/` (default location)
3. If neither found, ask user for custom location or suggest `/specd:map-codebase`

**Referenced docs (when available):**
- `ARCHITECTURE.md` - Understand existing patterns for integration
- `CONVENTIONS.md` - Ensure requirements follow coding standards
- `STRUCTURE.md` - Know where new code should go
</context>

<when_to_use>
**Use new-feature for:**
- Starting a new feature or enhancement
- When you need structured planning documents
- Before implementing non-trivial functionality
- When multiple people will work on a feature

**Skip new-feature for:**
- Bug fixes (just fix them)
- Trivial changes (<1 hour of work)
- Exploratory spikes
</when_to_use>

<process>
1. Setup - Get feature name, check if exists
2. Codebase Context - Look for codebase docs
3. Complexity Assessment - Ask light/moderate/complicated
4. Deep Questioning - Adaptive depth based on complexity
5. Write FEATURE.md - Capture context from conversation
6. Configuration - Ask mode/depth preferences
7. Define Requirements - Scope v1/v2/out-of-scope
8. Create Roadmap - Derive phases, map requirements
9. Initialize State - Create STATE.md
10. Completion - Summary and next steps
</process>

<success_criteria>
- [ ] Feature folder created at `.specd/features/{name}/`
- [ ] All 5 files created (FEATURE.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json)
- [ ] Requirements have REQ-IDs in format `{FEAT}-{CAT}-{NUM}`
- [ ] Roadmap phases map to requirements
- [ ] Commits made at key milestones
</success_criteria>
