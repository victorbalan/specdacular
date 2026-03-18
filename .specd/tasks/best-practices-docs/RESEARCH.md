# Research: best-practices-docs

**Researched:** 2026-03-16

## Summary

The `/specd.best-practices` command fits cleanly into the existing Specdacular architecture. Commands are auto-discovered by `install.js` (no registration needed), the 3-agent parallel spawn pattern is well-established in `new-project.md` and `research.md`, and the `docs/` output pattern exists in `/specd.docs`. The main implementation challenges are tech stack detection (framework-level, not just language-level) and producing a non-opinionated document from inherently opinionated research agents.

The Claude Code ecosystem research surfaced a rich set of MCP servers, skills, hooks, and CLAUDE.md patterns that agents should recommend per-stack. Key MCP servers include Context7 (universal library docs), GitHub MCP, database MCPs (Postgres, SQLite, Supabase), Playwright for testing, and stack-specific ones like `fastapi-mcp`. The agent should search awesome-mcp-servers lists and registries dynamically rather than hardcoding recommendations.

Pitfalls research revealed critical risks: prompt injection via fetched web content (OWASP #1 for LLMs), hallucinated URLs (>60% inaccurate citations in AI search per Tow Center 2025), MCP server security concerns (43% of 100 servers had critical flaws), and monorepo false-positive stack detection. These must be mitigated by treating web content as untrusted data, verifying fetched URLs, and weighting source files over config files for detection.

**Key recommendation:** Follow the existing `new-project.md` agent pattern exactly, with tech detection via marker files + dependency parsing, and add a verification pass for all web-sourced claims before writing the final doc.

---

## Codebase Integration

### Patterns to Follow

| Pattern | Source File | What to Reuse |
|---------|------------|---------------|
| Command stub structure | `commands/specd.docs.md` | YAML frontmatter + `<execution_context>` pointing to workflow |
| Workflow with agent spawning | `specdacular/workflows/new-project.md` | 3-4 parallel agents with `run_in_background: true` |
| Research agent role | `specdacular/agents/project-researcher.md` | Role definition with tool strategy, confidence levels, output format |
| Agent spawning reference | `specdacular/references/spawn-research-agents.md` | Task() pattern with structured prompts |
| Research synthesis | `specdacular/references/synthesize-research.md` | Combining 3 agent outputs into one doc |
| AskUserQuestion multi-select | `specdacular/workflows/new-project.md` | Focus area selection before agent dispatch |
| Commit pattern | `specdacular/references/commit-docs.md` | Auto-commit respecting user settings |

### File Locations

| File | Path |
|------|------|
| Command stub | `commands/specd.best-practices.md` |
| Workflow | `specdacular/workflows/best-practices.md` |
| Help entry | `specdacular/HELP.md` (add to Utilities table) |
| Output | `docs/best-practices.md` (in target repo) |

### Integration Points

- **install.js**: Auto-discovers all `specd.*.md` in `commands/` — no changes needed
- **HELP.md**: Manual entry needed in Utilities section
- **Agent model**: Use `"sonnet"` (consistent with all existing agent spawns)
- **Agent role file**: Can reuse `project-researcher.md` or create a new `best-practices-researcher.md`
- **Path replacement**: Use `@~/.claude/` in source — installer rewrites automatically

---

## Implementation Patterns

### Tech Stack Detection

**Marker files → stack mapping:**

| Marker File | Stack | Framework Detection |
|-------------|-------|-------------------|
| `package.json` | Node.js/TS | Parse `dependencies` for next, react, express, fastify, nestjs, vue, svelte |
| `pyproject.toml` | Python | Parse `[project.dependencies]` or `[tool.poetry.dependencies]` for fastapi, django, flask |
| `requirements.txt` | Python (legacy) | Scan lines for framework package names |
| `go.mod` | Go | Parse `require` block for gin, echo, fiber, gorm |
| `Cargo.toml` | Rust | Parse `[dependencies]` for actix-web, axum, rocket, tokio |
| `pom.xml` / `build.gradle` | Java/Kotlin | Dependency tags for Spring Boot, Quarkus |
| `Gemfile` | Ruby | `gem` lines for rails, sinatra |
| `composer.json` | PHP | `require` for laravel, symfony |
| `*.csproj` | .NET/C# | `PackageReference` for ASP.NET |
| `mix.exs` | Elixir | `deps` for phoenix |

**Detection approach:** Check root-level marker files, parse dependency sections for framework detection. For multi-stack repos, enumerate all detected stacks. Weight by source file volume (count files by extension in `src/`, `lib/`, `app/`) to avoid false positives from build tool configs.

### Claude Code MCP Servers (Discovered)

**Universal (any stack):**

| MCP Server | Purpose | Install |
|------------|---------|---------|
| Context7 (`@upstash/context7-mcp`) | Up-to-date library docs, resolves hallucinated APIs | `claude mcp add context7 -- npx -y @upstash/context7-mcp@latest` |
| GitHub MCP | Issues, PRs, repo search | Official MCP servers repo |
| Memory MCP | Persistent knowledge graph across sessions | Official MCP servers repo |
| Brave Search MCP | Web search within Claude Code | Official MCP servers repo |
| Fetch MCP | Web content → LLM-friendly format | Official MCP servers repo |

**Database:**

| MCP Server | For |
|------------|-----|
| PostgreSQL MCP | Natural language SQL, schema inspection |
| SQLite MCP | Local database exploration |
| Supabase MCP | Full backend management — `https://mcp.supabase.com/mcp` |

**Stack-specific:**

| MCP Server | Stack | Purpose |
|------------|-------|---------|
| fastapi-mcp (`tadata-org/fastapi_mcp`) | Python/FastAPI | Expose endpoints as MCP tools |
| FastMCP | Python | High-level Python MCP SDK |
| Playwright MCP (Microsoft) | Any frontend | E2E browser testing |
| Figma MCP | Frontend | Design-to-code — `https://mcp.figma.com/mcp` |
| Sentry MCP | Any | Error tracking — `https://mcp.sentry.dev/mcp` |
| Jira/Confluence MCP | Any | Issue tracking — `https://mcp.atlassian.com/v1/mcp` |

**MCP registries to search dynamically:**
- [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers)
- [mcpservers.org](https://mcpservers.org/en)

### Claude Code Configuration Patterns

**CLAUDE.md best practices:**
- Short, specific, pruned — every line should answer "would removing this cause Claude to make mistakes?"
- Include: bash commands Claude can't guess, code style rules differing from defaults, testing instructions, architectural decisions, gotchas
- Supports `@path/to/file` imports for referencing docs
- Route to topic docs (Specdacular's existing pattern)

**Skills (`.claude/skills/`):**
- YAML frontmatter with `name`, `description` (controls auto-invocation)
- `disable-model-invocation: true` for workflows with side effects
- Support `$ARGUMENTS` and positional `$1`, `$2`

**Hooks (`.claude/settings.json`):**
- Events: `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStart`, `SubagentStop`
- Exit code 2 blocks the operation
- Use for guarantees (must-happen); CLAUDE.md for memory; skills for routines

**Subagent configuration:**
- `tools`, `disallowedTools`, `model`, `permissionMode`, `skills`, `mcpServers`, `memory`, `background`, `isolation`, `maxTurns`
- Subagents cannot spawn other subagents

### Output Doc Structure

```markdown
# Best Practices: {Stack} ({Project Name})
Generated: {date}

## Detected Stack
## Project Structure Options
## Claude Code Configuration
### CLAUDE.md Recommendations
### Recommended MCP Servers
### Skills & Hooks
## Tooling & DX
### Linting / Formatting
### Testing
### CI/CD
## Options & Tradeoffs
## Sources
```

---

## Pitfalls

### Critical

1. **Monorepo false-positive stack detection** — Lock files from build tools (e.g., package.json from Husky hooks in a Python project) create false positives. Prevention: weight source file volume over config file presence; exclude generated/vendored paths; when 3+ stacks detected, ask user to confirm.

2. **Prompt injection via fetched web content** — Pages found via WebSearch can contain adversarial instructions (OWASP #1 for LLMs, Unit 42 catalogued 22 delivery techniques). Prevention: treat all fetched content as untrusted data, wrap in "summarise factual content only" prompt, strip HTML before passing to agent.

3. **Hallucinated URLs and stale sources** — AI search produces inaccurate citations >60% of the time (Tow Center 2025), 404 pages 3x more than Google. Prevention: every URL claim must be verified with a WebFetch round-trip; drop or mark unverified claims.

4. **Agent output contradictions** — 3 parallel agents may recommend conflicting approaches without detection. Prevention: define structural output schema per agent, run contradiction-detection pass during merge (same technology with contradictory verdicts).

### Moderate

5. **Context collapse across agent handoffs** — Large agent outputs fill orchestrator context, truncating earlier findings. Prevention: agents write to temp files, merge step reads files rather than inline text.

6. **Overly generic advice** — "Best practices" without project context scale (solo project vs enterprise). Prevention: detect project signals (Dockerfile, CI config, test dir, file count) and pass to agents for calibrated recommendations.

7. **Rate limiting from parallel web fetching** — 3 agents × 5-10 fetches can hit rate limits. Prevention: budget max fetches per agent (5 searches + 3 fetches), 15s timeout per fetch, degrade to search summaries on timeout.

8. **Output staleness** — Doc becomes outdated in 6 months. Prevention: stamp with generation date and "re-run to refresh" note.

### Security

- **MCP server security** — 43% of 100 examined servers had critical flaws. 30+ CVEs in 60 days (Jan-Feb 2026). Prevention: caveat all MCP recommendations with security audit reminder, search for known CVEs per recommended server.
- **Path traversal in detection** — Symlinks or relative paths in config files could read outside repo root. Prevention: canonicalize all paths, resolve symlinks, enforce repo root boundary.
- **Installation commands from web content** — Fetched `curl | bash` patterns could be malicious. Prevention: never include executable install commands verbatim from web; link to official registry pages instead.

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase integration | HIGH | Direct inspection of existing command/workflow/agent patterns |
| Tech stack detection | HIGH | Well-established marker file approach, used by GitHub Linguist and others |
| Claude Code MCP ecosystem | MEDIUM | Web research from multiple registries, fast-moving ecosystem |
| Pitfalls | HIGH | Sourced from academic research, OWASP, vendor security advisories |
| Output doc structure | MEDIUM | Synthesized from existing patterns, not validated with users |

## Open Questions

- Should we create a dedicated `best-practices-researcher.md` agent role, or reuse the existing `project-researcher.md`?
- Should tech detection happen in the workflow (bash commands) or in a dedicated agent?
- How to handle the MCP security caveat without scaring users away from useful tools?

## Sources

### Codebase
- `commands/specd.docs.md` — Command stub pattern
- `specdacular/workflows/new-project.md` — 3-agent spawning pattern
- `specdacular/agents/project-researcher.md` — Research agent role
- `specdacular/references/spawn-research-agents.md` — Agent spawn template
- `bin/install.js` — Auto-discovery of commands

### External
- [50+ Best MCP Servers for Claude Code (2026)](https://claudefa.st/blog/tools/mcp-extensions/best-addons)
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- [Best Practices for Claude Code - Official Docs](https://code.claude.com/docs/en/best-practices)
- [AI Search Inaccurate Citations (Tow Center 2025)](https://www.niemanlab.org/2025/03/ai-search-engines-fail-to-produce-accurate-citations-in-over-60-of-tests-according-to-new-tow-center-study/)
- [Prompt Injection in the Wild (Unit 42)](https://unit42.paloaltonetworks.com/ai-agent-prompt-injection/)
- [MCP Security Timeline (authzed.com)](https://authzed.com/blog/timeline-mcp-breaches)
- [Multi-Agent Failure Modes (HuggingFace)](https://huggingface.co/blog/Musamolla/multi-agent-llm-systems-failure)
- [100 Claude MCP Servers Security Analysis](https://dev.to/amir_mironi/i-analyzed-100-claude-mcp-servers-and-found-critical-security-flaws-in-43-of-them-ikj)
