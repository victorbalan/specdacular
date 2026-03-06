# Research: fix-slowness

**Researched:** 2026-03-06
**Confidence:** HIGH

## Summary

The slowness has three compounding causes: (1) **~50K tokens of workflow instructions loaded eagerly** before any task work begins, pushing Claude to 80-90K tokens of instructions before it writes a single line of code; (2) **29 file reads and 15 git commands per 4-task phase execution**, with config.json read 12 times for the same auto-commit boolean; (3) **~2,500-3,000 lines of bloat** across workflow/reference files from repeated `<success_criteria>`, `<philosophy>`, preamble blocks, and verbose prose that duplicates information Claude already has.

The `specd.continue.md` command's `<context>` block eagerly loads all 6 dispatch workflow files even though only 1 is used per run. The `execute-hooks.md` reference (127 lines) is expanded ~12 times during a 3-phase task, adding ~1,524 lines of hook instructions to context even when no hooks are configured. Brain routing (168 lines) is re-expanded every loop iteration. Context degrades over long sessions (confirmed Claude Code bug #10881).

**Key recommendation:** Create `specd-utils.js` for deterministic operations, trim all workflow files by removing `<success_criteria>`/`<philosophy>`/preamble blocks (~290 lines), compress `execute-hooks.md` from 127→~40 lines, compress `brain-routing.md` from 168→~70 lines, and add lean context loading for execution mode.

---

## Codebase Integration

### Patterns to Follow

**Existing hooks pattern**
Follow pattern in `hooks/specd-check-update.js` and `hooks/specd-statusline.js`:
- Node.js stdlib only (fs, path, child_process, os)
- JSON output for machine readability
- Silent fail on errors
- Single file with focused purpose

### File Structure

Where new files go:

```
hooks/
├── specd-check-update.js   # existing — version check
├── specd-statusline.js     # existing — statusline
└── specd-utils.js          # NEW — deterministic workflow operations
```

### Reusable Code

- **Prototype:** `hooks/specd-utils.js` already exists with 13 working subcommands (built and tested earlier this session)

### Integration Points

| Connect To | Via | Purpose |
|------------|-----|---------|
| `commit-code.md` | Replace 3-step logic with `specd-utils commit` call | Eliminate per-task config reads |
| `commit-docs.md` | Same replacement | Eliminate per-commit config reads |
| `brain-routing.md` | Replace state parsing with `specd-utils route` call | Eliminate repeated file reads + conditional logic |
| `load-context.md` | Add execution mode parameter | Skip 5,000-10,000 lines of unnecessary context during execute |
| `execute.md` | Use script for phase-info, record-start, log-changelog, state-add-phase | Eliminate manual JSON editing |
| `brain.md` | Use script for config-update, advance-phase, commit | Eliminate state transition reasoning |
| `bin/install.js` | Already copies all `hooks/` files — no change needed | Automatic |

---

## Implementation Patterns

### Standard Approach

Single Node.js CLI script with subcommand dispatch via `process.argv[2]`. Each subcommand reads files, does deterministic work, writes results, outputs JSON. Claude calls it with one bash command.

### Workflow Trimming Approach

Remove cross-cutting bloat patterns from all workflow and reference files:

| Pattern | Files Affected | Lines Saved |
|---------|---------------|-------------|
| `<success_criteria>` blocks | 13 workflows | ~130 lines |
| `<philosophy>` blocks | 12 workflows | ~100 lines |
| "Before using this reference" preambles | 9 references | ~60 lines |
| Redundant prose that duplicates tables/code | brain-routing.md, load-context.md | ~150 lines |

### Context Loading Modes

| Mode | Used By | Files Loaded |
|------|---------|-------------|
| Full | discuss, research, plan, phase-plan | All task files + all codebase docs |
| Execution | execute, review | FEATURE.md, DECISIONS.md, PLAN.md, PATTERNS.md only |

---

## Pitfalls

### Critical
- **Eager workflow loading** — `specd.continue.md` loads all 6 workflow files via `<context>`. Fix: load only brain.md; brain dispatches workflows at runtime. This alone could save ~30K tokens.
- **Context compaction at 70-80%** — With ~90K tokens of instructions before any work, medium tasks hit compaction early, adding latency. Prevention: reduce instruction footprint.

### Moderate
- **execute-hooks.md expansion** — 127 lines × 12 loads = 1,524 lines of hook logic even with no hooks configured. Prevention: compress to ~40 lines; move subagent template to separate file loaded on demand.
- **brain-routing.md has redundant prose** — The routing table (15 lines) contains all the logic. The 100+ lines of prose below it just re-explain each row. Prevention: keep table + bash snippets only.
- **PLAN.md read twice in execute.md** — load-context reads it, then find_phase reads it again. Prevention: load-context's phase-specific section is sufficient.
- **config.json read 12 times per phase** — 9 reads of global `.specd/config.json` (once per commit call for auto-commit check). Prevention: `specd-utils commit` script reads it once internally.

