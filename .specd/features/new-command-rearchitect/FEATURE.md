# Feature: new-command-rearchitect

## What This Is

Rearchitect specdacular's command structure and planning workflow. Renames `features/` to `tasks/`, flattens plan hierarchy to one PLAN.md per step, simplifies commands from `/specd:feature:*` to `/specd:*`, and makes auto-mode (no interactive prompts between stages) the default behavior.

## Technical Requirements

### Must Create

- [ ] `commands/specd/new.md` — Replaces `new-feature.md`, command becomes `/specd:new`
- [ ] `commands/specd/continue.md` — Replaces `continue-feature.md`, command becomes `/specd:continue`
- [ ] `commands/specd/discuss.md` — Replaces `discuss-feature.md`
- [ ] `commands/specd/research.md` — Replaces `research-feature.md`
- [ ] `commands/specd/plan.md` — Replaces `plan-feature.md`
- [ ] `commands/specd/execute.md` — Replaces `execute-plan.md`
- [ ] `specdacular/workflows/new.md` — Replaces `new-feature.md`
- [ ] `specdacular/workflows/continue.md` — Replaces `continue-feature.md`
- [ ] `specdacular/workflows/discuss.md` — Replaces `discuss-feature.md`
- [ ] `specdacular/workflows/research.md` — Replaces `research-feature.md`
- [ ] `specdacular/workflows/plan.md` — Replaces `plan-feature.md`
- [ ] `specdacular/workflows/execute.md` — Replaces `execute-plan.md`
- [ ] `specdacular/templates/tasks/` — Replaces `templates/features/`, updated for new structure
- [ ] Updated `STATE.md` template — References `steps/` instead of `plans/phase-NN/`
- [ ] Updated `ROADMAP.md` template — References steps instead of phases/plans
- [ ] Updated `PLAN.md` template — One per step, contains all tasks

### Must Integrate With

- `bin/install.js` — Update paths: copy `commands/specd/` (new filenames), `specdacular/workflows/` (new filenames), `specdacular/templates/tasks/`
- `commands/specd/help.md` — Update command list and descriptions
- `commands/specd/status.md` — Update to read from `.specd/tasks/` instead of `.specd/features/`
- `commands/specd/toolbox.md` — Update command references
- `hooks/specd-statusline.js` — If it references feature paths, update
- All workflow cross-references — Workflows reference each other via `@` paths

### Constraints

- Zero dependencies — No new npm packages
- Backward compatibility is NOT required — This is a clean break, old `features/` structure won't be supported
- Steps must be small — Each step gets exactly one PLAN.md with focused tasks
- Auto-mode default — `continue` runs discuss→research→plan→execute without prompting unless `--no-auto` is passed

---

## Success Criteria

- [ ] `/specd:new my-task` creates `.specd/tasks/my-task/` with FEATURE.md, CONTEXT.md, DECISIONS.md, CHANGELOG.md, STATE.md, config.json
- [ ] `/specd:continue my-task` auto-runs through stages without prompting at each transition
- [ ] `/specd:continue my-task --no-auto` prompts at each stage transition (current behavior)
- [ ] `/specd:plan my-task` creates `steps/step-01/PLAN.md`, `steps/step-02/PLAN.md`, etc. — one plan file per step
- [ ] Old `feature:*` commands are removed
- [ ] `bin/install.js` installs the new command/workflow filenames correctly
- [ ] Help command shows updated command names

---

## Out of Scope

- [X] Task type classification (small/medium/big/bug) — Deferred, will be a follow-up
- [X] Different document structures per task type — Deferred
- [X] Migration tool for existing `.specd/features/` → `.specd/tasks/` — Clean break
- [X] Orchestrator/multi-project mode changes — Keep as-is for now, just rename paths

---

## Initial Context

### User Need
The current workflow is too verbose — phases with multiple plans are confusing. Commands are long (`/specd:feature:new`). The interactive prompting at every stage transition slows down users who want to just run through the whole lifecycle.

### Integration Points
- All command files in `commands/specd/`
- All workflow files in `specdacular/workflows/`
- Templates in `specdacular/templates/`
- Installer in `bin/install.js`
- Help and status commands

### Key Constraints
- One PLAN.md per step (no multi-plan phases)
- Auto-mode is the default for `/specd:continue`
- Steps should be small and focused
