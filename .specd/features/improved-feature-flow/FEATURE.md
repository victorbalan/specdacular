# Feature: improved-feature-flow

## What This Is

Simplifies the specdacular command surface from ~15 commands to 7 by consolidating phase and feature sub-commands behind a `toolbox` menu, renaming `next` to `continue`, and making review user-guided instead of auto-fix.

## Technical Requirements

### Must Create

- [ ] `commands/specd/continue-feature.md` — Replaces `next-feature.md`. The main flow driver command.
- [ ] `commands/specd/toolbox.md` — Single command presenting a menu of: discuss, research, plan, review, insert. Each option loads the corresponding workflow.
- [ ] `specdacular/workflows/toolbox.md` — Workflow logic for the toolbox menu and dispatching to sub-workflows
- [ ] `specdacular/workflows/review-feature.md` — New user-guided review workflow (show summary, take feedback, generate fix plans)
- [ ] `specdacular/workflows/insert-phase.md` — Phase insertion workflow (moved from `phase:insert`, auto-renumbers)

### Must Integrate With

- `specdacular/workflows/next-feature.md` — Rename/refactor to `continue-feature.md`, update all internal references
- `specdacular/workflows/discuss-feature.md` — Keep workflow, remove command stub, called from toolbox
- `specdacular/workflows/research-feature.md` — Keep workflow, remove command stub, called from toolbox
- `specdacular/workflows/plan-feature.md` — Keep workflow, remove command stub, called from toolbox
- `specdacular/workflows/execute-plan.md` — Add review checkpoint after phase execution ("Is this OK?")
- `commands/specd/new-feature.md` — Update continuation references from `next` to `continue`
- `commands/specd/help.md` — Update to reflect new command surface
- `bin/install.js` — Update file copy list (remove old commands, add new ones)
- `specdacular/templates/features/STATE.md` — Update resume command reference from `next` to `continue`

### Constraints

- Zero new dependencies — Node built-ins only, same as rest of codebase
- Workflows keep working — Only command stubs change; workflow files stay functional
- Incremental change — Don't rewrite the flow logic, just change how commands are accessed
- Autocomplete must show exactly 7 entries — `feature:new`, `feature:continue`, `feature:toolbox`, `map-codebase`, `status`, `help`, `update`

---

## Success Criteria

- [ ] `/specd:feature:continue` drives the full lifecycle (same behavior as current `next`)
- [ ] `/specd:feature:toolbox` presents menu with discuss, research, plan, review, insert options
- [ ] Each toolbox option loads and executes the correct workflow
- [ ] No `phase:*` commands appear in autocomplete
- [ ] No standalone `feature:discuss`, `feature:research`, `feature:plan` commands in autocomplete
- [ ] Review workflow shows summary to user, waits for feedback, generates fix plans from feedback
- [ ] After phase execution, `continue` asks "Is this OK?" before moving to next phase
- [ ] `insert` from toolbox adds a phase and auto-renumbers
- [ ] All references to `next` updated to `continue` (STATE.md template, help, new-feature completion)
- [ ] `bin/install.js` correctly installs only the new command set

---

## Out of Scope

- [X] Rewriting the flow logic — The `continue` routing logic stays the same, just renamed
- [X] Changing how workflows work internally — discuss, research, plan workflows untouched
- [X] Adding new workflow capabilities — No new features beyond review behavior change
- [X] Changing `map-codebase`, `status`, `help`, `update` commands — These stay as-is

---

## Initial Context

### User Need
Too many commands to remember. Users and the AI agent both struggle with command sprawl. The flow should be driven by `continue, continue, continue` with a toolbox for when you know exactly what you want.

### Integration Points
- Command files in `commands/specd/` (add/remove)
- Workflow files in `specdacular/workflows/` (keep, add review/insert/toolbox)
- `bin/install.js` (update installed file list)
- Templates referencing `next` (update to `continue`)

### Key Constraints
- Autocomplete shows max 7 entries
- Review is user-guided, never auto-fixes
- Existing workflow logic preserved — this is a surface-level restructuring
