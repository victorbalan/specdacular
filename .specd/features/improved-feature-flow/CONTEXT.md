# Context: improved-feature-flow

**Last Updated:** 2026-02-13
**Sessions:** 2

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

### What are the toolbox menu descriptions?

**Question:** Exact wording for each option in the toolbox AskUserQuestion menu.

**Resolution:** Confirmed menu structure:

| Option | Label | Description |
|--------|-------|-------------|
| Discuss | "Discuss" | "Explore open questions and gray areas about the feature" |
| Research | "Research" | "Spawn agents to research implementation patterns, libraries, and pitfalls" |
| Plan | "Plan" | "Create phased implementation plans from feature context" |
| Review | "Review" | "Review executed work — report issues, generate fix plans" |
| Insert | "Insert phase" | "Add a new phase to the roadmap (decimal numbering)" |

**Details:**
- Discuss, Research, and Plan each ask a follow-up: "Whole feature or a specific phase?"
- If specific phase, user selects which phase

**Related Decisions:** DEC-006, DEC-007

---

### How does phase insertion numbering work?

**Question:** When inserting a phase between existing phases, how to number it?

**Resolution:** Decimal numbering, one level only. Insert after phase 6 → 6.1, again → 6.2, again → 6.3. No deeper nesting (no 6.1.1).

**Details:**
- Removes the need for renumbering entirely
- Existing phase references stay valid
- No `phase:renumber` needed at all
- Edge case (insert between 6 and 6.1) not supported — just use next decimal

**Related Decisions:** DEC-006

---

### How does the review workflow work?

**Question:** What does the review show and how does user feedback become fix plans?

**Resolution:** After phase execution completes:
1. Show list of files created/modified
2. Show brief paragraph on how/what to test
3. Ask "Is this OK, or do you want to revise?"
4. If revise: user provides feedback (bugs, things they don't like)
5. Feedback becomes fix plans using decimal numbering (e.g., 6.1, 6.2)
6. Execute fix plans, then ask again

**Details:**
- Review never auto-fixes code
- User examines code themselves
- Test guidance helps user know what to verify
- Fix plans use same format as regular plans

**Related Decisions:** DEC-003, DEC-008

---

### How should phase transitions work in the state machine?

**Question:** When does a phase advance to the next? Currently it auto-advances after all plans execute, which causes `continue` in a fresh context to skip review.

**Resolution:** Phase status tracks three states: `executing` → `executed` → `completed`. After all plans in a phase run, status becomes `executed` (not `completed`). `continue` sees `executed` and triggers the review checkpoint. Only after user says "yes, move on" does it become `completed` and the next phase activates.

**Details:**
- Discovered when phase 7 wasn't reviewed but state showed phase 8
- `continue` in a fresh context must always land on the right step
- The user approval gate is what makes `continue` reliable across context resets

**Related Decisions:** DEC-009

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
| 2026-02-13 | Toolbox menu, decimal numbering, review flow, scope questions | 3 more decisions, all gray areas resolved |
| 2026-02-13 | Phase state machine, transition gating | DEC-009, critical state tracking fix |

---

## Gray Areas Remaining

_(All resolved)_

---

## Quick Reference

- **Feature:** `.specd/features/improved-feature-flow/FEATURE.md`
- **Decisions:** `.specd/features/improved-feature-flow/DECISIONS.md`
- **Research:** `.specd/features/improved-feature-flow/RESEARCH.md` (if exists)
