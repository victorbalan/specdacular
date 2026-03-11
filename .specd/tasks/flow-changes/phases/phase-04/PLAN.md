---
task: flow-changes
phase: 4
depends_on: [1, 2, 3]
creates:
  - bin/ralph.js
modifies:
  - bin/install.js
---

# Phase 4: RALPH Loop

## Objective

Build `bin/ralph.js` — a Node.js state-machine loop that drives the full task lifecycle by spawning fresh Claude CLI instances per step. Zero dependencies (Node.js stdlib only).

## Context

**Reference these files:**
- `@bin/install.js` — Existing entry point pattern, add ralph subcommand dispatch
- `@specdacular/guardrails/specd-rules.txt` — Guardrails to inject via `--append-system-prompt-file`
- `@specdacular/workflows/brain.md` — Brain routing logic (RALPH mirrors this in code)
- `@specdacular/references/resolve-task.md` — Task resolution chain

**From Research — Critical Pitfalls:**
- stdin MUST be `'inherit'` — `claude -p` hangs with piped stdin (GitHub #771)
- Use `child.on('close')` not `child.on('exit')` — exit fires before stdio flush
- Kill process groups, not just PIDs — spawn with `{ detached: true }`, kill with `process.kill(-child.pid)`
- Atomic state writes — write temp file + `fs.renameSync`
- `--dangerously-skip-permissions` must be pre-accepted interactively first

**From Research — RALPH Pattern:**
- State-machine: read state → determine step → spawn `claude -p` → check results → loop
- Use `--output-format json` for structured results
- Use `--append-system-prompt-file` for guardrails injection
- Slash commands don't work in `-p` mode — build natural-language prompts referencing workflow files

**Relevant Decisions:**
- DEC-001: state.json for task resolution
- DEC-002: Keep /specd.continue — RALPH is a separate entry point, not a replacement
- DEC-003: Context/guardrails injected automatically at each step

---

## Tasks

### Task 1: Create bin/ralph.js — Core Loop

**Files:** `bin/ralph.js`

**Action:**
Create the RALPH loop script. Zero external dependencies — use only Node.js stdlib (`fs`, `path`, `child_process`, `os`, `readline`).

**Structure:**

```
#!/usr/bin/env node

1. Parse args (task name optional, falls back to state.json)
2. Pre-flight checks:
   - Verify `claude` is in PATH
   - Verify `--dangerously-skip-permissions` has been accepted
   - Verify task directory exists
3. Main loop:
   a. Read .specd/tasks/{name}/config.json → stage, phase, status
   b. Determine next step (mirror brain-routing.md logic):
      - discussion stage → discuss workflow
      - research stage → research workflow
      - planning stage → plan workflow
      - execution stage + pending → phase-plan or execute (check PLAN.md)
      - execution stage + executed → review
      - execution stage + completed → advance phase or complete
   c. Build prompt (natural language, reference workflow file)
   d. Show step banner
   e. Spawn claude -p with guardrails
   f. Wait for completion
   g. Check exit code and result
   h. If error: prompt retry/skip/stop
   i. Re-read state → loop
4. SIGINT handler: graceful shutdown
```

**Key implementation details:**

```javascript
// Spawning pattern (from research)
function runClaudeStep(prompt, guardrailsFile, opts = {}) {
  const args = [
    '-p', prompt,
    '--output-format', 'json',
    '--append-system-prompt-file', guardrailsFile,
    '--dangerously-skip-permissions',
    '--no-session-persistence',
  ];
  if (opts.maxTurns) args.push('--max-turns', String(opts.maxTurns));

  const child = spawn('claude', args, {
    stdio: ['inherit', 'pipe', 'pipe'],  // stdin MUST be inherit
    detached: true,
    cwd: process.cwd(),
  });
  // ... collect stdout/stderr, resolve on 'close' event
}
```

**Prompt construction:**
```javascript
function buildPrompt(taskName, stepName, workflowPath) {
  return `You are executing a specd workflow step.

Task: ${taskName}
Step: ${stepName}

Read and execute the workflow: @${workflowPath}
The task is: ${taskName}

Read the task state from .specd/tasks/${taskName}/ to understand context.
Execute the workflow steps. Update state files when done.
Do not ask questions — proceed autonomously.`;
}
```

**State reading (atomic):**
```javascript
function readState(taskDir) {
  const configPath = path.join(taskDir, 'config.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

function writeStateAtomic(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, filePath);
}
```

**SIGINT handling:**
```javascript
let currentChild = null;
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  if (currentChild) {
    try { process.kill(-currentChild.pid, 'SIGTERM'); } catch {}
  }
  process.exit(0);
});
```

**Pre-flight check for --dangerously-skip-permissions:**
```javascript
function checkPermissions() {
  try {
    execSync('claude --dangerously-skip-permissions -p "echo ok" --output-format json --no-session-persistence', {
      stdio: ['inherit', 'pipe', 'pipe'],
      timeout: 10000,
    });
    return true;
  } catch {
    return false;
  }
}
```

**Banner output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RALPH: {task-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step: {step-name}
Phase: {current}/{total}
```

**Guardrails file resolution:**
- Look for `~/.claude/specdacular/guardrails/specd-rules.txt` first
- Fall back to `./specdacular/guardrails/specd-rules.txt`
- If neither exists, warn and continue without

**Verify:**
```bash
node bin/ralph.js --help 2>&1 | grep -q "ralph" && echo "OK"
```

**Done when:**
- [ ] ralph.js exists and runs without errors (`--help` works)
- [ ] State-machine loop reads config.json and routes correctly
- [ ] Spawns claude with correct flags (inherit stdin, json output, guardrails)
- [ ] Process group cleanup on SIGINT
- [ ] Atomic state writes
- [ ] Pre-flight check for permissions

---

### Task 2: Add ralph subcommand to install.js

**Files:** `bin/install.js`

**Action:**
Add subcommand dispatch at the top of install.js, before the banner:

```javascript
// Dispatch subcommands before install logic
if (process.argv[2] === 'ralph') {
  require('./ralph.js');
  return;
}
```

This keeps `npx specdacular ralph` working without a second bin entry.

**Verify:**
```bash
grep -q "ralph" bin/install.js && echo "OK"
```

**Done when:**
- [ ] `npx specdacular ralph` dispatches to ralph.js
- [ ] Normal `npx specdacular` install flow unchanged

---

## Verification

After all tasks complete:

```bash
# ralph.js exists and has help
node bin/ralph.js --help 2>&1 | grep -qi "ralph" && echo "ralph: OK"

# install.js dispatches ralph
grep -q "ralph" bin/install.js && echo "dispatch: OK"

# ralph.js uses correct spawn pattern
grep -q "inherit" bin/ralph.js && echo "stdin-inherit: OK"
grep -q "detached" bin/ralph.js && echo "detached: OK"
grep -q "close" bin/ralph.js && echo "close-event: OK"
grep -q "renameSync" bin/ralph.js && echo "atomic-write: OK"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] RALPH loop can start and show its banner
- [ ] Process cleanup on SIGINT works

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/flow-changes/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
