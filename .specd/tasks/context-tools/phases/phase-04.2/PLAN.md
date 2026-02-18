---
task: context-tools
phase: 4.2
depends_on: [4]
modifies:
  - commands/specd/toolbox.md
---

# Phase 4.2: Fix — Toolbox context-review routing

## Objective

Fix the toolbox's Context → Review flow so that Claude properly follows the context-review workflow instead of hallucinating a "hasn't been created yet" message.

## Root Cause

The toolbox command embeds 9+ workflow files via `@` references. When Claude needs to follow just one (context-review), it gets confused by the volume and improvises instead. Fix: replace auto-embedded `@` references for context workflows with explicit Read-on-demand instructions.

## Tasks

### Task 1: Replace @ references with Read-on-demand for context workflows

**Files:** `commands/specd/toolbox.md`

**Action:**
Remove `@` prefix from context workflow references so they are NOT auto-embedded. Add explicit instruction to Read the workflow file and follow its process.

**Done when:**
- [x] Context workflow references use Read-on-demand (no `@` prefix)
- [x] IMPORTANT note prevents improvisation
