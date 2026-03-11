---
task: flow-changes
phase: 2
depends_on: [1]
creates:
  - specdacular/guardrails/specd-rules.txt
  - commands/specd.context.md
  - specdacular/workflows/context.md
modifies: []
---

# Phase 2: Guardrails Template & Context Command

## Objective

Create a `/specd.context` command that loads task state and injects behavioral rules, plus the guardrails template used by both the command and the future RALPH loop.

## Context

**Reference these files:**
- `@commands/specd.continue.md` — Pattern for command structure (YAML frontmatter + execution_context + context)
- `@specdacular/workflows/status.md` — Pattern for read-only workflow (reads state, outputs summary, no file writes)
- `@specdacular/references/resolve-task.md` — Task resolution (created in Phase 1)

**Relevant Decisions:**
- DEC-003: Context command as read-only loader with behavioral guardrails. Re-runnable mid-conversation.
- DEC-004: Steering as guardrail behavior, not a command. Direction-change detection included in guardrails.
- DEC-001: state.json for task resolution (use resolve-task.md).

**From Research:**
- Guardrails should be under 60 lines with 2-3 IMPORTANT rules max
- Two-layer model: advisory rules (CLAUDE.md/guardrails) + deterministic hooks (for hard stops)
- Direction-change detection: detect phrases like "actually", "let's change", "forget that"
- Context compaction drops early system instructions — keep injected context short
- Reserve "IMPORTANT" for critical invariants only

**Phase 1 outcomes:**
- resolve-task.md created and working — use it for task resolution in the context command

---

## Tasks

### Task 1: Create Guardrails Template

**Files:** `specdacular/guardrails/specd-rules.txt`

**Action:**
Create a behavioral guardrails file under 60 lines. This file is injected by `/specd.context` and by the RALPH loop (Phase 4) via `--append-system-prompt-file`.

Content should include:

1. **State management rules (IMPORTANT):**
   - Read STATE.md at session start — single source of truth
   - After completing a step, update STATE.md and config.json before anything else

2. **File conventions:**
   - All task documents go in `.specd/tasks/{task-name}/`
   - Use DEC-{NNN} format for decisions
   - Respect auto_commit_docs and auto_commit_code settings in .specd/config.json
   - Never modify files outside the current phase's designated scope

3. **Commit format:**
   - Follow commit-docs.md and commit-code.md patterns
   - Do not improvise commit messages

4. **Direction-change detection:**
   - If user says anything suggesting a change ("actually", "let's change", "forget that", "different approach", "new requirement"):
     1. STOP current work
     2. State the detected direction change
     3. Ask to update specs
     4. Do NOT continue old plan until confirmed

5. **Conflict resolution:**
   - If STATE.md and filesystem disagree, surface the conflict — do not resolve silently

Keep it concise. Use plain text (not markdown) since it goes into `--append-system-prompt-file`.

**Verify:**
```bash
wc -l specdacular/guardrails/specd-rules.txt | awk '{print ($1 <= 60) ? "OK" : "TOO LONG: "$1" lines"}'
```

**Done when:**
- [ ] specd-rules.txt exists under 60 lines
- [ ] Contains state management, file conventions, commit format, direction-change detection, conflict resolution
- [ ] Uses IMPORTANT sparingly (2-3 times max)

---

### Task 2: Create commands/specd.context.md

**Files:** `commands/specd.context.md`

**Action:**
Create a thin command wrapper following the existing command pattern (see specd.continue.md, specd.status.md).

- YAML frontmatter: name, description, argument-hint, allowed-tools (Read, Glob, Bash only — this is read-only)
- `<objective>`: Read-only context loader that displays task summary and injects behavioral guardrails. Re-runnable mid-conversation.
- `<execution_context>`: Reference the context workflow at `@~/.claude/specdacular/workflows/context.md`
- `<context>`: Reference resolve-task.md for task resolution, reference the guardrails file

**Verify:**
```bash
[ -f "commands/specd.context.md" ] && echo "OK"
```

**Done when:**
- [ ] Command file exists with proper YAML frontmatter
- [ ] Points to context.md workflow
- [ ] Uses resolve-task.md for task resolution

---

### Task 3: Create specdacular/workflows/context.md

**Files:** `specdacular/workflows/context.md`

**Action:**
Create a read-only workflow that:

1. **Resolves task** using resolve-task.md
2. **Loads task state** — reads config.json, STATE.md, DECISIONS.md, CONTEXT.md, ROADMAP.md (if exists)
3. **Displays summary:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    CONTEXT: {task-name}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   **Stage:** {stage}
   **Phase:** {current}/{total} — {phase name}
   **Decisions:** {count} active

   **Gray areas:** {count remaining or "all resolved"}
   **Next step:** {from STATE.md}
   ```
4. **Injects guardrails** by referencing the specd-rules.txt file:
   ```
   @~/.claude/specdacular/guardrails/specd-rules.txt
   ```

This is a read-only workflow — it does NOT modify any files, does NOT commit. It only reads and displays.

Follow the `<purpose>`, `<process>` with `<step>` pattern used by other workflows.

**Verify:**
```bash
cat specdacular/workflows/context.md | grep -q "specd-rules.txt" && echo "OK"
```

**Done when:**
- [ ] Workflow reads task state and displays summary
- [ ] Injects guardrails via @reference to specd-rules.txt
- [ ] Does not modify any files (read-only)
- [ ] Follows existing workflow structure patterns

---

## Verification

After all tasks complete:

```bash
# Guardrails exist and are under 60 lines
[ -f "specdacular/guardrails/specd-rules.txt" ] && echo "guardrails: OK"
wc -l specdacular/guardrails/specd-rules.txt | awk '{print ($1 <= 60) ? "length: OK" : "TOO LONG"}'

# Command and workflow exist
[ -f "commands/specd.context.md" ] && echo "command: OK"
[ -f "specdacular/workflows/context.md" ] && echo "workflow: OK"

# Workflow references guardrails
grep -q "specd-rules.txt" specdacular/workflows/context.md && echo "guardrails-ref: OK"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] Guardrails template is under 60 lines with proper rules
- [ ] `/specd.context` command loads task state and injects guardrails

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/flow-changes/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
