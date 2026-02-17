# Specdacular — AI Feature Planning

This project uses [Specdacular](https://github.com/victorbalan/specdacular) for feature planning and codebase documentation.

## Codebase Context

If `.specd/codebase/` exists, read these files for project understanding:
- `.specd/codebase/MAP.md` — System overview
- `.specd/codebase/PATTERNS.md` — Code patterns and conventions
- `.specd/codebase/STRUCTURE.md` — Directory layout

## Available Skills

- `$specd-config` — Create or update .specd/config.json with commit settings
- `$specd-feature-continue` — Continue feature lifecycle — picks up where you left off
- `$specd-feature-discuss` — Continue or deepen understanding of a feature through targeted discussion.
- `$specd-feature-new` — Initialize a new feature and start the first discussion
- `$specd-feature-plan` — Create a roadmap with phase overview and empty phase directories.
- `$specd-feature-research` — Research how to implement a feature by spawning parallel agents for different research dimensions.
- `$specd-feature-review` — User-guided review of an executed phase.
- `$specd-feature-toolbox` — Advanced feature operations — discuss, research, plan, review, insert
- `$specd-help` — Show all specdacular commands and usage guide
- `$specd-map-codebase` — Analyze codebase with parallel agents to produce AI-optimized documentation
- `$specd-phase-execute` — Execute a plan from a feature, tracking progress and logging deviations.
- `$specd-phase-insert` — Insert a new phase after an existing one using decimal numbering (e.g., Phase 03.1).
- `$specd-phase-plan` — Create detailed, executable PLAN.md files for a single phase.
- `$specd-phase-prepare` — Prepare a phase for execution by discussing gray areas and optionally researching implementation patterns.
- `$specd-phase-renumber` — Renumber all phases to a clean integer sequence after decimal phases have been inserted.
- `$specd-phase-research` — Research implementation patterns for a specific phase before executing it.
- `$specd-phase-review` — Review executed plans for a phase by comparing intended changes against actual code.
- `$specd-status` — Show feature status dashboard
- `$specd-update` — Update Specdacular to the latest version

## Workflow

1. Map your codebase: `$specd-map-codebase`
2. Start a feature: `$specd-feature-new my-feature`
3. Drive the lifecycle: `$specd-feature-continue my-feature`

The continue command figures out what to do next — no need to remember individual commands.
