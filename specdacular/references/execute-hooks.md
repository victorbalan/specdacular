<shared name="execute_hooks">

## Execute Hooks

Resolve and execute a hook. Called by brain.md for pre/post hooks around each step.

**Before using this reference, you must have ready:**
- `$HOOK_CONFIG` — the hook configuration (from pipeline.json step or global hooks)
- `$STEP_NAME` — the current step name (for convention discovery and logging)
- `$TASK_NAME` — the task name
- `$TASK_DIR` — path to task directory

### Resolve Hook

**If hook config is explicitly set (not null):**

Hook config shape:
```json
{
  "workflow": "path/to/hook.md",
  "mode": "inline",
  "optional": false
}
```

Defaults if fields are missing:
- `mode`: `"inline"`
- `optional`: `false`

**If hook config is null — convention fallback:**

Check for convention-named hook file:
```bash
[ -f ".specd/hooks/{pre|post}-{step-name}.md" ] && echo "found"
```

If found, use it with defaults: `mode: "inline"`, `optional: false`.

If not found, skip — no hook to execute.

### Execute Hook — Inline Mode

When `mode` is `"inline"` (default):

1. Read the hook markdown file
2. Execute the hook's instructions in the brain's current context
3. The hook has full access to task files (FEATURE.md, CONTEXT.md, DECISIONS.md, etc.)
4. The hook can read and modify any task file — this is how it communicates with subsequent steps
5. After hook completes, continue to next item in execution sequence

**Convention for hooks modifying shared files:**
Hooks should append to designated sections rather than overwriting. If adding context, append under a `## Hook Context` section or similar.

### Execute Hook — Subagent Mode

When `mode` is `"subagent"`:

1. **Flush state to disk first:** Ensure all pending config.json and STATE.md writes are committed. The subagent reads from disk and must see current state.

2. **Spawn hook as Task agent:**
```
Task(
  subagent_type: "general-purpose"
  model: "sonnet"
  run_in_background: false
  description: "Hook: {hook-file-name}"
  prompt: "You are executing a hook for the specdacular workflow system.

Read and follow the instructions in: {path/to/hook.md}

Task context:
- Task name: {task-name}
- Task directory: {task-dir}
- Current step: {step-name}

You have full access to read and modify task files in the task directory.
After completing the hook instructions, return a brief summary of what you did."
)
```

3. After subagent returns, brain continues. Subagent's file modifications are already on disk.

### Error Handling

**If hook succeeds:** Continue to next item in execution sequence.

**If hook fails and `optional: false` (default):**
- Stop the pipeline immediately
- Save current state (config.json, STATE.md)
- Surface the error to the user:
```
Hook failed: {hook-file-name}
Error: {description of what went wrong}

Pipeline stopped. Resume with /specd:continue {task-name}
```
- End workflow

**If hook fails and `optional: true`:**
- Print visible warning:
```
[HOOK SKIPPED] {hook-file-name} failed: {reason}
```
- Append to CHANGELOG.md:
```markdown
### {date} - Hook Failure

**{hook-file-name} (optional, skipped)**
- **Step:** {step-name}
- **Error:** {reason}
- **Impact:** Hook skipped, pipeline continued
```
- Continue to next item in execution sequence

### Execution Order

The full hook execution sequence around a step:

```
1. Global hooks.pre-step    (if configured)
2. Step hooks.pre           (if configured, else convention fallback)
3. ── STEP WORKFLOW ──
4. Step hooks.post          (if configured, else convention fallback)
5. Global hooks.post-step   (if configured)
```

</shared>
