# Research: flow-changes

**Researched:** 2026-03-11

## Summary

The RALPH loop should use `claude -p` (headless mode) with `--output-format json` and `--append-system-prompt-file` for guardrails injection. Critical discovery: stdin must be `'inherit'` not `'pipe'` when spawning Claude CLI from Node.js (confirmed TTY hang bug). Slash commands don't work in `-p` mode, so RALPH must construct natural-language prompts referencing workflow files directly.

For guardrails, the two-layer model is key: advisory rules in CLAUDE.md/append-system-prompt (workflow guidance, direction-change detection) + deterministic hooks (hard stops). Keep CLAUDE.md under 60 lines, reserve "IMPORTANT" for 2-3 critical invariants, and use `.claude/rules/` for scoped rules.

**Key recommendation:** Build RALPH as a state-machine loop reading `config.json` → spawning `claude -p` with `--append-system-prompt-file` for guardrails → checking state changes after each step. Use `child.on('close')` not `child.on('exit')`, kill process groups not just PIDs, and write state atomically via rename.

---

## Codebase Integration

### Import Dependencies
- `specdacular/references/validate-task.md` — Task directory validation, reusable by all new commands
- `specdacular/references/load-context.md` — Standard context loading pattern for all step workflows
- `specdacular/references/commit-docs.md` — Auto-commit with setting check
- `specdacular/references/record-decision.md` — DEC-{NNN} formatting
- `specdacular/templates/tasks/` — Templates for all task documents
- `specdacular/workflows/discuss.md` — Discussion flow pattern (reusable in expanded `/specd.new`)
- `specdacular/workflows/research.md` — Research agent spawning pattern (referenced by `/specd.research`)

### Patterns to Follow
- **Command structure:** Thin wrapper at `commands/specd.{name}.md` with YAML frontmatter → `<execution_context>` pointing to workflow
- **Workflow structure:** `<purpose>`, `<philosophy>`, `<process>` with `<step name="...">` elements
- **State transitions:** Read config.json → determine next action → execute → update state → commit
- **File naming:** UPPERCASE.md for documents, kebab-case for task names, `phase-{NN}` for phases

### File Locations
- `commands/specd.context.md` — Read-only context loader command
- `commands/specd.research.md` — Ad-hoc research command
- `commands/specd.plan.md` — Phase planning command
- `commands/specd.execute.md` — Phase execution command (includes review)
- `specdacular/workflows/context.md` — Context loading + guardrails injection workflow
- `bin/ralph.js` — RALPH loop script (dispatched via `bin/install.js` subcommand)
- `specdacular/guardrails/ralph.txt` — Guardrails template for RALPH injection

### Current Toolbox Contents (to extract)
1. **Discuss** → Folds into expanded `/specd.new` inception flow
2. **Research** → `/specd.research` (standalone, ad-hoc)
3. **Plan** → `/specd.plan` (standalone)
4. **Execute** → `/specd.execute` (standalone, includes review)
5. **Review** → Folds into `/specd.execute` workflow

### Integration Points
- `bin/install.js` — Add new commands to copy list + ralph.js dispatch (`if (args[0] === 'ralph') require('./ralph.js')`)
- `commands/specd.continue.md` — Add `state.json` fallback for task name resolution
- `commands/specd.help.md` — Add new commands to help output
- `commands/specd.status.md` — Could show current task from state.json

---

## Implementation Patterns

### Claude Code CLI Reference (for RALPH)

**Core execution flags:**

| Flag | Purpose |
|------|---------|
| `-p` / `--print` | Headless mode — execute prompt, print, exit |
| `--output-format json` | Returns `{result, session_id, total_cost_usd, num_turns, is_error}` |
| `--output-format stream-json` | Newline-delimited JSON events (for live progress) |
| `--max-turns N` | Limit agentic turns per invocation |
| `--no-session-persistence` | Ephemeral session (no disk save) |

**Guardrails injection:**

| Flag | Behavior |
|------|----------|
| `--append-system-prompt "..."` | Appends to Claude Code defaults — recommended |
| `--append-system-prompt-file ./path.txt` | Appends from file — best for RALPH |
| `--system-prompt "..."` | Replaces entire default system prompt (nuclear, avoid) |

**Permissions:**

| Flag | Behavior |
|------|----------|
| `--allowedTools "Bash,Read,Edit,Write,Glob,Grep"` | Auto-approves listed tools |
| `--dangerously-skip-permissions` | Skips all prompts (must pre-accept once interactively) |

