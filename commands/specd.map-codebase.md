---
name: specd.map-codebase
description: Analyze codebase with parallel agents to produce AI-optimized documentation
argument-hint: ""
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
---

<objective>
Analyze existing codebase using parallel mapper agents to produce 4 AI-optimized documents.

Each mapper agent explores a focus area and **writes documents directly** to `.specd/codebase/`. The orchestrator only receives confirmations, keeping context usage minimal.

Output: .specd/codebase/ folder with 4 documents designed for Claude consumption.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/map-codebase.md
</execution_context>

<context>
**These documents are FOR CLAUDE, not humans.**

Each document answers a question Claude can't get from reading code:

| Document | Question it answers |
|----------|---------------------|
| MAP.md | "Where is X? What functions exist?" |
| PATTERNS.md | "How do I write code that fits here?" |
| STRUCTURE.md | "Where do I put new code?" |
| CONCERNS.md | "What will bite me?" |

**Principle:** Don't document what Claude can grep. Document tribal knowledge, gotchas, and patterns.
</context>

<when_to_use>
**Use map-codebase for:**
- First time working with a codebase
- Before planning a new feature
- After significant refactoring
- Onboarding Claude to an unfamiliar repo

**Skip map-codebase for:**
- Trivial codebases (<10 files)
- When you already have recent codebase docs
</when_to_use>

<process>
1. Check if .specd/codebase/ already exists (offer to refresh or skip)
2. Create .specd/codebase/ directory
3. Spawn 4 parallel specd-codebase-mapper agents:
   - Agent 1: map focus → writes MAP.md
   - Agent 2: patterns focus → writes PATTERNS.md
   - Agent 3: structure focus → writes STRUCTURE.md
   - Agent 4: concerns focus → writes CONCERNS.md
4. Wait for agents to complete, collect confirmations
5. Verify all 4 documents exist
6. Commit codebase map
7. Report completion
</process>

<success_criteria>
- [ ] .specd/codebase/ directory created
- [ ] All 4 documents written by mapper agents
- [ ] Documents contain real code examples (not placeholders)
- [ ] Parallel agents completed without errors
</success_criteria>
