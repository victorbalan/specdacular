# Decisions — semi-auto-default

## DEC-001: Semi-auto as default mode
**Decision:** Semi-auto behavior becomes the default. No flag needed.
**Rationale:** It's the most useful mode — auto-runs mundane steps, pauses for important ones. Making it default removes friction.

## DEC-002: Remove interactive mode
**Decision:** Remove the interactive mode concept entirely.
**Rationale:** Prompting at every single stage transition adds friction without value. Users who want control can set `pause: true` on specific steps.

## DEC-003: Remove `enabled` field
**Decision:** Steps are enabled by presence in the pipeline config. Remove/comment to disable.
**Rationale:** Cleaner config. A boolean that's always `true` is noise.

## DEC-004: Rename `pause_in_semi_auto` → `pause`
**Decision:** Replace with `pause` (boolean, defaults to `false`). In normal mode, `pause: true` steps prompt the user. In `--auto`, all pauses are skipped.
**Rationale:** Cleaner name. The old name referenced a mode concept that no longer exists.
