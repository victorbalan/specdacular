---
task: new-project-flow
phase: 4
depends_on: [3]
creates: []
modifies:
  - specdacular/workflows/new-project.md
---

# Phase 4: Scaffolding

## Objective

Replace the scaffold stub in the workflow. Create orchestrator config at root, sub-project directories with `.specd/config.json`, and seed each with a setup task (`FEATURE.md`) derived from system-level research/requirements. Show completion banner with all artifacts and next steps.

## Context

**Reference these files:**
- `specdacular/workflows/new-project.md` — Current workflow with scaffold stub
- `.specd/config.json` — Orchestrator config pattern: `"type": "orchestrator"` with `projects` array

**Relevant Decisions:**
- DEC-001: System-level docs at `.specd/tasks/project/`
- DEC-002: Always orchestrator mode, even single-project
- DEC-005: Sub-projects get `.specd/config.json` + `.specd/tasks/setup/FEATURE.md` seeded from research/requirements
- DEC-006: Standalone command — after scaffolding, users use `/specd.new` and `/specd.continue` on sub-projects

---

## Tasks

### Task 1: Implement scaffolding stage in workflow

**Files:** `specdacular/workflows/new-project.md`

**Action:**
Replace the `scaffold` stub step with a functional scaffolding stage.

**The scaffolding stage should:**

1. **Show banner:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    SCAFFOLDING: {project-name}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

2. **Read context:**
   - `.specd/tasks/project/ROADMAP.md` — sub-projects list, phases
   - `.specd/tasks/project/REQUIREMENTS.md` — v1 requirements
   - `.specd/tasks/project/research/STACK.md` — technology per sub-project
   - `.specd/tasks/project/research/ARCHITECTURE.md` — service responsibilities

3. **Create orchestrator config at root:**
   Write `.specd/config.json`:
   ```json
   {
     "type": "orchestrator",
     "project_name": "{project-name}",
     "created": "{date}",
     "projects": [
       {
         "name": "{sub-project-name}",
         "path": "{sub-project-name}/",
         "type": "{frontend|backend|worker|etc.}"
       }
     ]
   }
   ```

4. **For each sub-project from ROADMAP.md:**

   a. Create directory:
   ```bash
   mkdir -p {sub-project-name}/.specd/tasks/setup
   ```

   b. Write sub-project `.specd/config.json`:
   ```json
   {
     "type": "project",
     "project_name": "{sub-project-name}",
     "orchestrator": "../",
     "created": "{date}"
   }
   ```

   c. Write `.specd/tasks/setup/FEATURE.md` seeded from research:
   Use the FEATURE.md template but fill in from system-level context:
   - **What This Is:** Setup task for {sub-project-name} — {description from ROADMAP.md}
   - **Must Create:** Initial project structure, dependencies, config based on STACK.md recommendations
   - **Must Integrate With:** Other sub-projects per ARCHITECTURE.md service boundaries
   - **Constraints:** Technology choices from STACK.md, architecture patterns from ARCHITECTURE.md
   - **Success Criteria:** Project runs locally, dependencies installed, basic structure in place

5. **Show scaffolding results per sub-project:**
   ```
   Created: {sub-project-name}/
   ├── .specd/config.json
   └── .specd/tasks/setup/FEATURE.md
   ```

6. **Commit all scaffolding:**
   @~/.claude/specdacular/references/commit-docs.md

   - **$FILES:** `.specd/config.json` + all sub-project `.specd/` directories
   - **$MESSAGE:** `docs(project): scaffold {N} sub-projects`
   - **$LABEL:** `scaffolding complete`

Continue to completion.

**Also update `roadmap_complete` step:** Change it from ending the workflow to continuing to scaffold.

**Replace the completion step** with a final banner that shows everything:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PROJECT COMPLETE: {project-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Artifacts

- `.specd/tasks/project/PROJECT.md` — Project vision
- `.specd/tasks/project/research/` — Stack, features, architecture, pitfalls
- `.specd/tasks/project/REQUIREMENTS.md` — {count} v1 requirements
- `.specd/tasks/project/ROADMAP.md` — {count} phases
- `.specd/config.json` — Orchestrator config

## Sub-Projects

{For each sub-project:}
**{name}/** — {description}
└── Ready: `/specd.new setup` to begin

## Next Steps

For each sub-project, run the setup task:

cd {sub-project-name}
/specd.continue setup

This will walk through setting up the project using the
research findings and requirements from this session.
```

End workflow.

**Verify:**
```bash
grep -q "orchestrator" specdacular/workflows/new-project.md && \
grep -q "setup/FEATURE" specdacular/workflows/new-project.md && \
grep -q "PROJECT COMPLETE" specdacular/workflows/new-project.md && \
echo "OK"
```

**Done when:**
- [ ] Scaffold stage creates orchestrator config at root
- [ ] Each sub-project gets directory + `.specd/config.json` + setup FEATURE.md
- [ ] Setup FEATURE.md seeded from system-level research/requirements
- [ ] Final completion banner shows all artifacts and next steps
- [ ] Workflow flows: questioning → research → requirements → roadmap → scaffold → complete

---

## Verification

After all tasks complete:

```bash
grep -q "orchestrator" specdacular/workflows/new-project.md && \
grep -q "setup/FEATURE" specdacular/workflows/new-project.md && \
grep -q "PROJECT COMPLETE" specdacular/workflows/new-project.md && \
echo "Phase 4 complete"
```

**Phase is complete when:**
- [ ] Scaffold stage fully implemented
- [ ] Complete flow from questioning through scaffolding works
- [ ] All stubs replaced with functional stages

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/new-project-flow/CHANGELOG.md`.
