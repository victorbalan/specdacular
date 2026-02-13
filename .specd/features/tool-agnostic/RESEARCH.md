# Research: tool-agnostic

**Researched:** 2026-02-13
**Feature type:** Build system / cross-tool generator
**Confidence:** MEDIUM-HIGH

## Summary

Building a Codex generator from Claude Code source files is feasible with a clear mapping between the two tools. The Specdacular architecture is well-suited for conversion — 8 of 9 templates are already tool-agnostic, and the command→workflow separation maps directly to Codex's SKILL.md + references/ pattern. The main challenges are: (1) agent spawning has no Codex equivalent, requiring sequential fallback; (2) tool references need prose-level rewriting; and (3) generated file maintenance needs discipline to prevent staleness.

**Key recommendation:** Build a single-pass Node.js script that transforms each command+workflow pair into a Codex skill directory (SKILL.md + references/workflow.md), with a tool reference translation table and frontmatter conversion. Start with the simplest workflows, graduate to complex ones.

---

## Codebase Integration

### Source File Inventory

**20 workflow files** in `specdacular/workflows/`:
- Largest: execute-plan.md (636 lines), new-feature.md (760 lines), continue-feature.md (654 lines)
- Smallest: toolbox.md (115 lines), config.md (112 lines)

**6 command files** in `commands/specd/`:
- Each has YAML frontmatter (name, description, argument-hint, allowed-tools)
- Each references workflow via `@~/.claude/specdacular/workflows/{name}.md`

**2 agent definitions:**
- `agents/specd-codebase-mapper.md` — tools: Read, Bash, Grep, Glob, Write
- `specdacular/agents/feature-researcher.md` — tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch

**9 feature templates** in `specdacular/templates/features/`:
- 8 are tool-agnostic (pure markdown content): FEATURE.md, CONTEXT.md, DECISIONS.md, RESEARCH.md, ROADMAP.md, STATE.md, CHANGELOG.md, DEPENDENCIES.md
- 1 uses `@path` references: PLAN.md

### Tool Reference Map

| Tool | Occurrences | Codex Equivalent | Notes |
|------|-------------|------------------|-------|
| Read | All workflows | `cat` / `cat -n` | Use `cat -n` to preserve line numbering |
| Write | 15 workflows | File write via shell | Codex writes files directly |
| Bash | 16 workflows | Shell commands | 1:1 mapping |
| Glob | 8 workflows | `find` or `rg --files` | Pattern matching |
| Grep | 9 workflows | `grep` or `rg` | Codex prefers `rg` |
| AskUserQuestion | 13 workflows | `ask_user_question` | Nearly 1:1 mapping |
| Task | 4 workflows | No equivalent | **Critical gap** — sequential fallback |
| Edit | 1 workflow | `apply_patch` / `sed` | Different paradigm |
| WebSearch | Agent only | Built-in if enabled | config.toml: `web_search = "cached"` |
| WebFetch | Agent only | No direct equivalent | May need MCP or web_search |

### Workflows by Complexity

**Easy to convert** (no agent spawning, simple tool usage):
- status.md, help.md, config.md, discuss-feature.md, review-feature.md, toolbox.md

**Medium complexity** (Write-heavy, AskUserQuestion):
- new-feature.md, plan-feature.md, plan-phase.md, execute-plan.md, continue-feature.md, insert-phase.md

**Hard to convert** (parallel agent spawning):
- map-codebase.md (4 parallel agents)
- research-feature.md (3 parallel agents)
- prepare-phase.md (3 optional parallel agents)
- research-phase.md (3 parallel agents)

### Install Script Integration

`bin/install.js` already supports `--global` and `--local` flags. A `--codex` flag would:
1. Parse at line 20-23 alongside existing flags
2. Copy from pre-built `codex/` directory instead of `.claude/` source
3. Target `.codex/skills/` or `~/.codex/skills/`
4. Skip hooks/statusline setup (Codex has its own)
5. Generate AGENTS.md instead of CLAUDE.md integration

---

## Implementation Approach

### Codex SKILL.md Format

**Confidence: HIGH** (Official OpenAI docs)

Frontmatter — only `name` and `description` required:
```yaml
---
name: specd-new-feature
description: Initialize a new feature folder and start first discussion for technical requirements
---
```

No `allowed-tools`, `argument-hint`, `user-invocable`, or `context` fields. These are Claude Code-specific.

### Skill Directory Structure

Each command+workflow becomes:
```
.codex/skills/specd-{name}/
├── SKILL.md              ← Brief entry point (<500 lines)
├── references/
│   └── workflow.md       ← Full translated workflow
│   └── commit-docs.md    ← Shared references
└── scripts/              ← Helper scripts if needed
```

### Codex config.toml

```toml
model = "gpt-5.2-codex"
approval_policy = "on-request"
sandbox_mode = "workspace-write"
web_search = "cached"

project_doc_fallback_filenames = ["AGENTS.md"]
project_doc_max_bytes = 65536
```

### AGENTS.md Content

Concise project-level instructions pointing to `.specd/codebase/` docs and describing the Specdacular workflow. Must stay under 32 KiB (default limit).

### Tool Translation Rules

