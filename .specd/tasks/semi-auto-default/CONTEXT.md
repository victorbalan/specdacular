# Discussion Context — semi-auto-default

## Session 1

**What's being built:** Simplification of the specdacular mode system. Currently there are three modes (interactive, semi-auto, auto) with two CLI flags (`--semi-auto`, `--auto`). The change makes semi-auto the default with no flag needed, keeps only `--auto`, and cleans up pipeline config.

**Key decisions made:**
- Default mode silently auto-runs through steps until hitting a `pause: true` step — no prompts at stage transitions
- `--auto` keeps current behavior (skip all pauses, stop only on errors/completion)
- `pause_in_semi_auto` renamed to just `pause`
- `enabled` field removed entirely — comment out or delete steps instead

## Gray Areas Remaining

_None — all resolved._