### RALPH Spawning Pattern

```javascript
const { spawn } = require('child_process');

function runClaudeStep(prompt, guardrailsFile, opts = {}) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--output-format', 'json',
      '--append-system-prompt-file', guardrailsFile,
      '--allowedTools', 'Bash,Read,Write,Edit,Glob,Grep',
      '--dangerously-skip-permissions',
      '--no-session-persistence',
    ];
    if (opts.maxTurns) args.push('--max-turns', String(opts.maxTurns));

    const child = spawn('claude', args, {
      stdio: ['inherit', 'pipe', 'pipe'],  // stdin MUST be inherit
      detached: true,  // for process group cleanup
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => {  // use 'close' not 'exit'
      try {
        resolve({ exitCode: code, result: JSON.parse(stdout.trim()), stderr });
      } catch {
        resolve({ exitCode: code, result: { result: stdout.trim() }, stderr });
      }
    });
  });
}
```

### RALPH Loop Structure

```
while (true):
  1. Read .specd/state.json → current_task
  2. Read .specd/tasks/{name}/config.json → stage, phase
  3. Determine next step from state
  4. If pause point → prompt user to continue or stop
  5. Generate guardrails file (dynamic, task-specific)
  6. Build natural-language prompt (slash commands don't work in -p mode)
  7. Spawn claude -p with --append-system-prompt-file
  8. Wait for close event, parse JSON output
  9. Check state files changed (mtime comparison)
  10. Loop or stop
```

### npx Entry Point

Extend `bin/install.js` to dispatch on subcommand:
```javascript
if (process.argv[2] === 'ralph') {
  require('./ralph.js')(process.argv.slice(3));
} else {
  // existing install logic
}
```

This keeps `npx specdacular ralph` working without adding a second bin entry.

### Prompt Construction

Since `-p` mode doesn't support slash commands, RALPH must build natural-language prompts:

```javascript
function buildStepPrompt(taskName, step) {
  return [
    `Task: ${taskName}`,
    `Stage: ${step.name}`,
    `Read the workflow at ~/.claude/specdacular/workflows/${step.workflow}`,
    `Read the task state at .specd/tasks/${taskName}/`,
    `Execute the workflow. Update state files when done.`,
  ].join('\n');
}
```

---

## Guardrails

### Two-Layer Model

| Layer | Mechanism | Guarantee |
|-------|-----------|-----------|
| CLAUDE.md / append-system-prompt | Prose instructions | Statistical — usually followed, context pressure can override |
| Hooks (PreToolUse/PostToolUse) | Shell scripts, exit code 2 = block | Deterministic — runs regardless |

**Use advisory rules for:** workflow guidance, file conventions, commit format, direction-change detection
**Use hooks for:** hard stops (never write to `.env`, never force-push, always run tests)

### Recommended Guardrails Content

**Core rules (keep under 60 lines total):**

```
IMPORTANT: Read STATE.md at the start of every session. It is the single source of truth.
IMPORTANT: After completing a step, update STATE.md and config.json before doing anything else.
YOU MUST commit with the format specified in commit-docs.md — do not improvise commit messages.

When working on a specd task:
- Write all documents to .specd/tasks/{task-name}/ — never create files elsewhere for task state
- Use DEC-{NNN} format for all decisions in DECISIONS.md
- Respect auto_commit_docs and auto_commit_code settings in .specd/config.json
- Never modify files outside the current phase's designated scope

If STATE.md and the filesystem disagree (e.g., STATE.md says done but artifact missing),
surface the conflict to the user. Do not resolve it silently.
```

### Direction-Change Detection Rule

```
If the user says anything suggesting a change of approach, requirement, or direction
(phrases like "actually", "let's change", "forget that", "different approach", "new requirement"):
1. STOP current work immediately
2. State: "I'm detecting a direction change. Current plan: [X]. New direction: [Y].
   Should I update the specs?"
3. If confirmed: record new decision (superseding old if applicable), update relevant docs
4. Do NOT continue with old plan until confirmed
```

### Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Do Instead |
|---|---|---|
| 500-line CLAUDE.md | Instruction dropout, context pressure | Under 60 lines, use @imports for scoped rules |
| Every rule marked IMPORTANT | Dilutes emphasis, none stand out | Reserve for 2-3 critical invariants |
| Timestamp in system prompt | Invalidates KV-cache every step | Put temporal context in user message |
| Prose for hard stops | Advisory only, can be overridden | Use PreToolUse hooks with exit code 2 |
| All state in injected preamble | Compacted away in long sessions | State in files Claude reads on demand |

