<shared name="brain_routing">

## Brain Routing

Determine the next pipeline step based on current state.

**Run:**
```bash
node ~/.claude/hooks/specd-utils.js route --task-dir $TASK_DIR
```

**Output:** `{"next_step": "...", "pipeline": "...", "resume": bool}`

- If `task_complete: true` → continue to complete step
- If `advance_phase: true` → run `node ~/.claude/hooks/specd-utils.js advance-phase --task-dir $TASK_DIR` first, then re-route
- Otherwise → use `next_step` and `pipeline` to find and dispatch the step

### Find Step in Pipeline

```
For each step in $PIPELINE.pipelines.{pipeline_name}:
  If step.name == $NEXT_STEP:
    Return step (workflow path, hooks config)
```

If step not found → error: `Step '{name}' not found in pipeline '{pipeline_name}'.`

### Resolve Workflow Path

Step workflow values are filenames (e.g., `"discuss.md"`). Resolve to full path:
- Installed: `~/.claude/specdacular/workflows/{workflow}`
- Local: `.claude/specdacular/workflows/{workflow}`
- User-overridden (path contains `/`): use as-is relative to project root.

</shared>
