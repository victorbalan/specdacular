# State: {task-name}

## Current Position

**Stage:** {discussion | research | planning | execution}
**Last Updated:** {YYYY-MM-DD}

---

## Stage Progress

### Discussion
- [x] Initial discussion complete
- [ ] Gray areas identified
- [ ] All gray areas resolved

### Research
- [ ] Research conducted
- [ ] Findings documented in RESEARCH.md

### Planning
- [ ] Phases derived
- [ ] Plans created

### Execution
- [ ] Phase 1 complete
- [ ] Phase 2 complete

---

## Execution Progress

### Current Phase
- Phase: none
- Started: —

### Completed Phases
| Phase | Completed | Tasks | Deviations |
|-------|-----------|-------|------------|

---

## Review Cycles

| Phase | Cycle | Date | Findings | Fix Plans | Status |
|-------|-------|------|----------|-----------|--------|

---

## Discussion Sessions

| Date | Focus | Outcome |
|------|-------|---------|
| {YYYY-MM-DD} | Initial discussion | FEATURE.md created |

---

## Documents Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| FEATURE.md | Created | {date} |
| CONTEXT.md | Created | {date} |
| DECISIONS.md | {N} decisions | {date} |
| RESEARCH.md | Not started | — |
| ROADMAP.md | Not started | — |
| phases/ | Not started | — |

---

## Decision Count

- **Active:** {N}
- **Superseded:** {N}
- **Total:** {N}

---

## Next Steps

{What the user should do next based on current state.}

**Resume:** `/specd:continue {task-name}` — Picks up where you left off.

---

## Quick Reference

- **Task:** `.specd/tasks/{task-name}/FEATURE.md`
- **Context:** `.specd/tasks/{task-name}/CONTEXT.md`
- **Decisions:** `.specd/tasks/{task-name}/DECISIONS.md`
- **Research:** `.specd/tasks/{task-name}/RESEARCH.md`
- **Roadmap:** `.specd/tasks/{task-name}/ROADMAP.md`
