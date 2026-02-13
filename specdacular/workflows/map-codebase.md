<purpose>
Orchestrate parallel codebase mapper agents to analyze codebase and produce 4 AI-optimized documents in .specd/codebase/

Each agent has fresh context, explores a specific focus area, and **writes documents directly**. The orchestrator only receives confirmation + line counts.

Output: .specd/codebase/ folder with 4 documents optimized for Claude consumption.
</purpose>

<philosophy>
**These documents are FOR CLAUDE, not humans.**

The 4 documents answer questions Claude can't get from reading code:
- **MAP.md** — "Where is X? What functions exist?"
- **PATTERNS.md** — "How do I write code that fits?"
- **STRUCTURE.md** — "Where do I put new code?"
- **CONCERNS.md** — "What will bite me?"

**Why dedicated mapper agents:**
- Fresh context per domain (no token contamination)
- Agents write documents directly (no context transfer back to orchestrator)
- Orchestrator only summarizes what was created (minimal context usage)
- Parallel execution (faster)
</philosophy>

<process>

<step name="detect_mode">
Determine if this is a single-project or multi-project setup.

Use AskUserQuestion:
- header: "Setup Mode"
- question: "Is this a multi-project setup (monorepo or multiple related projects)?"
- options:
  - "Single project" — One codebase, one .specd/ (most common)
  - "Multi-project" — Multiple projects that coordinate (monorepo, multi-repo)

**If Single project:**
Set mode = "project".
Continue to check_existing.

**If Multi-project:**
Set mode = "orchestrator".
Continue to check_existing.
</step>

<step name="check_existing">
**First, check for legacy setup (DEC-012):**

```bash
# Check if .specd/ exists but has no config.json (legacy setup)
if [ -d ".specd" ] && [ ! -f ".specd/config.json" ]; then
  echo "legacy_setup"
fi
```

**If legacy_setup detected:**

```
Your codebase map was created with an older version of Specdacular.
Re-mapping is recommended — this will also ask about multi-project support.
```

Use AskUserQuestion:
- header: "Legacy Setup"
- question: "Re-map your codebase with the latest Specdacular?"
- options:
  - "Yes, re-map (Recommended)" — Re-run mapping with multi-project detection
  - "Skip for now" — Keep existing map, continue without re-mapping

**If "Yes, re-map":** Delete .specd/codebase/, continue with detect_mode flow.
**If "Skip for now":** Exit workflow.

**If .specd/config.json exists, check version:**

```bash
cat .specd/config.json 2>/dev/null
```

If `specd_version` is less than current version (1), offer to re-map with same prompt as legacy flow above.

**Then check if .specd/codebase/ already exists:**

```bash
ls -la .specd/codebase/ 2>/dev/null
```

**If exists:**

Use the AskUserQuestion tool:

```json
{
  "questions": [{
    "question": "Codebase map already exists. What would you like to do?",
    "header": "Existing map",
    "options": [
      {
        "label": "Refresh - remap codebase",
        "description": "Delete existing docs and generate fresh analysis"
      },
      {
        "label": "Skip - use existing",
        "description": "Keep current codebase map, no changes"
      }
    ],
    "multiSelect": false
  }]
}
```

If "Refresh": Delete .specd/codebase/, continue based on mode.
If "Skip": Exit workflow

**If doesn't exist:**
Continue based on mode.

**Mode branching (after check_existing resolves):**
- If mode = "project": continue to check_existing_docs (existing single-project flow)
- If mode = "orchestrator": continue to register_projects (multi-project flow, see below)
</step>

<step name="check_existing_docs">
Check for existing documentation in the codebase:

```bash
# Find common documentation files
ls README* CONTRIBUTING* ARCHITECTURE* docs/ doc/ wiki/ 2>/dev/null
find . -maxdepth 2 -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | head -20
```

**Always read and incorporate any docs found.** This is automatic - existing documentation contains tribal knowledge we want to capture.

**Then ask user if there's more we missed:**

