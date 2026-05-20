# specd-review — Design

**Date:** 2026-05-20
**Status:** Approved (design phase)

## Summary

`specd-review` is a standalone Node.js CLI that runs an iterative,
multi-agent code review loop. Multiple configurable reviewer agents
(backed by `claude`, `codex`, or any other CLI) review a git diff in
parallel; a designated fixer agent applies fixes; the loop repeats until
no blocking issues remain or a round cap is reached. It runs auto or
interactive, and is meant to be shared with colleagues independently of
Claude Code.

## Goals

- Standalone, shareable CLI — installable by colleagues with one command.
- Configurable agents, defined one-per-file, in the style of the runner's
  agent config.
- Parallel reviewers, one fixer; an iterative review→fix→re-review loop.
- Auto mode (severity-gated) and interactive mode (loop pauses at a
  findings gate for human input).
- A live TUI showing parallel agents and their progress, with a
  persistent input box.

## Non-Goals

- Not a Claude Code slash command and not a runner pipeline (a separate
  standalone CLI was explicitly chosen for now).
- No git worktree isolation — fixes are committed directly in the
  working tree, one commit per round.
- No TUI-only features that cannot degrade to a plain non-TTY fallback.

## Architecture & Distribution

**Name:** `specd-review`

**Package:** a self-contained Node.js npm package inside this repo at
`tools/specd-review/`, with `bin: { "specd-review": "./cli.js" }`.
Colleagues install via `npm i -g <git-url>` (or a published package
later).

**Dependencies (lean):**

- `commander` — argument parsing
- `chalk` — colored output (plain fallback)
- `simple-git` — git operations (status, log, diff, commit)
- `js-yaml` — config and agent file parsing
- `ink` + `ink-spinner` — interactive TUI
- Native `child_process` + `gh` CLI — invoke agent CLIs and fetch PRs

**External tools required on PATH:** `git`, `gh`, plus whatever agent
CLIs the configured agents reference (`claude`, `codex`, …).

**Package layout:**

```
tools/specd-review/
  cli.js                  # entry, arg parsing, mode selection
  src/
    orchestrator.js       # the round loop
    config.js             # load + merge global/project config + agent files
    agents/runner.js      # spawn an agent CLI, capture JSON, retry/timeout
    agents/parser.js      # StreamParser (ported from runner)
    findings.js           # parse, normalize, dedupe, severity-gate
    git.js                # branch/PR/diff/base/commit helpers
    report.js             # markdown report writer
    ui/ink-view.js        # interactive TUI (live agents + input box)
    ui/plain-view.js      # non-TTY fallback line printer + prompts
  agents/                 # default agent files seeded by `init`
```

The agent spawn/parse/timeout logic and `StreamParser` are ported from
the runner (`runner/main/agent/runner.js`, `runner/main/agent/parser.js`)
rather than reinvented, keeping the two in sync conceptually.

## Agents & Configuration

**One agent per file.** Agents live in a directory; the filename (sans
extension) is the agent name.

```
~/.specd-review/
  config.yml
  agents/
    claude-correctness.yml
    codex-security.yml
    codex-perf.yml
    claude-fixer.yml
```

A project-level `.specd-review/agents/*.yml` in the repo root is also
scanned. A project agent file shadows a global one with the same name.

**`config.yml` — global settings:**

```yaml
max_rounds: 5
agents: [claude-correctness, codex-security, codex-perf, claude-fixer]
# `agents` is the default selection; omit to use all discovered agents.
```

**Agent file** (e.g. `codex-security.yml`):

```yaml
role: reviewer            # reviewer | fixer
cmd: "codex exec"
output_format: json_block
system_prompt: |
  Review the diff for security issues and API misuse.
  Emit findings as a ```specd-result JSON block (schema below).
  {{diff}}
```

**Rules:**

- Agent file shape mirrors `runner/tests/fixtures/agents.yaml`
  (`cmd`, `output_format`, `system_prompt`), plus a `role` field.
- Any number of reviewer agents; they are distinguished by their
  `system_prompt`, not by a fixed CLI list. There may be several
  `claude-*` and several `codex-*` reviewers.
- Exactly one enabled agent with `role: fixer`.
- Template variables the orchestrator injects into `system_prompt`:
  `{{diff}}`, `{{findings}}`, `{{user_feedback}}`, `{{round}}`, `{{base}}`.
- `--agents a,b,c` overrides the selection from `config.yml`.
- `specd-review init` seeds `~/.specd-review/` with `config.yml` and the
  four default agent files so colleagues are productive immediately.

## The Round Loop & Data Flow

```
1. Preflight
   - resolve target:
       no arg  -> current branch, diff vs merge-base with main/master
       <PR#>   -> `gh pr checkout <N>`, then diff vs base
   - refuse to run if the working tree is dirty
     (message: commit or stash first)
   - compute base and capture {{diff}}

