<purpose>
Execute a plan from a feature, tracking progress and logging deviations.

**Key principles:**
- Execute tasks in order with verification
- Auto-fix bugs/blockers, log to CHANGELOG.md
- Ask before architectural changes
- Stop on verification failure, let user decide
- Commit after each successful task

**Output:** Completed tasks, updated STATE.md, CHANGELOG.md entries
</purpose>

<philosophy>

## Deviations Are Normal

Plans are written in advance. Reality differs. The goal is controlled deviation:
- Small fixes: Just do it, log it
- Big changes: Ask first

## Auto-fix vs Ask First

**Auto-fix (log to CHANGELOG.md):**
- Bugs — Code doesn't work, logic errors, crashes
- Blockers — Missing imports, wrong paths, missing deps
- Missing critical — Error handling, validation needed for correctness

**Ask first:**
- New files not specified in plan
- Different approach than specified
- Architectural changes — new patterns, new dependencies

## Verification Is Non-Negotiable

Every task has verification. If it fails:
1. Show the output
2. Ask user: Retry / Skip / Stop
3. Log skips to CHANGELOG.md

## Progress Is Persistent

STATE.md tracks exactly where we are. If interrupted, we can resume.

</philosophy>

<process>

<step name="validate">
Validate feature exists and has plans.

```bash
# Check feature exists
[ -d ".specd/features/$ARGUMENTS" ] || { echo "not found"; exit 1; }

# Check plans exist
[ -d ".specd/features/$ARGUMENTS/plans" ] || { echo "no plans"; exit 1; }

# Check ROADMAP exists
[ -f ".specd/features/$ARGUMENTS/ROADMAP.md" ] || { echo "no roadmap"; exit 1; }
```

**If feature not found:**
```
Feature '{name}' not found.

Run /specd:new-feature {name} to create it.
```

**If no plans:**
```
Feature '{name}' has no plans yet.

Run /specd:plan-feature {name} to create plans.
```

Continue to load_context.
</step>

<step name="load_context">
Load ALL context needed for execution.

**Read feature context:**
- `config.json` — Feature settings (check `execution.auto_commit`)
- `STATE.md` — Current progress, completed plans
- `DECISIONS.md` — Constraints to follow during implementation
- `RESEARCH.md` — Implementation notes, pitfalls (if exists)
- `ROADMAP.md` — Phase overview, plan order

**Read codebase context (if available):**
- `PATTERNS.md` — Code patterns to follow
- `STRUCTURE.md` — Where files go
- `MAP.md` — System overview

**Internalize:**
- Which plans are complete (from STATE.md)
- Which phase we're in
- Key decisions affecting implementation
- Patterns to follow

Continue to find_plan.
</step>

<step name="find_plan">
Determine which plan to execute.

**If plan path provided in arguments:**
- Use that plan directly
- Verify it exists

**Else find next plan:**
1. Read STATE.md for current progress
2. Read ROADMAP.md for plan order
3. Find first plan without completion marker in STATE.md
4. Or first plan file in current phase directory

**If no plan found:**
```
All plans complete for '{name}'!

Feature execution finished. Review:
- STATE.md for summary
- CHANGELOG.md for deviations
```

**Present plan to execute:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 EXECUTE PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** {feature-name}

**Context loaded:**
- STATE.md: {phase X, N plans executed}
- DECISIONS.md: {N} decisions
- ROADMAP.md: {N} phases, {M} plans total

**Settings:**
- Auto-commit: {yes | no} (from config.json)

**Next plan:** {plans/phase-XX/YY-PLAN.md}
**Objective:** {one-line from plan}

Proceed? [Y/n]
```

Use AskUserQuestion:
- header: "Execute"
- question: "Proceed with this plan?"
- options:
  - "Yes, execute" — Continue to execute_tasks
  - "Show plan first" — Read and display plan content, then ask again
  - "Skip to different plan" — Ask for plan path
  - "Cancel" — Exit workflow

Continue to execute_tasks.
</step>

<step name="execute_tasks">
Execute each task in the plan.

**Read plan file:**
Parse the plan to extract:
- Objective
- Tasks (numbered)
- For each task: files, action, pattern, verification, done criteria

**Update STATE.md:**
Set current plan and task:
```markdown
### Current Plan
- Plan: {path to current plan}
- Task: 1 of {N}
- Started: {YYYY-MM-DD HH:MM}
```

**For each task:**

### 1. Announce task
```
───────────────────────────────────────────────────────
Executing Task {N}: {Title}
Files: {file list}
───────────────────────────────────────────────────────
```

### 2. Implement task
Follow the plan's instructions:
- Create/modify specified files
- Follow patterns from codebase docs
- Reference DECISIONS.md for constraints
- Use code patterns from PATTERNS.md

### 3. Handle deviations during implementation

**If bug/blocker discovered:**
- Fix it immediately
- Log to CHANGELOG.md:
```markdown
### {YYYY-MM-DD} - Plan {phase-XX/YY}

