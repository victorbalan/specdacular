---
task: semi-auto-default
phase: 2
title: Documentation Updates
dependencies: [1]
creates: []
modifies:
  - specdacular/STATE-MACHINE.md
  - specdacular/HELP.md
  - README.md
---

## Objective

Update all documentation to reflect the new two-mode system.

## Context

Phase 1 updated the core logic. This phase updates documentation that references the old three-mode system.

## Tasks

### Task 1: Update STATE-MACHINE.md

**Files:** `specdacular/STATE-MACHINE.md`

**Action:**
- Update the full pipeline.json example (~lines 280-340):
  - Remove `"mode": "interactive"` line
  - Remove all `"enabled": true` lines
  - Rename `"pause_in_semi_auto"` → `"pause"` everywhere
  - Omit `pause` where value would be `false` (discuss, research, plan)
- Update the step fields table (~line 347-350):
  - Remove `enabled` row
  - Change `pause_in_semi_auto` row to `pause` with updated description

**Done when:**
- [ ] Pipeline example matches new format
- [ ] Step fields table updated

### Task 2: Update HELP.md

**Files:** `specdacular/HELP.md`

**Action:**
- Update command table (~line 12): Remove `--semi-auto` from continue command
- Update modes line (~line 41): `Modes: default (auto-runs to execution, pauses at phase steps), --auto (run everything)`
- Update modes table (~lines 72-76): Two rows — Default and Auto
- Remove "Enable/disable steps" line (~line 88)
- Remove "Change mode" line (~line 89)

**Done when:**
- [ ] Only default and `--auto` modes documented
- [ ] No `enabled`, `semi-auto`, or `interactive` references

### Task 3: Update README.md

**Files:** `README.md`

**Action:**
- Update continue examples (~lines 141-143): Remove `--semi-auto` example, update default description
- Update command table (~line 171): Remove `--semi-auto` from argument hint
- Update modes table (~lines 275-278): Two rows — Default and Auto
- Update pipeline JSON example (~lines 289-300): Remove `mode`, `enabled`, rename `pause_in_semi_auto` → `pause`
- Remove "Enable/disable steps" line (~line 309)
- Remove "Change mode" line (~line 310)

**Done when:**
- [ ] Only default and `--auto` modes documented
- [ ] Pipeline JSON example matches new format
- [ ] No `enabled`, `semi-auto`, or `interactive` mode references
