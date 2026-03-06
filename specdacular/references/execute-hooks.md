<shared name="execute_hooks">

## Execute Hooks

**Required:** `$HOOK_CONFIG`, `$STEP_NAME`, `$TASK_NAME`, `$TASK_DIR`

### Resolve Hook

If `$HOOK_CONFIG` is set (not null), use it: `{ "workflow": "path/to/hook.md", "mode": "inline"|"subagent", "optional": false }`.
Defaults: `mode: "inline"`, `optional: false`.

If null, check convention: `.specd/hooks/{pre|post}-{step-name}.md`. If found, use with defaults. If not found, skip.

### Execute — Inline Mode (default)

Read the hook markdown file and execute its instructions in the current context. The hook has full access to task files and can modify them.

### Execute — Subagent Mode

Flush state to disk first. Then spawn a general-purpose agent with the hook file path, task name, task dir, and step name. Agent's file modifications persist on disk.

### Error Handling

- **Required hook fails (`optional: false`):** Stop pipeline, save state, show error, end workflow.
- **Optional hook fails (`optional: true`):** Warn `[HOOK SKIPPED] {name}: {reason}`, log to CHANGELOG.md, continue.

### Execution Order

```
1. Global hooks.pre-step (if configured)
2. Step hooks.pre (if configured, else convention fallback)
3. ── STEP WORKFLOW ──
4. Step hooks.post (if configured, else convention fallback)
5. Global hooks.post-step (if configured)
```

</shared>