**[Auto-fix] {Short description}**
- **What:** {What was fixed}
- **Why:** {Why it was needed}
- **Files:** `{affected files}`
```
- Continue implementation

**If architectural change needed:**
- Stop implementation
- Present to user:
```
Architectural change needed:

**What:** {Description of change}
**Why:** {Why plan approach won't work}
**Proposed:** {Alternative approach}

This differs from the plan. How to proceed?
```

Use AskUserQuestion:
- header: "Change"
- question: "This requires a change from the plan. Approve?"
- options:
  - "Approve change" — Implement and log to CHANGELOG.md
  - "Try plan approach" — Attempt original approach
  - "Stop and discuss" — Pause execution

**If user approves change:**
- Implement the change
- Log to CHANGELOG.md:
```markdown
### {YYYY-MM-DD} - Plan {phase-XX/YY}

**[User-approved] {Short description}**
- **What:** {What was changed}
- **Why:** {Why plan approach didn't work}
- **Decision:** User approved alternative
- **Files:** `{affected files}`
```

### 4. Run verification
Execute the verification command from the task:
```bash
{verification command from plan}
```

**If verification passes:**
- Show: `Verification: {command} ✓`
- Continue to commit

**If verification fails:**
- Show output:
```
Verification failed for Task {N}: {Title}

Command: {verification command}
Output:
{actual output}

How to proceed?
```

Use AskUserQuestion:
- header: "Failed"
- question: "Verification failed. How to proceed?"
- options:
  - "Retry task" — Go back to step 2 for this task
  - "Skip task" — Log to CHANGELOG.md and continue
  - "Stop execution" — Pause, save progress

**If skip:**
- Log to CHANGELOG.md:
```markdown
### {YYYY-MM-DD} - Plan {phase-XX/YY}

**[Skipped] Task {N}: {Title}**
- **Reason:** Verification failed, user chose to skip
- **Command:** `{verification command}`
- **Output:** {truncated output}
- **Files:** `{affected files}`
```

### 5. Commit task (if auto_commit enabled)

**Check config.json `execution.auto_commit`:**

**If auto_commit is true:**
```bash
git add {files from task}
git commit -m "feat({feature}): {task description}"
```

**If auto_commit is false:**
- Do NOT commit
- Show message:
```
Task {N} complete. Changes ready for review.
Files modified: {file list}

Commit when ready:
git add {files} && git commit -m "feat({feature}): {task description}"
```

### 6. Update STATE.md
Update current task number:
```markdown
- Task: {N+1} of {M}
```

**Continue to next task.**

After all tasks, continue to complete_plan.
</step>

<step name="complete_plan">
Mark plan complete and suggest next.

**Update STATE.md:**

1. Clear current plan section:
```markdown
### Current Plan
- Plan: none
- Task: —
- Started: —
```

2. Add to completed plans table:
```markdown
### Completed Plans
| Plan | Completed | Tasks | Deviations |
|------|-----------|-------|------------|
| {path} | {YYYY-MM-DD} | {N} | {count} |
```

3. Update stage progress checkboxes

**Commit STATE.md update (if auto_commit enabled):**

**If auto_commit is true:**
```bash
git add .specd/features/{feature}/STATE.md
git commit -m "docs({feature}): complete plan {phase-XX/YY}"
```

**If auto_commit is false:**
- Do NOT commit
- Include STATE.md in the list of modified files for user to review

**Find next plan:**
- Check ROADMAP.md for next plan in sequence
- Or next phase if current phase complete

**Present summary:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PLAN COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Plan:** {path}
**Tasks executed:** {N}
**Deviations logged:** {count}

{If deviations:}
## Deviations

{List from CHANGELOG.md for this plan}

───────────────────────────────────────────────────────

**Next plan:** {path or "None - all plans complete"}

{If next plan exists:}
Run `/specd:execute-plan {feature}` to continue.

{If all complete:}
All plans complete! Feature '{feature}' is implemented.
Review STATE.md and CHANGELOG.md for summary.
```

End workflow.
</step>

</process>

<changelog_format>
When logging to CHANGELOG.md, use this format:

```markdown
### {YYYY-MM-DD} - Plan {phase-XX/YY}

**[{Type}] {Short description}**
- **What:** {Description of change}
- **Why:** {Reason for deviation}
- **Files:** `{comma-separated file paths}`

{If relevant:}
- **Decision:** {User decision if asked}
- **Output:** {Truncated verification output if skipped}
```

Types:
- `[Auto-fix]` — Bug, blocker, or missing critical item fixed automatically
- `[User-approved]` — Architectural change approved by user
- `[Skipped]` — Task skipped due to verification failure
</changelog_format>

<success_criteria>
- Feature validated with plans
- All context loaded and internalized
- Tasks executed in plan order
- Verification run after each task
- Deviations logged appropriately
- Commits made with proper format
- STATE.md updated with progress
- Next plan identified or completion announced
</success_criteria>
