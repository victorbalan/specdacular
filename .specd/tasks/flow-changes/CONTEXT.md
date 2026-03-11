# Context: flow-changes

**Last Updated:** 2026-03-11
**Sessions:** 1

## Discussion Summary

Initial discussion covered three interconnected changes to specdacular's developer flow:

1. **Local state tracking** — A `.specd/state.local.json` file (gitignored) that stores the current working task so commands don't need explicit task name arguments. Minimal format: just `current_task`.

2. **Command extraction + RALPH loop** — Extract granular commands from the toolbox into standalone slash commands. Build a RALPH (Read-Act-Log-Pause-Handoff) loop as `npx specdacular ralph` that spawns fresh Claude instances per step, avoiding context bloat. The existing pipeline survives as `/specd.auto` or `/specd.brain`.

3. **Context + guardrails injection** — A `/specd.context` command that loads task context AND injects behavioral rules so Claude stays on-rails (writes to correct specd files, auto-commits, follows conventions). Re-injectable mid-conversation when Claude drifts.

The command vocabulary is the main open research question — needs to be "developer-natural" rather than a 1:1 mirror of workflow stages.

---

## Resolved Questions

### What goes in state.local.json?

**Question:** Should it track just task name or richer state (phase, last command, etc.)?

**Resolution:** Minimal — just `{"current_task": "flow-changes"}`. Task-level state lives in the task's own config.json and STATE.md.

**Related Decisions:** DEC-001

### What happens to the existing pipeline?

**Question:** Do we remove `/specd.continue` or keep it?

**Resolution:** Keep it as a renamed command (`/specd.auto` or `/specd.brain`) for backward compatibility. RALPH loop becomes the primary execution model.

**Related Decisions:** DEC-002

---

## Deferred Questions

### Exact command vocabulary

**Reason:** Needs research — current workflow stages (discuss, research, plan, execute, review) are too mechanical. Need to find developer-natural actions.
**Default for now:** Use current stages as starting point for research
**Revisit when:** Research phase

### RALPH loop protocol details

**Reason:** Need to research how the loop communicates with Claude, passes context, handles errors
**Default for now:** Node.js script spawning `claude` CLI with prompts
**Revisit when:** Research phase

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-03-11 | Local state, command extraction, RALPH loop, context guardrails | FEATURE.md created, 3 decisions recorded |

---

## Gray Areas Remaining

- [ ] Command vocabulary — What's the right set of granular commands? Not 1:1 with workflow stages
- [ ] RALPH loop implementation — How exactly does it spawn Claude, pass context, track progress?
- [ ] Context guardrails content — What specific rules keep Claude compliant? How to make them re-injectable?
- [ ] Naming for the legacy pipeline command — `/specd.auto` vs `/specd.brain` vs something else

---

## Quick Reference

- **Task:** `.specd/tasks/flow-changes/FEATURE.md`
- **Decisions:** `.specd/tasks/flow-changes/DECISIONS.md`
- **Research:** `.specd/tasks/flow-changes/RESEARCH.md` (if exists)
