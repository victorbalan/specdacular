---
task: context-tools
phase: 4.2
depends_on: [4]
modifies:
  - .claude/commands/specd/toolbox.md
---

# Phase 4.2: Fix — Toolbox context-review routing

## Objective

Fix the toolbox's Context → Review flow so that Claude properly follows the context-review workflow instead of hallucinating a "hasn't been created yet" message.

## Root Cause Analysis

The toolbox command embeds 9+ workflow files via `@` references — all task workflows (discuss, research, plan, execute, review) plus all context workflows (status, review, add). When Claude needs to follow just one (context-review), it gets confused by the volume of embedded content and improvises instead.

The `continue.md` command avoids this by only embedding the single `continue.md` workflow in `execution_context` and listing delegates in the `context` section. The continue workflow itself then dispatches to specific sub-workflows.

## Tasks

### Task 1: Restructure toolbox context flow delegation

**Files:** `.claude/commands/specd/toolbox.md`

**Action:**
The current toolbox embeds all workflow files inline. Instead, make the context flow's delegation explicit by having Claude READ the workflow file at dispatch time rather than relying on pre-embedded `@` content.

Replace the Context Flow delegation section:

**Current:**
```
Based on selection, delegate to the appropriate workflow:
- Status → @./.claude/specdacular/workflows/context-status.md
- Review → @./.claude/specdacular/workflows/context-review.md
- Add → @./.claude/specdacular/workflows/context-add.md
```

**New:**
```
Based on selection, read and follow the appropriate workflow:
- Status → Read `.claude/specdacular/workflows/context-status.md` and follow its process
- Review → Read `.claude/specdacular/workflows/context-review.md` and follow its process
- Add → Read `.claude/specdacular/workflows/context-add.md` and follow its process

IMPORTANT: Use the Read tool to load the selected workflow file, then execute its <process> steps in order. Do NOT improvise — the workflow file contains the complete process.
```

Also remove the `@` prefix from these three context workflow references so they are NOT auto-embedded at command load time. This reduces the embedded content and makes the dispatch explicit.

**Verify:**
```bash
# No @ references for context workflows (they should be Read-on-demand)
! grep -q "@./.claude/specdacular/workflows/context-" .claude/commands/specd/toolbox.md && echo "OK: no embedded context workflows"
```

**Done when:**
- [ ] Context workflow references are NOT `@`-prefixed (not auto-embedded)
- [ ] Explicit instruction to Read the workflow file and follow its process
- [ ] IMPORTANT note prevents improvisation

---

## Verification

```bash
# No auto-embedded context workflow references
! grep -q "@./.claude/specdacular/workflows/context-" .claude/commands/specd/toolbox.md && echo "routing: OK"

# Workflow files still referenced by path (just not @-prefixed)
grep -q "context-review.md" .claude/commands/specd/toolbox.md && echo "reference: OK"
```
