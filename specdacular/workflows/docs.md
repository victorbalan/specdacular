<purpose>
Orchestrate codebase analysis and generate topic-based documentation in docs/ with a CLAUDE.md routing table.

Reuses the 4 parallel mapper agents for raw analysis, then merges their outputs into dynamically-detected topic docs. CLAUDE.md is a pure router — all rules go in docs/rules.md.

**Output:** docs/ folder with topic docs + CLAUDE.md routing table
</purpose>

<philosophy>

## Context Engineering

Every token fights for its place. CLAUDE.md is a thin router, docs are loaded on-demand per task context. No bloat.

## Dynamic Topics

Topics emerge from what the codebase actually uses. A React project gets react-query.md; a Go API gets middleware.md. No fixed list.

## Merge, Don't Replace

Agent outputs are raw material. The merge step reorganizes by topic ("how to use it") not by agent ("what the agent found"). Content from all 4 agents can land in the same doc.

## Rules Are Special

docs/rules.md is always generated. It contains one-liner rules that apply to every code change — the "always read first" file.

</philosophy>

<process>

<step name="discover_docs_location">
Determine where docs should be written.

**Check existing CLAUDE.md for doc path references:**
```bash
[ -f "CLAUDE.md" ] && cat CLAUDE.md || echo "no_claude_md"
```

If CLAUDE.md exists, scan for references to a docs directory:
- Look for patterns like `docs/`, `documentation/`, or path references in tables/links
- If a consistent docs path is referenced, use it as `$DOCS_DIR`

**If no CLAUDE.md or no docs path found:**
Set `$DOCS_DIR = "docs"`

```bash
mkdir -p $DOCS_DIR
```

Continue to check_existing.
</step>

<step name="check_existing">
Check if specd-generated docs already exist.

```bash
# Check for specd-generated docs (have generated_by: specd in frontmatter)
grep -rl "generated_by: specd" $DOCS_DIR/ 2>/dev/null
```

**If specd-generated docs found:**

Use AskUserQuestion:
- header: "Existing Docs"
- question: "Found existing specd-generated docs. What would you like to do?"
- options:
  - "Refresh — regenerate all docs" — Delete specd-generated docs and regenerate
  - "Skip — use existing" — Keep current docs, exit workflow

If "Refresh": Delete only files with `generated_by: specd` frontmatter. Continue.
If "Skip": Exit workflow.

**Also check for existing CLAUDE.md content to preserve later:**
```bash
[ -f "CLAUDE.md" ] && cat CLAUDE.md
```
Store existing CLAUDE.md content as `$EXISTING_CLAUDE_MD` for merge step.

Continue to check_existing_docs.
</step>

<step name="check_existing_docs">
Scan for existing project documentation to feed to mapper agents.

```bash
# Find common documentation files
ls README* CONTRIBUTING* ARCHITECTURE* docs/ doc/ wiki/ 2>/dev/null
find . -maxdepth 2 -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./.specd/*" 2>/dev/null | head -20
```

**Always read and incorporate any docs found.** Existing documentation contains tribal knowledge we want to capture.

**Ask user for additional context:**

Use AskUserQuestion:
- header: "More docs?"
- question: "Do you have any other documentation I should incorporate? (wiki, Notion, external docs, etc.)"
- options:
  - "No — that's everything" — Proceed with what was found
  - "Yes — I have more" — Wait for user to share additional context

If user selects "Yes — I have more": wait for user to provide context, incorporate it.

Build `$EXISTING_DOCS_CONTEXT` — a summary of all found documentation to include in agent prompts.

Continue to spawn_agents.
</step>

<step name="spawn_agents">
Spawn 4 parallel mapper agents to a temp directory.

**Create temp directory for raw outputs:**
```bash
mkdir -p .specd/tmp/docs-raw
```

**CRITICAL:** Use the dedicated `specd-codebase-mapper` agent, NOT `Explore`.

Spawn all 4 agents with `subagent_type="specd-codebase-mapper"`, `model="sonnet"`, and `run_in_background=true`.

**If existing documentation was found:**
Include `$EXISTING_DOCS_CONTEXT` in each agent's prompt:
```
Existing documentation context:
{summary of README, ARCHITECTURE, CONTRIBUTING, etc.}

Use this context to inform your analysis. Incorporate relevant architectural decisions, gotchas, and conventions mentioned in the docs.
```

**Agent 1: Map Focus**

```
Focus: map

Create a navigation map of this codebase for Claude.

Write MAP.md to .specd/tmp/docs-raw/ containing:
- Entry points (where execution starts)
- Core modules with function signatures
- External integrations (services, env vars)
- Key type definitions

{$EXISTING_DOCS_CONTEXT if available}

Extract ACTUAL function signatures from the code. Include file paths everywhere.
Return confirmation only when done.
```

