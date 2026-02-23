# Research: phase-review

**Researched:** 2026-02-09
**Feature:** Post-execution plan review with iterative correction loop
**Confidence:** HIGH (codebase integration), MEDIUM (external patterns), MEDIUM (pitfalls)

## Summary

The phase-review feature fills the gap between execution and phase completion. Research across three dimensions confirms the design is sound: the codebase already has all integration points needed (plan frontmatter with `creates`/`modifies`, STATE.md tracking, CHANGELOG.md logging), external patterns from IaC tools and code review systems validate the approach (state reconciliation, iterative review cycles, progressive disclosure), and pitfalls research identifies key risks to design around (over-literal comparison, iteration fatigue, scope creep).

**Key recommendation:** Focus on semantic intent matching (did the code achieve what the plan intended?) rather than literal comparison (does the code match the plan word-for-word). Use plan `creates`/`modifies` frontmatter for file-level verification, and Claude's semantic understanding for intent-level verification.

---

## Codebase Integration

### Execute-Plan Workflow — The Primary Integration Point

The review command reads the same state that execute-plan writes:

**Plan Status table format:**
```markdown
| Phase | Plan | Title | Status |
|-------|------|-------|--------|
| 1 | 01 | Create HTML Template Structure | Complete |
```

**Completed Plans table:**
```markdown
| Plan | Completed | Tasks | Deviations |
|------|-----------|-------|------------|
| phase-01/01-PLAN.md | 2026-02-04 | 4 | 0 |
```

Execute-plan finds "first incomplete plan" — corrective plans (DEC-003) continue the sequence and get picked up automatically.

### Plan File Structure

Plans use YAML frontmatter that the review workflow reads:

```yaml
---
feature: {feature-name}
phase: {N}
plan: {NN}
depends_on:
  - phase-XX/NN-PLAN.md
creates:
  - path/to/new/file.ts
modifies:
  - path/to/existing/file.ts
corrects: [01, 03]  # Optional: for corrective plans (DEC-003)
---
```

`creates` + `modifies` = complete list of files the review must inspect.

### STATE.md — Where Review Cycles Section Goes

After "Execution Progress", before "Discussion Sessions":

```markdown
### Review Cycles
| Phase | Cycle | Date | Findings | Corrective Plans | Status |
|-------|-------|------|----------|------------------|--------|
| 1 | 1 | 2026-02-10 | 2 deviations, 1 issue | 04-PLAN, 05-PLAN | fixes-pending |
| 1 | 2 | 2026-02-11 | 0 | — | clean |
```

Phase completion requires: last review cycle status = `clean`.

### Command Definition Pattern

Follow existing phase commands. Frontmatter:

```yaml
---
name: specd.phase:review
description: Review executed plans against actual code and identify deviations
argument-hint: "[feature-name] [phase-number]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
```

Reference workflow: `@~/.claude/specdacular/workflows/review-phase.md`

### Workflow Step Structure

Based on existing workflows (execute-plan, plan-phase, prepare-phase):

1. `validate` — Feature exists, phase exists, has execution history
2. `load_context` — Read feature + phase + plan files + codebase docs
3. `filter_plans` — Get only plans with status `Complete` (DEC-006)
4. `inspect_phase` — For each completed plan, compare files to actual code
5. `present_findings` — Per-plan status table with expandable details (DEC-005)
6. `gather_user_input` — Ask about satisfaction, additional issues (DEC-001)
7. `record_decisions` — New decisions to DECISIONS.md
8. `generate_correctives` — Corrective plans if issues found (DEC-003)
9. `update_state` — Update Review Cycles section (DEC-004)
10. `update_changelog` — Log deviations to CHANGELOG.md
11. `commit_and_next` — Commit, suggest next steps

### Help + README Integration

Add to Phase Commands table between execute and insert:
```
| `/specd.phase:review [feature] [phase]` | Review executed plans against actual code |
```

Update feature flow diagram to show review loop:
```
phase:execute -> phase:review -> [if issues: corrective plans -> phase:execute -> phase:review]*
```

### CHANGELOG.md Format for Review Entries

```markdown
### {YYYY-MM-DD} - Review {feature}/phase-{NN} (Cycle {N})

**[Deviation] {Short description}**
- **Planned:** {What plan specified}
- **Actual:** {What was actually implemented}
- **Files:** `{affected file paths}`
- **Impact:** {Low/Medium/High}
```

---

## Implementation Approach

### State Reconciliation Pattern (from Terraform/Pulumi)

The core pattern: compare desired state (plan) against actual state (code), produce structured diff.

**Applied to phase-review:**
- **Desired state** = plan frontmatter `creates`/`modifies` + plan objectives
- **Actual state** = files on disk + their content
- **Structured diff** = per-plan status table + deviation details

**Key insight from IaC tools:** Render diffs between structured representations, not just text. Show what changed semantically, not line-by-line.

### Iterative Review Cycle Pattern

