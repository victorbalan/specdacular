---
name: specd.best-practices
description: Detect repo tech stack and generate a curated best-practices reference doc with project patterns, Claude Code tools, and tooling recommendations
argument-hint: ""
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Edit
  - Agent
  - AskUserQuestion
  - WebSearch
  - WebFetch
---

<objective>
Detect a repo's tech stack, spawn research agents to discover best practices, Claude Code ecosystem tools, and recommended tooling, then produce a curated `docs/best-practices.md` reference doc.

Agents use web search to find current patterns, MCP servers, skills, hooks, and tooling for the detected stack. The output presents options with tradeoffs — not opinionated prescriptions.

Output: `docs/best-practices.md` in the target repo.
</objective>

<execution_context>
@~/.claude/specdacular/workflows/best-practices.md
</execution_context>

<context>
**How it works:**
1. Detects all tech stacks in the repo (marker files + dependency parsing)
2. Asks user for focus areas before research
3. Spawns 3 parallel research agents (stack patterns, Claude Code ecosystem, tooling/DX)
4. Merges findings into a structured reference doc

**Key principles:**
- Auto-detects stack — user doesn't need to specify what tech they use
- Presents options with context and tradeoffs, not single prescriptions
- User steers research focus before agents run
- Output is self-contained and readable without re-running the command
- Does NOT modify CLAUDE.md — the doc is for the user, not necessarily for Claude
</context>

<when_to_use>
**Use /specd.best-practices for:**
- Starting a new project and want to know what tools/patterns exist for your stack
- Joining an existing project and want to understand available Claude Code integrations
- Exploring what MCP servers, skills, and hooks are available for your tech
- Getting current tooling recommendations (linters, formatters, testing, CI)

**Skip /specd.best-practices for:**
- Projects where you already have a well-established toolchain
- When you need docs about your existing codebase (use `/specd.docs` instead)
</when_to_use>

<process>
1. Detect tech stacks from repo marker files and dependencies
2. Present detected stacks to user (ask to select if 3+ found)
3. Ask user for focus areas (everything, structure, Claude Code tools, or tooling/DX)
4. Spawn 3 parallel research agents with stack and focus context
5. Collect and merge agent outputs
6. Write `docs/best-practices.md` with categorized findings
7. Show summary to user
</process>

<success_criteria>
- [ ] Tech stack auto-detected from repo files
- [ ] User asked for focus areas before research
- [ ] 3 research agents spawned with stack-aware prompts
- [ ] Output organized by category: stack patterns, Claude Code ecosystem, tooling/DX
- [ ] Each recommendation includes context, tradeoffs, and when to use it
- [ ] Doc is self-contained and readable
- [ ] CLAUDE.md is NOT modified
</success_criteria>
