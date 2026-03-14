---
name: specd.docs
description: Generate topic-based docs and CLAUDE.md routing table from codebase analysis
argument-hint: ""
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Edit
  - Task
  - Agent
  - AskUserQuestion
---

<objective>
Generate AI-optimized documentation using a context-engineering approach.

Spawns 4 parallel mapper agents for raw codebase analysis, then merges their outputs into topic-specific docs in `docs/`. Writes CLAUDE.md as a pure routing table — no inline rules.

Output: `docs/` folder with topic-specific docs + `CLAUDE.md` routing table.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/docs.md
</execution_context>

<context>
**Context engineering approach:**

CLAUDE.md is a thin routing table — "Working on X? Read docs/Y.md". All knowledge lives in `docs/`:

| File | Purpose |
|------|---------|
| `docs/rules.md` | Always-true rules (imports, naming, conventions) |
| `docs/{topic}.md` | Topic-specific patterns and guidance |
| `CLAUDE.md` | Router only — points to the right doc for the context |

**Key principles:**
- Topics are dynamic — detected from what the codebase actually uses
- Every doc has frontmatter (`last_reviewed`, `generated_by`) for staleness tracking
- `rules.md` is always generated — contains project-wide rules
- CLAUDE.md merge is non-destructive — preserves existing user content
- No external research during generation — docs reflect actual code patterns
</context>

<when_to_use>
**Use /specd.docs for:**
- First time working with a codebase
- Before planning a new feature
- After significant refactoring
- When existing docs are stale or missing

**Skip /specd.docs for:**
- Trivial codebases (<10 files)
- When you have recently generated docs (use `/specd.docs.review` instead)
</when_to_use>

<process>
1. Discover docs location (check CLAUDE.md for existing path, default to `docs/`)
2. Check for existing specd-generated docs (offer refresh or skip)
3. Scan for existing project documentation (README, ARCHITECTURE, etc.)
4. Spawn 4 parallel mapper agents to temp directory
5. Merge agent outputs into topic clusters (dynamic topic detection)
6. Propose doc list to user for approval
7. Generate topic docs + `rules.md` with YAML frontmatter
8. Write/update CLAUDE.md routing table (non-destructive merge)
9. Clean up temp files
</process>

<success_criteria>
- [ ] Topic-specific docs generated in `docs/` (or user-configured location)
- [ ] `docs/rules.md` always generated with project-wide rules
- [ ] All docs have YAML frontmatter (`last_reviewed`, `generated_by`)
- [ ] CLAUDE.md routing table written (new or merged into existing)
- [ ] CLAUDE.md has zero inline rules — purely a router
- [ ] Topics dynamically determined from codebase analysis
- [ ] User approved doc list before generation
- [ ] Existing CLAUDE.md content preserved during merge
</success_criteria>
