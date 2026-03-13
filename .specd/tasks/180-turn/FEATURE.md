# Task: 180-turn

## What This Is

Replace specdacular's custom `.specd/codebase/` documentation system with a context-engineering approach that uses the project's `CLAUDE.md` as a router and `docs/` folder for topic-specific, on-demand knowledge files. Two new commands (`/specd.docs` and `/specd.docs.review`) replace the old `map-codebase` and `codebase.review` commands.

## Technical Requirements

### Must Create

- [ ] `commands/specd.docs.md` — Command definition for `/specd.docs`
- [ ] `specdacular/workflows/docs.md` — Workflow: spawn 4 agents, merge outputs, propose doc topics, generate docs, write CLAUDE.md routing table
- [ ] `commands/specd.docs.review.md` — Command definition for `/specd.docs.review`
- [ ] `specdacular/workflows/docs-review.md` — Workflow: audit existing docs, check freshness, suggest new topics, propose CLAUDE.md cleanup, track review dates

### Must Modify

- [ ] `commands/specd.help.md` — Replace `map-codebase` / `codebase.review` with new commands
- [ ] `specdacular/workflows/new.md` — Remove `.specd/codebase/` checks, reference CLAUDE.md instead
- [ ] `specdacular/workflows/execute.md` — Remove `.specd/codebase/` references
- [ ] `specdacular/workflows/plan.md` — Remove `.specd/codebase/` references
- [ ] `specdacular/workflows/discuss.md` — Remove `.specd/codebase/` references
- [ ] `specdacular/workflows/research.md` — Remove `.specd/codebase/` references
- [ ] `bin/install.js` — Update installation to include new commands, remove old ones

### Must Remove

- [ ] `commands/specd.codebase.map.md` — Old command
- [ ] `commands/specd.codebase.review.md` — Old command (if exists)
- [ ] `specdacular/workflows/map-codebase.md` — Old workflow
- [ ] References to `.specd/codebase/` across all workflows

### Must Integrate With

- `agents/specd-codebase-mapper.md` — Reuse the same 4 parallel agents (map, patterns, structure, concerns) for initial codebase analysis
- Existing CLAUDE.md files — Read, parse, merge routing table into existing content
- `docs/` folder (or user-configured location) — Generate and manage topic-specific documentation files

### Constraints

- **Reuse existing agents** — The 4 mapper agents (map, patterns, structure, concerns) stay as-is for raw analysis. The new workflow merges their outputs into topic-based docs.
- **Dynamic doc topics** — Topics are derived from what the codebase actually uses, not a fixed list. Research agents investigate best practices for the detected stack.
- **Docs location discovery** — Check if CLAUDE.md already references a docs path. If yes, use it. If no, default to `docs/`. Never use `.specd/`.
- **Non-destructive CLAUDE.md editing** — Append/merge the routing table into existing CLAUDE.md. Propose removing bloat but don't delete without user approval.
- **Keep existing task flow** — The new/discuss/plan/execute lifecycle stays intact. Only remove `.specd/codebase/` references from those workflows.
- **Review date tracking** — `docs.review` tracks when each doc was last reviewed, flags stale docs.

---

## Success Criteria

- [ ] `/specd.docs` on a new project generates topic-specific docs in `docs/` and a CLAUDE.md routing table
- [ ] `/specd.docs` on an existing project with CLAUDE.md merges routing table without destroying user content
- [ ] `/specd.docs.review` audits docs for staleness, suggests improvements, proposes new topic files
- [ ] All existing workflows (new, discuss, plan, execute, research) no longer reference `.specd/codebase/`
- [ ] Old commands (`map-codebase`, `codebase.review`) are removed
- [ ] The 4 mapper agents are reused for raw analysis, their outputs merged into topic-based docs
- [ ] Docs topics are dynamically determined based on actual codebase content

---

## Out of Scope

- [X] Changing the task lifecycle (new/discuss/plan/execute) — Stays as-is
- [X] Skill generators per project — Future task, not this one
- [X] Removing the `.specd/tasks/` structure — Tasks system stays
- [X] MCP or external tool integrations — Future consideration

---

## Initial Context

### User Need
Specdacular's custom `.specd/codebase/` docs are redundant with what CLAUDE.md + `docs/` can do natively. The context engineering approach (routing table + on-demand knowledge) is more aligned with how Claude Code works and scales better. The user has validated this pattern on the SND webclient project.

### Integration Points
- 4 codebase mapper agents (reused for raw analysis)
- CLAUDE.md (router / always-loaded rules)
- `docs/` folder (topic-specific, on-demand knowledge)
- All existing workflow files (need `.specd/codebase/` references stripped)

### Key Constraints
- Dynamic topic detection (no fixed doc list)
- Non-destructive CLAUDE.md merging
- User approval before generating/removing docs
- Review date tracking for freshness auditing
