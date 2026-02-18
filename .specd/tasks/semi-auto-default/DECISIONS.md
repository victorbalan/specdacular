# Decisions — semi-auto-default

## DEC-001: Semi-auto as default mode
**Decision:** Semi-auto behavior becomes the default. No flag needed.
**Rationale:** It's the most useful mode — auto-runs mundane steps, pauses for important ones. Making it default removes friction.

## DEC-002: Interactive mode as opt-in flag
**Decision:** Keep interactive mode but make it opt-in via `--interactive` flag instead of the default.
**Rationale:** Some users want to be prompted at every transition. Making it a flag keeps it available without being the default friction.

## DEC-005: Smart step skipping
**Decision:** Brain evaluates whether a step adds value and skips it if not (e.g., skip research on trivial phases).
**Rationale:** Not every phase needs research. The brain should be intelligent about this rather than blindly running every step.

## DEC-003: Remove `enabled` field
**Decision:** Steps are enabled by presence in the pipeline config. Remove/comment to disable.
**Rationale:** Cleaner config. A boolean that's always `true` is noise.

## DEC-004: Rename `pause_in_semi_auto` → `pause`
**Decision:** Replace with `pause` (boolean, defaults to `false`). In normal mode, `pause: true` steps prompt the user. In `--auto`, all pauses are skipped.
**Rationale:** Cleaner name. The old name referenced a mode concept that no longer exists.
