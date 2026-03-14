---
task: 180-turn
phase: 1
depends_on: []
creates:
  - commands/specd.docs.md
  - specdacular/workflows/docs.md
modifies: []
---

# Phase 1: Docs Generation Command

## Objective

Create the `/specd.docs` command and its workflow. When run on any project, it spawns 4 mapper agents for raw analysis, merges their outputs into dynamically-detected topic docs in `docs/`, always generates `docs/rules.md`, and writes/updates CLAUDE.md as a pure routing table.

## Context

**Reference these files for format/patterns:**
- `commands/specd.codebase.map.md` — Command definition format to follow (frontmatter + objective + execution_context + context + process + success_criteria)
- `specdacular/workflows/map-codebase.md` — Workflow pattern to follow (purpose + philosophy + step-based process + success_criteria). Especially the agent spawning pattern with `subagent_type="specd-codebase-mapper"` and `run_in_background=true`
- `agents/specd-codebase-mapper.md` — The 4 mapper agents we're reusing (map, patterns, structure, concerns)

**Relevant Decisions:**
- DEC-001: Reuse existing 4 mapper agents for raw analysis — agents stay unchanged, workflow merges their outputs
- DEC-002: Docs location discovery — check CLAUDE.md for existing docs path first, default to `docs/`
- DEC-004: Non-destructive CLAUDE.md merging — append/merge routing table, propose bloat removal but don't delete without approval
- DEC-005: Dynamic doc topics — topics detected from agent output content, not a fixed list
- DEC-006: CLAUDE.md is purely a router — zero inline rules, all rules go in `docs/rules.md`
- DEC-007: Frontmatter for review date tracking — all generated docs include `last_reviewed` and `generated_by` frontmatter
- DEC-008: No external research during generation — only use mapper agent findings, no web research

---

## Tasks

### Task 1: Create command definition

**Files:** `commands/specd.docs.md`

**Action:**
Create the command definition file following the exact format of `commands/specd.codebase.map.md`. The command replaces the old `specd.codebase.map` with a context-engineering approach.

**Structure:**
- Frontmatter: name `specd.docs`, description about generating topic-based docs + CLAUDE.md routing table, allowed-tools (Read, Bash, Glob, Grep, Write, Task, AskUserQuestion, Agent, Edit)
- `<objective>`: Replace `.specd/codebase/` with topic-specific docs in `docs/` and a CLAUDE.md routing table. Reuses 4 mapper agents for raw analysis, then merges into topic docs.
- `<execution_context>`: Reference `@~/.claude/specdacular/workflows/docs.md`
- `<context>`: Explain the context-engineering approach — CLAUDE.md as router, docs/ for on-demand knowledge, frontmatter for review dates, rules.md for always-true rules
- `<when_to_use>`: First time with a codebase, before new features, after refactoring, when docs are stale
- `<process>`: High-level steps: 1) Discover docs location 2) Spawn 4 mapper agents 3) Merge outputs into topic clusters 4) Propose doc list to user 5) Generate topic docs + rules.md with frontmatter 6) Write/update CLAUDE.md routing table 7) Commit
- `<success_criteria>`: Docs generated in `docs/`, CLAUDE.md routing table written, rules.md always present, frontmatter on all docs

**Verify:**
```bash
[ -f "commands/specd.docs.md" ] && head -5 commands/specd.docs.md | grep -q "name: specd.docs" && echo "PASS" || echo "FAIL"
```

**Done when:**
- [ ] File exists with correct frontmatter
- [ ] Follows same structure as specd.codebase.map.md
- [ ] References docs.md workflow in execution_context

---

### Task 2: Create docs workflow

**Files:** `specdacular/workflows/docs.md`

**Action:**
Create the full workflow file following the pattern of `specdacular/workflows/map-codebase.md`. This is the core of the new system.

**Workflow steps to implement:**

**Step 1: `discover_docs_location`**
- Read CLAUDE.md if it exists, look for existing doc path references (e.g., `docs/`, `documentation/`)
- If found, use that path. If not, default to `docs/`
- Set `$DOCS_DIR` variable

**Step 2: `check_existing`**
- Check if `$DOCS_DIR` already has specd-generated docs (check for frontmatter with `generated_by: specd`)
- If exists: ask user to refresh or skip (same pattern as map-codebase.md check_existing)
- Check for existing CLAUDE.md content to preserve

**Step 3: `check_existing_docs`**
- Same as map-codebase.md — find README, ARCHITECTURE, etc.
- Ask user for additional context
- Build context string for mapper agents

