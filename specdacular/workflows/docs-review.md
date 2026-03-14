<purpose>
Audit existing topic docs for accuracy, staleness, and coverage gaps. Optionally research best practices for the detected stack. Update frontmatter review dates after user approval.

**Output:** Review findings, updated docs and review dates, CLAUDE.md routing table changes if docs added/removed.
</purpose>

<philosophy>

## Trust But Verify

Docs were generated from real code, but code changes. The review checks whether docs still reflect reality.

## Freshness Is Not Accuracy

A doc can be stale (old review date) but still accurate, or fresh but drifted (code changed right after review). Check both dimensions.

## Research Is Additive

Research agents suggest improvements based on current best practices. They don't override what the codebase actually does — they propose what it could do better.

## User Decides

Present findings. Let the user choose what to update. Don't auto-fix.

</philosophy>

<process>

<step name="discover_docs">
Find all specd-generated docs and parse their frontmatter.

**Read CLAUDE.md routing table:**
```bash
[ -f "CLAUDE.md" ] && cat CLAUDE.md || echo "no_claude_md"
```

Extract `$DOCS_DIR` from routing table paths. Default to `docs/` if not found.

**Find specd-generated docs:**
```bash
grep -rl "generated_by: specd" $DOCS_DIR/ 2>/dev/null
```

**For each doc found, parse frontmatter:**
Read the file, extract:
- `last_reviewed` date
- `generated_by` field
- Doc topic/name from filename

If no specd-generated docs found:
```
No specd-generated docs found. Run /specd.docs first to generate topic docs.
```
End workflow.

Build `$DOC_LIST` — array of docs with their metadata.

Continue to assess_freshness.
</step>

<step name="assess_freshness">
Check how fresh each doc is based on review dates and git history.

**For each doc in `$DOC_LIST`:**

1. Calculate days since `last_reviewed`:
   ```bash
   # Days between last_reviewed and today
   echo $(( ($(date +%s) - $(date -d "{last_reviewed}" +%s)) / 86400 ))
   ```

2. Check if significant code changed since last review:
   ```bash
   git log --since="{last_reviewed}" --name-only --pretty=format: -- "src/" "lib/" "app/" | sort -u | head -20
   ```

3. Classify freshness:
   - **Fresh** — reviewed within 30 days, no significant code changes
   - **Aging** — reviewed 30-90 days ago
   - **Stale** — reviewed 90+ days ago
   - **Code changed** — significant changes to source files since last review (regardless of age)

Continue to check_accuracy.
</step>

<step name="check_accuracy">
Spot-check doc content against current code.

**For each doc in `$DOC_LIST`:**

1. **File path check:** Extract all file paths mentioned in the doc. Verify each exists:
   ```bash
   # For each path referenced in the doc
   [ -f "{path}" ] && echo "exists" || echo "missing: {path}"
   ```

2. **Pattern check:** For docs that describe code patterns (with code examples), spot-check a few:
   - Read the referenced source file
   - Check if the pattern described still matches the actual code
   - Note any significant differences

3. **Rules check (for rules.md):** Verify each rule still applies:
   - Import conventions — check a few imports in source files
   - Naming conventions — check recent files follow the pattern
   - File placement — check if new files follow the described structure

4. **Classify accuracy:**
   - **Accurate** — spot-checks pass, content matches code
   - **Minor drift** — small inaccuracies (renamed function, moved file)
   - **Major drift** — significant patterns changed, doc is misleading
   - **Obsolete** — technology/pattern no longer exists in codebase

Continue to detect_gaps.
</step>

<step name="detect_gaps">
Find technologies and patterns in the code not covered by existing docs.

**Scan codebase for technology markers:**
```bash
# Check package.json / go.mod / Cargo.toml for dependencies
cat package.json 2>/dev/null | grep -E '"dependencies"|"devDependencies"' -A 50
cat go.mod 2>/dev/null
cat Cargo.toml 2>/dev/null

# Check for common patterns in source files
grep -rl "import.*from" src/ 2>/dev/null | head -10
```

