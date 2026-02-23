---
task: new-project-flow
phase: 1
depends_on: []
creates:
  - commands/specd.new-project.md
  - specdacular/workflows/new-project.md
  - specdacular/templates/tasks/PROJECT.md
modifies:
  - specdacular/HELP.md
---

# Phase 1: Command & Workflow Shell

## Objective

Create the `/specd.new-project` slash command, the main workflow with a functional questioning stage (later stages stubbed), and the PROJECT.md template. User can run the command, answer questions, and get a PROJECT.md written.

## Context

**Reference these files:**
- `commands/specd.new.md` — Pattern for slash command definition (frontmatter, objective, execution_context, context, process, success_criteria)
- `specdacular/workflows/new.md` — Pattern for initialization workflow (validate → codebase_context → discussion → write → commit → completion)
- `specdacular/templates/tasks/FEATURE.md` — Pattern for task template files

**Relevant Decisions:**
- DEC-004: Separate command, not a mode of `/specd.new`
- DEC-006: Standalone command, no pipeline/brain integration — workflow runs its own sequential flow
- DEC-001: System-level docs live at `.specd/tasks/project/`
- DEC-002: Always orchestrator mode, even single-project
- DEC-003: Single research agent, 4 spawns with different focus areas
- DEC-005: Sub-projects get `.specd/config.json` + `.specd/tasks/setup/FEATURE.md`

---

## Tasks

### Task 1: Create slash command definition

**Files:** `commands/specd.new-project.md`

**Action:**
Create the slash command file following the exact pattern from `commands/specd.new.md`:

- **Frontmatter:** name `specd.new-project`, description "Bootstrap a new project from idea to structured plan", argument-hint `"[project-name]"`, allowed-tools: Read, Bash, Glob, Grep, Write, AskUserQuestion, Task (needed for research agents later)
- **Objective:** Guides users from "I have an idea" to a structured project plan. Creates PROJECT.md through collaborative questioning. Later stages (research, requirements, roadmap, scaffolding) are stubbed for Phase 2-4.
- **execution_context:** Points to `@~/.claude/specdacular/workflows/new-project.md`
- **context:** Project name from $ARGUMENTS. No codebase context needed (greenfield).
- **success_criteria:** Command recognized, questioning produces PROJECT.md, committed to git

**Verify:**
```bash
[ -f commands/specd.new-project.md ] && grep -q "specd.new-project" commands/specd.new-project.md && echo "OK"
```

**Done when:**
- [ ] Command file exists with correct frontmatter and structure
- [ ] Follows same pattern as specd.new.md

---

### Task 2: Create PROJECT.md template

**Files:** `specdacular/templates/tasks/PROJECT.md`

**Action:**
Create a template for the project vision document. This is the greenfield equivalent of FEATURE.md — captures the high-level vision before any code exists.

Template sections:
- **Project Name** — `{project-name}`
- **Vision** — One-paragraph description of what this project is and why it exists
- **Problem Statement** — What problem does this solve? For whom?
- **Target Users** — Who uses this and how?
- **Key Goals** — 3-5 measurable goals for v1
- **Technical Constraints** — Known constraints (platform, language preferences, integrations, timeline)
- **Sub-Projects** — Known or suspected sub-projects (e.g., ui, api, worker). Can be empty if not yet identified.
- **Key Decisions** — Any decisions made during questioning (links to DEC-IDs if recorded)
- **Open Questions** — Things to resolve during research

Use `{placeholder}` syntax consistent with other templates (FEATURE.md pattern).

**Verify:**
```bash
[ -f specdacular/templates/tasks/PROJECT.md ] && grep -q "Vision" specdacular/templates/tasks/PROJECT.md && echo "OK"
```

**Done when:**
- [ ] Template exists with all sections
- [ ] Uses same placeholder style as other templates

---

### Task 3: Create new-project workflow

**Files:** `specdacular/workflows/new-project.md`

**Action:**
Create the main workflow following the pattern from `specdacular/workflows/new.md` but adapted for greenfield projects. This is a standalone workflow (DEC-006) — no brain/pipeline integration.

**Stages (questioning functional, rest stubbed):**

1. **validate** — Get project name from $ARGUMENTS or ask. Normalize to kebab-case. Check if `.specd/tasks/project/` already exists (the fixed task name for system-level docs per DEC-001).

2. **questioning** — The core of Phase 1. Open-ended conversation to understand:
   - What is this project? (vision, problem, users)
   - What sub-projects/services might be needed? (ui, api, worker, etc.)
   - Technical preferences (language, framework, deployment)
   - Key constraints (timeline, team size, compliance)
   - Out-of-scope items

   Follow the thread — collaborative, not interrogative (same philosophy as new.md). After 4-6 exchanges, summarize understanding. When clear enough, write PROJECT.md.

3. **write_project** — Create `.specd/tasks/project/` directory. Write PROJECT.md using the template. Also create CONTEXT.md, DECISIONS.md (record any decisions from questioning), and a minimal config.json.

4. **commit** — Commit all created files with message `docs(project): initialize project — {project-name}`.

5. **research** (STUB) — Print: `Research stage coming in Phase 2. Will spawn agents for stack, features, architecture, pitfalls.` End workflow.

6. **requirements** (STUB) — Not reached yet.

7. **roadmap** (STUB) — Not reached yet.

8. **scaffold** (STUB) — Not reached yet.

**completion** — After commit, show banner with created files and next steps. Since research is stubbed, end with message about future stages.

**Important implementation notes:**
- Use `<purpose>`, `<philosophy>`, `<process>`, `<step>`, `<success_criteria>` tags matching existing workflow patterns
- Reference commit-docs.md for commit step
- The questioning stage should be thorough — this is the only functional stage in Phase 1

**Verify:**
```bash
[ -f specdacular/workflows/new-project.md ] && grep -q "questioning" specdacular/workflows/new-project.md && echo "OK"
```

**Done when:**
- [ ] Workflow exists with all stages (questioning functional, rest stubbed)
- [ ] Follows same structural patterns as new.md
- [ ] Questioning stage has clear instructions for the conversational flow
- [ ] Commit step references commit-docs.md

---

### Task 4: Update HELP.md

**Files:** `specdacular/HELP.md`

**Action:**
Add `/specd.new-project` to the help file. Add it to the "Core Flow" table between `/specd.new` and `/specd.continue`:

```
| `/specd.new-project [name]` | Bootstrap a new project from idea to structured plan |
```

Also update the "Task Flow" section to mention the new-project flow:

```
**For new projects:**
/specd.new-project → (creates structured plan + scaffolding)
```

**Verify:**
```bash
grep -q "new-project" specdacular/HELP.md && echo "OK"
```

**Done when:**
- [ ] `/specd.new-project` appears in help command listing
- [ ] Brief description of what it does

---

## Verification

After all tasks complete:

```bash
# All files exist
[ -f commands/specd.new-project.md ] && \
[ -f specdacular/workflows/new-project.md ] && \
[ -f specdacular/templates/tasks/PROJECT.md ] && \
grep -q "new-project" specdacular/HELP.md && \
echo "Phase 1 complete"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] `/specd.new-project` command file is properly structured
- [ ] Workflow questioning stage has clear conversational flow instructions
- [ ] PROJECT.md template has all required sections

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/new-project-flow/CHANGELOG.md`.

**When to log:**
- Choosing a different approach than specified
- Adding functionality not in the plan
- Skipping or modifying a task
- Discovering issues that change the approach
