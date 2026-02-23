---
task: new-project-flow
phase: 2
depends_on: [1]
creates:
  - specdacular/agents/project-researcher.md
modifies:
  - specdacular/workflows/new-project.md
---

# Phase 2: Research Agent & Stage

## Objective

After questioning produces PROJECT.md, spawn 4 parallel research agents to investigate stack, features, architecture, and pitfalls. Write findings to `.specd/tasks/project/research/`. Replace the research stub in the workflow.

## Context

**Reference these files:**
- `specdacular/agents/feature-researcher.md` — Pattern for agent definition (role, philosophy, tool_strategy, confidence_levels, output_formats, execution_flow, success_criteria)
- `specdacular/workflows/new-project.md` — Current workflow with research stub to replace
- `~/.claude/specdacular/references/spawn-research-agents.md` — Pattern for spawning parallel agents (3 agents with run_in_background)

**Relevant Decisions:**
- DEC-003: Single research agent covering all 4 domains, adapted from GSD's project-researcher. Opinionated output with confidence levels. Writes SUMMARY.md, STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md.
- DEC-006: Standalone command — research runs within the workflow, not through the brain/pipeline.

**Key difference from feature-researcher:**
- feature-researcher investigates how to implement a feature in an existing codebase
- project-researcher investigates how to BUILD a project from scratch — stack choices, feature scope, architecture patterns, and pitfalls for the chosen domain
- No codebase to analyze — all context comes from PROJECT.md

---

## Tasks

### Task 1: Create project-researcher agent definition

**Files:** `specdacular/agents/project-researcher.md`

**Action:**
Create the agent definition following the `feature-researcher.md` pattern but adapted for greenfield project research.

**Structure (matching feature-researcher.md):**
- **Frontmatter:** name `project-researcher`, description, tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch
- **role:** Investigate how to build a project from scratch. Spawned 4 times with different focus areas. Returns structured findings.
- **philosophy:** Same as feature-researcher (Claude's training as hypothesis, specificity over generality, investigation not confirmation)
- **tool_strategy:** Same as feature-researcher (Context7 first, WebFetch for official docs, WebSearch for ecosystem)
- **confidence_levels:** Same table (HIGH/MEDIUM/LOW)

**Output formats — 4 focus areas:**

1. **Stack** — Technology recommendations:
   ```markdown
   ## Stack Findings
   ### Recommended Stack
   | Layer | Technology | Version | Rationale | Confidence |
   ### Why This Stack
   ### Alternatives Considered
   ```

2. **Features** — Feature categorization:
   ```markdown
   ## Features Findings
   ### Table Stakes (must have for v1)
   - Feature: description, complexity estimate, dependencies
   ### Differentiators (competitive advantage)
   - Feature: description, complexity, dependencies
   ### Nice-to-Have (v2+)
   - Feature: description
   ### Anti-Features (explicitly avoid)
   - Feature: why to avoid
   ```

3. **Architecture** — System design:
   ```markdown
   ## Architecture Findings
   ### Recommended Architecture
   - Pattern, rationale, diagram
   ### Service Boundaries
   - Service: responsibility, tech, communication
   ### Data Model
   - Key entities and relationships
   ### Key Patterns
   - Pattern: where to apply, example
   ```

4. **Pitfalls** — Same format as feature-researcher pitfalls (critical/moderate/minor)

**Execution flow:**
1. Parse focus area and project context from prompt
2. Execute tool strategy based on focus area
3. Structure findings in the appropriate format
4. Return findings (do NOT write files — the workflow synthesizes)

**Verify:**
```bash
[ -f specdacular/agents/project-researcher.md ] && grep -q "project-researcher" specdacular/agents/project-researcher.md && echo "OK"
```

**Done when:**
- [ ] Agent file exists with all sections matching feature-researcher pattern
- [ ] Four focus area output formats defined
- [ ] Tool strategy section references Context7, WebFetch, WebSearch

---

### Task 2: Implement research stage in workflow

**Files:** `specdacular/workflows/new-project.md`

**Action:**
Replace the `research_stub` step and the `research` step stub with a functional research stage that spawns 4 parallel agents.

**The research stage should:**

1. **Show research banner:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    RESEARCHING: {project-name}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Spawning 4 research agents...
   ```

2. **Spawn 4 agents using Task tool with `run_in_background: true`:**
   Each agent reads `~/.claude/specdacular/agents/project-researcher.md` for its role.
   Each gets the PROJECT.md content as context plus a specific focus area.

   - Agent 1: Stack (languages, frameworks, libraries, infrastructure)
   - Agent 2: Features (categorize capabilities from domain knowledge)
   - Agent 3: Architecture (system design, service boundaries, data model)
   - Agent 4: Pitfalls (common mistakes, performance issues, security)

   Use `subagent_type: "general-purpose"` and `model: "sonnet"` for all agents (matching spawn-research-agents.md pattern).

3. **Wait for all agents to complete.** Report status:
   ```
   Research agents complete:
   - Stack: {✓ | ✗}
   - Features: {✓ | ✗}
   - Architecture: {✓ | ✗}
   - Pitfalls: {✓ | ✗}
   ```

4. **Write research files** to `.specd/tasks/project/research/`:
   - `STACK.md` — from stack agent
   - `FEATURES.md` — from features agent
   - `ARCHITECTURE.md` — from architecture agent
   - `PITFALLS.md` — from pitfalls agent
   - `SUMMARY.md` — synthesized from all 4 (key recommendations, roadmap implications, confidence overview)

5. **Commit research files:**
   Using commit-docs.md reference:
   - $FILES: `.specd/tasks/project/research/`
   - $MESSAGE: `docs(project): research complete — {project-name}`
   - $LABEL: `research findings`

6. **Show research summary and continue to requirements stub.**

**Also update the flow:**
- The `research_stub` step becomes the real research step
- After research, continue to `requirements` (still stubbed for Phase 3)
- Move the completion banner to after the last functional stage

**Verify:**
```bash
grep -q "project-researcher" specdacular/workflows/new-project.md && \
grep -q "STACK.md" specdacular/workflows/new-project.md && \
grep -q "run_in_background" specdacular/workflows/new-project.md && \
echo "OK"
```

**Done when:**
- [ ] Research stage spawns 4 parallel agents
- [ ] Each agent gets project context + specific focus area
- [ ] Agents use project-researcher.md role
- [ ] Results written to `.specd/tasks/project/research/`
- [ ] SUMMARY.md synthesized from all 4 outputs
- [ ] Research files committed
- [ ] Completion banner shows after research (since requirements is still stubbed)

---

## Verification

After all tasks complete:

```bash
# Agent file exists with correct content
[ -f specdacular/agents/project-researcher.md ] && \
grep -q "project-researcher" specdacular/agents/project-researcher.md && \
# Workflow has research implementation
grep -q "project-researcher" specdacular/workflows/new-project.md && \
grep -q "STACK.md" specdacular/workflows/new-project.md && \
echo "Phase 2 complete"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] project-researcher agent follows feature-researcher patterns
- [ ] Workflow research stage spawns 4 parallel agents correctly

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/new-project-flow/CHANGELOG.md`.
