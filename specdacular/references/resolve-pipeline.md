<shared name="resolve_pipeline">

## Resolve Pipeline

Load and validate the pipeline configuration.

**Before using this reference, you must have ready:**
- Working directory is the project root

### Load Pipeline

**Resolution order:**
1. Check for user override: `.specd/pipeline.json`
2. Fall back to installed default: `~/.claude/specdacular/pipeline.json`

```bash
if [ -f ".specd/pipeline.json" ]; then
  echo "user-override"
elif [ -f "~/.claude/specdacular/pipeline.json" ]; then
  echo "default"
else
  echo "not-found"
fi
```

**If user override found:**
```
Using custom pipeline from .specd/pipeline.json
```
Read `.specd/pipeline.json`.

**If default found:**
Read the installed `specdacular/pipeline.json` (use the path prefix from install — `~/.claude/specdacular/pipeline.json` for global, `.claude/specdacular/pipeline.json` for local).

**If not found:**
```
No pipeline.json found. This shouldn't happen — try reinstalling with npx specdacular.
```
End workflow.

### Validate Pipeline

After loading, validate the pipeline config:

**1. Check schema_version:**
```
Read "schema_version" field. If missing, warn:
"Warning: pipeline.json has no schema_version. Expected 1.0."
```

**2. Check pipeline references:**
For each step in all pipelines, if a step has `"pipeline": "{name}"`:
- Check that `pipelines.{name}` exists
- If not: error with `"Pipeline step '{step.name}' references pipeline '{name}' which doesn't exist in pipelines object."`

**3. Check workflow references:**
For each step with a `"workflow"` field:
- Check the value is a non-empty string
- If empty: error with `"Step '{step.name}' has no workflow specified."`

**4. Warn on missing standard steps (non-blocking):**
Check if these step names exist in any pipeline: discuss, plan, execute, review.
For each missing, warn:
```
Note: Standard step '{name}' not found in pipeline. This is OK if intentional.
```

### Set Pipeline Variable

After validation, the pipeline config is available as `$PIPELINE` for the brain to use.

`$PIPELINE_SOURCE` is set to `"user-override"` or `"default"`.

</shared>