**Step 4: `spawn_agents`**
- Create temp directory for raw agent outputs: `.specd/tmp/docs-raw/`
- Spawn 4 parallel agents using `subagent_type="specd-codebase-mapper"` and `run_in_background=true`
- Agent prompts same as map-codebase.md but writing to `.specd/tmp/docs-raw/` instead of `.specd/codebase/`
- Include existing documentation context in prompts if found

**Step 5: `collect_and_merge`**
- Wait for all 4 agents to complete
- Read all 4 raw outputs from `.specd/tmp/docs-raw/`
- **Topic detection algorithm:**
  1. Scan all 4 outputs for technology/pattern mentions (e.g., React Query, CSS Modules, Express routes, testing patterns)
  2. Group related mentions into topic clusters (e.g., "react-query" + "api-calls" + "data-fetching" = one cluster)
  3. Each cluster becomes a proposed doc file, named after the dominant theme
  4. Always include `rules.md` as a mandatory doc (for always-true rules extracted across all outputs)
- **Present proposed doc list to user:**
  Use AskUserQuestion to show proposed topics and let user approve, remove, or add topics

**Step 6: `generate_docs`**
- For each approved topic, pull relevant content from all 4 raw agent outputs
- Organize content by "how to use it" — not by which agent found it
- Add YAML frontmatter to each doc:
  ```yaml
  ---
  last_reviewed: {YYYY-MM-DD}
  generated_by: specd
  ---
  ```
- **For `rules.md` specifically:**
  Extract one-liner rules that apply to every code change (import conventions, naming, file placement, component usage patterns)
  These are the "always-true" rules that used to be candidates for CLAUDE.md inline rules
- Write each doc to `$DOCS_DIR/{topic}.md`

**Step 7: `write_claude_md`**
- Build routing table: one line per doc file mapping context → file path
- Format: `# Context Docs\n\n| Working on... | Read |\n|...|...|\n| {topic context} | docs/{topic}.md |`
- Always include `docs/rules.md` as "Always read first"
- **If CLAUDE.md exists:**
  - Parse existing content
  - Find existing routing table (look for specd markers or similar table)
  - Replace routing table section, preserve everything else
  - If existing CLAUDE.md has content that looks like it should be in docs/ (bloated rules, patterns), propose migration but don't auto-delete
- **If CLAUDE.md doesn't exist:**
  - Create new CLAUDE.md with just the routing table
- Use section markers: `<!-- specd:docs-routing:start -->` and `<!-- specd:docs-routing:end -->` to identify managed sections

**Step 8: `cleanup_and_commit`**
- Delete `.specd/tmp/docs-raw/` temp directory
- Commit generated docs and CLAUDE.md
- Present completion summary with doc list and line counts

**Verify:**
```bash
[ -f "specdacular/workflows/docs.md" ] && grep -q "spawn_agents" specdacular/workflows/docs.md && grep -q "generate_docs" specdacular/workflows/docs.md && grep -q "write_claude_md" specdacular/workflows/docs.md && echo "PASS" || echo "FAIL"
```

**Done when:**
- [ ] File exists with all 8 steps implemented
- [ ] Follows step-based process pattern from map-codebase.md
- [ ] Agent spawning uses `subagent_type="specd-codebase-mapper"` pattern
- [ ] Topic detection and merging logic is defined
- [ ] Frontmatter generation included
- [ ] CLAUDE.md merge logic handles both new and existing files
- [ ] Section markers used for managed content
- [ ] rules.md always generated
- [ ] Cleanup removes temp files

---

## Verification

After all tasks complete:

```bash
# Both files exist
[ -f "commands/specd.docs.md" ] && [ -f "specdacular/workflows/docs.md" ] && echo "Files exist" || echo "Missing files"

# Command has correct frontmatter
head -3 commands/specd.docs.md | grep -q "name: specd.docs" && echo "Command frontmatter OK" || echo "Command frontmatter missing"

# Workflow has all key steps
for step in discover_docs_location check_existing spawn_agents collect_and_merge generate_docs write_claude_md cleanup_and_commit; do
  grep -q "$step" specdacular/workflows/docs.md && echo "Step $step: OK" || echo "Step $step: MISSING"
done

# Workflow references mapper agent
grep -q "specd-codebase-mapper" specdacular/workflows/docs.md && echo "Agent reference OK" || echo "Agent reference missing"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/180-turn/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
