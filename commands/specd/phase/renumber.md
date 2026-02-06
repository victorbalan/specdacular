---
name: specd:phase:renumber
description: Renumber phases to clean integer sequence
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Renumber all phases to a clean integer sequence after decimal phases have been inserted.

**What it does:**
1. Validate — Feature exists with plans and ROADMAP.md
2. Collect phases — List all phase directories, build old->new mapping
3. Preview — Show renumbering plan, ask user to confirm
4. Rename directories — Process highest-to-lowest to avoid collisions
5. Update plan frontmatter — Fix phase references in plan files
6. Update ROADMAP.md — Rewrite phase headers, remove `(INSERTED)` markers
7. Update STATE.md — Rewrite phase references everywhere
8. Update config.json — Set `phases_count` to new total
9. Show summary
</objective>

<execution_context>
@~/.claude/specdacular/workflows/renumber-phases.md
</execution_context>

<context>
Arguments: $ARGUMENTS (expects: feature-name)

**Load feature context:**
@.specd/features/{name}/ROADMAP.md
@.specd/features/{name}/STATE.md
@.specd/features/{name}/config.json
@.specd/features/{name}/plans/ (all phase directories and plan files)
</context>

<process>
1. **Validate** — Feature exists with plans directory and ROADMAP.md
2. **Collect Phases** — Build sorted list and renumbering mapping
3. **Preview** — Show mapping, confirm with user
4. **Rename Directories** — Highest target number down to avoid collisions
5. **Update Plan Frontmatter** — Fix phase/depends_on in plan YAML
6. **Update ROADMAP.md** — Rewrite headers, remove `(INSERTED)` markers
7. **Update STATE.md** — Rewrite all phase references
8. **Update config.json** — Set `phases_count` to integer count
9. **Completion** — Show summary of changes
</process>

<success_criteria>
- [ ] Feature validated with plans and ROADMAP.md
- [ ] All phase directories collected and sorted correctly
- [ ] Renumbering mapping shown to user and confirmed
- [ ] Directories renamed without collisions (highest-to-lowest)
- [ ] Plan file frontmatter updated (phase, depends_on)
- [ ] ROADMAP.md headers and references updated, `(INSERTED)` markers removed
- [ ] STATE.md phase references updated everywhere
- [ ] config.json `phases_count` updated
- [ ] Summary shown to user
</success_criteria>
