---
task: context-tools
phase: 3
depends_on: [1, 2]
creates: []
modifies:
  - commands/specd/toolbox.md
---

# Phase 3: Toolbox Integration

## Objective

Wire the three context workflows into the existing `/specd:toolbox` command menu so users can access Context Review, Context Add, and Context Status from the toolbox.

## Context

**Reference these files:**
- `@commands/specd/toolbox.md` — Current toolbox command to modify
- `@.specd/codebase/PATTERNS.md` — Command-to-workflow dispatch pattern

**Relevant Decisions:**
- DEC-003: Toolbox integration, not standalone commands
- DEC-010: Context workflows skip task validation (toolbox currently validates task first — need conditional logic)

**From Research:**
- Toolbox currently requires task selection before showing menu
- Context operations are project-scoped, not task-scoped
- Need to either: (a) add context options before task selection, or (b) restructure toolbox to show operation categories first

---

## Tasks

### Task 1: Update toolbox.md command

**Files:** `commands/specd/toolbox.md`

**Action:**
Modify the toolbox command to support context operations alongside task operations.

**Approach:** Add context operations as a separate category in the toolbox. Before asking for a task name, present a top-level choice:

Update the `<execution_context>` section to:

1. **First, present operation category** using AskUserQuestion:
   - header: "Category"
   - question: "What type of operation?"
   - options:
     - "Task operations" — Work on a specific task (discuss, research, plan, execute, review)
     - "Context management" — Review, add to, or check status of codebase context

2. **If Task operations:** Continue with existing flow (validate task, then show task menu with Discuss/Research/Plan/Execute/Review)

3. **If Context management:** Present context menu using AskUserQuestion:
   - header: "Context"
   - question: "What would you like to do with the codebase context?"
   - options:
     - "Review" — Walk through a context file section by section
     - "Add" — Add new content to the codebase context
     - "Status" — Show context files dashboard with staleness info

   Based on selection, dispatch to:
   - Review → `@~/.claude/specdacular/workflows/context-review.md`
   - Add → `@~/.claude/specdacular/workflows/context-add.md`
   - Status → `@~/.claude/specdacular/workflows/context-status.md`

Also update the command description and objective to reflect the new context operations.

**Verify:**
```bash
grep -q "Context management" commands/specd/toolbox.md && echo "updated"
```

**Done when:**
- [ ] Toolbox shows "Task operations" and "Context management" as top-level categories
- [ ] Context management submenu shows Review, Add, Status
- [ ] Each context option dispatches to the correct workflow
- [ ] Existing task operations flow is preserved unchanged
- [ ] Command description updated to mention context management

---

### Task 2: Verify installation compatibility

**Files:** `bin/install.js`

**Action:**
Verify that the new workflow files will be correctly copied during installation. Check that:

1. `copyWithPathReplacement` will copy `specdacular/workflows/context-*.md` files (it recursively copies the `specdacular/` directory, so new files are automatically included)
2. Path references in the new workflow files use `~/.claude/` prefix (which gets rewritten for local installs)
3. No changes to `install.js` should be needed — verify this is the case

**Verify:**
```bash
# Check that workflows use correct path prefix
grep -l "~/.claude/specdacular" specdacular/workflows/context-*.md | wc -l
```

**Done when:**
- [ ] Confirmed new workflow files will be copied by existing install logic
- [ ] All `@` references in new workflows use `~/.claude/` prefix
- [ ] No changes needed to `bin/install.js`

---

## Verification

After all tasks complete:

```bash
grep -q "Context management" commands/specd/toolbox.md && \
[ -f "specdacular/workflows/context-status.md" ] && \
[ -f "specdacular/workflows/context-review.md" ] && \
[ -f "specdacular/workflows/context-add.md" ] && \
echo "phase 3 complete"
```

**Phase is complete when:**
- [ ] Toolbox updated with context operations
- [ ] All 3 workflows dispatched correctly from toolbox
- [ ] Installation compatibility confirmed

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/context-tools/CHANGELOG.md`.
