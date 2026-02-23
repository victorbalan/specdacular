---
task: brain-and-hooks
phase: 4
depends_on: [1, 2, 3]
creates: []
modifies:
  - commands/specd.continue.md
  - specdacular/workflows/brain.md
---

# Phase 4: Integration + Command Wiring

## Objective

Wire the brain into the command entry point, ensure the installed command references brain.md correctly, and verify the full pipeline works end-to-end. Update FEATURE.md and DECISIONS.md with any new decisions from implementation.

## Context

**Reference these files:**
- `@commands/specd.continue.md` — Command entry point that invokes the workflow
- `@specdacular/workflows/brain.md` — The brain (from Phases 1-3)
- `@specdacular/workflows/continue.md` — Thinned workflow (from Phase 3)
- `@bin/install.js` — Installer that copies files

**Relevant Decisions:**
- DEC-004: pipeline.json copied during install
- DEC-010: Modes preserved via CLI flags

**From Research:**
- install.js copyWithPathReplacement handles pipeline.json automatically (no code changes)
- CLI flags (--semi-auto, --auto) override pipeline.json mode
- Argument parsing lives exclusively in brain.md (Pitfall #11)

---

## Tasks

### Task 1: Update continue command entry point

**Files:** `commands/specd.continue.md`

**Action:**
Ensure the command file's `<execution_context>` points to the continue.md workflow (which now delegates to brain.md). Check that allowed-tools includes everything the brain needs (Read, Write, Bash, Glob, Grep, Task, AskUserQuestion, Edit).

The command should preserve its current argument-hint for task name and mode flags.

**Verify:**
```bash
grep -q "execution_context" commands/specd.continue.md && echo "has execution context"
```

**Done when:**
- [ ] Command entry point references continue.md workflow
- [ ] allowed-tools list includes all brain-required tools
- [ ] argument-hint preserved

---

### Task 2: Verify pipeline.json install path

**Files:** `specdacular/pipeline.json`

**Action:**
Verify that `pipeline.json` will be correctly copied during install. Check:
1. File is in `specdacular/` directory (which install.js copies recursively)
2. No absolute path references that would need replacement (pipeline.json uses relative workflow names)
3. Brain's resolve-pipeline.md uses the correct installed path pattern

Run a local install test if possible:
```bash
node bin/install.js --local
```

Check that pipeline.json appears in `.claude/specdacular/pipeline.json`.

**Verify:**
```bash
[ -f "specdacular/pipeline.json" ] && echo "source exists"
```

**Done when:**
- [ ] pipeline.json is in the correct source directory
- [ ] No absolute paths in the file
- [ ] Brain's resolution logic matches install destination

---

### Task 3: End-to-end pipeline validation

**Files:** `specdacular/workflows/brain.md`

**Action:**
Review brain.md for completeness and correctness:

1. **Pipeline resolution:** Brain correctly loads `.specd/pipeline.json` → fallback → default
2. **State routing:** All 8 state combinations route to correct pipeline steps
3. **Mode handling:** Interactive prompts match continue.md's original UX, semi-auto uses `pause_in_semi_auto`, auto proceeds
4. **Hook execution:** Full hook lifecycle (resolution, inline/subagent, optional/required)
5. **Phase loop:** Correctly advances phases, handles decimal phases, terminates when all complete
6. **Stop/resume:** State saved correctly for `/specd.continue` resume
7. **Error handling:** Step failure stops pipeline, optional hook failure logs and continues

Fix any gaps found during review.

**Verify:**
```bash
grep -q "resolve_pipeline" specdacular/workflows/brain.md && grep -q "phase_loop\|phase-execution" specdacular/workflows/brain.md && echo "brain has key sections"
```

**Done when:**
- [ ] Brain handles all routing cases
- [ ] No step workflow still contains flow control
- [ ] Phase loop handles decimal phases
- [ ] All 3 modes work correctly

---

## Verification

After all tasks complete:

```bash
echo "=== Files exist ===" && \
[ -f "specdacular/pipeline.json" ] && \
[ -f "specdacular/workflows/brain.md" ] && \
[ -f "specdacular/workflows/revise.md" ] && \
[ -f "specdacular/references/resolve-pipeline.md" ] && \
[ -f "specdacular/references/brain-routing.md" ] && \
echo "=== All files present ===" && \
echo "=== Phase 4 complete ==="
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] Command entry point wired correctly
- [ ] pipeline.json installs correctly
- [ ] Brain is complete and handles all cases

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/brain-and-hooks/CHANGELOG.md`.
