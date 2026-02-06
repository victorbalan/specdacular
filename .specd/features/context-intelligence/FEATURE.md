# Feature: context-intelligence

## What This Is

Smart context loading and pruning for Specdacular workflows. Instead of loading the entire context stack (FEATURE.md + CONTEXT.md + DECISIONS.md + RESEARCH.md + ROADMAP.md + all codebase docs) for every command, load only what's relevant to the current phase and task. Achieves ~76% context reduction for mature features.

## Technical Requirements

### Must Create

- [ ] Phase-aware context loading instructions in all workflow files — Load Phase N decisions/research prominently, summarize earlier phases
- [ ] Decision relevance tagging — Each decision tagged with `phases: [N, M]` so loaders can filter by current phase
- [ ] CONTEXT.md summarization protocol — After N discussion sessions, archive detail into `CONTEXT-archive.md`, keep condensed summary
- [ ] Context budget estimation — Before spawning parallel agents, estimate total context size and warn if exceeding threshold
- [ ] Graduated loading instructions — Load summaries first, full documents only if Claude needs them

### Must Integrate With

- `specdacular/workflows/execute-plan.md` — Heaviest context consumer; must use phase-filtered loading
- `specdacular/workflows/plan-feature.md` — Needs full DECISIONS.md but only relevant phase RESEARCH.md
- `specdacular/workflows/discuss-feature.md` — Needs full CONTEXT.md but can summarize old sessions
- `specdacular/workflows/research-*.md` — Needs codebase docs but can load selectively
- `specdacular/templates/features/DECISIONS.md` — Template must include `**Phase:**` field (already present)
- `.specd/features/{name}/` — All feature state files affected by smart loading

### Constraints

- **No data loss** — Archiving/summarization must preserve originals (archive, don't delete)
- **Backward compatible** — Features created before this change must still work (graceful degradation if phase tags missing)
- **Workflow-driven** — Smart loading is instruction-based (in workflow markdown), not code-based. Specdacular has no runtime.
- **Agent Skills alignment** — Context loading patterns should align with progressive disclosure from the Agent Skills migration

---

## Success Criteria

- [ ] Phase 4 execution of a mature feature loads <700 lines of context (vs ~2,650 today)
- [ ] Decisions in DECISIONS.md have `**Phase:**` field and workflows filter by it
- [ ] CONTEXT.md auto-summarization triggers after 5+ discussion sessions
- [ ] Context archive files preserve full detail for reference
- [ ] All workflows include context loading instructions (not just "load everything")
- [ ] No regression in output quality — Claude has all *relevant* context, just not irrelevant context

---

## Out of Scope

- [X] Token counting — No actual token measurement; use line count as proxy
- [X] Automated context compression — Claude does the summarization, not a script
- [X] Dynamic context based on conversation — Only phase-based filtering, not conversation-adaptive

---

## Initial Context

### User Need
As features grow across multiple discussion sessions and phases, context files accumulate indefinitely. A large feature with 10+ sessions, 20+ decisions, and multi-phase research floods the context window with information irrelevant to the current task. This directly degrades Claude's output quality.

### Integration Points
- Every workflow that loads feature context (nearly all of them)
- DECISIONS.md template (Phase field)
- CONTEXT.md format (summarization protocol)
- Agent spawning (context budget estimation)

### Key Constraints
- Instruction-based, not code-based (Specdacular is markdown workflows)
- Must work with features that predate this change
- Archive, never delete
