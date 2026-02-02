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

<step name="check_existing">
Check if .specd/codebase/ already exists:

```bash
ls -la .specd/codebase/ 2>/dev/null
```

**If exists:**

```
.specd/codebase/ already exists with these documents:
[List files found]

Options:
1. Refresh - Delete existing and remap codebase
2. Skip - Use existing codebase map as-is
```

Wait for user response.

If "Refresh": Delete .specd/codebase/, continue to create_structure
If "Skip": Exit workflow

**If doesn't exist:**
Continue to create_structure.
</step>

<step name="create_structure">
Create .specd/codebase/ directory:

```bash
mkdir -p .specd/codebase
```

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
Commit the codebase map:

```bash
git add .specd/codebase/*.md
git commit -m "$(cat <<'EOF'
docs: map codebase for Claude

- MAP.md - Navigation: modules, functions, integrations
- PATTERNS.md - Code examples: services, errors, testing
- STRUCTURE.md - Organization: where to put new code
- CONCERNS.md - Warnings: gotchas, anti-patterns, debt

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

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

</process>

<success_criteria>
- .specd/codebase/ directory created
- 4 parallel specd-codebase-mapper agents spawned with run_in_background=true
- Agents write documents directly (orchestrator doesn't receive document contents)
- All 4 documents exist: MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md
- Documents contain real code examples (not placeholders)
- Clear completion summary with line counts
</success_criteria>
