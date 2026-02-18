---
task: semi-auto-default
phase: 1
title: Core Logic Changes
dependencies: []
creates: []
modifies:
  - specdacular/pipeline.json
  - specdacular/workflows/brain.md
  - specdacular/workflows/continue.md
  - specdacular/references/brain-routing.md
  - specdacular/references/execute-hooks.md
  - specdacular/references/resolve-pipeline.md
  - commands/specd/continue.md
---

## Objective

Update the core pipeline config and brain orchestrator to implement the new two-mode system (default + `--auto`).

## Context

- DEC-001: `pause_in_semi_auto` → `pause`
- DEC-002: Remove interactive mode
- DEC-003: Remove `enabled` field
- DEC-004: `pause` field renamed from `pause_in_semi_auto`
- Research: No dynamic usage of `enabled` found, safe to remove

## Tasks

### Task 1: Update pipeline.json

**Files:** `specdacular/pipeline.json`

**Action:**
- Remove `"mode": "interactive"` line (line 3)
- Remove all `"enabled": true` lines (lines 8, 18, 28, 44, 54, 64)
- Rename `"pause_in_semi_auto"` to `"pause"` everywhere (lines 10, 20, 30, 46, 56, 66)
- Keep values as-is: `false` for discuss/research/plan, `true` for execute/review/revise
- For steps where `pause` would be `false`, omit the field entirely (since false is the default)

**Verification:** `cat specdacular/pipeline.json | python3 -m json.tool` (valid JSON)

**Done when:**
- [ ] No `mode`, `enabled`, or `pause_in_semi_auto` fields exist
- [ ] `pause: true` only on execute, review, revise
- [ ] Valid JSON

### Task 2: Update brain.md

**Files:** `specdacular/workflows/brain.md`

**Action:**
- **parse_args step (~lines 34-45):** Remove `--semi-auto` flag check. Only check for `--auto`.
- **Mode resolution (~lines 65-71):** Remove pipeline.json `mode` field reading. Remove interactive default. Logic becomes: if `--auto` flag → auto mode, else → default mode.
- **dispatch_step (~lines 110-115):** Remove `enabled: false` skip logic entirely.
- **prompt_or_proceed (~lines 128-194):** Remove interactive mode branch entirely. Rename semi-auto to default behavior: check step's `pause` field (not `pause_in_semi_auto`). Keep auto mode as-is (proceed without prompting).
- **Summary section at bottom:** Update mode descriptions.
- Update purpose/description at top of file to reflect two modes.

**Verification:** Read the file, check no references to `semi-auto`, `interactive`, `enabled`, or `pause_in_semi_auto` remain.

**Done when:**
- [ ] Only two modes: default and auto
- [ ] No `--semi-auto` flag parsing
- [ ] No `enabled` skip logic
- [ ] `pause` field checked instead of `pause_in_semi_auto`

### Task 3: Update continue.md

**Files:** `specdacular/workflows/continue.md`

**Action:**
- Remove `--semi-auto` from arg parsing description (line 13)
- Update mode handling description (line 17) — remove "interactive/semi-auto/auto", replace with "default/auto"

**Done when:**
- [ ] No `semi-auto` or `interactive` references

### Task 4: Update brain-routing.md

**Files:** `specdacular/references/brain-routing.md`

**Action:**
- Remove `enabled` field skip logic (~lines 133-137): `If step.enabled == false: Skip to next step`
- Remove "research step is enabled" phrasing — just say "no RESEARCH.md"

**Done when:**
- [ ] No `enabled` references

### Task 5: Update execute-hooks.md

**Files:** `specdacular/references/execute-hooks.md`

**Action:**
- Remove the note about disabled steps (line 127): `Do NOT execute any hooks for disabled steps...`

**Done when:**
- [ ] No disabled step reference

### Task 6: Update resolve-pipeline.md

**Files:** `specdacular/references/resolve-pipeline.md`

**Action:**
- Change "enabled step" phrasing to just "step" (remove enabled qualifier)

**Done when:**
- [ ] No `enabled` references

### Task 7: Update commands/specd/continue.md

**Files:** `commands/specd/continue.md`

**Action:**
- Update `argument-hint` (line 4): `"[task-name] [--auto]"` (remove `--semi-auto`)
- Update mode descriptions (~lines 19-22): Remove interactive and semi-auto, describe default and `--auto`
- Update success criteria (~line 66): `--auto` flag respected (remove `--semi-auto`)

**Done when:**
- [ ] argument-hint only shows `--auto`
- [ ] Mode descriptions show default + `--auto` only