**Compare against existing doc topics:**
- List technologies/frameworks used in the code
- List topics covered by existing docs
- Identify gaps: technologies in code but not documented
- Identify obsolete: topics in docs but technology no longer in code

**Propose new docs** for significant gaps (technology used in 3+ files).
**Propose removal** for obsolete topics.

Continue to research_improvements.
</step>

<step name="research_improvements">
Optionally research best practices for the detected stack.

Use AskUserQuestion:
- header: "Research?"
- question: "Want me to research current best practices for your stack to suggest improvements?"
- options:
  - "Yes — research improvements" — Spawn research agents for detected technologies
  - "No — just review accuracy" — Skip research, go to findings

**If user says yes:**

For each major technology detected in the codebase, spawn a research agent:

Use Agent tool:
- description: "Research {technology} best practices"
- prompt: "Research current best practices for {technology} in {year}. Focus on:
  - Common patterns and anti-patterns
  - Performance recommendations
  - Security considerations
  - Migration guidance for newer versions
  Return a concise list of actionable suggestions."

Collect research results. For each suggestion, note:
- What the codebase currently does
- What best practice recommends
- Impact level (low/medium/high)

Continue to present_findings.
</step>

<step name="present_findings">
Show review results to user.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DOCS REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{count} docs reviewed

{For each doc:}
{✅|⚠️|❌|🔍} {doc name} — {Accurate|Minor drift|Major drift|Stale|Obsolete}
   Last reviewed: {date} ({N} days ago)
   {If drifted: "Drift: {specific inaccuracy}"}
   {If code changed: "Code changed: {N} files modified since review"}
```

**If gaps found:**
```
Coverage gaps:
- {technology/pattern} — Used in {N} files, not documented
  Proposed: docs/{topic}.md
```

**If obsolete docs found:**
```
Possibly obsolete:
- {doc name} — {technology} no longer found in codebase
```

**If research done:**
```
Improvement suggestions:
{For each suggestion:}
- [{impact}] {suggestion}
  Current: {what code does}
  Recommended: {what best practice says}
```

Continue to apply_updates.
</step>

<step name="apply_updates">
Let user choose what actions to take.

Use AskUserQuestion:
- header: "Actions"
- question: "What would you like to do with these findings?"
- multiSelect: true
- options:
  - "Update drifted docs" — Fix inaccuracies in docs that have drifted
  - "Generate new docs for gaps" — Create docs for uncovered topics
  - "Remove obsolete docs" — Delete docs for removed technologies
  - "Mark accurate docs as reviewed" — Update last_reviewed to today

**For "Update drifted docs":**
For each drifted doc, read the current code and update the doc content to match reality. Update frontmatter `last_reviewed` to today.

**For "Generate new docs for gaps":**
For significant gaps, generate new topic docs. This may require re-running mapper agents for fresh codebase data, or the review workflow can generate targeted docs from its own analysis. Add new docs to CLAUDE.md routing table (between section markers).

**For "Remove obsolete docs":**
Delete obsolete doc files. Remove their entries from CLAUDE.md routing table.

**For "Mark accurate docs as reviewed":**
For each doc classified as accurate, update `last_reviewed` in frontmatter to today's date.

**Update CLAUDE.md routing table** if docs were added or removed:
- Add new entries for generated docs
- Remove entries for deleted docs
- Keep within `<!-- specd:docs-routing:start -->` / `<!-- specd:docs-routing:end -->` markers

**Do not auto-commit.** User manages commits.

**Present completion:**
```
Review complete.

Updated: {count} docs
Generated: {count} new docs
Removed: {count} obsolete docs
Reviewed: {count} docs marked as fresh
```

End workflow.
</step>

</process>

<success_criteria>
- All specd-generated docs found via frontmatter scan
- Freshness assessed using last_reviewed dates + git history
- Accuracy spot-checked against current code (file paths, patterns, rules)
- Coverage gaps detected by comparing codebase vs. doc topics
- Research is optional — user chooses
- Findings presented with clear per-doc status
- User selects which actions to take (multiSelect)
- Frontmatter last_reviewed updated on approved docs
- CLAUDE.md routing table updated if docs added/removed
- No auto-commit — user manages commits
</success_criteria>
