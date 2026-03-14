---
name: specd.generate-skills.learn
description: Generate a /learn skill that captures lessons into project docs
argument-hint: "[namespace]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - AskUserQuestion
---

<objective>
Generate a project-specific `/{namespace}:learn` skill that captures coding lessons, mistakes, and patterns from conversations into the project's `docs/` files.

The skill is customized to the project's actual documentation structure — it knows which doc files exist, what sections they have, and what format they use.

Output: `.claude/commands/{namespace}/learn.md`
</objective>

<execution_context>
@~/.claude/specdacular/workflows/generate-learn-skill.md
</execution_context>

<context>
**What the learn skill does:**

When a user runs `/{ns}:learn` during a conversation, it:
1. Extracts lessons from the conversation (or from an explicit argument)
2. Classifies each as a Rule (hard constraint) or Pattern (technique)
3. Maps it to the right doc file and section
4. Checks for duplicates
5. Writes it in the existing format

**Prerequisites:**
- `docs/` folder with topic docs (run `/specd.docs` first if missing)
- `CLAUDE.md` routing table

**After generation**, users can refine the skill with the `/skill-creator` plugin (Anthropic-verified) which provides eval, improve, and benchmark modes.
</context>

<when_to_use>
**Use after:**
- Running `/specd.docs` to generate project documentation
- When you want conversations to feed back into project docs

**Prerequisites:**
- `docs/` folder exists with topic docs
</when_to_use>

<process>
1. Check docs/ exists, read all doc files
2. Derive namespace from project name or user argument
3. Build doc target table from actual doc files
4. Generate the learn skill file
5. Suggest /skill-creator for refinement
</process>

<success_criteria>
- [ ] Namespace derived from project or user input
- [ ] `.claude/commands/{namespace}/learn.md` generated
- [ ] Skill references actual doc files that exist in the project
- [ ] Doc target table matches real docs with accurate descriptions
</success_criteria>
