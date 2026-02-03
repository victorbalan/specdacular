---
name: specd:discuss-feature
description: Continue or deepen feature discussion - can be called multiple times
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
Continue or deepen understanding of a feature through targeted discussion. Can be called **many times** — context accumulates.

**Updates:**
- `.specd/features/{name}/CONTEXT.md` — Accumulates resolved questions
- `.specd/features/{name}/DECISIONS.md` — Accumulates decisions with dates/rationale
- `.specd/features/{name}/STATE.md` — Tracks discussion progress

**Idempotent:** Calling multiple times builds on previous discussions, doesn't reset.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/discuss-feature.md
</execution_context>

<context>
Feature name: $ARGUMENTS

**Load feature context:**
@.specd/features/{name}/FEATURE.md
@.specd/features/{name}/CONTEXT.md
@.specd/features/{name}/DECISIONS.md
@.specd/features/{name}/STATE.md

**Load codebase context (if available):**
@.specd/codebase/PATTERNS.md
@.specd/codebase/STRUCTURE.md
@.specd/codebase/MAP.md
</context>

<process>
1. **Validate** — Check feature exists, has required files
2. **Load Context** — Read FEATURE.md, CONTEXT.md, DECISIONS.md
3. **Show Current State** — "Here's what we've discussed so far..."
4. **Identify Gray Areas** — Based on feature type and existing context
5. **Let User Select** — Which areas to discuss this session
6. **Probe Each Area** — Until clear (4 questions, then check)
7. **Record Decisions** — NEW decisions to DECISIONS.md with date + rationale
8. **Update CONTEXT.md** — With newly resolved questions
9. **Present Summary** — Offer next steps
</process>

<success_criteria>
- [ ] Feature validated (exists, has required files)
- [ ] Existing context loaded and summarized
- [ ] Gray areas identified and presented
- [ ] User-selected areas discussed
- [ ] Decisions recorded with date, context, rationale
- [ ] CONTEXT.md updated with resolved questions
- [ ] User knows options: discuss more, research, or plan
</success_criteria>
