---
task: fix-slowness
phase: 3
depends_on: [2]
creates: []
modifies:
  - specdacular/references/load-context.md
  - specdacular/references/execute-hooks.md
  - specdacular/references/validate-task.md
  - specdacular/workflows/execute.md
  - All workflow files (16 total)
  - All reference files with preambles (7 total)
---

# Phase 3: Context & Bloat Reduction

## Objective

Reduce workflow token footprint by ~40-50%. Add lean context loading for execution mode. Remove bloat patterns (success_criteria, philosophy blocks, preambles) across all files.

## Context

**From Phase 1 & 2:**
- specd-utils.js handles all mechanical operations
- commit refs and brain-routing already slimmed
- Workflow files still carry ~2,500+ lines of bloat

**Relevant Decisions:**
- DEC-003: Lean context loading for execution mode — skip CONTEXT.md, MAP.md, STRUCTURE.md, CONCERNS.md during execute

**From Research:**
- execute-hooks.md (127 lines) expanded ~12 times per 3-phase task = ~1,524 context lines even with no hooks
- ~130 lines total across 16 `<success_criteria>` blocks
- ~100 lines total across 14 `<philosophy>` blocks (some contain behavioral instructions)
- ~60 lines total across 7 preambles

---

## Tasks

### Task 1: Add execution mode to load-context.md

**Files:** `specdacular/references/load-context.md`

**Action:**
Add a second mode to load-context.md. When the caller sets `$CONTEXT_MODE = execution`, only load:
- FEATURE.md (requirements)
- DECISIONS.md (constraints)
- Current phase PLAN.md
- PATTERNS.md (code examples)
- Optionally: RESEARCH.md, CHANGELOG.md

Skip: CONTEXT.md, STATE.md, config.json, MAP.md, STRUCTURE.md, CONCERNS.md

Also remove the "Before using this reference" preamble. Remove the "What to Extract After Loading" section (Claude already knows what to extract).

Update execute.md to set `$CONTEXT_MODE = execution` before calling load-context.

**Verify:**
```bash
grep -c 'CONTEXT_MODE' specdacular/references/load-context.md
wc -l specdacular/references/load-context.md
```

**Done when:**
- [ ] load-context.md has execution mode that skips unnecessary files
- [ ] load-context.md is ≤50 lines
- [ ] execute.md sets CONTEXT_MODE = execution
- [ ] Preamble removed

---

### Task 2: Compress execute-hooks.md

**Files:** `specdacular/references/execute-hooks.md`

**Action:**
Compress from 127 → ~40 lines by:
1. Remove preamble ("Before using this reference")
2. Merge "Resolve Hook" and "Execute Hook" into a single flow
3. Remove verbose subagent template — replace with brief description
4. Keep: hook resolution logic, inline/subagent modes, error handling, execution order
5. Remove redundant section headers and blank lines

**Verify:**
```bash
wc -l specdacular/references/execute-hooks.md
```

**Done when:**
- [ ] execute-hooks.md is ≤50 lines
- [ ] Hook resolution, execution, and error handling all preserved
- [ ] No preamble

---

### Task 3: Trim validate-task.md

**Files:** `specdacular/references/validate-task.md`

**Action:**
Remove verbose error message templates. Keep the bash validation logic. The error messages can be one-liners — Claude will format them appropriately.

Remove preamble. Target: ~40 lines.

**Verify:**
```bash
wc -l specdacular/references/validate-task.md
```

**Done when:**
- [ ] validate-task.md is ≤45 lines
- [ ] All validation checks preserved
- [ ] Error templates removed (one-liners instead)

---

### Task 4: Remove success_criteria and trim philosophy blocks across all files

**Files:** All 16 workflow files with `<success_criteria>`, all 14 with `<philosophy>`

**Action:**
For each workflow file:
1. Remove `<success_criteria>...</success_criteria>` block entirely
2. For `<philosophy>` blocks: check if any contain behavioral instructions (not just commentary). If behavioral, move the instruction inline into the relevant `<step>`. Then remove the `<philosophy>` block.
3. Remove remaining preambles from reference files (record-decision.md, resolve-pipeline.md, spawn-research-agents.md, synthesize-research.md)

**Files to modify:**
- Workflows: brain.md, config.md, context-add.md, context-manual-review.md, continue.md, discuss.md, execute.md, map-codebase.md, new-project.md, new.md, phase-plan.md, plan.md, research.md, review.md, revise.md, toolbox.md
- References: record-decision.md, resolve-pipeline.md, spawn-research-agents.md, synthesize-research.md

**Verify:**
```bash
grep -c '<success_criteria>' specdacular/workflows/*.md specdacular/references/*.md 2>/dev/null | grep -v ':0$' | wc -l
grep -c 'Before using this reference' specdacular/references/*.md 2>/dev/null | grep -v ':0$' | wc -l
```
Both should return 0.

**Done when:**
- [ ] Zero `<success_criteria>` blocks in any file
- [ ] Zero "Before using this reference" preambles in any reference
- [ ] Behavioral instructions from philosophy blocks preserved inline
- [ ] Commentary-only philosophy blocks removed

---

## Verification

After all tasks complete:

```bash
# Execution mode exists
grep 'CONTEXT_MODE' specdacular/references/load-context.md

# execute-hooks compressed
wc -l specdacular/references/execute-hooks.md  # ≤50

# No success_criteria blocks
grep -rl '<success_criteria>' specdacular/workflows/ specdacular/references/ 2>/dev/null | wc -l  # 0

# No preambles
grep -rl 'Before using this reference' specdacular/references/ 2>/dev/null | wc -l  # 0

# Total line reduction
wc -l specdacular/workflows/*.md specdacular/references/*.md | tail -1
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] load-context.md has execution mode
- [ ] execute-hooks.md ≤50 lines
- [ ] Zero success_criteria blocks
- [ ] Zero preambles in references
- [ ] Total line count reduced by ≥20%

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/fix-slowness/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