From code review research, the optimal cycle:
1. Reviewer inspects (Claude reads plans + code)
2. Findings presented with clear categorization
3. Author responds (user flags additional issues or approves)
4. If changes needed: corrective plans generated → executed → re-reviewed
5. Cycle terminates when reviewer approves (status = `clean`)

**Termination conditions:**
- All findings resolved (clean review)
- User accepts remaining deviations as intentional
- Max cycle limit reached (recommend 3 cycles max)

### Deviation Classification

Recommended categories for review output:

| Icon | Status | Meaning |
|------|--------|---------|
| ✅ | Match | Code implements plan as intended |
| ⚠️ | Deviation | Code works but differs from plan |
| ❌ | Incomplete | Plan objective not fully met |
| ⏸️ | Not executed | Plan hasn't been run yet (partial review) |

Deviations are neutral — might be intentional improvements, might be mistakes. User decides in conversation phase.

### Progressive Disclosure for Output

From UX research (Nielsen Norman Group):
1. **Summary first:** "3 plans ✅ | 1 deviation ⚠️ | 1 incomplete ❌"
2. **Status table:** Quick scan per-plan
3. **Expanded details:** Only for items needing attention
4. **User conversation:** Capture response and decisions

### Corrective Plan Generation

From CAPA (Corrective and Preventive Action) framework:
- **Scope to the finding:** Fix what was intended but not done, not general improvements
- **Link back:** `corrects: [01, 03]` frontmatter traces fix to original plan
- **Minimal scope:** Corrective plans should touch fewer files than original plans, not more
- **Ask first:** "Should this fix also address [related issue], or keep it separate?"

---

## Pitfalls

### Critical

**Over-literal comparison flags equivalent implementations**
- Plans say "create `user.ts`" but code uses `users.ts` — is that a deviation?
- Prevention: Compare intent fulfillment, not literal text. Use `creates`/`modifies` for file-level checks, Claude's understanding for semantic checks.

**Corrective plans too broad or too narrow**
- Prevention: Scope correctives to specific original plans via `corrects` frontmatter. Ask user before generating. Corrective plans should modify fewer files than originals, not more.

**Iteration fatigue — review cycles never converge**
- Prevention: Max 3 cycles per phase. Show progress: "Cycle 2/3: 2 issues (down from 5)". If findings increase between cycles, stop and discuss.

### Moderate

**Review becomes re-planning session (scope creep)**
- Prevention: Two sections in output — "Deviations from Plan" (review territory) and "Improvement Ideas" (deferred to feature:discuss). Corrective plans fix gaps, not add features.

**Partial review reports misleading "clean" status**
- Prevention: Qualify status: "Clean (2/4 plans executed)". Show dependency warnings: "Plans 03, 04 depend on this — integration not yet verified."

**Stale review status after manual changes**
- Prevention: Track review timestamp. If git shows changes after last review date, warn. Consider checking for uncommitted changes at review start.

### Minor

**User already knows about flagged deviations**
- Prevention: Conversation phase lets user say "yes I know about X". Pre-acknowledged deviations not repeated.

**Deviation logging duplicates CHANGELOG.md entries**
- Prevention: Review reads CHANGELOG.md before logging. Skip deviations already logged during execution. Use distinct sections: "Auto-fixes (execution)" vs "Review findings (post-execution)".

### Task-Specific Warnings

| When Building | Watch Out For | Prevention |
|---------------|---------------|------------|
| Inspection step | Claude can't verify runtime behavior, only static code | Re-run plan verification commands during review |
| Semantic comparison | Non-deterministic — same review run twice may differ | Use structured frontmatter checks alongside semantic review |
| Corrective plans | Corrective modifying files that later plans depend on | Check `depends_on` graph before generating correctives |
| Partial review | Can't detect integration issues between plans | Show dependency warnings in review output |
| Git state | Uncommitted changes cause review/reality mismatch | Check for uncommitted changes at review start |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase integration | HIGH | Read all relevant files. Plan frontmatter, STATE.md, workflow patterns all clear. |
| Workflow structure | HIGH | Follows established patterns from execute-plan, prepare-phase, plan-phase. |
| Review output format | MEDIUM | Based on UX patterns (progressive disclosure) and existing tool formats. Needs user testing. |
| Corrective plan generation | MEDIUM | Scoping logic based on CAPA patterns and `corrects` frontmatter. Edge cases possible. |
| Iteration termination | MEDIUM | 3-cycle max is heuristic from code review research. May need tuning. |

## Open Questions

- **Verification command re-running:** Should the review re-run plan verification commands (e.g., `npm test`, `curl` checks) or only inspect static code? Running verification is more thorough but slower and may fail for environmental reasons.
- **Review strictness configuration:** Should there be a per-feature config for review sensitivity (lenient/standard/strict)? Or let the conversation phase handle calibration naturally?
- **Cross-phase review:** Out of scope per FEATURE.md, but users may want to re-review Phase 1 after Phase 2 reveals issues. Currently no mechanism for this.