Use the AskUserQuestion tool:

```json
{
  "questions": [{
    "question": "Do you have any other documentation I should incorporate? (wiki, Notion, external docs, etc.)",
    "header": "More docs?",
    "options": [
      {
        "label": "No - that's everything",
        "description": "Proceed with what was found in the repo"
      },
      {
        "label": "Yes - I have more",
        "description": "I'll share additional documentation or context"
      }
    ],
    "multiSelect": false
  }]
}
```

**If user selects "Yes - I have more":**
Wait for user to provide additional context (paste docs, share links, explain architecture).
Incorporate this into the context for mapper agents.

**Then continue to create_structure.**
</step>

<step name="create_structure">
Create .specd/codebase/ directory:

```bash
mkdir -p .specd/codebase
```

**Create project-level config (DEC-012):**

Write `.specd/config.json`:
```json
{
  "type": "project",
  "specd_version": 1,
  "created": "{YYYY-MM-DD}"
}
```

This enables future version detection and mode detection for all workflows.

**Documents to be created:**
- MAP.md (from map mapper) — Navigation: function signatures, entry points, modules
- PATTERNS.md (from patterns mapper) — Code examples: services, error handling, testing
- STRUCTURE.md (from structure mapper) — Organization: where to put new code
- CONCERNS.md (from concerns mapper) — Warnings: gotchas, anti-patterns, tech debt

Continue to spawn_agents.
</step>

<step name="spawn_agents">
Spawn 4 parallel specd-codebase-mapper agents.

Use Task tool with `subagent_type="specd-codebase-mapper"` and `run_in_background=true` for parallel execution.

**CRITICAL:** Use the dedicated `specd-codebase-mapper` agent, NOT `Explore`.

**If existing documentation was found and user said to incorporate it:**
Include a summary of the existing docs in each agent's prompt:
```
Existing documentation context:
{summary of README, ARCHITECTURE, CONTRIBUTING, etc.}

Use this context to inform your analysis. Incorporate relevant architectural decisions, gotchas, and conventions mentioned in the docs.
```

**Agent 1: Map Focus**

Task tool parameters:
```
subagent_type: "specd-codebase-mapper"
model: "sonnet"
run_in_background: true
description: "Map codebase navigation"
```

Prompt:
```
Focus: map

Create a navigation map of this codebase for Claude.

Write MAP.md to .specd/codebase/ containing:
- Entry points (where execution starts)
- Core modules with function signatures
- External integrations (services, env vars)
- Key type definitions

Extract ACTUAL function signatures from the code. Include file paths everywhere.
Return confirmation only when done.
```

**Agent 2: Patterns Focus**

Task tool parameters:
```
subagent_type: "specd-codebase-mapper"
model: "sonnet"
run_in_background: true
description: "Map codebase patterns"
```

Prompt:
```
Focus: patterns

Extract code patterns from this codebase for Claude to follow.

Write PATTERNS.md to .specd/codebase/ containing:
- Service/handler patterns (with real code examples)
- Error handling patterns (with real code examples)
- Testing patterns (with real code examples)
- Mocking patterns (with real code examples)
- Import conventions

Use ACTUAL code from the codebase, not generic examples. Include file paths and line numbers.
Return confirmation only when done.
```

**Agent 3: Structure Focus**

Task tool parameters:
```
subagent_type: "specd-codebase-mapper"
model: "sonnet"
run_in_background: true
description: "Map codebase structure"
```

Prompt:
```
Focus: structure

Document where to put new code in this codebase.

Write STRUCTURE.md to .specd/codebase/ containing:
- Quick reference table: "I want to add X → put it in Y"
- Directory purposes (what goes where)
- Naming conventions
- Where NOT to put code
- Active migrations (if any)

Be prescriptive: "Put new services in X" not "Services are in X".
Return confirmation only when done.
```

**Agent 4: Concerns Focus**

Task tool parameters:
```
subagent_type: "specd-codebase-mapper"
model: "sonnet"
run_in_background: true
description: "Map codebase concerns"
```

