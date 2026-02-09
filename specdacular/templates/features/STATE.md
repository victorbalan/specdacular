# State: {feature-name}

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

### Current Plan
- Plan: none
- Task: —
- Started: —

### Completed Plans
| Plan | Completed | Tasks | Deviations |
|------|-----------|-------|------------|

---

## Review Cycles

| Phase | Cycle | Date | Findings | Corrective Plans | Status |
|-------|-------|------|----------|------------------|--------|

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
| plans/ | Not started | — |

---

## Decision Count

- **Active:** {N}
- **Superseded:** {N}
- **Total:** {N}

---

## Next Steps

{What the user should do next based on current state.}

**Options:**
- `/specd:feature:discuss {feature-name}` — Continue refining understanding
- `/specd:feature:research {feature-name}` — Research implementation approach
- `/specd:feature:plan {feature-name}` — Create roadmap with phase overview (when ready)
- `/specd:phase:prepare {feature-name} {N}` — Prepare a specific phase
- `/specd:phase:plan {feature-name} {N}` — Create detailed plans for a phase
- `/specd:phase:execute {feature-name}` — Execute plans with progress tracking
- `/specd:phase:review {feature-name} {N}` — Review executed plans against actual code

---

## Session Notes

{Space for notes during sessions. Cleared or archived as appropriate.}

---

## Quick Reference

- **Feature:** `.specd/features/{feature-name}/FEATURE.md`
- **Context:** `.specd/features/{feature-name}/CONTEXT.md`
- **Decisions:** `.specd/features/{feature-name}/DECISIONS.md`
- **Research:** `.specd/features/{feature-name}/RESEARCH.md`
- **Roadmap:** `.specd/features/{feature-name}/ROADMAP.md`