### Warnings

| When Implementing | Watch Out For | Prevention |
|-------------------|---------------|------------|
| Trimming philosophy blocks | Some contain actual behavioral instructions (e.g., "Four Questions Then Check" in discuss.md) | Move behavioral instructions inline into the relevant `<step>`, delete only commentary |
| Lean context loading | Execute might need RESEARCH.md for pattern guidance | Keep RESEARCH.md as optional load in execution mode |
| Script commit logic | Shell quoting issues with commit messages containing special chars | Use `JSON.stringify(message)` for git commit -m argument |

---

## Quantified Impact

### Per 4-Task Phase Execution (Current)

| Metric | Count |
|--------|-------|
| File reads (cat commands) | 29 |
| Git commands | 15 |
| config.json reads | 12 |
| Context lines loaded (unused during coding) | ~65% of total |
| Reference expansions | ~8 (commit-code ×4, commit-docs ×2, validate ×1, load-context ×1) |

### Per 4-Task Phase Execution (After Fix)

| Metric | Target |
|--------|--------|
| File reads | ~8 (FEATURE.md, DECISIONS.md, PLAN.md, PATTERNS.md + optional RESEARCH.md, CHANGELOG.md + phase-info script + route script) |
| Git commands | 15 (unchanged — same commits, just scripted) |
| config.json reads by Claude | 0 (script handles all config reads) |
| Context lines loaded | ~35% of current (execution mode) |
| Reference expansions | ~2 (commit references now 5 lines each) |

### Workflow Bloat Reduction

| File | Current Lines | Target Lines | Savings |
|------|--------------|-------------|---------|
| execute-hooks.md | 127 | ~40 | ~87 (×12 loads = ~1,044 context lines) |
| brain-routing.md | 168 | ~70 | ~98 (×3 loads = ~294 context lines) |
| brain.md | 378 | ~250 | ~128 |
| load-context.md | 84 | ~45 | ~39 (×4 loads = ~156 context lines) |
| validate-task.md | 72 | ~40 | ~32 (×4 loads = ~128 context lines) |
| All success_criteria | ~130 total | 0 | ~130 |
| All philosophy blocks | ~100 total | ~20 (keep behavioral) | ~80 |
| All preambles | ~60 total | 0 | ~60 |
| **Total per 3-phase run** | | | **~2,500-3,000 lines** |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| specd-utils.js script | HIGH | Already prototyped and tested with 13 working subcommands |
| Workflow trimming | HIGH | Line counts and load frequencies measured precisely |
| Context loading modes | HIGH | load-context.md structure is clear, execution mode well-defined |
| Eager loading fix | MEDIUM | Need to verify how `<context>` block in commands works — may need Claude Code docs |
| Claude Code bugs | MEDIUM | Confirmed via GitHub issues but outside our control |

## Open Questions

1. **How does the `<context>` block in command .md files work?** — Does it eagerly load all `@` references, or are they resolved lazily? If eager, removing workflow references from `specd.continue.md`'s context block would be a major win. Recommendation: test by removing and observing behavior.

## Sources

### Codebase
- `specdacular/references/commit-code.md` — 37 lines, loaded per task commit
- `specdacular/references/commit-docs.md` — 38 lines, loaded per docs commit
- `specdacular/references/brain-routing.md` — 168 lines, loaded per brain loop
- `specdacular/references/execute-hooks.md` — 127 lines, loaded 12× per 3-phase run
- `specdacular/references/load-context.md` — 84 lines, loaded per step dispatch
- `specdacular/workflows/brain.md` — 378 lines, master orchestrator
- `specdacular/workflows/execute.md` — 147 lines, phase executor

### External
- [Claude Code performance degradation #10881](https://github.com/anthropics/claude-code/issues/10881)
- [Performance with long prompts #1488](https://github.com/anthropics/claude-code/issues/1488)
- [54% token reduction gist](https://gist.github.com/johnlindquist/849b813e76039a908d962b2f0923dc9a)
- [Claude Code best practices](https://code.claude.com/docs/en/best-practices)

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| DEC-001: Use Node.js for utility script | Zero-dependency, matches existing hooks pattern |
| DEC-002: Include brain routing in script | Deterministic state machine, removes repeated reasoning |
| DEC-003: Lean context loading for execution | ~65% of loaded context unused during coding |
| DEC-004: Single file with subcommands | Simpler install, shared helpers |
