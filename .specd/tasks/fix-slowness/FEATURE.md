# Task: fix-slowness

## What This Is

Reduce Claude's execution-phase "thinking" time (currently 9-48+ minutes) by offloading deterministic operations to a Node.js utility script and reducing unnecessary context loading during code execution.

## Technical Requirements

### Must Create

- [ ] `hooks/specd-utils.js` — Node.js CLI with subcommands for all mechanical workflow operations (commit, config-update, config-get, phase-info, route, advance-phase, record-phase-start, log-changelog, state-add-phase, next-decision-number, increment, next-decimal-phase, init-task)

### Must Integrate With

- `specdacular/references/commit-code.md` — Replace 3-step read-check-commit with single script call
- `specdacular/references/commit-docs.md` — Same replacement
- `specdacular/references/brain-routing.md` — Replace state parsing + conditional logic with single script call returning JSON
- `specdacular/references/load-context.md` — Add execution-mode parameter for lean context loading
- `specdacular/workflows/execute.md` — Use script for config reads, changelog entries, state updates, commits
- `specdacular/workflows/brain.md` — Use script for state transitions, routing, phase advancement
- `specdacular/workflows/revise.md` — Use script for decimal phase creation and config updates
- `bin/install.js` — Ensure specd-utils.js gets copied during install (already handled by existing hooks copy logic)

### Constraints

- Zero dependencies — Node.js stdlib only, matching existing hooks pattern
- Single file — one `specd-utils.js` with subcommands, not many small scripts
- JSON output — all subcommands output JSON for easy parsing
- Backwards compatible — existing task folders and config.json structures unchanged

---

## Success Criteria

- [ ] `node hooks/specd-utils.js commit` correctly checks auto-commit settings and commits or skips
- [ ] `node hooks/specd-utils.js route` returns correct next step for all 8 state combinations in brain-routing.md
- [ ] `node hooks/specd-utils.js config-update --set "key=value"` reads, modifies, and writes config.json atomically
- [ ] `node hooks/specd-utils.js phase-info` returns full phase state in one call
- [ ] Workflow references (commit-code.md, commit-docs.md, brain-routing.md) reduced to single script calls
- [ ] `load-context.md` has execution mode that skips CONTEXT.md, MAP.md, STRUCTURE.md, CONCERNS.md
- [ ] `execute.md` uses specd-utils for all mechanical operations
- [ ] Research phase identifies additional slowness sources beyond what's already known

---

## Out of Scope

- [X] Changing the pipeline structure or step order — this task optimizes existing flows
- [X] Adding new workflow steps — focus is reducing overhead in existing ones
- [X] Modifying the agent spawning patterns (research agents, codebase mappers)
- [X] UI/UX changes to status output or user prompts

---

## Initial Context

### User Need
During `/specd.continue` execution phases, Claude spends 9-48+ minutes "thinking" on deterministic operations (commits, config reads, state transitions, brain routing). This wastes context tokens and user time. The more deterministic the operations, the better Claude performs.

### Integration Points
- All workflow references in `specdacular/references/` that involve commits or config reads
- Brain routing logic in `specdacular/references/brain-routing.md`
- Execute workflow in `specdacular/workflows/execute.md`
- Brain workflow in `specdacular/workflows/brain.md`
- Context loading in `specdacular/references/load-context.md`
- Existing hooks in `hooks/` (pattern to follow)

### Key Constraints
- Must stay zero-dependency (Node.js stdlib only)
- Script already prototyped and tested in `hooks/specd-utils.js` with 13 working subcommands
- Research phase needed to identify additional slowness sources in workflows