### RALPH-Level Direction Detection

After each step, RALPH can diff spec files against previous state. If specs changed during a step, pause and prompt: "Specs changed. Continue with new specs or review changes first?"

---

## Pitfalls

### Critical

**stdin must be `'inherit'` when spawning Claude CLI**
- `claude -p` hangs indefinitely with piped stdin (TTY detection bug)
- Confirmed: GitHub issues #771, #6295, #9026
- Prevention: `stdio: ['inherit', 'pipe', 'pipe']` — never default
- Confidence: HIGH

**Use `child.on('close')` not `child.on('exit')`**
- `exit` fires before stdio streams finish flushing
- Reading output on `exit` gets stale/empty content
- Prevention: Always use `close` event for output reading
- Confidence: HIGH

**Kill process groups, not just PIDs**
- `child.kill()` only sends signal to immediate child, not grandchildren
- Claude's subprocesses survive as orphans
- Prevention: Spawn with `{ detached: true }`, kill with `process.kill(-child.pid, 'SIGTERM')`
- Confidence: HIGH

**Atomic state file writes**
- `fs.writeFile` is not atomic — interrupt leaves corrupt file
- Prevention: Write to temp file, `fs.renameSync` to target (rename is atomic on POSIX)
- Confidence: HIGH

**`--dangerously-skip-permissions` must be pre-accepted**
- Hangs waiting for interactive acceptance on first run
- Prevention: Pre-flight check in RALPH, document in `--help`
- Confidence: HIGH

### Moderate

**Context compaction drops guardrail instructions**
- At ~92% context, Claude Code auto-compacts and may drop early system instructions
- Prevention: Keep injected context short (<200 lines), put persistent rules in CLAUDE.md
- Confidence: HIGH

**Stale injected context contradicting filesystem**
- If user edits state files between steps, injected context lies
- Prevention: Always read state fresh before injection, validate against artifacts
- Confidence: HIGH

**Overspecified CLAUDE.md causes instruction dropout**
- Statistically, Claude ignores rules in long files
- Prevention: Under 60 lines, use @imports, move code style to linters
- Confidence: HIGH

**Security: user input in spawn arguments**
- Feature names with shell metacharacters could inject flags
- Prevention: Use `spawn` with argument arrays (never `exec` string concat), validate inputs
- Confidence: HIGH

### Minor

**SIGINT propagation hits both RALPH and Claude**
- Ctrl-C kills both processes simultaneously, risking partial writes
- Prevention: Intercept SIGINT in RALPH, send graceful SIGTERM to Claude first
- Confidence: MEDIUM

**KV-cache invalidation from dynamic system prompts**
- Timestamps or session IDs in system prompt prevent cache reuse
- Prevention: Keep system prompt static/deterministic, put dynamic data in user message
- Confidence: MEDIUM

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase integration | HIGH | Direct codebase exploration, all patterns verified |
| RALPH loop implementation | HIGH | Official CLI docs + confirmed GitHub issues |
| Guardrails structure | HIGH | Official best practices + verified practitioner sources |
| Direction-change detection | MEDIUM | Behavioral pattern, not deterministic |

## Open Questions

- Should RALPH support `--output-format stream-json` for live progress display, or is final JSON sufficient?
- Should guardrails file be static (shipped) or dynamically generated per-step with task context?
- Should RALPH use a lockfile to prevent parallel instances on same task?

## Sources

### Codebase
- All `commands/specd.*.md` files — command structure patterns
- `specdacular/workflows/*.md` — workflow structure patterns
- `specdacular/references/*.md` — reusable reference patterns
- `bin/install.js` — installation and dispatch patterns
- `commands/specd.toolbox.md` — current toolbox operations to extract

### External
- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference) — all flags (HIGH)
- [Claude Code Headless Mode](https://code.claude.com/docs/en/headless) — SDK/scripted usage (HIGH)
- [GitHub #771](https://github.com/anthropics/claude-code/issues/771) — TTY stdin hang fix (HIGH)
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices) — compaction, rules (HIGH)
- [HumanLayer CLAUDE.md Guide](https://www.humanlayer.dev/blog/writing-a-good-claude-md) — 60-line rule (HIGH)
- [Manus Context Engineering](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) — context drift, KV-cache (MEDIUM)
- [Paddo Hooks Guardrails](https://paddo.dev/blog/claude-code-hooks-guardrails/) — deterministic enforcement (HIGH)
