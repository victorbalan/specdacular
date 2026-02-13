# Decisions: improved-feature-flow

**Feature:** improved-feature-flow
**Created:** 2026-02-13
**Last Updated:** 2026-02-13

---

## Active Decisions

### DEC-001: Group advanced operations under toolbox command

**Date:** 2026-02-13
**Status:** Active
**Context:** Users face ~15 commands in autocomplete. Need to reduce to ~7 while keeping all functionality accessible.
**Decision:** Create a single `/specd:feature:toolbox` command that presents a menu (via AskUserQuestion) with options: discuss, research, plan, review, insert. Each option dispatches to the corresponding workflow.
**Rationale:**
- Single command file = one autocomplete entry instead of five
- Menu gives descriptions of what each option does
- Workflows stay unchanged — only the entry point changes
**Implications:**
- Remove command files: `discuss-feature.md`, `research-feature.md`, `plan-feature.md`
- Keep workflow files: `discuss-feature.md`, `research-feature.md`, `plan-feature.md` in `specdacular/workflows/`
- New files: `commands/specd/toolbox.md`, `specdacular/workflows/toolbox.md`

---

### DEC-002: Remove all standalone phase commands

**Date:** 2026-02-13
**Status:** Active
**Context:** Phase commands (`phase:insert`, `phase:renumber`, `phase:review`, `phase:research`, `phase:prepare`, `phase:plan`, `phase:execute`) add clutter and are better accessed through the flow.
**Decision:** Delete all `commands/specd/*-phase.md` command files. Absorb their functionality into `continue` flow and `toolbox` menu.
**Rationale:**
- Phase operations are contextual — they only make sense at certain stages
- `continue` already routes to the right operation based on state
- Insert and review are useful as manual operations → available via toolbox
- Renumber is mechanical → happens automatically on insert
**Implications:**
- Delete 7 command files from `commands/specd/`
- Update `bin/install.js` to not install these files
- Keep workflow files that are still needed

---

### DEC-003: Review is user-guided, not auto-fix

**Date:** 2026-02-13
**Status:** Active
**Context:** Current review behavior goes into the code and attempts auto-fixes. User wants to drive the review — they look at the code, report issues, and the agent generates fix plans.
**Decision:** Review workflow shows a summary of what was implemented, then enters a conversation where the user provides feedback. That feedback gets turned into new fix plans.
**Rationale:**
- User has better judgment about code quality and correctness
- Auto-fix can introduce new issues
- User-guided review builds trust and keeps human in the loop
**Implications:**
- New workflow: `specdacular/workflows/review-feature.md`
- `continue` adds review checkpoint after phase execution
- Review output: fix plans (same format as regular plans)

---

### DEC-004: Rename `next` to `continue`

**Date:** 2026-02-13
**Status:** Active
**Context:** Naming choice for the main flow driver command.
**Decision:** Use `continue` instead of `next`. Command becomes `/specd:feature:continue`.
**Rationale:**
- "Continue where you left off" reads naturally
- More descriptive of what the command does
**Implications:**
- Rename `commands/specd/next-feature.md` → `commands/specd/continue-feature.md`
- Rename/refactor `specdacular/workflows/next-feature.md` → `specdacular/workflows/continue-feature.md`
- Update all references in templates, help, other workflows

---

### DEC-005: Autocomplete shows exactly 7 entries

**Date:** 2026-02-13
**Status:** Active
**Context:** Claude Code shows one autocomplete entry per command file in `commands/specd/`.
**Decision:** Command directory contains exactly 7 files: `new-feature.md`, `continue-feature.md`, `toolbox.md`, `map-codebase.md`, `status.md`, `help.md`, `update.md`.
**Rationale:**
- Minimal cognitive load for users
- All functionality still accessible via toolbox or continue
- Clean, scannable list
**Implications:**
- Delete all other command files from `commands/specd/`
- Toolbox dispatches to workflows without needing command stubs

---

### DEC-006: Decimal phase numbering for inserts

