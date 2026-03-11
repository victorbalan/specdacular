# Context: flow-changes

**Last Updated:** 2026-03-11
**Sessions:** 2

## Discussion Summary

Reworking specdacular's developer flow across four areas:

1. **Active task tracking** — `.specd/state.json` (committed) stores `{"current_task": "task-name"}`. Committed so it travels with branches. Merge conflicts accepted as temporary tradeoff.

2. **Command vocabulary** — Consolidated to: `/specd.new` (inception: discuss + research + phases), `/specd.research` (ad-hoc), `/specd.plan` (phase planning), `/specd.execute` (phase implementation). Plus `/specd.context` as read-only loader.

3. **Context + guardrails** — `/specd.context` is read-only: loads task state and injects behavioral rules. Steering (direction changes) is handled as a guardrail behavior — Claude detects intent and prompts to update specs/decisions/roadmap.

4. **RALPH loop** — `npx specdacular ralph` spawns fresh Claude instances per step. Injects `/specd.context` at each step start. Details TBD (research needed).

---

## Resolved Questions

### What goes in state file and how is it tracked?

**Question:** Should it be gitignored or committed? What content?

**Resolution:** Committed as `.specd/state.json` with `{"current_task": "task-name"}`. Gitignored breaks across branches. Branch-name inference too rigid. Committed means it travels with the branch. Merge conflicts accepted as temporary tradeoff.

**Related Decisions:** DEC-001

### What happens to the existing pipeline?

**Question:** Do we remove `/specd.continue` or keep it?

**Resolution:** Keep it as a renamed command (`/specd.auto` or `/specd.brain`) for backward compatibility. RALPH loop becomes the primary execution model.

**Related Decisions:** DEC-002

### What's the command vocabulary?

**Question:** How many commands, and what do they do?

**Resolution:** `/specd.new` (discuss + research + phases in one inception flow), `/specd.research` (ad-hoc research), `/specd.plan` (phase plan), `/specd.execute` (implement phase). Plus `/specd.context` (read-only loader + guardrails).

**Related Decisions:** DEC-005

### Is /specd.context read-only or does it allow steering?

**Question:** Should the context command let users change direction?

**Resolution:** Read-only. Steering is a behavioral guardrail: when Claude detects a direction change, it prompts to update specs/decisions/roadmap. This works in any context where guardrails are loaded, not just via a specific command.

**Related Decisions:** DEC-003, DEC-004

---

## Deferred Questions

### RALPH loop protocol details

**Reason:** Need to research how the loop communicates with Claude, passes context, handles errors
**Default for now:** Node.js script spawning `claude` CLI with prompts
**Revisit when:** Research phase

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-03-11 | Local state, command extraction, RALPH loop, context guardrails | FEATURE.md created, 3 decisions recorded |
| 2026-03-11 | Command vocabulary, state file tracking, context read-only vs steering | Resolved: committed state, 4-command set, steering as guardrail. 5 decisions total |

---

## Gray Areas Remaining

- [ ] RALPH loop implementation — How exactly does it spawn Claude, pass context, track progress?
- [ ] Context guardrails content — What specific rules keep Claude compliant? How to make them re-injectable?
- [ ] Naming for the legacy pipeline command — `/specd.auto` vs `/specd.brain` vs something else
- [ ] Where does review fit? — Part of execute? Separate step in RALPH loop? Between-phase logic?

---

## Quick Reference

- **Task:** `.specd/tasks/flow-changes/FEATURE.md`
- **Decisions:** `.specd/tasks/flow-changes/DECISIONS.md`
- **Research:** `.specd/tasks/flow-changes/RESEARCH.md` (if exists)
