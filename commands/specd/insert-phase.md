---
name: specd:insert-phase
description: Insert a new phase after an existing one (decimal numbering)
argument-hint: "[feature-name] [after-phase] [description...]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

<objective>
Insert a new phase after an existing one using decimal numbering (e.g., Phase 03.1 after Phase 03).

**What it does:**
1. Parse arguments — feature name, target phase number, description
2. Validate — Feature exists, ROADMAP.md exists, target phase exists
3. Find next decimal — Scan existing decimals, calculate next (03.1, 03.2, etc.)
4. Create phase directory — `plans/phase-{NN.M}/`
5. Update ROADMAP.md — Insert new phase section with `(INSERTED)` marker
6. Update STATE.md — Add roadmap evolution note, add unchecked phase checkbox
7. Update config.json — Increment `phases_count`
8. Show next steps
</objective>

<execution_context>
@~/.claude/specdacular/workflows/insert-phase.md
</execution_context>

<context>
Arguments: $ARGUMENTS (expects: feature-name after-phase description...)

**Load feature context:**
@.specd/features/{name}/ROADMAP.md
@.specd/features/{name}/STATE.md
@.specd/features/{name}/config.json
</context>

<process>
1. **Parse Arguments** — Extract feature-name, after-phase (integer), description
2. **Validate** — Feature exists, ROADMAP.md exists, target phase exists
3. **Find Next Decimal** — Scan for existing decimal directories, calculate next
4. **Create Phase Directory** — `plans/phase-{NN.M}/`
5. **Update ROADMAP.md** — Insert after target phase with `(INSERTED)` marker
6. **Update STATE.md** — Add evolution note and unchecked checkbox
7. **Update config.json** — Increment `phases_count`
8. **Completion** — Show summary with next steps
</process>

<success_criteria>
- [ ] Arguments parsed correctly (feature, phase number, description)
- [ ] Feature and target phase validated
- [ ] Decimal number calculated correctly (based on existing decimals)
- [ ] Phase directory created: `plans/phase-{NN.M}/`
- [ ] ROADMAP.md updated with new phase entry (includes `(INSERTED)` marker)
- [ ] Phase inserted in correct position (after target phase, before next phase)
- [ ] STATE.md updated with roadmap evolution note and unchecked checkbox
- [ ] config.json `phases_count` incremented
- [ ] User informed of next steps
</success_criteria>