2. Round N (loop):
   a. Run all selected reviewers in PARALLEL on {{diff}}
   b. Each reviewer emits a ```specd-result JSON block:
        { findings: [ {file, line, severity, category,
                        description, suggestion} ],
          summary: "<prose rationale>" }
   c. findings.js: normalize -> dedupe across reviewers
      (same file+line+category) -> severity-gate
   d. INTERACTIVE ONLY — pause at the findings gate:
        - render findings; user may `/edit` the merged JSON in $EDITOR
        - user may type freeform feedback for this round
        - user chooses `/continue`, `/accept`, or `/quit`
   e. If zero `blocking` findings remain -> exit loop (converged)
   f. If N >= max_rounds -> exit loop (exhausted)
   g. Run the fixer on remaining findings (+ {{user_feedback}});
      the fixer edits files
   h. git add -A && git commit -m "specd-review round N: <n> issues"
   i. recompute {{diff}}; N++; go to (a)

3. Report
   - write specd-review-report.md: per-round findings, prose summaries,
     user feedback, commit hashes, final state
   - print summary
   - exit 0 if converged, 1 if exhausted with blocking issues remaining
```

**Severity levels:** `blocking` (gates the loop) and `nice-to-have`
(reported, never gates).

**Cross-round context:** each reviewer sees only the *current* diff,
plus a short note of what previous rounds changed, so resolved issues
are not re-flagged.

**Auto vs interactive:** the loop is identical. Auto mode never stops.
Interactive mode (`--interactive`) enables step (d): the loop pauses at
the findings gate so the human can trim findings and/or supply feedback.

### Interactive feedback

In interactive mode the loop pauses *between steps* at the findings
gate. The user has two levers there:

1. **Edit findings** — `/edit` opens the merged findings JSON in
   `$EDITOR` to delete or downgrade issues (structured lever).
2. **Freeform feedback** — typed plain-English guidance for the fixer,
   e.g. "skip the naming nits", "don't touch the test files". This is
   injected into the fixer prompt as `{{user_feedback}}` and treated as
   higher priority than the raw findings list.

Feedback is per-round (a fresh prompt each round; empty = no extra
guidance). It is not a launch-time flag — there is no `--feedback`
option. Each round's feedback is recorded in the report for
reproducibility.

## Interactive TUI

Built with `ink` (React for the terminal), in the spirit of the Claude
Code CLI: a persistent input box and a live panel of parallel agents.

**Live layout during a round:**

```
  specd-review · round 2 · base: main

  (spin) claude-correctness   reviewing src/orchestrator.js…
  (spin) codex-security       analyzing auth flow…          3 findings
  (ok)   codex-perf           done                          1 finding

  ───────────────────────────────────────────────
  > _
```

Each reviewer line is driven live by `StreamParser` `status` events
(`progress`, `percent`) emitted by the agent runner.

**At the findings pause gate:**

- Findings render as a scrollable, severity-colored list grouped by file.
- The persistent input box accepts:
  - plain text -> feedback for the fixer this round
  - `/edit` -> open findings JSON in `$EDITOR`
  - `/continue` -> run the fixer, proceed to the next round
  - `/accept` -> stop, accept the current state
  - `/quit` -> abort
- The fixer's progress streams in the same live panel.

**Non-TTY fallback:** if stdout is not a TTY (CI, piped output, dumb
terminal), the CLI auto-degrades to a plain line printer with
`[c]ontinue / [e]dit / [a]ccept / [q]uit` prompts. The orchestrator is
unchanged — only `src/ui/` differs (`ink-view` vs `plain-view`).

## Error Handling

- **Reviewer crashes or emits no valid JSON:** retry once, then skip
  that reviewer for the round (noted in the report) and continue with
  the remaining reviewers.
- **Fixer crashes or makes no file changes:** stop the loop and report
  the last good state. No partial commit is created.
- **Dirty working tree at preflight:** refuse to start; instruct the
  user to commit or stash.
- **Per-round commits:** each fixer pass is its own commit, so any round
  is independently revertable.

## CLI Surface

```
specd-review              # review current branch
specd-review <PR#>        # review a GitHub PR
specd-review init         # seed ~/.specd-review/ with defaults
  --interactive           # enable the findings pause gate + TUI input
  --agents a,b,c          # override agent selection
  --max-rounds N          # override config.yml
  --config <path>         # alternate config location
```

## Testing

- **Unit:** `findings.js` (normalize, dedupe, severity-gate);
  `config.js` (global/project merge, shadowing); `git.js` (base
  resolution); template-variable substitution.
- **Agent runner:** spawn a stub `cmd` (e.g. `echo` emitting a canned
  `specd-result` block) — mirrors the runner's existing
  `agent-parser.test.js` approach.
- **Orchestrator:** drive the loop with stub agents; assert convergence,
  round-cap exhaustion, reviewer-skip-on-failure, fixer-failure-stop,
  and per-round commit creation.
- **UI:** the plain (non-TTY) view is unit-testable on captured output;
  the `ink` view is smoke-tested manually.
