# Superpowers Pipeline Design

## Goal

Replace the current 3-stage default pipeline (plan → implement → review) with a 2-stage Superpowers-driven pipeline that uses the full Superpowers skill chain as one cohesive flow, with Victor's deep parallel review as the quality gate.

## Current State

The runner's default pipeline has three stages, each spawning a separate Claude Code agent:

1. **plan** (`claude-superpower-planner`) — Invokes `superpowers:brainstorming` → `writing-plans`. Produces a design spec and implementation plan.
2. **implement** (`claude-implementer`) — Invokes `superpowers:executing-plans`. Executes the plan inline (sequential tasks in one session).
3. **review** (`claude-reviewer`) — Invokes `superpowers:requesting-code-review`. Generic review, writes findings to `.specd/reviews/`.

**Problems:**
- The Superpowers flow (brainstorm → plan → execute) is designed to chain naturally in one session. Splitting it across agents loses context and requires plan discovery between stages.
- The implementer uses `executing-plans` (inline sequential) but not `subagent-driven-development` (per-task sub-agents with spec + code quality reviews). Sub-agent execution gives better quality through isolation and per-task review.
- The reviewer uses a generic code review skill, not Victor's 5-agent parallel deep review.
- No auto-fix capability — review findings are informational only.

## New Default Pipeline

Two stages:

```
superpowers → victor-review
```

### Stage 1: `superpowers`

One agent runs the complete Superpowers skill chain:

1. `superpowers:brainstorming` — Research codebase, answer own questions, propose approaches, write design spec
2. `superpowers:writing-plans` — Produce implementation plan (chained automatically by brainstorming)
3. `superpowers:subagent-driven-development` — Execute the plan with per-task sub-agents ("process in process")
   - Each plan task gets: implementer sub-agent → spec reviewer sub-agent → code quality reviewer sub-agent
   - Sub-agents have isolated context (no session history pollution)
   - Two-stage review per task: spec compliance first, then code quality

The agent is instructed to:
- Choose "Subagent-Driven Development" (option 1) when the writing-plans skill offers execution options
- Skip `finishing-a-development-branch` — the runner manages branch lifecycle and PR creation
- Be fully autonomous — answer its own questions, make its own choices
- Emit `specd-status` progress markers throughout
- Emit `specd-result` when complete

**Timeout:** 7200s (2 hours) — longer than current 3600s because this runs the full flow.

### Stage 2: `victor-review`

Deep parallel review + auto-fix:

1. Invoke `victor:review` skill — spawns 5 specialized review agents in parallel:
   - Security & Auth
   - Logic Bugs & Runtime Errors
   - Database & Data Integrity
   - API Conventions & Validation
   - React & Frontend Patterns
2. Merge and deduplicate findings across all 5 agents
3. Auto-fix issues by tier:
   - **Critical** (security, data loss, auth bypasses) — always fix
   - **Bugs** (logic errors, race conditions) — always fix
   - **Medium** (validation gaps, convention violations) — fix only clear-cut cases
   - **Minor** (code quality, consistency) — skip
4. Write review report to `.specd/reviews/{{task.id}}-review.md`
5. Commit fixes + review report

**On failure:** `on_fail: retry, max_retries: 1` — If critical issues can't be fixed, retry once.

## Pipeline Configuration

```json
{
  "name": "default",
  "stages": [
    { "stage": "superpowers", "agent": "claude-superpowers", "critical": true, "timeout": 7200 },
    { "stage": "review", "agent": "claude-victor-reviewer", "on_fail": "retry", "max_retries": 1, "timeout": 3600 }
  ]
}
```

## Agent Templates

### `claude-superpowers`

System prompt instructs the agent to run the full Superpowers chain autonomously. Key instructions:

- MUST invoke `superpowers:brainstorming` first
- Non-interactive: answer all clarifying questions by researching the codebase
- When writing-plans offers execution choice, choose "Subagent-Driven Development" (option 1)
- Do NOT invoke `finishing-a-development-branch` — the runner handles branch/PR lifecycle
- Commit work throughout (the sub-agents commit per task)
- Emit `specd-status` at major milestones (researching, brainstorming, planning, executing task N/M)
- Emit `specd-result` when all tasks are complete

Template variables: `{{task.id}}`, `{{task.name}}`, `{{task.spec}}`, `{{task.feedback}}`, `{{stage.name}}`, `{{stage.index}}`, `{{stage.total}}`, `{{pipeline.name}}`

### `claude-victor-reviewer`

System prompt instructs the agent to review and fix. Key instructions:

- Get the base commit (first commit on branch) and HEAD for diff context
- Invoke `victor:review` skill with the branch changes
- Parse the structured output (Critical / Bugs / Medium / Minor tiers)
- For Critical and Bugs: implement fixes, commit each fix
- For Medium: fix only obvious cases (missing null checks, clear validation gaps)
- For Minor: skip
- Write full review report to `.specd/reviews/{{task.id}}-review.md`
- Set `specd-result` status to "success" if no unfixed Critical issues remain
- Set `specd-result` status to "failure" if Critical issues couldn't be fixed

Template variables: same as above, plus `{{previous_stage_output}}` (summary from superpowers stage).

## Changes Required

### `runner/main/bootstrap.js`

1. Add `claude-superpowers` agent template to `DEFAULT_AGENTS`
2. Add `claude-victor-reviewer` agent template to `DEFAULT_AGENTS`
3. Update `DEFAULT_PIPELINE` to use the new 2-stage structure
4. Keep old agents (`claude-superpower-planner`, `claude-implementer`, `claude-reviewer`) — they remain available for custom pipelines

### No Infrastructure Changes

The pipeline infrastructure (sequencer, resolver, template engine, worktree manager, PR creation) already supports this. The only change is agent definitions and pipeline configuration.

## Interaction with Existing Features

- **Worktrees**: Runner creates worktrees per task. The superpowers agent and its sub-agents all work in the same worktree.
- **PR creation**: Runner creates/updates draft PRs after each stage. After superpowers stage → PR has implementation commits. After victor-review → PR has review fixes.
- **Resumability**: Stage sequencer skips completed stages. If superpowers completes but victor-review fails, resuming skips superpowers.
- **Brainstorm pipeline**: Unchanged. Ideas still go through brainstorm → human review → approve → default pipeline.
- **State management**: No changes. Task status transitions work the same.
- **Custom pipelines**: Users can still define custom pipelines using any combination of agents.

## What Stays the Same

- Pipeline infrastructure (sequencer, resolver, template engine)
- Worktree management
- PR creation flow
- State management
- Brainstorm pipeline (for idea → plan → human review flow)
- Task lifecycle (idea → planning → review → ready → in_progress → done)
- All existing agents remain available for custom pipelines

## What Changes

- Default pipeline: 3 stages → 2 stages
- New agent: `claude-superpowers` (unified brainstorm + plan + execute with sub-agents)
- New agent: `claude-victor-reviewer` (deep 5-agent review + auto-fix)
- Old agents remain in `DEFAULT_AGENTS` but aren't referenced by the default pipeline
