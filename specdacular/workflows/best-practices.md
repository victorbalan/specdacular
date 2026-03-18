<purpose>
Detect a repo's tech stack, ask user for focus areas, spawn 3 research agents, merge findings into docs/best-practices.md.

**Output:** `docs/best-practices.md` in the target repo
</purpose>

<philosophy>

## Detect, Don't Ask

Auto-detect the tech stack from marker files and dependencies. The user shouldn't have to tell us what they use.

## Options, Not Opinions

Present what's available with context and tradeoffs. Light "recommended" tags are fine, but the user chooses. Research agents must capture multiple options per topic.

## User Steers Research

Ask for focus areas before dispatching agents. Focused research is deeper and more useful than broad-but-shallow.

## Verify Before Publishing

Web-sourced claims must be treated as untrusted. URLs may be stale, recommendations may be outdated. The merge step should flag low-confidence items.

</philosophy>

<process>

<step name="detect_stack">
Detect all tech stacks in the repo from marker files and dependency parsing.

```bash
# Detect marker files at repo root
STACKS=""

# Node.js / TypeScript
if [ -f "package.json" ]; then
  DEPS=$(cat package.json | grep -E '"(dependencies|devDependencies)"' -A 100 | grep -oE '"(next|react|vue|svelte|angular|express|fastify|nestjs|nuxt|remix|astro|hono|elysia|bun|deno)"' | tr -d '"' | sort -u | tr '\n' ', ' | sed 's/,$//')
  if [ -f "tsconfig.json" ] || grep -q '"typescript"' package.json 2>/dev/null; then
    STACKS="$STACKS\nTypeScript: $DEPS"
  else
    STACKS="$STACKS\nNode.js: $DEPS"
  fi
fi

# Python
if [ -f "pyproject.toml" ]; then
  DEPS=$(grep -E '(fastapi|django|flask|starlette|litestar|sanic|tornado|streamlit|gradio|celery|pytest)' pyproject.toml 2>/dev/null | grep -oE '(fastapi|django|flask|starlette|litestar|sanic|tornado|streamlit|gradio|celery|pytest)' | sort -u | tr '\n' ', ' | sed 's/,$//')
  STACKS="$STACKS\nPython: $DEPS"
elif [ -f "requirements.txt" ]; then
  DEPS=$(grep -oiE '(fastapi|django|flask|starlette|litestar|sanic|tornado|streamlit|gradio|celery|pytest)' requirements.txt 2>/dev/null | sort -u | tr '\n' ', ' | sed 's/,$//')
  STACKS="$STACKS\nPython: $DEPS"
elif [ -f "setup.py" ] || [ -f "setup.cfg" ]; then
  STACKS="$STACKS\nPython: (legacy setup)"
fi

# Go
if [ -f "go.mod" ]; then
  DEPS=$(grep -oE '(gin-gonic|echo|fiber|chi|gorilla|gorm|sqlx|ent)' go.mod 2>/dev/null | sort -u | tr '\n' ', ' | sed 's/,$//')
  STACKS="$STACKS\nGo: $DEPS"
fi

# Rust
if [ -f "Cargo.toml" ]; then
  DEPS=$(grep -oE '(actix-web|axum|rocket|warp|tokio|serde|diesel|sqlx|sea-orm)' Cargo.toml 2>/dev/null | sort -u | tr '\n' ', ' | sed 's/,$//')
  STACKS="$STACKS\nRust: $DEPS"
fi

# Java / Kotlin
if [ -f "pom.xml" ]; then
  DEPS=$(grep -oE '(spring-boot|quarkus|micronaut|jakarta)' pom.xml 2>/dev/null | sort -u | tr '\n' ', ' | sed 's/,$//')
  STACKS="$STACKS\nJava: $DEPS"
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
  DEPS=$(grep -oE '(spring-boot|quarkus|micronaut|ktor)' build.gradle* 2>/dev/null | sort -u | tr '\n' ', ' | sed 's/,$//')
  STACKS="$STACKS\nJava/Kotlin: $DEPS"
fi

# Ruby
if [ -f "Gemfile" ]; then
  DEPS=$(grep -oE "'(rails|sinatra|hanami|rspec|sidekiq)'" Gemfile 2>/dev/null | tr -d "'" | sort -u | tr '\n' ', ' | sed 's/,$//')
  STACKS="$STACKS\nRuby: $DEPS"
fi

# PHP
if [ -f "composer.json" ]; then
  DEPS=$(grep -oE '"(laravel|symfony|slim|phpunit)"' composer.json 2>/dev/null | tr -d '"' | sort -u | tr '\n' ', ' | sed 's/,$//')
  STACKS="$STACKS\nPHP: $DEPS"
fi

# .NET / C#
if ls *.csproj 2>/dev/null | head -1 > /dev/null; then
  DEPS=$(grep -oE '(AspNetCore|EntityFramework|Blazor|MAUI)' *.csproj 2>/dev/null | sort -u | tr '\n' ', ' | sed 's/,$//')
  STACKS="$STACKS\n.NET: $DEPS"
fi

# Elixir
if [ -f "mix.exs" ]; then
  DEPS=$(grep -oE ':(phoenix|ecto|absinthe|oban|live_view)' mix.exs 2>/dev/null | tr -d ':' | sort -u | tr '\n' ', ' | sed 's/,$//')
  STACKS="$STACKS\nElixir: $DEPS"
fi

# Clean up and display
echo "$STACKS" | grep -v '^$'
```

