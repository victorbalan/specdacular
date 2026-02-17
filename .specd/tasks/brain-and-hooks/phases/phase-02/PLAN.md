---
task: brain-and-hooks
phase: 2
depends_on: [1]
creates: []
modifies:
  - specdacular/workflows/brain.md
  - specdacular/references/resolve-pipeline.md
---

# Phase 2: Hook System

## Objective

Add hook resolution, execution (inline + subagent), and error handling to the brain. After this phase, the brain fully supports pre/post hooks on every step plus global pre-step/post-step hooks.

## Context

**Reference these files:**
- `@specdacular/workflows/brain.md` — Brain from Phase 1 (has hook placeholders)
- `@specdacular/pipeline.json` — Hook config shape
- `@.specd/codebase/PATTERNS.md` — Parallel agent spawning pattern (for subagent hooks)

**Relevant Decisions:**
- DEC-002: Hooks are markdown workflows only
- DEC-005: No special output contract — hooks modify task files directly
- DEC-006: Configurable inline vs subagent, default inline
- DEC-007: Optional flag — false stops pipeline, true logs and continues

**From Research:**
- Hook execution order: global pre-step → step pre → STEP → step post → global post-step
- Convention-based discovery as fallback: `.specd/hooks/pre-{step-name}.md`
- Flush state to disk before spawning subagent hooks (Pitfall #7)
- Establish append-only convention for hooks writing to shared files (Pitfall #4)
- Log optional hook failures visibly + to CHANGELOG.md (Pitfall #13)
- Don't run global hooks on disabled steps (Research finding #4)

---

## Tasks

### Task 1: Add hook resolution logic to brain.md

**Files:** `specdacular/workflows/brain.md`

**Action:**
Add a `resolve_hooks` step to brain.md that, for each step about to be dispatched:

1. Check step's `hooks.pre` and `hooks.post` in pipeline.json (explicit config)
2. If null, check `.specd/hooks/pre-{step-name}.md` and `.specd/hooks/post-{step-name}.md` (convention fallback)
3. Check global `hooks.pre-step` and `hooks.post-step`
4. Build execution list: [global pre-step, step pre, STEP, step post, global post-step]
5. Skip hooks that resolve to null/no file found
6. Skip all hooks for disabled steps

Hook config shape when not null:
```json
{ "workflow": "path/to/hook.md", "mode": "inline", "optional": false }
```

If convention-discovered (file exists but no config), default to: `{ "mode": "inline", "optional": false }`.

**Verify:**
```bash
grep -c "resolve_hooks\|hook" specdacular/workflows/brain.md
```

**Done when:**
- [ ] Hook resolution logic handles explicit + convention fallback
- [ ] Builds correct execution order (global pre → step pre → STEP → step post → global post)
- [ ] Skips hooks for disabled steps

---

### Task 2: Add inline hook execution

**Files:** `specdacular/workflows/brain.md`

**Action:**
Add inline hook execution to the brain's dispatch flow. For hooks with `mode: "inline"`:

1. Brain reads the hook markdown file
2. Brain executes the hook's instructions in its own context (same as executing any workflow step)
3. Hook has full access to task files (FEATURE.md, CONTEXT.md, DECISIONS.md, etc.)
4. After hook completes, brain continues to next item in execution list

For error handling:
- If `optional: false` and hook fails → stop pipeline, save state, surface error
- If `optional: true` and hook fails → print visible warning (`[HOOK SKIPPED] pre-plan.md failed: {reason}`), append to CHANGELOG.md, continue

**Verify:**
```bash
grep -c "inline\|optional" specdacular/workflows/brain.md
```

**Done when:**
- [ ] Inline hooks execute in brain's context
- [ ] Optional vs required error handling works
- [ ] Failed optional hooks produce visible warnings + CHANGELOG entry

---

### Task 3: Add subagent hook execution

**Files:** `specdacular/workflows/brain.md`

**Action:**
Add subagent hook execution for hooks with `mode: "subagent"`:

1. Before spawning, flush all pending state writes to disk (Pitfall #7)
2. Spawn hook as a Task agent with `run_in_background: false` (wait for completion)
3. Pass the hook markdown file path and task context in the prompt
4. Subagent reads task files from disk, executes hook instructions, writes changes
5. After subagent returns, brain continues

Use the same optional/required error handling as inline hooks.

**Verify:**
```bash
grep -c "subagent\|Task" specdacular/workflows/brain.md
```

**Done when:**
- [ ] Subagent hooks spawn with correct context
- [ ] Brain flushes state before spawning
- [ ] Same error handling as inline hooks

---

## Verification

After all tasks complete:

```bash
grep -q "resolve_hooks" specdacular/workflows/brain.md && grep -q "inline" specdacular/workflows/brain.md && grep -q "subagent" specdacular/workflows/brain.md && echo "Phase 2 complete"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] brain.md supports full hook lifecycle (resolution, inline, subagent)
- [ ] Hook execution order is correct (global → step → STEP → step → global)
- [ ] Error handling distinguishes optional vs required

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/brain-and-hooks/CHANGELOG.md`.