```javascript
const TOOL_TRANSLATIONS = {
  // Prose replacements
  'use the Read tool': 'use `cat -n`',
  'Read tool': '`cat -n`',
  'use the Write tool': 'write the file',
  'Write tool': 'file writing',
  'use the Edit tool': 'use `sed` or manual editing',
  'use the Grep tool': 'use `rg`',
  'use the Glob tool': 'use `find`',
  'use Grep': 'use `rg`',
  'use Glob': 'use `find`',

  // Frontmatter
  'allowed-tools:': '# allowed-tools (removed for Codex)',

  // References
  '@~/.claude/specdacular/': 'See references/',
};
```

### XML Tag Handling

Codex works fine with XML-style tags in prompts. No need to transform `<step>`, `<process>`, `<philosophy>` — keep them as-is.

---

## Pitfalls

### Critical

**Parallel Agent Gap**
- What goes wrong: 4 workflows spawn parallel agents via Task tool. Codex has no equivalent.
- Why it happens: Claude Code's Task tool with `run_in_background=true` is unique.
- Prevention: Convert to sequential execution. Add timing warnings ("This takes 4x longer"). Add context reset suggestions between major steps.
- Detection: Generated skill references `Task tool` or `subagent_type`.

**Stale Generated Files**
- What goes wrong: Source workflow updated, `codex/` not regenerated, Codex users get outdated skills.
- Why it happens: Human forgets to run build before committing.
- Prevention: Pre-commit hook checking source vs generated timestamps. CI verification. Auto-generated header comment.
- Detection: `npm run build:codex && git diff --exit-code codex/`

**YAML Frontmatter Validation**
- What goes wrong: Invalid YAML causes Codex to silently skip the entire skill (GitHub issue #8609).
- Why it happens: Colons in description field, missing quotes.
- Prevention: YAML linting in build script. Quote all strings. Test with YAML parser.
- Detection: Build script validates frontmatter before writing.

### Moderate

**Context Accumulation in Sequential Mode**
- What goes wrong: Sequential execution of research agents consumes context progressively; quality degrades.
- Prevention: Suggest restarting Codex between major steps. Estimate token budget per step.

**File Reference Syntax**
- What goes wrong: `@path` references don't work in Codex SKILL.md.
- Prevention: Transform to `See [file](references/file.md)` or explicit "Read the file: path" instructions.

**Merge Conflicts in Generated Files**
- What goes wrong: Two developers edit different source workflows, both regenerate, massive conflicts in `codex/`.
- Prevention: Deterministic generation. Document: "If conflict in codex/, rebuild from merged source."

### Minor

**Symlinked Skills Not Discovered** (GitHub #9365)
- Prevention: Build script copies files, never symlinks.

**Color/Metadata Frontmatter**
- Prevention: Strip Claude Code-specific fields during generation.

### Task-Specific Warnings

| When Implementing | Watch Out For | Prevention |
|-------------------|---------------|------------|
| Build script | Zero-dependency YAML parsing | Manual parser or accept js-yaml dependency |
| map-codebase skill | 4→1 agent conversion | Rewrite as sequential 4-step workflow |
| execute-plan skill | Edit tool → apply_patch | Different paradigm, test carefully |
| Feature templates | PLAN.md `@path` references | Transform to standard markdown links |
| Install script | `.codex/` vs `.claude/` paths | Path prefix replacement (existing pattern) |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codex SKILL.md format | HIGH | Official OpenAI documentation + GitHub examples |
| Tool reference translation | MEDIUM | Mapping is clear but behavioral differences untested |
| Build script architecture | HIGH | Follows existing `bin/install.js` patterns |
| Parallel agent handling | MEDIUM | Sequential fallback is straightforward but untested in Codex |
| Generated file maintenance | HIGH | Well-understood problem with known solutions (hooks, CI) |

---

## Open Questions

1. **Does Codex handle XML-style tags in skills?**
   - What we know: Codex accepts markdown. XML tags should pass through as text.
   - What's unclear: Whether GPT interprets `<step>`, `<process>` tags like Claude does.
   - Recommendation: Keep tags in generated skills, test with Codex, adjust if needed.

2. **How does `ask_user_question` actually work in Codex?**
   - What we know: Codex has this tool. UI has tabs for multiple questions.
   - What's unclear: Exact parameter format, whether it matches AskUserQuestion 1:1.
   - Recommendation: Test with simple example during planning phase.

3. **Token budget for sequential agent execution**
   - What we know: 4 agents in parallel = 4x200K fresh context. Sequential = shared context.
   - What's unclear: How much context each "agent step" actually consumes.
   - Recommendation: Add explicit context checkpoints in sequential versions.

---

## Sources

### Codebase (from Explore)
- All 20 workflow files analyzed for tool references
- All 6 command files analyzed for frontmatter structure
- `bin/install.js` analyzed for installation patterns
- Templates analyzed for tool-agnostic vs tool-specific content

### Verified External (HIGH confidence)
- [Agent Skills](https://developers.openai.com/codex/skills) — SKILL.md format
- [Config basics](https://developers.openai.com/codex/config-basic/) — TOML structure
- [AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md/) — Project instructions
- [Slash commands](https://developers.openai.com/codex/cli/slash-commands/) — Command format

### Community (MEDIUM confidence)
- GitHub issues #8609 (YAML frontmatter), #9365 (symlinks), #9226 (script discovery)
- Comparison articles: Claude Code vs Codex CLI

---

## Decisions Made

Decisions recorded in DECISIONS.md during this research:

| Decision | Rationale |
|----------|-----------|
| DEC-005: Start with easy workflows | Reduce risk, validate approach before complex conversions |
| DEC-006: Pre-commit hook for staleness | Critical prevention for the generated files maintenance pitfall |