**Also detect project signals for calibrated recommendations:**
```bash
# Project maturity signals
[ -f "Dockerfile" ] || [ -f "docker-compose.yml" ] && echo "SIGNAL: Docker"
[ -d ".github/workflows" ] || [ -f ".gitlab-ci.yml" ] || [ -f "Jenkinsfile" ] && echo "SIGNAL: CI/CD"
[ -d "tests" ] || [ -d "test" ] || [ -d "__tests__" ] || [ -d "spec" ] && echo "SIGNAL: Test directory"
[ -f ".eslintrc*" ] || [ -f "eslint.config.*" ] || [ -f ".prettierrc*" ] || [ -f "ruff.toml" ] || [ -f ".flake8" ] && echo "SIGNAL: Linting configured"
find . -maxdepth 3 -name "*.ts" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.rb" 2>/dev/null | head -200 | wc -l | xargs echo "SIGNAL: Source files:"
```

Store detected stacks as `$DETECTED_STACKS` and signals as `$PROJECT_SIGNALS`.

Continue to present_stacks.
</step>

<step name="present_stacks">
Show detected stacks to the user.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BEST PRACTICES RESEARCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Detected stacks:
{$DETECTED_STACKS formatted as a list}

Project signals:
{$PROJECT_SIGNALS}
```

**If no stacks detected:**
```
No tech stacks detected from marker files. This might be an empty repo
or use an uncommon setup.

