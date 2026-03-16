# Roadmap: best-practices-docs

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 3 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Command & Tech Detection** — Create command stub, workflow skeleton, and tech stack detection logic
- [ ] **Phase 2: Research Agents** — Implement 3 parallel research agents with stack-aware prompts
- [ ] **Phase 3: Merge & Output** — Merge agent outputs into docs/best-practices.md, add help entry

---

## Phase Details

### Phase 1: Command & Tech Detection

**Goal:** A working command that detects the repo's tech stack, asks the user for focus areas, and is ready to dispatch agents.

**Creates:**
- `commands/specd.best-practices.md` — Command stub with frontmatter and execution_context
- `specdacular/workflows/best-practices.md` — Workflow with steps: detect stack → ask user focus → (agent dispatch placeholder) → merge → write output

**Success Criteria:**
1. Running `/specd.best-practices` in a repo with `package.json` correctly detects Node.js and frameworks
2. Running it in a repo with `pyproject.toml` correctly detects Python and frameworks
3. User is presented with detected stacks and asked for focus areas via AskUserQuestion
4. Workflow structure has all step placeholders ready for agent integration

**Dependencies:** None (first phase)

---

### Phase 2: Research Agents

**Goal:** 3 parallel research agents that take detected stack info and user focus areas, research best practices via web search, and return structured findings.

**Creates:**
- Agent spawn logic in `specdacular/workflows/best-practices.md` (fill in spawn_agents step)
- Agent prompts with stack-aware context, source priorities, and output schemas

**Modifies:**
- `specdacular/workflows/best-practices.md` — Add agent spawning step, collection step, temp file handling

**Success Criteria:**
1. All 3 agents spawn with `run_in_background: true` and receive detected stack info
2. Agent 1 (Stack Patterns) searches for project structure, architectural patterns, libraries
3. Agent 2 (Claude Code Ecosystem) searches for MCP servers, skills, hooks, CLAUDE.md patterns
4. Agent 3 (Tooling & DX) searches for linters, formatters, test frameworks, CI patterns
5. Each agent returns structured markdown with confidence levels

**Dependencies:** Phase 1 complete (workflow structure exists)

---

### Phase 3: Merge & Output

**Goal:** Merge 3 agent outputs into a clean `docs/best-practices.md`, add the command to help, and handle edge cases.

**Creates:**
- Merge logic in `specdacular/workflows/best-practices.md` (fill in merge and write steps)

**Modifies:**
- `specdacular/workflows/best-practices.md` — Add merge step, contradiction detection, output formatting
- `specdacular/HELP.md` — Add `/specd.best-practices` to Utilities table

**Success Criteria:**
1. Agent outputs merged into coherent `docs/best-practices.md` organized by category
2. Each recommendation has: name, purpose, tradeoffs, when to use it
3. Generation date stamped in the doc with "re-run to refresh" note
4. No contradictions between sections (same tech recommended differently)
5. `/specd.help` shows the new command
6. The doc is self-contained and readable

**Dependencies:** Phase 2 complete (agent outputs available)

---

## Execution Order

```
Phase 1: Command & Tech Detection
└── PLAN.md
    ↓
Phase 2: Research Agents
└── PLAN.md
    ↓
Phase 3: Merge & Output
└── PLAN.md
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Present Options, Don't Prescribe | Phase 3 merge must present tradeoffs, not single choices |
| DEC-002: Output Stays Separate | Phase 3 does NOT modify CLAUDE.md routing table |
| DEC-003: Ask User Focus Areas | Phase 1 must include AskUserQuestion step before agents |
| DEC-006: Detect All Stacks | Phase 1 detection must enumerate all stacks, not just primary |
| DEC-007: Three Research Agents | Phase 2 splits work across 3 agents matching output categories |
