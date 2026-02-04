---
feature: {feature-name}
phase: {N}
plan: {NN}
depends_on: []
creates:
  - {path/to/new/file.ts}
  - {path/to/new/file.tsx}
modifies:
  - {path/to/existing/file.ts}
---

# Plan {NN}: {Plan Title}

## Objective

{What this plan accomplishes and why. 1-2 sentences max.}

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Code patterns to follow
- `@.specd/codebase/STRUCTURE.md` — Where files go
- `@{path/to/pattern/file}` — Pattern to follow for this task

**Relevant Decisions:**
- DEC-XXX: {Decision that affects this plan}
- DEC-YYY: {Another relevant decision}

**From Research:** (if RESEARCH.md exists)
- {Key finding that affects implementation}
- {Pitfall to avoid}

---

## Tasks

### Task 1: {Task Title}

**Files:** `{path/to/file}`

**Action:**
{Clear description of what to create or modify. Include enough detail that the implementing agent doesn't need to ask questions.}

Follow pattern from `{path/to/example}`:
```{language}
// Pattern to follow
{code example showing the pattern}
```

Create:
```{language}
// What to create
{code example or structure}
```

**Verify:**
```bash
{command to verify task is complete}
```

**Done when:**
- [ ] {Specific, observable completion criterion}
- [ ] {Another criterion}

---

### Task 2: {Task Title}

**Files:** `{path/to/file}`

**Action:**
{Clear description}

**Pattern:**
```{language}
{code pattern}
```

**Verify:**
```bash
{verification command}
```

**Done when:**
- [ ] {Completion criterion}

---

### Task 3: {Task Title}

**Files:** `{path/to/file}`

**Action:**
{Clear description}

**Verify:**
```bash
{verification command}
```

**Done when:**
- [ ] {Completion criterion}

---

## Verification

After all tasks complete, verify the plan is done:

```bash
# Type check (if TypeScript)
npx tsc --noEmit

# Run tests (if applicable)
npm test -- --grep "{relevant tests}"

# Manual verification
{any manual checks needed}
```

**Plan is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] No TypeScript errors
- [ ] {Any plan-specific criteria}

---

## Output

When this plan is complete:

1. Update `.specd/features/{feature-name}/STATE.md`:
   - Mark this plan as complete
   - Note any discoveries or decisions made

2. Commit changes:
   ```bash
   git add {files created/modified}
   git commit -m "feat({feature}): {what was accomplished}

   Plan {phase}.{plan} complete:
   - {summary of what was done}"
   ```

3. Next plan: `phase-{NN}/{NN+1}-PLAN.md` (if exists)

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/{feature-name}/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach

**Format:**
```markdown
### {YYYY-MM-DD} - Plan {NN}

**{Brief title}**
- **What:** {What you decided/changed}
- **Why:** {Reason for the change}
- **Files:** `{affected files}`
```

**Don't log:**
- Minor implementation details
- Standard coding patterns
- Things working as planned

---

## Notes

{Space for the implementing agent to record discoveries, blockers, or decisions made during implementation. Leave empty in template.}
