# Feature: new-command-rearchitect

## What This Is

Rearchitect specdacular's command structure and planning workflow. Renames `features/` to `tasks/`, flattens plan hierarchy to one PLAN.md per phase, simplifies commands from `/specd:feature:*` to `/specd:*`, adds a code review agent after every phase execution, and introduces `--semi-auto` and `--auto` flags for `/specd:continue`.

## Technical Requirements

### Must Create

- [ ] `commands/specd/new.md` — Replaces `new-feature.md`, command becomes `/specd:new`
- [ ] `commands/specd/continue.md` — Replaces `continue-feature.md`, command becomes `/specd:continue`
- [ ] `commands/specd/discuss.md` — Replaces `discuss-feature.md`
- [ ] `commands/specd/research.md` — Replaces `research-feature.md`
- [ ] `commands/specd/plan.md` — Replaces `plan-feature.md`
- [ ] `commands/specd/execute.md` — Replaces `execute-plan.md`
- [ ] `commands/specd/review.md` — New: code review command (also runs automatically after execution)
- [ ] `specdacular/workflows/new.md` — Replaces `new-feature.md`
- [ ] `specdacular/workflows/continue.md` — Replaces `continue-feature.md`
- [ ] `specdacular/workflows/discuss.md` — Replaces `discuss-feature.md`
- [ ] `specdacular/workflows/research.md` — Replaces `research-feature.md`
- [ ] `specdacular/workflows/plan.md` — Replaces `plan-feature.md`
- [ ] `specdacular/workflows/execute.md` — Replaces `execute-plan.md`
- [ ] `specdacular/workflows/review.md` — New: code review workflow
- [ ] `specdacular/templates/tasks/` — Replaces `templates/features/`, updated for new structure
- [ ] Updated `STATE.md` template — References `phases/phase-NN/` (one PLAN.md each)
- [ ] Updated `ROADMAP.md` template — References phases with single plans
- [ ] Updated `PLAN.md` template — One per phase, contains all tasks for that phase

### Must Integrate With

- `bin/install.js` — Update paths: copy `commands/specd/` (new filenames), `specdacular/workflows/` (new filenames), `specdacular/templates/tasks/`
- `commands/specd/help.md` — Update command list and descriptions
- `commands/specd/status.md` — Update to read from `.specd/tasks/` instead of `.specd/features/`
- `commands/specd/toolbox.md` — Update command references
- `hooks/specd-statusline.js` — If it references feature paths, update
- All workflow cross-references — Workflows reference each other via `@` paths

### Constraints

- Zero dependencies — No new npm packages
- Backward compatibility is NOT required — Clean break
- One PLAN.md per phase — Phases kept small and focused
- Code review agent runs after every phase execution (all modes)
- Interactive mode is the default — `--semi-auto` and `--auto` are opt-in flags

---

## Success Criteria

- [ ] `/specd:new my-task` creates `.specd/tasks/my-task/` with FEATURE.md, CONTEXT.md, DECISIONS.md, CHANGELOG.md, STATE.md, config.json
- [ ] `/specd:continue my-task` prompts at each stage transition (default interactive)
- [ ] `/specd:continue my-task --semi-auto` auto-runs discuss→research→plan, then executes phase-by-phase with review + user approval after each
- [ ] `/specd:continue my-task --auto` runs everything until task completion, only stops if review finds issues
- [ ] `/specd:plan my-task` creates `phases/phase-01/PLAN.md`, `phases/phase-02/PLAN.md`, etc.
- [ ] After every phase execution, code review agent runs and presents findings to user
- [ ] Review can generate fix plans in decimal phases (e.g., `phases/phase-01.1/PLAN.md`)
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
The current workflow is too verbose — multiple plans per phase are confusing. Commands are long (`/specd:feature:new`). Users want automated progression through stages with code review built in.

### Integration Points
- All command files in `commands/specd/`
- All workflow files in `specdacular/workflows/`
- Templates in `specdacular/templates/`
- Installer in `bin/install.js`
- Help and status commands
- Reference library review patterns (`.agents/skills/specd-phase-review/`, `.agents/skills/specd-feature-review/`)

### Key Constraints
- One PLAN.md per phase (no multi-plan phases)
- Interactive mode is default; `--semi-auto` and `--auto` are flags
- Code review runs after every phase execution regardless of mode
- Phases should be small and focused
