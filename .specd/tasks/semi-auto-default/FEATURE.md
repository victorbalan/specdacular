# Semi-Auto as Default Mode

## Summary

Simplify the mode system. Semi-auto becomes the default behavior (no flag). Only `--auto` remains as a flag. Clean up pipeline config by removing `pause_in_semi_auto` (replace with `pause`) and removing the `enabled` field entirely.

## Requirements

### Mode System Changes
- **Default mode = current semi-auto behavior**: brain auto-runs steps where `pause: false`, pauses where `pause: true`
- **`--auto` flag**: runs everything without pausing, only stops on errors or task completion
- **Remove `--semi-auto` flag**: no longer needed since it's the default
- **Remove `interactive` mode concept**: no more prompting at every stage transition
- **Remove `mode` field from pipeline.json**: no longer needed (default is semi-auto, only override is `--auto`)

### Pipeline Config Cleanup
- **Replace `pause_in_semi_auto`** with `pause` (boolean, defaults to `false`) — cleaner name
- **Remove `enabled` field** from all steps — if a step shouldn't run, remove/comment it from the config
- Brain skip logic for `enabled: false` is removed
- **Remove `mode` field** from pipeline.json

### Pause Behavior
- Normal mode: brain checks `pause` field — if `true`, prompt user; if `false`/absent, auto-proceed
- `--auto` mode: ignores `pause` entirely, runs everything
- Main pipeline steps: `pause` absent (auto-run)
- Phase-execution steps: `pause: true` (prompt user)

## Files to Modify

### Core
- `specdacular/pipeline.json` — remove `mode`, rename `pause_in_semi_auto` → `pause`, remove `enabled`
- `specdacular/workflows/brain.md` — update mode parsing, remove `--semi-auto` flag handling, remove `enabled` skip logic, simplify prompt_or_proceed to only check `pause` field
- `specdacular/references/brain-routing.md` — update routing docs to reflect new mode system

### Documentation
- `specdacular/STATE-MACHINE.md` — update pipeline config reference, remove `enabled` field docs
- `specdacular/HELP.md` — update mode descriptions, remove semi-auto flag
- `README.md` — update mode docs, pipeline examples, CLI flags
- `commands/specd/continue.md` — update argument-hint and description (remove `--semi-auto`)

### Hooks Reference
- `specdacular/references/execute-hooks.md` — remove disabled step hook skip logic

## Non-Goals
- No changes to the routing table or state machine logic
- No changes to hook execution order
- No changes to step workflows themselves
