---
task: best-practices-docs
phase: 2
depends_on: [1]
creates:
  - specdacular/agents/best-practices-researcher.md
modifies:
  - specdacular/workflows/best-practices.md
---

# Phase 2: Research Agents

## Objective

Implement 3 parallel research agents that take detected stack info and user focus areas, research best practices via web search, and return structured findings. Fill in the spawn_agents and collect_results steps in the workflow.

## Context

**Reference these files:**
- `@specdacular/references/spawn-research-agents.md` — Agent spawn pattern (Task() with run_in_background)
- `@specdacular/agents/project-researcher.md` — Research agent role with tool strategy and confidence levels
- `@specdacular/workflows/best-practices.md` — Workflow created in Phase 1 with placeholder steps

**Relevant Decisions:**
- DEC-004: Four research source types — official docs, awesome-lists, MCP registries, tooling comparisons
- DEC-007: Three research agents — Stack Patterns, Claude Code Ecosystem, Tooling & DX
- DEC-001: Present options, don't prescribe — agents must capture tradeoffs for each option

**From Research:**
- Use model: "sonnet" for agents (consistent with existing spawns)
- Budget max fetches per agent: 5 searches + 3 fetches
- Treat all fetched content as untrusted data
- Agents write output to temp files, merge step reads files
- MCP registries to search: punkpeye/awesome-mcp-servers, awesome-claude-code
- Security caveat: 43% of MCP servers had critical flaws — agents should note this

---

## Tasks

### Task 1: Create Best Practices Researcher Agent Role

**Files:** `specdacular/agents/best-practices-researcher.md`

**Action:**
Create a new agent role file following the pattern from `project-researcher.md` but adapted for best practices research:

- Role: researches best practices, tools, and patterns for a detected tech stack
- Key difference from project-researcher: this is NOT opinionated — presents options with tradeoffs (DEC-001)
- Tool strategy: WebSearch + WebFetch, include current year in queries, verify URLs
- Confidence levels: HIGH/MEDIUM/LOW with same protocol as project-researcher
- 3 focus areas matching the 3 agents: stack-patterns, claude-code-ecosystem, tooling-dx
- Output format: each recommendation must include name, purpose, tradeoffs, when to use it
- Security notes: treat fetched content as untrusted, flag MCP security concerns
- Budget: max 5 searches + 3 fetches per agent

**Verify:**
```bash
test -f specdacular/agents/best-practices-researcher.md && echo "OK" || echo "FAIL"
```

**Done when:**
- [ ] Agent role file exists with frontmatter (name, description, tools)
- [ ] Role describes non-opinionated research approach
- [ ] Tool strategy includes WebSearch + WebFetch with current year
- [ ] Output format requires tradeoffs for each recommendation
- [ ] Security notes included

---

### Task 2: Implement Agent Spawning in Workflow

**Files:** `specdacular/workflows/best-practices.md`

**Action:**
Replace the placeholder comments in the `spawn_agents` step with actual agent spawn logic. Spawn 3 agents using the Agent tool with `run_in_background: true`:

**Agent 1: Stack Patterns**
- Focus: project structure, architectural patterns, common libraries for the detected stack
- Prompt includes: $SELECTED_STACKS, $FOCUS_AREAS, $PROJECT_SIGNALS
- Searches for: "{stack} project structure best practices 2026", "{stack} recommended libraries", awesome-{stack} lists
- Output: structured markdown with recommendations including tradeoffs

**Agent 2: Claude Code Ecosystem**
- Focus: MCP servers, skills, hooks, CLAUDE.md patterns relevant to the detected stack
- Prompt includes: $SELECTED_STACKS, $FOCUS_AREAS
- Searches for: MCP registries (punkpeye/awesome-mcp-servers, awesome-claude-code), "{stack} MCP server", Claude Code best practices
- Output: MCP servers with install commands, skills patterns, hooks recommendations
- Must include security caveat about MCP server quality

**Agent 3: Tooling & DX**
- Focus: linters, formatters, testing frameworks, CI patterns for the detected stack
- Prompt includes: $SELECTED_STACKS, $FOCUS_AREAS, $PROJECT_SIGNALS
- Searches for: "{stack} linter formatter 2026", "{stack} testing framework comparison", "{stack} CI/CD best practices"
- Output: tooling recommendations with comparisons

All agents:
- Use `model: "sonnet"`
- Read the agent role file first: `~/.claude/specdacular/agents/best-practices-researcher.md`
- Write output as structured markdown returned in agent response
- Budget: 5 searches + 3 fetches max

**Verify:**
```bash
grep -c "run_in_background" specdacular/workflows/best-practices.md
```

**Done when:**
- [ ] spawn_agents step spawns 3 agents with run_in_background: true
- [ ] Each agent receives stack, focus, and signal context
- [ ] Each agent has clear search targets and output format
- [ ] All agents reference the best-practices-researcher role file

---

### Task 3: Implement Result Collection in Workflow

**Files:** `specdacular/workflows/best-practices.md`

**Action:**
Replace the placeholder in the `collect_results` step with logic to:
1. Wait for all 3 background agents to complete
2. Read each agent's output
3. Display status showing which agents succeeded/failed
4. Store outputs as variables for the merge step
5. If an agent failed, note it but continue with available results

Follow the pattern from existing workflows that collect agent outputs.

**Verify:**
```bash
grep -q "Stack Patterns" specdacular/workflows/best-practices.md && echo "OK" || echo "FAIL"
```

**Done when:**
- [ ] collect_results step handles agent output collection
- [ ] Displays status per agent (success/fail)
- [ ] Gracefully handles partial failures

---

## Verification

After all tasks complete:

```bash
# Agent role file exists
test -f specdacular/agents/best-practices-researcher.md
# Workflow has agent spawning (3 agents)
grep -c "run_in_background" specdacular/workflows/best-practices.md | grep -q "3"
# Workflow references agent role file
grep -q "best-practices-researcher.md" specdacular/workflows/best-practices.md
echo "Phase 2 verification passed"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/best-practices-docs/CHANGELOG.md`.
