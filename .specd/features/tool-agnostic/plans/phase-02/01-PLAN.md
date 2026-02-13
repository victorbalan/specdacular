---
feature: tool-agnostic
phase: 2
plan: 01
depends_on: []
creates: []
modifies:
  - bin/build-codex.js
---

# Plan 01: Extend Build Script for Shared References and Cross-Skill Pointers

## Objective

Extend `bin/build-codex.js` to copy shared reference files (commit-docs.md, commit-code.md, select-feature.md, select-phase.md) into each skill's `references/` directory, and translate cross-workflow `@path` references into "See skill: specd-{name}" pointers.

## Context

**Reference these files:**
- `@bin/build-codex.js` — Current build script from Phase 1
- `@specdacular/references/commit-docs.md` — Shared reference (used by discuss-feature)
- `@specdacular/references/select-feature.md` — Shared reference (used by review-feature, toolbox)

**Relevant Decisions:**
- DEC-007: Shared references copied per-skill — each skill gets its own copy
- DEC-008: Cross-workflow references become skill pointers

## Tasks

### Task 1: Add shared reference copying

**Files:** `bin/build-codex.js`

**Action:**

Add a mechanism to detect which shared references a workflow uses and copy them (translated) into the skill's `references/` directory.

1. Define a `REFERENCES_DIR` constant pointing to `specdacular/references/`
2. After generating `references/workflow.md`, scan the original workflow content for `@~/.claude/specdacular/references/{name}.md` patterns
3. For each match, read the source reference file, apply `translateTools()` and `replacePathRefs()`, and write to `references/{name}.md` in the skill directory

```javascript
const REFERENCES_DIR = path.join(ROOT, 'specdacular', 'references');

/**
 * Copy shared references that the workflow uses into the skill's references/ dir.
 */
function copySharedRefs(workflowContent, refsDir) {
  const refPattern = /@[^\s]*specdacular\/references\/([^\s<)]+\.md)/g;
  let match;
  const copied = [];
  while ((match = refPattern.exec(workflowContent)) !== null) {
    const refName = match[1];
    const srcPath = path.join(REFERENCES_DIR, refName);
    if (fs.existsSync(srcPath)) {
      let content = fs.readFileSync(srcPath, 'utf8');
      content = translateTools(content);
      content = replacePathRefs(content);
      fs.writeFileSync(path.join(refsDir, refName), AUTO_GENERATED_HEADER + content);
      copied.push(refName);
    }
  }
  return copied;
}
```

Call `copySharedRefs()` in the main loop after writing `references/workflow.md`.

**Verify:**
```bash
node bin/build-codex.js && ls codex/skills/specd-feature-toolbox/references/
```

Expected: `workflow.md`, `select-feature.md`, `select-phase.md`

**Done when:**
- [ ] Shared references detected from workflow content
- [ ] References copied and translated per-skill
- [ ] Only referenced files copied (not all references to all skills)

---

### Task 2: Translate cross-workflow references to skill pointers

**Files:** `bin/build-codex.js`

**Action:**

Add a translation rule in `replacePathRefs()` that converts `@~/.claude/specdacular/workflows/{name}.md` references into `See skill: specd-{name}` pointers. This is different from the `<execution_context>` reference (which links command→workflow) — these are inline references from one workflow to another.

Update `replacePathRefs()`:
```javascript
// Replace @workflow references with skill pointers
// Match: @~/.claude/specdacular/workflows/{name}.md or @/abs/path/specdacular/workflows/{name}.md
result = result.replace(/@[^\s<)]*specdacular\/workflows\/([^\s<).]+)\.md/g, (match, name) => {
  const skillName = 'specd-' + name;
  return `(see skill: ${skillName})`;
});
```

Also update the existing `replacePathRefs` to handle the reference files:
```javascript
// Replace @reference paths with local reference links
result = result.replace(/@[^\s<)]*specdacular\/references\/([^\s<)]+\.md)/g, (match, name) => {
  return `[${name}](references/${name})`;
});
```

**Important:** These new rules must come BEFORE the generic `@~/.claude/specdacular/` catch-all rule, since they're more specific.

**Verify:**
```bash
node bin/build-codex.js && grep -r "specdacular/workflows/" codex/ | head -5
```

Expected: No matches (all workflow references translated to skill pointers).

```bash
grep "see skill:" codex/skills/specd-feature-toolbox/references/workflow.md | head -3
```

Expected: Lines like `(see skill: specd-discuss-feature)`

**Done when:**
- [ ] Cross-workflow `@path` references become "(see skill: specd-{name})"
- [ ] Cross-reference `@path` references become markdown links to local references
- [ ] No raw `@~/.claude/specdacular/workflows/` paths remain in output
- [ ] No raw `@~/.claude/specdacular/references/` paths remain in output

---

## Verification

After all tasks complete:

```bash
# Full build
node bin/build-codex.js

# Check shared references were copied
ls codex/skills/specd-feature-toolbox/references/
# Expected: workflow.md, select-feature.md, select-phase.md

ls codex/skills/specd-feature-continue/references/
# Expected: workflow.md, commit-docs.md (if referenced)

# No raw specdacular paths remain
grep -r "specdacular/" codex/ && echo "FAIL" || echo "PASS"

# Skill pointers present
grep "see skill:" codex/skills/specd-feature-toolbox/references/workflow.md | head -3

# Auto-generated headers on reference files
for f in $(find codex/ -name "*.md"); do head -1 "$f" | grep -q "AUTO-GENERATED" || echo "Missing header: $f"; done
```

**Plan is complete when:**
- [ ] Shared references copied per-skill based on workflow usage
- [ ] Cross-workflow references translated to skill pointers
- [ ] Cross-reference paths translated to local markdown links
- [ ] All verifications pass