Prompt:
```
Focus: concerns

Find gotchas and problems in this codebase that Claude needs to know.

Write CONCERNS.md to .specd/codebase/ containing:
- Gotchas (surprising but intentional behaviors)
- Anti-patterns (what NOT to do, with examples)
- Tech debt (with guidance on working around it)
- Fragile areas (with safe modification guidance)
- Dependency notes (pinned versions, upgrade blockers)
- Performance notes

Gotchas section is MOST IMPORTANT. Include file paths for everything.
Return confirmation only when done.
```

Continue to collect_confirmations.
</step>

<step name="collect_confirmations">
Wait for all 4 agents to complete.

Read each agent's output file to collect confirmations.

**Expected confirmation format from each agent:**
```
## Mapping Complete

**Focus:** {focus}
**Document written:** `.specd/codebase/{DOC}.md` ({N} lines)

Key findings:
- {summary}
```

If any agent failed, note the failure and continue with successful documents.

Continue to verify_output.
</step>

<step name="verify_output">
Verify all documents created successfully:

```bash
ls -la .specd/codebase/
wc -l .specd/codebase/*.md
```

**Verification checklist:**
- All 4 documents exist (MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md)
- No empty documents (each should have >20 lines)

If any documents missing or empty, note which agents may have failed.

Continue to commit_codebase_map.
</step>

<step name="commit_codebase_map">
Commit the codebase map.

@~/.claude/specdacular/references/commit-docs.md

- **$FILES:** `.specd/codebase/*.md .specd/config.json`
- **$MESSAGE:** `docs: map codebase for Claude` with list of documents created
- **$LABEL:** `codebase map`

Continue to completion.
</step>

<step name="completion">
Present completion summary.

**Get line counts:**
```bash
wc -l .specd/codebase/*.md
```

**Output format:**

```
Codebase mapped for Claude.

Created .specd/codebase/:
- MAP.md ([N] lines) — Navigation: modules, functions, entry points
- PATTERNS.md ([N] lines) — Code examples to follow
- STRUCTURE.md ([N] lines) — Where to put new code
- CONCERNS.md ([N] lines) — Gotchas and anti-patterns

These docs help Claude understand your codebase. They'll be referenced during planning and implementation.

To review: `cat .specd/codebase/MAP.md`
```

End workflow.
</step>

<!-- ═══════════════════════════════════════════════════════
     MULTI-PROJECT FLOW
     Reached when detect_mode sets mode = "orchestrator".
     check_existing branches here instead of to check_existing_docs.
     ═══════════════════════════════════════════════════════ -->

<step name="register_projects">
Register sub-projects for orchestrator mode.

**Scan for project markers in immediate subdirectories:**

```bash
# Find directories with common project markers
for dir in */; do
  if [ -f "${dir}package.json" ] || [ -f "${dir}go.mod" ] || [ -f "${dir}Cargo.toml" ] || [ -f "${dir}pyproject.toml" ] || [ -f "${dir}pom.xml" ] || [ -f "${dir}build.gradle" ] || [ -f "${dir}Makefile" ] || [ -f "${dir}Gemfile" ]; then
    echo "${dir%/}"
  fi
done
```

**Present found projects:**
```
Found these potential projects:
- {dir1}/ (has package.json)
- {dir2}/ (has go.mod)
- {dir3}/ (has package.json)

These will be registered as sub-projects.
```

Use AskUserQuestion:
- header: "Projects"
- question: "Are these the right projects? You can adjust in the next step."
- options:
  - "Yes, these are correct" — Continue with found projects
  - "I need to adjust" — Let user add/remove projects

**If "I need to adjust":**
Ask user to describe which projects to add or remove. Update the list accordingly.

**For each project, ask for a one-liner description:**
Use AskUserQuestion for each project (or batch if 3 or fewer):
- header: "{project-name}"
- question: "Brief description of {project-name}?"
- options: Provide 2-3 inferred descriptions based on directory contents + "Something else"