**Date:** 2026-02-13
**Status:** Active
**Context:** Inserting phases between existing ones previously required renumbering all subsequent phases, breaking references.
**Decision:** Use decimal numbering: insert after phase 6 → 6.1, again → 6.2, again → 6.3. One level of decimals only — no 6.1.1.
**Rationale:**
- No cascading renames of plan files or directories
- Existing references to phase numbers stay valid
- Simple mental model
- Eliminates `phase:renumber` command entirely
**Implications:**
- Plan directories: `plans/phase-6.1/`, `plans/phase-6.2/`
- ROADMAP.md lists decimal phases in order
- Execution follows: 6 → 6.1 → 6.2 → 6.3 → 7

---

### DEC-007: Discuss/research/plan ask scope (feature vs phase)

**Date:** 2026-02-13
**Status:** Active
**Context:** When user selects discuss, research, or plan from the toolbox, they might want to work on the whole feature or zoom into a specific phase.
**Decision:** After selecting discuss/research/plan, present a follow-up: "Whole feature or a specific phase?" If specific phase, let user select which one.
**Rationale:**
- Sometimes you need to zoom into "how should phase 3 work" without rehashing everything
- Feature-level and phase-level are both valid scopes
- Matches how developers actually think about work
**Implications:**
- Toolbox workflow needs two-step flow for discuss/research/plan
- Phase-level discuss/research/plan reuse existing phase workflows
- Feature-level uses existing feature workflows

---

### DEC-008: Review shows summary + test guidance, revisions become fix plans

**Date:** 2026-02-13
**Status:** Active
**Context:** Need to define the exact review flow after phase execution.
**Decision:** After phase execution: (1) show files created/modified, (2) include brief test guidance paragraph, (3) ask "Is this OK or do you want to revise?", (4) if revise, user provides feedback, (5) feedback becomes fix plans with decimal numbering (6.1, 6.2), (6) execute fixes, ask again.
**Rationale:**
- Test guidance helps user know what to verify
- User drives the review, not the agent
- Fix plans use same format as regular plans for consistency
- Decimal numbering keeps things ordered
**Implications:**
- Review workflow must read executed plan to know what files were touched
- Test guidance derived from plan objectives and success criteria
- Fix plans created in `plans/phase-{N.M}/` directories

---

### DEC-009: Phase transition requires explicit user approval

**Date:** 2026-02-13
**Status:** Active
**Context:** Currently, after all plans in a phase execute, the state auto-advances to the next phase. This means running `continue` in a fresh context skips review and jumps to the wrong phase. User discovered this when phase 7 wasn't reviewed but state already showed phase 8.
**Decision:** Phase status in STATE.md must track: `executing` → `executed` → `completed`. A phase moves to `completed` only after explicit user approval ("Is this OK? Yes"). Only then does the next phase become active. `continue` in a fresh context reads this status and knows to show the review checkpoint, not advance.
**Rationale:**
- Fresh context must load the correct state — can't skip review
- User approval is the gate between phases
- Prevents losing review feedback when context resets
- Makes `continue` reliable regardless of when it's called
**Implications:**
- STATE.md phase tracking needs `executed` vs `completed` distinction
- `continue` workflow must check phase status before deciding next action
- Execute workflow marks phase as `executed` (not `completed`) when all plans done
- Review/approval step marks phase as `completed` and advances to next phase

---

## Superseded Decisions

_(none)_

---

## Revoked Decisions

_(none)_

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-13 | Group advanced operations under toolbox command | Active |
| DEC-002 | 2026-02-13 | Remove all standalone phase commands | Active |
| DEC-003 | 2026-02-13 | Review is user-guided, not auto-fix | Active |
| DEC-004 | 2026-02-13 | Rename next to continue | Active |
| DEC-005 | 2026-02-13 | Autocomplete shows exactly 7 entries | Active |
| DEC-006 | 2026-02-13 | Decimal phase numbering for inserts | Active |
| DEC-007 | 2026-02-13 | Discuss/research/plan ask scope (feature vs phase) | Active |
| DEC-008 | 2026-02-13 | Review shows summary + test guidance, revisions become fix plans | Active |
| DEC-009 | 2026-02-13 | Phase transition requires explicit user approval | Active |
