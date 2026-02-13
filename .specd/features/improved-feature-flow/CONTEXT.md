# Context: improved-feature-flow

**Last Updated:** 2026-02-13
**Sessions:** 1

## Discussion Summary

User identified command sprawl as the core problem — ~15 commands are too many to remember. The solution is to consolidate around 3 user-facing feature commands (`new`, `continue`, `toolbox`) and keep utility commands (`map-codebase`, `status`, `help`, `update`). Phase commands are removed entirely as standalone entries. The toolbox command wraps discuss, research, plan, review, and insert behind a single menu. Review behavior changes from auto-fix to user-guided conversation.

---

## Resolved Questions

### How should advanced operations be accessed?

**Question:** Should discuss, research, plan, review, insert be separate commands or grouped?

**Resolution:** Grouped under a single `toolbox` command that presents an AskUserQuestion menu. User picks the operation, toolbox loads the workflow.

**Details:**
- Toolbox menu options: discuss, research, plan, review, insert
- Each option loads the corresponding workflow from `specdacular/workflows/`
- No standalone command files for these operations
- Workflows themselves are unchanged

**Related Decisions:** DEC-001

---

### What happens to phase commands?

**Question:** Should phase:insert, phase:renumber, phase:review, etc. remain as commands?

**Resolution:** Remove all `phase:*` standalone commands. Insert moves to toolbox. Renumber happens automatically when inserting. Review becomes the new user-guided review-feature workflow. Research/prepare/plan get absorbed into the `continue` flow.

**Details:**
- `phase:insert` → toolbox "insert" option
- `phase:renumber` → automatic when inserting
- `phase:review` → toolbox "review" option (new user-guided workflow)
- `phase:research`, `phase:prepare`, `phase:plan` → absorbed into `continue` flow
- `phase:execute` → driven by `continue`

**Related Decisions:** DEC-002

---

### How should review work?

**Question:** Should review auto-fix code issues or be user-guided?

**Resolution:** User-guided. Review shows a summary of what was implemented, the user examines the code themselves and provides feedback ("this has a bug", "I don't like this approach"), and the review generates new fix plans from that feedback.

**Details:**
- After phase execution, `continue` asks "Is this OK?"
- If user says no, enters review mode
- Review presents what was done, user drives the conversation
- User feedback gets turned into fix plans
- This is already partially implemented — needs tightening

**Related Decisions:** DEC-003

---

### What should `next` be renamed to?

**Question:** Is `next` the right name for the flow driver command?

**Resolution:** Rename to `continue`. More natural language — "continue where you left off."

**Related Decisions:** DEC-004

---

## Deferred Questions

### Should toolbox show different options based on feature stage?

**Reason:** Could be useful (e.g., don't show "insert" before planning), but adds complexity
**Default for now:** Show all options, let the workflow validate if the operation makes sense at the current stage
**Revisit when:** After first implementation, based on user experience

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-13 | Command consolidation, naming, review behavior, autocomplete | 5 decisions, feature scoped |

---

## Gray Areas Remaining

- [ ] Toolbox menu descriptions — Exact wording for each option's description in the AskUserQuestion menu
- [ ] Review workflow details — Exact structure of the review summary and how user feedback becomes fix plans
- [ ] Insert workflow — How auto-renumber works when inserting between existing phases

---

## Quick Reference

- **Feature:** `.specd/features/improved-feature-flow/FEATURE.md`
- **Decisions:** `.specd/features/improved-feature-flow/DECISIONS.md`
- **Research:** `.specd/features/improved-feature-flow/RESEARCH.md` (if exists)
