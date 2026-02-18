# Semi-Auto as Default Mode

## Summary

Simplify the mode system. Semi-auto becomes the default behavior (no flag). Add `--interactive` and `--auto` as opt-in flags. Clean up pipeline config by removing `pause_in_semi_auto` (replace with `pause`) and removing the `enabled` field entirely. Brain should be smart about skipping unnecessary steps.

## Requirements

### Mode System Changes
- **Default mode = current semi-auto behavior**: brain auto-runs steps where `pause: false`, pauses where `pause: true`
- **`--interactive` flag**: prompts at every stage transition with options to skip/jump
- **`--auto` flag**: runs everything without pausing, only stops on errors or task completion
- **Remove `--semi-auto` flag**: no longer needed since it's the default
- **Remove `mode` field from pipeline.json**: no longer needed

### Smart Step Skipping (default and auto modes)
- Brain evaluates whether a step adds value before running it
- Skip research on trivial/straightforward phases
- Skip discussion when no gray areas remain
- In interactive mode, the user decides — brain still presents the option but can recommend skipping

### Pipeline Config Cleanup
- **Replace `pause_in_semi_auto`** with `pause` (boolean, defaults to `false`) — cleaner name
- **Remove `enabled` field** from all steps — if a step shouldn't run, remove/comment it from the config
- Brain skip logic for `enabled: false` is removed
- **Remove `mode` field** from pipeline.json

### Pause Behavior
- Default mode: brain checks `pause` field — if `true`, prompt user; if `false`/absent, auto-proceed
- `--interactive` mode: prompts at every step with skip/jump options
- `--auto` mode: ignores `pause` entirely, runs everything
- Main pipeline steps: `pause` absent (auto-run)
- Phase-execution steps: `pause: true` (prompt user)

## Files to Modify

### Core
- `specdacular/pipeline.json` — remove `mode`, rename `pause_in_semi_auto` → `pause`, remove `enabled`
- `specdacular/workflows/brain.md` — update mode parsing, add `--interactive`, remove `--semi-auto`, remove `enabled` skip logic, update prompt_or_proceed for three modes
- `specdacular/references/brain-routing.md` — update routing docs to reflect new mode system

### Documentation
- `specdacular/STATE-MACHINE.md` — update pipeline config reference, remove `enabled` field docs
- `specdacular/HELP.md` — update mode descriptions
- `README.md` — update mode docs, pipeline examples, CLI flags
- `commands/specd/continue.md` — update argument-hint and description

### Hooks Reference
- `specdacular/references/execute-hooks.md` — remove disabled step hook skip logic

## Non-Goals
- No changes to hook execution order
- No changes to step workflows themselves