You can still run research — just tell me what stack you're using.
```
Use AskUserQuestion to ask what stack to research.

**If 3+ stacks detected (monorepo risk per research pitfalls):**
Use AskUserQuestion:
- header: "Multiple Stacks Detected"
- question: "I found several tech stacks. Which should I research? (Multiple stacks in a repo can include build tool configs that aren't your main stack.)"
- options: Each detected stack as a separate option, plus "All of them"

Store selected stacks as `$SELECTED_STACKS`. If fewer than 3 stacks or user selects "All", use all detected stacks.

Continue to ask_focus.
</step>

<step name="ask_focus">
Ask user for research focus areas (DEC-003).

Use AskUserQuestion:
- header: "Research Focus"
- question: "What should I focus on? I'll research deeper in your chosen areas."
- options:
  - "Everything — full breadth across all categories"
  - "Project structure & patterns — architecture, file layout, common libraries"
  - "Claude Code tools — MCP servers, skills, hooks, CLAUDE.md patterns"
  - "Tooling & DX — linting, formatting, testing, CI/CD, pre-commit hooks"

Store response as `$FOCUS_AREAS`.

Continue to spawn_agents.
</step>

<step name="spawn_agents">
Spawn 3 parallel research agents with stack and focus context. All agents run in background simultaneously.

**Spawn all 3 agents in a single message using the Agent tool with `run_in_background: true`:**

### Agent 1: Stack Patterns

```
Agent(
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "Stack patterns research"
  run_in_background: true
  prompt: "First, read ~/.claude/specdacular/agents/best-practices-researcher.md for your role and output format.

<focus_area>stack-patterns</focus_area>

<detected_stacks>
$SELECTED_STACKS
</detected_stacks>

<user_focus>
$FOCUS_AREAS
</user_focus>

<project_signals>
$PROJECT_SIGNALS
</project_signals>

Research project structure options, architectural patterns, and common libraries for the detected stacks.

<search_targets>
1. Search: '{primary_stack} project structure best practices 2026'
2. Search: '{primary_stack} recommended libraries production 2026'
3. Search: 'awesome-{primary_stack} github'
4. Search: '{primary_framework} vs alternatives comparison 2026' (if framework detected)
5. Fetch: Official docs or awesome-list for top finding (verify claims)
</search_targets>

<output_instructions>
Return structured markdown following the 'Stack Patterns Output' format from your role file.
Every recommendation must include: name, purpose, tradeoffs, when to use it.
Assign confidence levels. Cite sources.
Do NOT write files — just return the markdown.
</output_instructions>"
)
```

### Agent 2: Claude Code Ecosystem

```
Agent(
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "Claude Code ecosystem research"
  run_in_background: true
  prompt: "First, read ~/.claude/specdacular/agents/best-practices-researcher.md for your role and output format.

<focus_area>claude-code-ecosystem</focus_area>

<detected_stacks>
$SELECTED_STACKS
</detected_stacks>

<user_focus>
$FOCUS_AREAS
</user_focus>

Research Claude Code MCP servers, skills, hooks, and CLAUDE.md patterns relevant to the detected stacks.

<search_targets>
1. Search: 'Claude Code MCP servers {primary_stack} 2026'
2. Search: 'awesome-mcp-servers github' — fetch the README for the full server list
3. Search: 'awesome-claude-code github' — fetch for skills and hooks patterns
4. Search: 'Claude Code CLAUDE.md best practices {primary_stack}'
5. Fetch: punkpeye/awesome-mcp-servers README or mcpservers.org for current server list
</search_targets>

<security_note>
43% of examined MCP servers had critical security flaws (2026 research).
For every MCP server you recommend, include a note about whether it's from an official/verified source.
Always link to the official registry page, not raw install commands from web results.
</security_note>

<output_instructions>
Return structured markdown following the 'Claude Code Ecosystem Output' format from your role file.
Include MCP servers with: name, purpose, install command (from official source only), stack relevance, confidence, security notes.
Include CLAUDE.md recommendations, skill patterns, and hook patterns.
Do NOT write files — just return the markdown.
</output_instructions>"
)
```

### Agent 3: Tooling & DX

```
Agent(
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "Tooling and DX research"
  run_in_background: true
  prompt: "First, read ~/.claude/specdacular/agents/best-practices-researcher.md for your role and output format.

<focus_area>tooling-dx</focus_area>

<detected_stacks>
$SELECTED_STACKS
</detected_stacks>

<user_focus>
$FOCUS_AREAS
</user_focus>

<project_signals>
$PROJECT_SIGNALS
</project_signals>

Research linters, formatters, testing frameworks, CI patterns, and pre-commit hooks for the detected stacks.

<search_targets>
1. Search: '{primary_stack} linter formatter comparison 2026'
2. Search: '{primary_stack} testing framework comparison 2026'
3. Search: '{primary_stack} CI/CD github actions best practices 2026'
4. Search: '{primary_stack} pre-commit hooks developer experience'
5. Fetch: Official docs for top linter/formatter to verify current config format
</search_targets>

<calibration>
Use project signals to calibrate recommendations:
- If CI/CD signal detected: focus on optimizing existing, not setting up from scratch
- If linting signal detected: compare existing tools to alternatives
- If no test directory: emphasize testing setup as priority
- Source file count indicates project scale: tailor recommendations accordingly
</calibration>

<output_instructions>
Return structured markdown following the 'Tooling & DX Output' format from your role file.
Present options as comparisons (tool A vs tool B) with tradeoffs.
Include pre-commit hook recommendations.
Do NOT write files — just return the markdown.
</output_instructions>"
)
```

After spawning all 3, continue to collect_results.

Continue to collect_results.
</step>

<step name="collect_results">
Wait for all 3 background agents to complete and collect their outputs.

**The agents were spawned with `run_in_background: true`, so they will notify when done.** Wait for all 3 notifications before proceeding.

**For each agent, when it completes:**
- Read the returned output (structured markdown)
- Store as `$AGENT_1_OUTPUT`, `$AGENT_2_OUTPUT`, `$AGENT_3_OUTPUT`
- If an agent failed or returned empty output, note it but continue

**Display status:**
```
Research agents complete:
- Stack Patterns: {✓ complete | ✗ failed}
- Claude Code Ecosystem: {✓ complete | ✗ failed}
- Tooling & DX: {✓ complete | ✗ failed}
```

**If any agent failed:**
```
Note: {agent name} research failed. The output doc will have reduced
coverage in that section. You can re-run /specd.best-practices to retry.
```

**If all agents failed:**
```
All research agents failed. This may be due to rate limiting or network
issues. Try again in a few minutes with /specd.best-practices.
```
End workflow.

Continue to merge_and_write.
</step>

<step name="merge_and_write">
Merge agent outputs into `docs/best-practices.md`.

```bash
mkdir -p docs
```

**Get project name from current directory:**
```bash
basename $(pwd)
```
Store as `$PROJECT_NAME`.

**Build the output document** by assembling agent outputs into the category structure. Write using the Write tool to `docs/best-practices.md`:

```markdown
# Best Practices: {$SELECTED_STACKS} ({$PROJECT_NAME})

