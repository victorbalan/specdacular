---
name: specd.docs.review
description: Review and audit codebase docs for accuracy, staleness, and coverage gaps
argument-hint: ""
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Edit
  - Agent
  - AskUserQuestion
  - WebSearch
  - WebFetch
---

<objective>
Audit existing topic docs for accuracy, staleness, and coverage gaps. Optionally research best practices for the detected stack. Updates frontmatter review dates after approval.

Output: Review findings with actionable suggestions, updated docs and review dates.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/docs-review.md
</execution_context>

<context>
**Review approach:**

Each doc has YAML frontmatter with `last_reviewed` and `generated_by` fields. The review workflow:

1. Reads frontmatter dates to detect stale docs
2. Spot-checks code references in docs against current codebase
3. Detects coverage gaps (technologies in code not covered by docs)
4. Optionally researches best practices for improvement suggestions
5. Presents findings and lets user choose what to update

**Staleness detection:**
- Compare `last_reviewed` against today and recent git history
- Flag docs where significant code changes happened since last review
- Check if referenced file paths, function signatures, and patterns still exist

**Research agents (optional):**
- Only used during review, never during generation (DEC-008)
- Investigate current best practices for detected technologies
- Suggest improvements, not mandates
</context>

<when_to_use>
**Use /specd.docs.review for:**
- After significant code changes (refactoring, new features)
- Periodically (monthly or quarterly)
- When docs feel out of date
- When wanting best-practice improvement suggestions

**Skip /specd.docs.review for:**
- Right after running /specd.docs (docs are fresh)
- Trivial changes that don't affect patterns
</when_to_use>

<process>
1. Find all specd-generated docs (scan for frontmatter)
2. Assess freshness (compare review dates against git history)
3. Check accuracy (spot-check code references)
4. Detect gaps (technologies not covered by docs)
5. Optionally research best practices
6. Present findings with per-doc status
7. Apply user-selected updates and update review dates
</process>

<success_criteria>
- [ ] All specd-generated docs found and assessed
- [ ] Stale docs flagged with days since review
- [ ] Drifted docs identified with specific inaccuracies
- [ ] Coverage gaps detected (new technologies, obsolete docs)
- [ ] Research suggestions provided (if user opted in)
- [ ] Review dates updated on approved docs
- [ ] CLAUDE.md routing table updated if docs added/removed
</success_criteria>
