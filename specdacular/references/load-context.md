<shared name="load_context">

## Load Task Context

Load all context files for a task. Use after validation.

**Before using this reference, you must have ready:**
- `$TASK_NAME` — the task name
- `$PHASE` (optional) — phase number, if loading phase-specific context

### Always Load

| File | Provides |
|------|----------|
| `FEATURE.md` | Technical requirements, files to create, integration points, constraints |
| `CONTEXT.md` | Discussion history, resolved questions, gray areas remaining |
| `DECISIONS.md` | Active decisions that constrain implementation |
| `STATE.md` | Current stage, progress, completed phases |
| `config.json` | Task settings, stage, decision count |

```bash
# Read all required files
cat .specd/tasks/$TASK_NAME/FEATURE.md
cat .specd/tasks/$TASK_NAME/CONTEXT.md
cat .specd/tasks/$TASK_NAME/DECISIONS.md
cat .specd/tasks/$TASK_NAME/STATE.md
cat .specd/tasks/$TASK_NAME/config.json
```

### Load If Exists

| File | Provides | When Useful |
|------|----------|-------------|
| `RESEARCH.md` | Implementation patterns, library decisions, pitfalls | Planning, execution |
| `ROADMAP.md` | Phase overview, success criteria, dependencies | Planning, execution, review |
| `CHANGELOG.md` | Implementation deviations, execution-time decisions | Review, continued execution |

```bash
# Check and read optional files
[ -f ".specd/tasks/$TASK_NAME/RESEARCH.md" ] && cat .specd/tasks/$TASK_NAME/RESEARCH.md
[ -f ".specd/tasks/$TASK_NAME/ROADMAP.md" ] && cat .specd/tasks/$TASK_NAME/ROADMAP.md
[ -f ".specd/tasks/$TASK_NAME/CHANGELOG.md" ] && cat .specd/tasks/$TASK_NAME/CHANGELOG.md
```

### Phase-Specific Context (when $PHASE is set)

```bash
PHASE_DIR=".specd/tasks/$TASK_NAME/phases/phase-$(printf '%02d' $PHASE)"

# Read phase plan
[ -f "$PHASE_DIR/PLAN.md" ] && cat "$PHASE_DIR/PLAN.md"
```

### Codebase Context (if available)

```bash
# Check for codebase docs
[ -d ".specd/codebase" ] && {
  [ -f ".specd/codebase/MAP.md" ] && cat .specd/codebase/MAP.md
  [ -f ".specd/codebase/PATTERNS.md" ] && cat .specd/codebase/PATTERNS.md
  [ -f ".specd/codebase/STRUCTURE.md" ] && cat .specd/codebase/STRUCTURE.md
  [ -f ".specd/codebase/CONCERNS.md" ] && cat .specd/codebase/CONCERNS.md
}
```

### Global Config

```bash
# Check for global specd config (auto-commit settings)
cat .specd/config.json 2>/dev/null || echo '{}'
```

### What to Extract After Loading

- **From FEATURE.md:** Files to create, integration points, constraints, success criteria
- **From CONTEXT.md:** Resolved questions, gray areas, discussion history
- **From DECISIONS.md:** Active decisions (filter out superseded/revoked)
- **From RESEARCH.md:** Patterns to follow, libraries to use, pitfalls to avoid
- **From ROADMAP.md:** Phase order, current phase, success criteria per phase
- **From STATE.md:** Current stage, completed phases, discussion session count
- **From codebase docs:** Code patterns, file locations, system architecture

</shared>
