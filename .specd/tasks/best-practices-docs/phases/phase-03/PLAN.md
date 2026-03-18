---
task: best-practices-docs
phase: 3
depends_on: [2]
creates: []
modifies:
  - specdacular/workflows/best-practices.md
  - specdacular/HELP.md
---

# Phase 3: Merge & Output

## Objective

Implement the merge_and_write step that combines 3 agent outputs into a clean `docs/best-practices.md`, and add the command to HELP.md.

## Context

**Reference these files:**
- `@specdacular/workflows/best-practices.md` — Workflow with merge placeholder step
- `@specdacular/HELP.md` — Help file where the new command needs an entry

**Relevant Decisions:**
- DEC-001: Present options, don't prescribe — merge must maintain tradeoff format
- DEC-002: Output stays separate — does NOT modify CLAUDE.md
- DEC-005: Organize by category — stack patterns, Claude Code ecosystem, tooling/DX
- DEC-006: Detect all stacks — output doc has per-stack sections where relevant

**From Research:**
- Run contradiction detection: same tech recommended differently by 2 agents
- Drop or flag unverified URL claims
- Stamp generation date with "re-run to refresh" note
- Agent outputs come as structured markdown with confidence levels

---

## Tasks

### Task 1: Implement Merge and Write Step

**Files:** `specdacular/workflows/best-practices.md`

**Action:**
Replace the placeholder in the `merge_and_write` step with logic to:

1. **Create output directory:** `mkdir -p docs`

2. **Build the output doc** by combining agent outputs into the DEC-005 structure:
   ```markdown
   # Best Practices: {Stacks} ({Project Name from directory})

   > Generated: {date} by `/specd.best-practices`
   > Re-run to refresh with latest recommendations.

   ## Detected Stack
   {$SELECTED_STACKS with framework details}

   ## Project Structure & Patterns
   {from $AGENT_1_OUTPUT — Stack Patterns agent}

   ## Claude Code Configuration
   ### CLAUDE.md Recommendations
   ### Recommended MCP Servers
   ### Skills & Hooks
   {from $AGENT_2_OUTPUT — Claude Code Ecosystem agent}

   ## Tooling & DX
   ### Linting & Formatting
   ### Testing
   ### CI/CD
   {from $AGENT_3_OUTPUT — Tooling & DX agent}

   ## Sources
   {aggregated from all agents}
   ```

3. **Contradiction detection:** Before writing, scan for cases where the same technology appears in multiple agent outputs with conflicting recommendations. If found, add a note in the relevant section.

4. **Handle partial results:** If an agent failed, include a note in that section: "This section has reduced coverage. Re-run to retry."

5. **Write the file** using the Write tool to `docs/best-practices.md`.

6. **Do NOT modify CLAUDE.md** (DEC-002).

**Verify:**
```bash
grep -q "merge_and_write" specdacular/workflows/best-practices.md && grep -v "Placeholder" specdacular/workflows/best-practices.md | grep -q "best-practices.md" && echo "OK" || echo "FAIL"
```

**Done when:**
- [ ] merge_and_write step has full merge logic
- [ ] Output doc structure matches DEC-005
- [ ] Contradiction detection included
- [ ] Partial failure handling included
- [ ] Generation date stamped

---

### Task 2: Add Help Entry

**Files:** `specdacular/HELP.md`

**Action:**
Add `/specd.best-practices` to the Utilities section of HELP.md. Follow the existing entry format.

Entry: `/specd.best-practices` — Detect tech stack and generate best practices reference doc

**Verify:**
```bash
grep -q "specd.best-practices" specdacular/HELP.md && echo "OK" || echo "FAIL"
```

**Done when:**
- [ ] Command appears in HELP.md Utilities section
- [ ] Format matches other entries

---

## Verification

After all tasks complete:

```bash
# Merge step is implemented (no more placeholder)
! grep -q "Placeholder: merge not yet implemented" specdacular/workflows/best-practices.md
# Help entry exists
grep -q "specd.best-practices" specdacular/HELP.md
echo "Phase 3 verification passed"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/best-practices-docs/CHANGELOG.md`.