> Generated: {today's date} by `/specd.best-practices`
> Re-run to refresh with latest recommendations.

---

## Detected Stack

{$SELECTED_STACKS with framework details from detect_stack step}

**Project signals:** {$PROJECT_SIGNALS summary — Docker, CI/CD, tests, linting, file count}

---

## Project Structure & Patterns

{Insert $AGENT_1_OUTPUT here — Stack Patterns agent findings}

{If agent 1 failed: "⚠️ Stack patterns research was unavailable. Re-run `/specd.best-practices` to retry."}

---

## Claude Code Configuration

{Insert $AGENT_2_OUTPUT here — Claude Code Ecosystem agent findings}

{If agent 2 failed: "⚠️ Claude Code ecosystem research was unavailable. Re-run `/specd.best-practices` to retry."}

---

## Tooling & DX

{Insert $AGENT_3_OUTPUT here — Tooling & DX agent findings}

{If agent 3 failed: "⚠️ Tooling & DX research was unavailable. Re-run `/specd.best-practices` to retry."}

---

## Sources

{Aggregate all source URLs from agent outputs into a single list.
Only include URLs that agents marked as verified.
Group by: Official Docs, Community Resources, Registries.}
```

**Merge rules to follow:**

1. **Organize by category, not by agent.** Each agent's output maps to one section, but if an agent's findings touch another section's topic, move that content to the appropriate section.

2. **Contradiction detection:** Before writing, scan all 3 agent outputs for cases where the same technology or tool is mentioned with conflicting recommendations. If found, add a note:
   ```
   > **Note:** Different research sources have varying perspectives on {tool}.
   > {Perspective 1} vs {Perspective 2}. Consider your specific needs.
   ```

3. **Confidence filtering:**
   - HIGH confidence findings: include directly as recommendations
   - MEDIUM confidence findings: include with source attribution
   - LOW confidence findings: move to a "For Awareness (Unverified)" subsection at the bottom of each major section, or omit if section is already comprehensive

4. **URL verification:** Only include URLs that agents reported as verified (fetched successfully). Drop broken or unverified URLs.

5. **Do NOT modify CLAUDE.md** (DEC-002). The output file is `docs/best-practices.md` only.

Continue to completion.
</step>

<step name="completion">
Show summary to user.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BEST PRACTICES GENERATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Stack:** {$SELECTED_STACKS}
**Output:** docs/best-practices.md

**Sections:**
- Project Structure & Patterns: {count} recommendations
- Claude Code Configuration: {count} MCP servers, {count} skills/hooks
- Tooling & DX: {count} recommendations

The doc is ready to review. It is NOT committed or added to CLAUDE.md.
You can commit it if you find it useful, or re-run to refresh.
```

End workflow.
</step>

</process>

<success_criteria>
- Tech stack auto-detected from repo marker files and dependencies
- User asked for focus areas before agent dispatch
- 3 research agents spawned with stack-aware context
- Agent outputs merged into categorized docs/best-practices.md
- Each recommendation has: name, purpose, tradeoffs, when to use it
- Generation date stamped, CLAUDE.md not modified
</success_criteria>