**Agent 2: Patterns Focus**

```
Focus: patterns

Extract code patterns from this codebase for Claude to follow.

Write PATTERNS.md to .specd/tmp/docs-raw/ containing:
- Service/handler patterns (with real code examples)
- Error handling patterns (with real code examples)
- Testing patterns (with real code examples)
- Mocking patterns (with real code examples)
- Import conventions

{$EXISTING_DOCS_CONTEXT if available}

Use ACTUAL code from the codebase, not generic examples. Include file paths and line numbers.
Return confirmation only when done.
```

**Agent 3: Structure Focus**

```
Focus: structure

Document where to put new code in this codebase.

Write STRUCTURE.md to .specd/tmp/docs-raw/ containing:
- Quick reference table: "I want to add X → put it in Y"
- Directory purposes (what goes where)
- Naming conventions
- Where NOT to put code
- Active migrations (if any)

{$EXISTING_DOCS_CONTEXT if available}

Be prescriptive: "Put new services in X" not "Services are in X".
Return confirmation only when done.
```

**Agent 4: Concerns Focus**

```
Focus: concerns

Find gotchas and problems in this codebase that Claude needs to know.

Write CONCERNS.md to .specd/tmp/docs-raw/ containing:
- Gotchas (surprising but intentional behaviors)
- Anti-patterns (what NOT to do, with examples)
- Tech debt (with guidance on working around it)
- Fragile areas (with safe modification guidance)
- Dependency notes (pinned versions, upgrade blockers)
- Performance notes

{$EXISTING_DOCS_CONTEXT if available}

Gotchas section is MOST IMPORTANT. Include file paths for everything.
Return confirmation only when done.
```

Continue to collect_and_merge.
</step>

<step name="collect_and_merge">
Wait for all 4 agents to complete. Read their raw outputs and detect topics.

**Collect outputs:**
```bash
ls -la .specd/tmp/docs-raw/
wc -l .specd/tmp/docs-raw/*.md
```

Read all 4 files from `.specd/tmp/docs-raw/`.

If any agent failed, note the failure and continue with successful outputs.

**Topic detection algorithm:**

1. **Extract mentions:** Scan all 4 raw outputs for technology names, framework references, pattern categories, and architectural concepts. Examples: "React Query", "CSS Modules", "Express middleware", "authentication", "database", "testing", "error handling", "API routes".

2. **Cluster related mentions:** Group mentions that naturally belong together:
   - Same technology (e.g., "React Query hooks" + "useQuery" + "data fetching" → one cluster)
   - Same concern area (e.g., "auth middleware" + "session tokens" + "JWT" → one cluster)
   - Same architectural layer (e.g., "API routes" + "endpoint handlers" + "request validation" → one cluster)

3. **Name each cluster:** Use the dominant theme as the doc filename:
   - `react-query-and-apis.md` (not `data-fetching.md` if React Query is the specific tech)
   - `authentication.md` (not `security.md` if auth is the specific topic)
   - `testing-patterns.md` (if testing has enough content for its own doc)
   - `project-structure.md` (where to put files, directory purposes)

4. **Always include `rules.md`:** Extract always-true rules from across all outputs:
   - Import conventions ("always use src/ alias")
   - Naming patterns ("components are PascalCase")
   - File placement rules ("tests go next to source files")
   - Forbidden patterns ("never use X, always use Y")

5. **Evaluate cluster size:** If a cluster has too little content (< 3 meaningful points), merge it into the most related larger cluster. If too large (> 30 meaningful points), consider splitting.

**Propose topics to user:**

Use AskUserQuestion:
- header: "Doc Topics"
- question: "Here are the proposed documentation topics based on your codebase analysis. Select the ones to generate:"
- multiSelect: true
- options: List each proposed topic with a brief description of what it covers

**Note:** `rules.md` is always generated regardless of selection — inform user of this.

Store approved topic list as `$APPROVED_TOPICS`.

Continue to generate_docs.
</step>

<step name="generate_docs">
Generate each approved topic doc and rules.md.

**For each topic in `$APPROVED_TOPICS`:**

1. Pull relevant content from all 4 raw agent outputs that matches this topic
2. Reorganize by "how to use it":
   - What is this? (brief intro)
   - Key patterns (with code examples from the actual codebase)
   - Where to find things (file paths)
   - Rules and conventions
   - Gotchas and warnings
