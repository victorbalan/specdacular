<shared name="load_context">

## Load Task Context

**Required:** `$TASK_NAME`, `$TASK_DIR` (from validate-task)
**Optional:** `$PHASE` (phase number), `$CONTEXT_MODE` ("full" or "execution")

### Full Mode (default)

Load all task files:

```bash
cat $TASK_DIR/FEATURE.md
cat $TASK_DIR/CONTEXT.md
cat $TASK_DIR/DECISIONS.md
cat $TASK_DIR/STATE.md
cat $TASK_DIR/config.json
[ -f "$TASK_DIR/RESEARCH.md" ] && cat $TASK_DIR/RESEARCH.md
[ -f "$TASK_DIR/ROADMAP.md" ] && cat $TASK_DIR/ROADMAP.md
[ -f "$TASK_DIR/CHANGELOG.md" ] && cat $TASK_DIR/CHANGELOG.md
```

Load codebase docs if available:
```bash
[ -d ".specd/codebase" ] && {
  [ -f ".specd/codebase/MAP.md" ] && cat .specd/codebase/MAP.md
  [ -f ".specd/codebase/PATTERNS.md" ] && cat .specd/codebase/PATTERNS.md
  [ -f ".specd/codebase/STRUCTURE.md" ] && cat .specd/codebase/STRUCTURE.md
  [ -f ".specd/codebase/CONCERNS.md" ] && cat .specd/codebase/CONCERNS.md
}
```

### Execution Mode (`$CONTEXT_MODE = execution`)

Load only what's needed for coding — skip discussion history, state, and codebase structure docs:

```bash
cat $TASK_DIR/FEATURE.md
cat $TASK_DIR/DECISIONS.md
[ -f ".specd/codebase/PATTERNS.md" ] && cat .specd/codebase/PATTERNS.md
[ -f "$TASK_DIR/RESEARCH.md" ] && cat $TASK_DIR/RESEARCH.md
[ -f "$TASK_DIR/CHANGELOG.md" ] && cat $TASK_DIR/CHANGELOG.md
```

### Phase-Specific Context (when $PHASE is set)

```bash
PHASE_DIR="$TASK_DIR/phases/phase-$(printf '%02d' $PHASE)"
[ -f "$PHASE_DIR/PLAN.md" ] && cat "$PHASE_DIR/PLAN.md"
```

</shared>
