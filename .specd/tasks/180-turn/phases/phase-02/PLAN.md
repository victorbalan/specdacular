---
task: 180-turn
phase: 2
depends_on: [1]
creates:
  - commands/specd.docs.review.md
  - specdacular/workflows/docs-review.md
modifies: []
---

# Phase 2: Docs Review Command

## Objective

Create the `/specd.docs.review` command and workflow. Audits existing docs for accuracy and staleness, spawns research agents for best-practice suggestions, proposes new topic files for coverage gaps, and updates frontmatter review dates.

## Context

**Reference these files for format/patterns:**
- `commands/specd.docs.md` — Follow same command definition format (created in phase 1)
- `specdacular/workflows/docs.md` — Follow same workflow pattern (created in phase 1)
- `specdacular/workflows/map-codebase.md` — Agent spawning patterns

**Relevant Decisions:**
- DEC-003: Separate review command — review is its own operation, not part of generation
- DEC-007: Frontmatter for review date tracking — read `last_reviewed` to detect staleness, update after review
- DEC-008: Research during review only — this is where research agents get used, not during generation

**Phase 1 outcomes:**
- `commands/specd.docs.md` and `specdacular/workflows/docs.md` established format patterns
- No deviations from phase 1
- User feedback: no auto-commit, no references to old system

---

## Tasks

### Task 1: Create review command definition

**Files:** `commands/specd.docs.review.md`

**Action:**
Create the command definition file following the format of `commands/specd.docs.md`.

**Structure:**
- Frontmatter: name `specd.docs.review`, description about auditing docs for accuracy/staleness, allowed-tools (Read, Bash, Glob, Grep, Write, Edit, Agent, AskUserQuestion, WebSearch, WebFetch)
- `<objective>`: Audit existing topic docs for accuracy, staleness, and coverage gaps. Optionally research best practices. Update review dates.
- `<execution_context>`: Reference `@~/.claude/specdacular/workflows/docs-review.md`
- `<context>`: Explain review approach — check docs against current code, detect drift, use research agents for improvement suggestions, track review dates via frontmatter
- `<when_to_use>`: After code changes, periodically, when docs feel stale, when wanting best-practice improvements
- `<process>`: High-level steps: 1) Find docs with specd frontmatter 2) Check freshness 3) Compare against current code 4) Optionally research best practices 5) Present findings 6) Apply updates + update review dates
- `<success_criteria>`: Stale docs flagged, drift detected, improvements suggested, review dates updated

**Verify:**
```bash
[ -f "commands/specd.docs.review.md" ] && head -5 commands/specd.docs.review.md | grep -q "name: specd.docs.review" && echo "PASS" || echo "FAIL"
```

**Done when:**
- [ ] File exists with correct frontmatter
- [ ] Follows same structure as specd.docs.md
- [ ] References docs-review.md workflow

---

### Task 2: Create docs review workflow

**Files:** `specdacular/workflows/docs-review.md`

**Action:**
Create the full review workflow. This is the counterpart to docs.md — it audits rather than generates.

**Workflow steps to implement:**

**Step 1: `discover_docs`**
- Find all specd-generated docs by scanning for `generated_by: specd` in frontmatter
- Read CLAUDE.md routing table to understand current doc structure
- Parse frontmatter from each doc: extract `last_reviewed` dates
- Set `$DOCS_DIR` from CLAUDE.md or default `docs/`

**Step 2: `assess_freshness`**
- For each doc, compare `last_reviewed` date against today
- Flag docs older than 30 days as stale (configurable threshold)
- Check git log for files changed since last review:
  ```bash
  git log --since="{last_reviewed}" --name-only --pretty=format: -- "src/" "lib/" | sort -u
  ```
- If significant code changes happened since last review, flag as "code changed since review"

**Step 3: `check_accuracy`**
- For each doc, read its content and spot-check against current code:
  - File paths mentioned in doc — do they still exist?
  - Function signatures referenced — are they still accurate?
  - Import patterns described — are they still used?
  - Rules in rules.md — are they still followed?