3. Not every section is required — only include sections with real content
4. Add YAML frontmatter:
   ```yaml
   ---
   last_reviewed: {YYYY-MM-DD}
   generated_by: specd
   ---
   ```
5. Write to `$DOCS_DIR/{topic}.md`

**For `rules.md` specifically:**

1. Extract one-liner rules from all 4 agent outputs that apply universally:
   - Import conventions
   - Naming conventions
   - File placement rules
   - Component/pattern usage rules
   - Forbidden patterns
2. Format as a scannable list — no long explanations:
   ```markdown
   ## Import Rules
   - Always use `@/` alias for src imports
   - Never import from `internal/` outside its module

   ## Naming
   - Components: PascalCase
   - Hooks: camelCase with `use` prefix
   ```
3. Add same frontmatter
4. Write to `$DOCS_DIR/rules.md`

Continue to write_claude_md.
</step>

<step name="write_claude_md">
Write or update CLAUDE.md as a pure routing table.

**Build routing table:**

```markdown
<!-- specd:docs-routing:start -->
# Context Docs

> Always read `docs/rules.md` first — it contains project-wide rules.

| Working on... | Read |
|---------------|------|
| {topic context description} | `docs/{topic}.md` |
| {topic context description} | `docs/{topic}.md` |
<!-- specd:docs-routing:end -->
```

Each row maps a working context to the relevant doc file. Examples:
- "React Query hooks, data fetching, API calls" → `docs/react-query-and-apis.md`
- "Styling, CSS, component appearance" → `docs/css-and-styles.md`
- "Writing or running tests" → `docs/testing-patterns.md`

**If CLAUDE.md doesn't exist (`$EXISTING_CLAUDE_MD` is empty):**
Write new CLAUDE.md with just the routing table.

**If CLAUDE.md exists (`$EXISTING_CLAUDE_MD` has content):**

1. Check if it already has specd section markers (`<!-- specd:docs-routing:start -->` and `<!-- specd:docs-routing:end -->`)
2. If markers found: replace content between markers with new routing table
3. If no markers: append routing table at the end of existing content

**Bloat detection (optional proposal):**
If existing CLAUDE.md has content that looks like rules, patterns, or documentation (not just project setup info), propose migration:

```
Your CLAUDE.md has content that might work better as topic docs:

- Lines {N}-{M}: Looks like coding rules → could move to docs/rules.md
- Lines {N}-{M}: Looks like API patterns → could move to docs/{topic}.md

Want me to migrate these? (This would slim down CLAUDE.md to just a router)
```

Use AskUserQuestion:
- header: "Migrate?"
- question: "Move existing CLAUDE.md content to topic docs?"
- options:
  - "Yes — migrate and slim down" — Move content to appropriate docs
  - "No — keep CLAUDE.md as-is" — Just append routing table

Only propose if there's significant bloat (>20 lines of rules/patterns). Skip this for small CLAUDE.md files.

Continue to cleanup_and_commit.
</step>

<step name="cleanup_and_commit">
Clean up temp files and commit results.

**Delete temp directory:**
```bash
rm -rf .specd/tmp/docs-raw
rmdir .specd/tmp 2>/dev/null  # Remove tmp dir if empty
```

**Commit:**

Check auto-commit setting:
```bash
cat .specd/config.json 2>/dev/null || echo '{"auto_commit_docs": true}'
```

If `auto_commit_docs` is false: skip commit, notify user.

If true (default):
```bash
git add $DOCS_DIR/*.md CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: generate topic docs and CLAUDE.md routing table

Created:
{list each doc file with line count}

CLAUDE.md routing table {created | updated}.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Continue to completion.
</step>

<step name="completion">
Present summary.

**Get line counts:**
```bash
wc -l $DOCS_DIR/*.md
```

**Output:**

```
Codebase docs generated.

Created {DOCS_DIR}/:
{For each doc:}
- {topic}.md ({N} lines) — {brief description}
- rules.md ({N} lines) — Project-wide rules (always read first)

CLAUDE.md routing table {created | updated}.

To review docs: /specd.docs.review
To refresh: /specd.docs
```

End workflow.
</step>

</process>

<success_criteria>
- 4 parallel specd-codebase-mapper agents spawned with run_in_background=true
- Agents write to temp directory, not final docs location
- Topic detection produces dynamic topic list from agent outputs
- User approves topic list before generation
- docs/rules.md always generated with project-wide rules
- All docs have YAML frontmatter (last_reviewed, generated_by)
- CLAUDE.md is purely a routing table — zero inline rules
- Existing CLAUDE.md content preserved during merge (section markers)
- Temp files cleaned up
- Results committed (if auto_commit_docs enabled)
</success_criteria>
