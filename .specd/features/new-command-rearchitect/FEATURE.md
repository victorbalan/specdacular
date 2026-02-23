# Feature: new-command-rearchitect

## What This Is

Rearchitect specdacular's command structure, planning workflow, and internal efficiency. Renames `features/` to `tasks/`, flattens plan hierarchy to one PLAN.md per phase, simplifies commands from `/specd.feature:*` to `/specd.*`, adds a code review agent after every phase execution, introduces `--semi-auto` and `--auto` flags, and eliminates ~2,000 lines of duplication by extracting shared references.

## Technical Requirements

### Must Create

**Commands (replacing old `feature:*` commands):**
- [ ] `commands/specd.new.md` — Replaces `new-feature.md`, command becomes `/specd.new`
- [ ] `commands/specd.continue.md` — Replaces `continue-feature.md`, command becomes `/specd.continue`
- [ ] `commands/specd.discuss.md` — Replaces `discuss-feature.md`
- [ ] `commands/specd.research.md` — Replaces `research-feature.md`
- [ ] `commands/specd.plan.md` — Replaces `plan-feature.md`
- [ ] `commands/specd.execute.md` — Replaces `execute-plan.md`
- [ ] `commands/specd.review.md` — New: code review command (also runs automatically after execution)

**Workflows (rewritten, deduplicated):**
- [ ] `specdacular/workflows/new.md` — Replaces `new-feature.md`
- [ ] `specdacular/workflows/continue.md` — Replaces `continue-feature.md`
- [ ] `specdacular/workflows/discuss.md` — Replaces `discuss-feature.md`
- [ ] `specdacular/workflows/research.md` — Replaces `research-feature.md` (converted to proper step format)
- [ ] `specdacular/workflows/plan.md` — Replaces `plan-feature.md`
- [ ] `specdacular/workflows/execute.md` — Replaces `execute-plan.md`
- [ ] `specdacular/workflows/review.md` — New: merged review workflow (combines review-feature + review-phase)

**Shared references (new, extracted from duplicated blocks):**
- [ ] `specdacular/references/load-context.md` — Standard feature context loading (FEATURE.md, CONTEXT.md, DECISIONS.md, etc.)
- [ ] `specdacular/references/record-decision.md` — DEC-{NNN} template and recording instructions
- [ ] `specdacular/references/spawn-research-agents.md` — Three-agent research spawn pattern
- [ ] `specdacular/references/synthesize-research.md` — RESEARCH.md template and synthesis instructions
- [ ] `specdacular/references/validate-task.md` — Task existence and file validation

**Templates:**
- [ ] `specdacular/templates/tasks/` — Replaces `templates/features/`, updated for new structure
- [ ] Updated `STATE.md` template — References `phases/phase-NN/PLAN.md`
- [ ] Updated `ROADMAP.md` template — References phases with single plans
- [ ] Updated `PLAN.md` template — One per phase, contains all tasks for that phase

**Orchestrator workflows (split from main workflows):**
- [ ] `specdacular/workflows/orchestrator/new.md` — Orchestrator-specific new task logic
- [ ] `specdacular/workflows/orchestrator/plan.md` — Orchestrator-specific planning logic

### Must Integrate With

- `bin/install.js` — Update paths for new filenames and `templates/tasks/`
- `commands/specd.help.md` — Update command list and descriptions
- `commands/specd.status.md` — Read from `.specd/tasks/` instead of `.specd/features/`
- `commands/specd.toolbox.md` — Update command references
- `hooks/specd-statusline.js` — Update if it references feature paths
- All workflow cross-references — Update `@` paths

### Must Remove

- [ ] Old command files: `new-feature.md`, `continue-feature.md`, `discuss-feature.md`, `research-feature.md`, `plan-feature.md`, `execute-plan.md`
- [ ] Old workflow files: `new-feature.md`, `continue-feature.md`, `discuss-feature.md`, `research-feature.md`, `plan-feature.md`, `execute-plan.md`, `review-phase.md`, `review-feature.md`
- [ ] Phase-specific commands/workflows: `discuss-phase.md`, `research-phase.md`, `plan-phase.md`, `prepare-phase.md`, `insert-phase.md`, `renumber-phases.md`

### Constraints

- Zero dependencies — No new npm packages
- Backward compatibility is NOT required — Clean break
- One PLAN.md per phase — Phases kept small and focused
- Code review agent runs after every phase execution (all modes)
- Interactive mode is the default — `--semi-auto` and `--auto` are opt-in flags
- Shared references should eliminate duplication, not add indirection

---

## Success Criteria

- [ ] `/specd.new my-task` creates `.specd/tasks/my-task/` with FEATURE.md, CONTEXT.md, DECISIONS.md, CHANGELOG.md, STATE.md, config.json
- [ ] `/specd.continue my-task` prompts at each stage transition (default interactive)
- [ ] `/specd.continue my-task --semi-auto` auto-runs discuss→research→plan, then executes phase-by-phase with review + user approval after each
- [ ] `/specd.continue my-task --auto` runs everything until task completion, only stops if review finds issues
- [ ] `/specd.plan my-task` creates `phases/phase-01/PLAN.md`, `phases/phase-02/PLAN.md`, etc.
- [ ] After every phase execution, code review agent runs and presents findings to user
- [ ] Review can generate fix plans in decimal phases (e.g., `phases/phase-01.1/PLAN.md`)
- [ ] Old `feature:*` commands are removed
- [ ] `bin/install.js` installs the new command/workflow filenames correctly
- [ ] Help command shows updated command names
- [ ] No duplicated blocks across workflows — shared logic in references
- [ ] Total workflow line count reduced by ~25% from current 7,570 lines

---

## Out of Scope

- [X] Task type classification (small/medium/big/bug) — Deferred, will be a follow-up
- [X] Different document structures per task type — Deferred
- [X] Migration tool for existing `.specd/features/` → `.specd/tasks/` — Clean break

---

## Initial Context

### User Need
The current workflow is too verbose — multiple plans per phase are confusing. Commands are long (`/specd.feature:new`). Users want automated progression through stages with code review built in. Internal workflow code has ~2,000 lines of duplication that makes maintenance harder.

### Integration Points
- All command files in `commands/specd.`
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
- Shared references for deduplication
