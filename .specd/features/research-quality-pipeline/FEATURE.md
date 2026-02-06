# Feature: research-quality-pipeline

## What This Is

Preserve research confidence levels through the entire pipeline (research → synthesis → planning → execution). Add staleness detection for codebase docs and conflict detection between research findings and existing decisions. Ensures Claude treats HIGH and LOW confidence findings differently during planning and execution.

## Technical Requirements

### Must Create

- [ ] Confidence-annotated RESEARCH.md format — Each finding tagged with confidence level (HIGH/MEDIUM/LOW), verification source, and affected phases
- [ ] Confidence-aware PLAN.md "From Research" section — Separate HIGH confidence (use directly) from LOW confidence (verify before implementing)
- [ ] Codebase docs staleness detection — `metadata.json` in `.specd/codebase/` tracking `generated_at`, `git_sha`, `files_analyzed`
- [ ] Conflict detection protocol — Research synthesis workflow compares findings against DECISIONS.md and flags contradictions
- [ ] Staleness warning in workflows — Check if codebase docs are >50 commits behind HEAD, warn user

### Must Integrate With

- `specdacular/workflows/research-feature.md` — Must produce confidence-annotated findings
- `specdacular/workflows/research-phase.md` — Must produce confidence-annotated findings
- `specdacular/agents/feature-researcher.md` — Agent must tag confidence on each finding
- `specdacular/workflows/plan-feature.md` — Must separate HIGH vs LOW confidence in "From Research" section
- `specdacular/workflows/plan-phase.md` — Must separate HIGH vs LOW confidence
- `specdacular/templates/features/RESEARCH.md` — Template must include confidence fields
- `specdacular/templates/features/PLAN.md` — Template must include confidence-aware "From Research"
- `.specd/codebase/` — Must add `metadata.json` for staleness tracking
- `specdacular/workflows/map-codebase.md` — Must write `metadata.json` when generating codebase docs

### Constraints

- **Confidence is inherited, not inflated** — Synthesis can only maintain or lower confidence, never raise it
- **Verification is explicit** — HIGH confidence requires codebase verification (code found in actual files). MEDIUM is from official docs. LOW is from community/blog sources.
- **Staleness is a warning, not a blocker** — Stale codebase docs trigger a warning, not a hard stop
- **No new dependencies** — Use git commands for SHA comparison, not external tools

---

## Success Criteria

- [ ] RESEARCH.md findings each have `**Confidence:**` and `**Phases:**` fields
- [ ] PLAN.md "From Research" section clearly separates HIGH vs LOW confidence items
- [ ] LOW confidence items in plans include "verify before implementing" instruction
- [ ] `.specd/codebase/metadata.json` exists after `map-codebase` with `generated_at` and `git_sha`
- [ ] Workflows warn when codebase docs are >50 commits behind current HEAD
- [ ] Research synthesis flags conflicts with existing decisions (e.g., "Research suggests X but DEC-003 decided Y")

---

## Out of Scope

- [X] Automated re-research — Staleness detection warns but doesn't auto-refresh
- [X] Confidence scoring algorithms — Confidence is Claude's judgment, not a formula
- [X] Research versioning — No version history for RESEARCH.md, just latest synthesis

---

## Initial Context

### User Need
Research agents mark findings with confidence levels, but this information is lost during synthesis. The synthesized RESEARCH.md doesn't flag low-confidence findings. Plans reference research with a tiny "From Research" section that can't capture confidence nuance. Claude treats all findings equally, leading to plans built on shaky foundations. Codebase docs have no timestamps so Claude can't tell if they're current.

### Integration Points
- Research workflows (produce confidence-tagged findings)
- Research agent definitions (tag confidence per finding)
- Planning workflows (consume confidence-aware research)
- Templates for RESEARCH.md and PLAN.md
- map-codebase workflow (write metadata.json)
- All workflows that load codebase docs (staleness check)

### Key Constraints
- Confidence is qualitative (Claude's judgment), not quantitative
- Must not slow down research or planning workflows
- Staleness check is a simple git comparison