**Build project registry:**
```json
[
  {"name": "{dir1}", "path": "./{dir1}", "description": "{user description}"},
  {"name": "{dir2}", "path": "./{dir2}", "description": "{user description}"}
]
```

Continue to create_orchestrator_structure.
</step>

<step name="create_orchestrator_structure">
Create orchestrator-level .specd/ directory and config.

```bash
mkdir -p .specd/codebase
```

**Write .specd/config.json (DEC-006, DEC-012):**
```json
{
  "type": "orchestrator",
  "specd_version": 1,
  "created": "{YYYY-MM-DD}",
  "projects": [
    {"name": "{name}", "path": "{path}", "description": "{description}"}
  ]
}
```

**Create per-project .specd/ structures:**
For each registered project:
```bash
mkdir -p {project-path}/.specd/codebase
```

**Write per-project config.json (DEC-012):**
For each registered project, write `{project-path}/.specd/config.json`:
```json
{
  "type": "project",
  "specd_version": 1,
  "created": "{YYYY-MM-DD}"
}
```

Continue to check_existing_docs_multi.
</step>

<step name="check_existing_docs_multi">
Check for existing documentation across all projects.

For each registered project, check for docs:
```bash
ls {project-path}/README* {project-path}/CONTRIBUTING* {project-path}/ARCHITECTURE* {project-path}/docs/ 2>/dev/null
```

Also check root-level docs:
```bash
ls README* CONTRIBUTING* ARCHITECTURE* docs/ 2>/dev/null
```

**Always read and incorporate any docs found** — same as single-project flow.

Ask user for additional docs (same AskUserQuestion as check_existing_docs).

Continue to spawn_per_project_agents.
</step>

<step name="spawn_per_project_agents">
Spawn 4 mapper agents per sub-project, all in parallel.

For each registered project, spawn the same 4 agents as the single-project flow (map, patterns, structure, concerns), but scoped to the project's directory.

**CRITICAL:** Each agent's prompt must specify the project path so it writes to `{project-path}/.specd/codebase/`.

Use Task tool with `subagent_type="specd-codebase-mapper"` and `run_in_background=true`.

**Per project, spawn 4 agents:**

Agent prompts follow the same pattern as the single-project agents in `spawn_agents`, with these modifications:
- Working directory context: "This project is at {project-path}/"
- Output path: "Write to {project-path}/.specd/codebase/{DOC}.md"
- Scope: "Only analyze code within {project-path}/"

**If existing documentation was found for a project:**
Include project-specific docs in that project's agent prompts (same as single-project).

All agents (across all projects) are spawned simultaneously for maximum parallelism.

Wait for all agents to complete. Verify each project has all 4 documents:

```bash
# Verify per-project docs
for project in {project-paths}; do
  echo "Checking $project..."
  ls -la "$project/.specd/codebase/"
  wc -l "$project/.specd/codebase/"*.md 2>/dev/null
done
```

If any agents failed, note which project/document and continue.

Continue to spawn_orchestrator_agent.
</step>

<step name="spawn_orchestrator_agent">
Spawn a single orchestrator mapper agent to synthesize system-level docs (DEC-007: runs AFTER all per-project mappers complete).

This agent reads sub-project codebase docs and scans codebases for system-level artifacts.

Use Task tool:
```
subagent_type: "specd-codebase-mapper"
model: "sonnet"
run_in_background: true
description: "Map orchestrator system docs"
```