- Classify each doc:
  - Fresh — reviewed recently, no significant code changes
  - Stale — reviewed long ago, code may have drifted
  - Drifted — confirmed inaccuracies found
  - OK — reviewed recently and still accurate

**Step 4: `detect_gaps`**
- Compare current codebase against existing doc topics
- Look for technologies/patterns in the code not covered by any doc
- Check if any doc topics are now obsolete (technology removed)
- Propose new docs for uncovered areas, removal of obsolete docs

**Step 5: `research_improvements`** (optional)
- Ask user if they want research-backed suggestions:

  Use AskUserQuestion:
  - header: "Research?"
  - question: "Want me to research best practices for your stack to suggest improvements?"
  - options:
    - "Yes — research improvements" — Spawn research agents
    - "No — just review accuracy" — Skip research

- If yes: spawn research agents (using Agent tool with WebSearch/WebFetch) for each detected technology. Compare codebase patterns against current best practices. Note suggestions.

**Step 6: `present_findings`**
- Show review summary:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DOCS REVIEW
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {count} docs reviewed

  {For each doc:}
  {icon} {doc name} — {status} (last reviewed: {date})
     {If drifted: list specific inaccuracies}
     {If stale: note days since review + changed files}

  {If gaps found:}
  Proposed new docs:
  - {topic}.md — {why it's needed}

  {If obsolete found:}
  Possibly remove:
  - {topic}.md — {why it's obsolete}

  {If research done:}
  Improvement suggestions:
  - {suggestion with source}
  ```

**Step 7: `apply_updates`**
- Ask user what to do:

  Use AskUserQuestion:
  - header: "Actions"
  - question: "What would you like to do with these findings?"
  - multiSelect: true
  - options:
    - "Update drifted docs" — Fix inaccuracies in drifted docs
    - "Generate new docs" — Create docs for gap topics
    - "Remove obsolete" — Delete obsolete docs and update routing table
    - "Mark all as reviewed" — Update last_reviewed dates on accurate docs

- For each selected action:
  - Update drifted: regenerate affected docs using same merge approach as docs.md (re-run mapper agents if needed, or patch in place for small changes)
  - Generate new: create new topic docs (may need to re-run agents for fresh data)
  - Remove obsolete: delete files, update CLAUDE.md routing table
  - Mark reviewed: update `last_reviewed` in frontmatter to today's date

- Check CLAUDE.md routing table — propose cleanup if it references non-existent docs or has bloat

**Do not auto-commit.** User manages commits.

**Verify:**
```bash
[ -f "specdacular/workflows/docs-review.md" ] && grep -q "assess_freshness" specdacular/workflows/docs-review.md && grep -q "check_accuracy" specdacular/workflows/docs-review.md && grep -q "research_improvements" specdacular/workflows/docs-review.md && echo "PASS" || echo "FAIL"
```

**Done when:**
- [ ] File exists with all 7 steps implemented
- [ ] Freshness check reads frontmatter dates
- [ ] Accuracy check spot-checks code references
- [ ] Gap detection compares codebase vs. existing docs
- [ ] Research is optional (user chooses)
- [ ] Findings presented with clear status per doc
- [ ] Update actions are user-selectable
- [ ] No auto-commit

---

## Verification

After all tasks complete:

```bash
# Both files exist
[ -f "commands/specd.docs.review.md" ] && [ -f "specdacular/workflows/docs-review.md" ] && echo "Files exist" || echo "Missing files"

# Command has correct frontmatter
head -3 commands/specd.docs.review.md | grep -q "name: specd.docs.review" && echo "Command frontmatter OK" || echo "FAIL"

# Workflow has all key steps
for step in discover_docs assess_freshness check_accuracy detect_gaps research_improvements present_findings apply_updates; do
  grep -q "$step" specdacular/workflows/docs-review.md && echo "Step $step: OK" || echo "Step $step: MISSING"
done
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/180-turn/CHANGELOG.md`.
