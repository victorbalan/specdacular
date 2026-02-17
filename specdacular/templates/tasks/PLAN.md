---
task: {task-name}
phase: {N}
depends_on: []
creates:
  - {path/to/new/file.ts}
modifies:
  - {path/to/existing/file.ts}
---

# Phase {N}: {Phase Title}

## Objective

{What this phase accomplishes and why. 1-2 sentences max.}

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Code patterns to follow
- `@.specd/codebase/STRUCTURE.md` — Where files go
- `@{path/to/pattern/file}` — Pattern to follow for this task

**Relevant Decisions:**
- DEC-XXX: {Decision that affects this phase}

**From Research:** (if RESEARCH.md exists)
- {Key finding that affects implementation}
- {Pitfall to avoid}

---

## Tasks

### Task 1: {Task Title}

**Files:** `{path/to/file}`

**Action:**
{Clear description of what to create or modify. Include enough detail that the implementing agent doesn't need to ask questions.}

**Verify:**
```bash
{command to verify task is complete}
```

**Done when:**
- [ ] {Specific, observable completion criterion}

---

### Task 2: {Task Title}

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

After all tasks complete:

```bash
{commands to verify the phase is done}
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/{task-name}/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
