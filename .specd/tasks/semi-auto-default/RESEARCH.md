# Research: semi-auto-default

## Key Recommendation

Straightforward rename/remove across 8 active files. No dynamic logic depends on `enabled` or mode fields — all changes are to markdown docs and one JSON config. Low risk, high confidence.

## Codebase Integration

### Files to Modify (active, shipped code)

| File | Changes | Confidence |
|------|---------|------------|
| `specdacular/pipeline.json` | Remove `mode`, remove `enabled`, rename `pause_in_semi_auto` → `pause` | HIGH |
| `specdacular/workflows/brain.md` | Remove `--semi-auto` parsing, remove interactive mode logic, remove `enabled` skip logic, simplify `prompt_or_proceed` | HIGH |
| `specdacular/workflows/continue.md` | Remove `--semi-auto` from arg parsing description, update mode list | HIGH |
| `specdacular/references/brain-routing.md` | Remove `enabled` skip logic (line ~133), remove "research step is enabled" phrasing | HIGH |
| `specdacular/references/execute-hooks.md` | Remove disabled step hook skip note (line 127) | HIGH |
| `specdacular/references/resolve-pipeline.md` | Remove "enabled" phrasing | HIGH |
| `commands/specd.continue.md` | Update argument-hint, update mode descriptions | HIGH |
| `specdacular/STATE-MACHINE.md` | Update pipeline config example, update step fields table | HIGH |
| `specdacular/HELP.md` | Update modes table, remove enabled docs, update mode line | HIGH |
| `README.md` | Update modes table, examples, pipeline JSON example | HIGH |

### Files to Modify (historical docs — optional)

These are `.specd/tasks/` and `.specd/features/` docs from previous tasks. They reference the old mode system but are historical records. **Recommended: leave as-is.** They document decisions at the time they were made.

| File | References |
|------|------------|
| `.specd/tasks/brain-and-hooks/DECISIONS.md` | DEC-010 references three modes |
| `.specd/tasks/brain-and-hooks/FEATURE.md` | Pipeline examples with `enabled`, `mode` |
| `.specd/tasks/brain-and-hooks/RESEARCH.md` | Mode analysis, `pause_in_semi_auto` |
| `.specd/features/new-command-rearchitect/*` | Multiple references to `--semi-auto` |
| `.specd/codebase/PATTERNS.md` | Pipeline example with `mode: interactive` |

## Implementation Patterns

### brain.md Changes

**Current `prompt_or_proceed` logic (3 branches):**
1. Interactive → always prompt with AskUserQuestion
2. Semi-auto → check `pause_in_semi_auto`, prompt if true, auto-proceed if false
3. Auto → always proceed

**New logic (2 branches):**
1. Default → check `pause` field, prompt if true, auto-proceed if false/absent
2. `--auto` → always proceed

**Current `parse_args` (lines 34-45):**
- Parses `--semi-auto` and `--auto` flags
- Reads `mode` from pipeline.json
- Priority: CLI flag → pipeline.json mode → "interactive"

**New `parse_args`:**
- Only parse `--auto` flag
- No `mode` field from pipeline.json
- If `--auto` present → auto mode, otherwise → default (pause-based)

### pipeline.json Changes

**Before:**
```json
{
  "schema_version": "1.0",
  "mode": "interactive",
  "pipelines": {
    "main": [
      { "name": "discuss", "enabled": true, "workflow": "discuss.md", "pause_in_semi_auto": false, "hooks": { "pre": null, "post": null } }
    ]
  }
}
```

**After:**
```json
{
  "schema_version": "1.0",
  "pipelines": {
    "main": [
      { "name": "discuss", "workflow": "discuss.md", "hooks": { "pre": null, "post": null } }
    ]
  }
}
```

Steps with `pause: true` (execute, review, revise) keep that field. Steps without it default to auto-proceed.

## Pitfalls

### 1. User pipeline overrides may break
**Risk:** MEDIUM
Users with `.specd/pipeline.json` overrides still using `enabled` or `pause_in_semi_auto` fields. Brain should gracefully handle old field names (or just ignore unknown fields, which it already does since it's markdown-driven).
**Mitigation:** Document the change. The brain is markdown-based, so unrecognized fields are just ignored.

### 2. No dynamic `enabled: false` usage found
**Risk:** LOW
Searched all config.json files — none set `enabled` dynamically. It's always `true` in the shipped pipeline.json. Safe to remove.

### 3. `mode` field in hook configs is NOT affected
**Risk:** LOW
Hooks have a `"mode": "inline|subagent"` field. This is a different `mode` than the pipeline-level `mode`. Must NOT remove this. Only remove the top-level `"mode": "interactive"` from pipeline.json.

### 4. Historical docs reference old modes
**Risk:** LOW
`.specd/tasks/brain-and-hooks/` docs reference the three-mode system. These are historical records of decisions made during that task. Updating them would rewrite history. Leave as-is.
