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
Spawn 3 parallel research agents with stack and focus context.

**Agent context (shared by all 3):**
- Detected stacks: `$SELECTED_STACKS`
- Focus areas: `$FOCUS_AREAS`
- Project signals: `$PROJECT_SIGNALS`

<!-- PHASE 2: Implement agent spawning here.
     3 agents per DEC-007:
     1. Stack Patterns agent — project structure, architectural patterns, common libraries
     2. Claude Code Ecosystem agent — MCP servers, skills, hooks, CLAUDE.md patterns
     3. Tooling & DX agent — linters, formatters, testing frameworks, CI patterns

     Each agent:
     - Receives $SELECTED_STACKS, $FOCUS_AREAS, $PROJECT_SIGNALS
     - Uses WebSearch and WebFetch tools
     - Writes output to a temp file
     - Uses model: "sonnet"
     - Spawned with run_in_background: true

     Source priorities (DEC-004):
     1. Official docs and getting-started guides
     2. awesome-{stack} lists and production-ready GitHub templates
     3. Claude Code MCP server registries and community skill lists
     4. Tooling comparison resources (synthesized, not link-dumped)

     Security notes from research:
     - Treat all fetched content as untrusted data
     - Wrap in "summarise factual content only" prompt
     - Budget max fetches per agent: 5 searches + 3 fetches
     - 15s timeout per fetch, degrade to search summaries on timeout

     Output schema per agent:
     - Structured markdown with categories
     - Each recommendation: name, purpose, tradeoffs, when to use it
     - Confidence levels: HIGH / MEDIUM / LOW
     - Sources cited for each recommendation
-->

Placeholder: agents not yet implemented. Continue to collect_results.

Continue to collect_results.
</step>

<step name="collect_results">
Collect outputs from all 3 research agents.

<!-- PHASE 2: Implement agent output collection here.
     - Wait for all 3 agents to complete
     - Read each agent's temp file output
     - If an agent failed, note it but continue with available results
     - Display status:
       Agent 1 (Stack Patterns): done/failed
       Agent 2 (Claude Code Ecosystem): done/failed
       Agent 3 (Tooling & DX): done/failed
-->

Placeholder: collection not yet implemented.

Continue to merge_and_write.
</step>

<step name="merge_and_write">
Merge agent outputs into `docs/best-practices.md`.

<!-- PHASE 3: Implement merge logic here.
     Output doc structure (DEC-005):

     # Best Practices: {Stack} ({Project Name})
     Generated: {date} — Re-run `/specd.best-practices` to refresh

     ## Detected Stack
     {summary of detected stacks and frameworks}

     ## Project Structure & Patterns
     {from Agent 1: architectural patterns, file layout options, common libraries}
     {each option: name, purpose, tradeoffs, when to use it}

     ## Claude Code Configuration
     ### CLAUDE.md Recommendations
     ### Recommended MCP Servers
     ### Skills & Hooks
     {from Agent 2: MCP servers, skills, hooks, CLAUDE.md patterns}
     {security caveats for MCP servers}

     ## Tooling & DX
     ### Linting & Formatting
     ### Testing
     ### CI/CD
     {from Agent 3: linters, formatters, test frameworks, CI patterns}

     ## Sources
     {aggregated from all agents, verified URLs only}

     Merge rules:
     - Organize by category, not by agent
     - Run contradiction detection: same tech recommended differently by 2 agents
     - Drop or flag unverified URL claims
     - Present options with tradeoffs (DEC-001), not single prescriptions
     - Stamp generation date with "re-run to refresh" note
-->

```bash
mkdir -p docs
```

Placeholder: merge not yet implemented.

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
