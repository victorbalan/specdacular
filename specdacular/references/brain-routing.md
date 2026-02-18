<shared name="brain_routing">

## Brain Routing

Determine the next pipeline step based on current state. The brain calls this after loading state to figure out where to dispatch.

**Before using this reference, you must have ready:**
- `$PIPELINE` — loaded pipeline config
- `$CONFIG` — task config.json contents
- `$STATE` — task STATE.md contents
- `$CONTEXT` — task CONTEXT.md contents
- `$TASK_DIR` — path to task directory

### Read Current State

Extract from config.json:
- `stage` — discussion, research, planning, execution
- `phases.current` — current phase number (if in execution)
- `phases.current_status` — pending, executing, executed, completed (if in execution)
- `phases.total` — total phases (if planned)

Extract from CONTEXT.md:
- Count unchecked items in "Gray Areas Remaining" section → `$GRAY_AREAS_COUNT`

### Route to Next Step

**State-to-step mapping:**

| State | Next Step | Pipeline |
|-------|-----------|----------|
| stage=discussion, gray areas > 0 | `discuss` | main |
| stage=discussion, gray areas = 0 | `research` (or `plan` if user skips) | main |
| stage=research, no RESEARCH.md | `research` | main |
| stage=planning, no phases dir | `plan` | main |
| stage=planning or execution, phases.current_status=pending | `execute` | phase-execution |
| stage=execution, phases.current_status=executing | `execute` (resume) | phase-execution |
| stage=execution, phases.current_status=executed | `review` | phase-execution |
| stage=execution, phases.current_status=completed | check more phases | phase-execution |

### Routing Logic

**1. Discussion stage with gray areas:**
```
$NEXT_STEP = "discuss"
$NEXT_PIPELINE = "main"
```
**2. Discussion stage, no gray areas:**
```
$NEXT_STEP = "research"
$NEXT_PIPELINE = "main"
```
Auto-proceed to research.

**3. Research stage:**
```bash
[ -f "$TASK_DIR/RESEARCH.md" ] && echo "has_research"
```
If no RESEARCH.md:
```
$NEXT_STEP = "research"
$NEXT_PIPELINE = "main"
```
If RESEARCH.md exists, advance to plan.

**4. Planning stage, no phases:**
```bash
[ -d "$TASK_DIR/phases" ] && echo "has_phases"
```
If no phases:
```
$NEXT_STEP = "plan"
$NEXT_PIPELINE = "main"
```
If phases exist, advance to execution.

**5. Execution — phases.current_status = "pending":**
```
$NEXT_STEP = "execute"
$NEXT_PIPELINE = "phase-execution"
```
This is a new phase ready to start.

**6. Execution — phases.current_status = "executing":**
```
$NEXT_STEP = "execute"
$NEXT_PIPELINE = "phase-execution"
$RESUME = true
```
Interrupted execution — resume.

**7. Execution — phases.current_status = "executed":**
```
$NEXT_STEP = "review"
$NEXT_PIPELINE = "phase-execution"
```
Phase done, needs review.

**8. Execution — phases.current_status = "completed":**
Check for more phases:
```bash
# Check if current phase < total phases
CURRENT=$(read phases.current from config.json)
TOTAL=$(read phases.total from config.json)
```

Also check for decimal fix phases:
```bash
ls -d $TASK_DIR/phases/phase-$(printf '%02d' $CURRENT).* 2>/dev/null
```

If decimal fix phases exist and are incomplete → route to execute for fix phase.
If current < total → advance `phases.current`, set status to "pending", route to execute.
If current >= total → task complete.

### Task Complete

When all phases are done:
```
$NEXT_STEP = "complete"
$TASK_COMPLETE = true
```

### Find Step in Pipeline

To find a step by name in a pipeline array:

```
For each step in $PIPELINE.pipelines.{pipeline_name}:
  If step.name == $NEXT_STEP:
    Return step (workflow path, hooks config)
```

If step not found in pipeline → error:
```
Step '{name}' not found in pipeline '{pipeline_name}'. Check your pipeline.json.
```

### Resolve Workflow Path

Step workflow values are filenames (e.g., `"discuss.md"`). Resolve to full path:

```
~/.claude/specdacular/workflows/{workflow}
```

Or for local install:
```
.claude/specdacular/workflows/{workflow}
```

For user-overridden workflows (path contains `/`), use as-is (relative to project root).

</shared>
