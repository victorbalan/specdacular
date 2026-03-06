<shared name="brain_routing">

## Brain Routing

Determine the next step by reading task state and walking the pipeline.

**Read state:**
```bash
node ~/.claude/hooks/specd-utils.js config-get --task-dir $TASK_DIR --key "stage"
node ~/.claude/hooks/specd-utils.js config-get --task-dir $TASK_DIR --key "phases"
```

**Determine position in pipeline:** Walk `$PIPELINE.pipelines.main` steps in order. The task's `stage` tells you which step was last completed. The next uncompleted step is your target. If the current step is `phase-execution` (a sub-pipeline reference), walk `$PIPELINE.pipelines["phase-execution"]` using `phases.current_status` to find position within it.

**For phase-execution sub-pipeline:** Check `phases.current_status`:
- `pending` + no PLAN.md → next step is `plan`
- `pending` + PLAN.md exists → next step is `execute`
- `executing` → resume `execute`
- `executed` → next step is `review`
- `completed` → advance to next phase (or task complete if last phase)

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
