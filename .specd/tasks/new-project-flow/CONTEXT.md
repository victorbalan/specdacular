# Context: new-project-flow

**Last Updated:** 2026-02-23
**Sessions:** 2

## Discussion Summary

Discussed creating a `/specd.new-project` command for greenfield projects. The existing `/specd.new` assumes a codebase exists — this new command helps users go from idea to structured plan before any code exists. Reviewed GSD's `new-project` flow as reference for the questioning, research, requirements, and roadmap stages. Key insight: this must support multi-project systems (ui, api, worker) through orchestrator mode, not just single projects.

---

## Resolved Questions

### Where do system-level docs live?

**Question:** Where should PROJECT.md, REQUIREMENTS.md, and other system-level artifacts live?

**Resolution:** At `.specd/tasks/project/` — treated as a special task within the orchestrator setup. The orchestrator's `.specd/config.json` at root coordinates sub-projects.

**Related Decisions:** DEC-001

### How does multi-project work?

**Question:** How does a single new-project run handle multiple services (ui, api, worker)?

**Resolution:** The orchestrator pattern. System-level docs at root, each sub-project gets its own directory with its own `.specd/`. The roadmap phase identifies sub-projects, and scaffolding creates them.

**Related Decisions:** DEC-002

### Should there be domain research?

**Question:** Should we include parallel research agents like GSD does?

**Resolution:** Yes. Spawn parallel agents for stack, features, architecture, and pitfalls research. Essential for greenfield where there's no existing codebase to learn from.

**Related Decisions:** DEC-003

### How do sub-projects get identified?

**Question:** Does the user specify sub-projects upfront or do they emerge from discussion?

**Resolution:** Both. User can state them upfront ("I need a React frontend and a Node API") or they can emerge from research/discussion ("architecture research suggests a separate worker service").

### Research agent design?

**Question:** Reuse existing feature-researcher pattern or create dedicated project-researcher agents?

**Resolution:** Single research agent covering all 4 domains (stack, features, architecture, pitfalls), adapted from GSD's `gsd-project-researcher`. One agent writes 5 files to `.specd/tasks/project/research/`. Opinionated output with confidence levels.

**Related Decisions:** DEC-003 (updated)

### How does continue route project tasks?

**Question:** How does `/specd.continue` route project-type tasks through different stages?

**Resolution:** It doesn't. `/specd.new-project` is a standalone command with its own sequential flow. No pipeline integration, no brain routing. After scaffolding, sub-projects use normal `/specd.continue`.

**Related Decisions:** DEC-006

### What gets scaffolded per sub-project?

**Question:** What exactly gets created per sub-project directory?

**Resolution:** `.specd/config.json` + `.specd/tasks/setup/FEATURE.md` seeded from system-level research/requirements. The setup task runs through normal task lifecycle to actually create boilerplate/code.

**Related Decisions:** DEC-005

### Requirements scoping UX?

**Question:** How does the user scope v1 features?

**Resolution:** Multi-select from research findings. Show features by category (table stakes, differentiators), user picks v1/later/out-of-scope. Write REQUIREMENTS.md from choices.

**Related Decisions:** DEC-007

---

## Deferred Questions

### Config preferences (depth, models, agents)

**Reason:** GSD asks upfront about workflow depth, model profiles, and which agents to enable. Need to decide if specd does the same or keeps it simpler.
**Default for now:** Extend existing `.specd/config.json` with project-level settings
**Revisit when:** During detailed workflow design in planning phase

### Auto mode support

**Reason:** GSD has `--auto` flag for unattended project initialization from a provided document. Not clear if specd needs this.
**Default for now:** Interactive only
**Revisit when:** After v1 of new-project is working

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-23 | Project vision, multi-project support, GSD reference, artifact structure | FEATURE.md created, core decisions made |
| 2026-02-23 | Research agent design, continue routing, scaffolding, requirements UX | All 4 gray areas resolved, 3 new decisions |

---

## Gray Areas Remaining

None — all resolved in session 2.

---

## Quick Reference

- **Task:** `.specd/tasks/new-project-flow/FEATURE.md`
- **Decisions:** `.specd/tasks/new-project-flow/DECISIONS.md`
- **Research:** `.specd/tasks/new-project-flow/RESEARCH.md` (if exists)