Prompt:
```
Focus: orchestrator

You are mapping a multi-project system. Sub-project analysis is already complete.

**Projects in this system:**
{For each project: name, path, description}

**Sub-project docs available:**
{For each project: list the 4 .specd/codebase/ files with paths}

**Your job:**
1. Read all sub-project codebase docs (MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md for each project)
2. Scan codebases for system-level artifacts:
   - docker-compose.yml, docker files
   - CI/CD configs (.github/workflows/, .gitlab-ci.yml, etc.)
   - Shared configs (eslint, prettier, tsconfig at root)
   - Cross-project imports or references
   - Shared databases, APIs, message queues
3. Write 4 orchestrator-level docs to .specd/codebase/:

**PROJECTS.md** — Project registry with responsibilities and entry points
Follow template structure: registry table, per-project details, codebase doc links.

**TOPOLOGY.md** — How projects communicate
Follow template: per-relationship sections with communication method, pattern, shared domains, source of truth, data flow. Include shared resources table and Mermaid diagram.

**CONTRACTS.md** — Shared interface descriptions (keep loose per DEC-008)
Follow template: per-relationship contract nature. Describe relationships, not specific endpoints.

**CONCERNS.md** — Cross-cutting system-level gotchas
Follow template: per-concern with scope, issue, impact, mitigation. Focus on SYSTEM-level concerns that span projects, not project-internal concerns.

Return confirmation with line counts for all 4 docs.
```

Wait for orchestrator agent to complete. Verify docs exist:

```bash
ls -la .specd/codebase/
wc -l .specd/codebase/*.md
```

Continue to commit_orchestrator_map.
</step>

<step name="commit_orchestrator_map">
Commit all mapping results (orchestrator + all sub-projects).

```bash
# Add orchestrator docs and config
git add .specd/codebase/*.md .specd/config.json

# Add per-project docs and configs
# {For each project:}
git add {project-path}/.specd/codebase/*.md {project-path}/.specd/config.json

git commit -m "$(cat <<'EOF'
docs: map multi-project codebase for Claude

Orchestrator:
- PROJECTS.md - Project registry
- TOPOLOGY.md - Communication patterns
- CONTRACTS.md - Shared interfaces
- CONCERNS.md - System-level gotchas

Projects mapped:
{For each project: - {name}: MAP, PATTERNS, STRUCTURE, CONCERNS}

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Continue to orchestrator_completion.
</step>

<step name="orchestrator_completion">
Present multi-project completion summary.

**Get line counts for orchestrator and each project:**
```bash
wc -l .specd/codebase/*.md
# For each project:
wc -l {project-path}/.specd/codebase/*.md
```

**Output format:**

```
Multi-project codebase mapped for Claude.

Orchestrator (.specd/codebase/):
- PROJECTS.md ({N} lines) — Project registry
- TOPOLOGY.md ({N} lines) — Communication patterns
- CONTRACTS.md ({N} lines) — Shared interfaces
- CONCERNS.md ({N} lines) — System-level concerns

{For each project:}
{project-name} ({project-path}/.specd/codebase/):
- MAP.md ({N} lines) — Navigation
- PATTERNS.md ({N} lines) — Code patterns
- STRUCTURE.md ({N} lines) — File organization
- CONCERNS.md ({N} lines) — Project-level gotchas

These docs help Claude understand your system across projects.
They'll be referenced during planning and implementation.
```

End workflow.
</step>

</process>

<success_criteria>
**Single-project mode:**
- .specd/codebase/ directory created
- .specd/config.json created with type and specd_version (DEC-012)
- 4 parallel specd-codebase-mapper agents spawned with run_in_background=true
- Agents write documents directly (orchestrator doesn't receive document contents)
- All 4 documents exist: MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md
- Documents contain real code examples (not placeholders)
- Clear completion summary with line counts

**Multi-project mode (additional):**
- detect_mode correctly identifies multi-project setup
- Projects registered with name, path, description
- .specd/config.json created with type=orchestrator and projects array (DEC-006)
- Per-project .specd/config.json created with type=project (DEC-012)
- 4 agents spawned per project, all in parallel
- Orchestrator agent runs after per-project agents complete (DEC-007)
- Orchestrator docs: PROJECTS.md, TOPOLOGY.md, CONTRACTS.md, CONCERNS.md
- Per-project docs: MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md per project
- Multi-project completion summary with per-project line counts

**Legacy detection:**
- .specd/ without config.json detected as legacy
- User prompted to re-map
</success_criteria>
