# Task: best-practices-docs

## What This Is

A command (`/specd.best-practices`) that detects a repo's tech stack, spawns research agents to discover best practices, Claude Code ecosystem tools, and recommended tooling, then produces a curated `docs/best-practices.md` reference doc the user can optionally commit.

## Technical Requirements

### Must Create

- [ ] `commands/specd.best-practices.md` — Slash command stub with frontmatter and execution_context
- [ ] `specdacular/workflows/best-practices.md` — Main workflow: detect stack → ask user focus → spawn agents → merge → write doc
- [ ] Output: `docs/best-practices.md` in target repo — Curated reference doc with findings organized by category

### Must Integrate With

- `bin/install.js` — Must be copied during install like other commands
- `commands/specd.help.md` — Must appear in help output
- Existing `/specd.docs` — Stays separate (not in CLAUDE.md routing table) unless user decides to include it

### Constraints

- Generic tech detection — Must work for any stack (Python, Node, Go, Rust, etc.), not hardcoded to one
- Present options, don't prescribe — Show what's available with context and tradeoffs; light "recommended" tags are okay, but user chooses
- User steering — Ask the user before research if they want to focus on specific areas
- Zero dependencies — Agents use web search/fetch, no npm packages
- Follow existing patterns — Command stub → workflow → agents, same as other specd commands

---

## Success Criteria

- [ ] Running `/specd.best-practices` in a FastAPI repo produces a useful `docs/best-practices.md`
- [ ] Running it in a Node/Express repo produces different, stack-appropriate results
- [ ] Tech stack is auto-detected from repo files (package.json, pyproject.toml, go.mod, Cargo.toml, etc.)
- [ ] User is asked for focus areas before agents are dispatched
- [ ] Output covers: project structure options, Claude Code tools (MCP servers, skills, hooks), and tooling/DX recommendations
- [ ] Each recommendation includes context on what it does and when to use it — not just a name
- [ ] The doc is self-contained and readable without running the command again

---

## Out of Scope

- [X] Auto-installing MCP servers or tools — Doc recommends, user installs
- [X] Scaffolding project structure — Doc describes options, doesn't create files
- [X] Integration with CLAUDE.md routing table — Stays separate unless user opts in later
- [X] Opinionated "you must do X" prescriptions — Present options with tradeoffs

---

## Initial Context

### User Need
Developers starting a project (or joining one) don't know what Claude Code MCP servers, skills, and hooks exist for their stack, or how to structure their project following community best practices. This command researches and curates that knowledge.

### Integration Points
- Same command/workflow/agent architecture as all specd commands
- `bin/install.js` for installation
- Web search/fetch for research (agents)

### Key Constraints
- Must auto-detect stack — user shouldn't have to tell it what tech they use
- Non-opinionated — present choices with context, let user decide
- User can steer research focus before agents run
