# Decisions: flow-changes

**Task:** flow-changes
**Created:** 2026-03-11
**Last Updated:** 2026-03-11

---

## Active Decisions

### DEC-001: Committed state file for active task

**Date:** 2026-03-11 (revised)
**Status:** Active
**Context:** Commands currently require explicit task name arguments. Developer needs to remember which task they're working on. Gitignored file breaks across branches (same file, different tasks). Branch-name inference is fragile.
**Decision:** Create `.specd/state.json` (committed, not gitignored) with minimal content: `{"current_task": "task-name"}`. Accept merge conflicts as a known tradeoff until a better solution is found.
**Rationale:**
- Committed file travels with the branch — each branch knows its task
- Minimal content reduces conflict surface (single field)
- Conflicts are annoying but not destructive — easy to resolve
- Keeps things simple; can revisit approach later
**Implications:**
- All commands that accept task name must add fallback to read from `state.json`
- `/specd.new` should set current_task when creating a new task
- Every command that runs should update `state.json` to keep it current
- May cause merge conflicts — accepted tradeoff for now
**References:**
- `@commands/specd.continue.md` — Primary consumer

### DEC-002: Keep pipeline as renamed command

**Date:** 2026-03-11
**Status:** Active
**Context:** The existing `/specd.continue` pipeline drives the whole lifecycle in one context window. RALPH loop replaces this as primary flow.
**Decision:** Rename the pipeline to `/specd.auto` or `/specd.brain` (name TBD). Keep it functional for users who prefer all-in-one execution.
**Rationale:**
- Backward compatibility for existing users
- Some tasks may benefit from single-context execution
- Low maintenance cost to keep it alongside new commands
**Implications:**
- `/specd.continue` name freed up for potential reuse or becomes alias
- Need to update help docs and command list
- RALPH loop becomes the recommended primary flow

### DEC-003: Context command as read-only loader with behavioral guardrails

**Date:** 2026-03-11
**Status:** Active
**Context:** Claude drifts from specd conventions mid-conversation — writes its own files, skips auto-commit, doesn't follow state management patterns.
**Decision:** Create `/specd.context` as a read-only command that loads task context AND injects behavioral guardrails. Re-runnable mid-conversation to reset Claude's behavior. No steering/editing — purely loads and sets mode.
**Rationale:**
- Context alone isn't enough — Claude needs explicit rules to stay on-rails
- Re-injectability handles drift without restarting conversation
- In RALPH loop, this gets injected automatically at each step start
- Steering is a guardrails behavior, not a separate command
**Implications:**
- Need a guardrails template with specific behavioral rules
- RALPH loop must include context injection in every step
- Rules must cover: file conventions, auto-commit, state management, specd tool usage
- Guardrails must include: "If user changes direction, prompt to update specs/decisions/roadmap"

### DEC-004: Steering as guardrail behavior, not a command

**Date:** 2026-03-11
**Status:** Active
**Context:** When users change direction mid-conversation ("let's use Redis instead", "scrap phase 3"), specs should stay in sync.
**Decision:** Steering is a behavioral guardrail injected by `/specd.context`, not a separate command. When Claude detects the user expressing a change in direction, it should prompt: record as decision? update roadmap? supersede existing decision?
**Rationale:**
- Direction changes happen organically in conversation, not via explicit commands
- Making it a guardrail means it works in any context where `/specd.context` has been loaded
- Keeps the command set small and focused
**Implications:**
- Guardrails template needs specific rules for detecting and handling direction changes
- Must integrate with DECISIONS.md (supersede/revoke) and ROADMAP.md (restructure phases)

### DEC-005: Command vocabulary — new/research/plan/execute

**Date:** 2026-03-11
**Status:** Active
**Context:** Original pipeline had discuss/research/plan/execute/review as separate stages. Too granular and mechanical.
**Decision:** Consolidate to 4 commands: `/specd.new` (discuss + research + produce phases), `/specd.research` (ad-hoc research in current context), `/specd.plan` (work through phase plan), `/specd.execute` (implement phase). Plus `/specd.context` as the loader.
**Rationale:**
- `/specd.new` should drive the whole inception: ask questions, research in parallel if needed, iterate until phases are ready
- Separate research command for ad-hoc "research X in this context" needs
- Plan and execute are the implementation pair, working phase by phase
- Fewer commands = easier mental model for developers
**Implications:**
- `/specd.new` becomes a bigger, more capable command
- Review may fold into execute or become part of the RALPH loop's between-step logic
- Toolbox keeps advanced/rare operations only

---

## Superseded Decisions

---

## Revoked Decisions

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-03-11 | Committed state file for active task | Active |
| DEC-002 | 2026-03-11 | Keep pipeline as renamed command | Active |
| DEC-003 | 2026-03-11 | Context command as read-only loader with guardrails | Active |
| DEC-004 | 2026-03-11 | Steering as guardrail behavior, not a command | Active |
| DEC-005 | 2026-03-11 | Command vocabulary — new/research/plan/execute | Active |
