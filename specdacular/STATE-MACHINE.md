# Specdacular State Machine Reference

How the brain orchestrates tasks, how state transitions work, and what custom workflows need to do.

---

## How the Brain Works

The brain is a loop: read state → route → dispatch → update state → repeat.

```
┌─────────────────────────────────────────────────┐
│                   BRAIN LOOP                    │
│                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │  Read     │───▶│  Route   │───▶│ Dispatch │ │
│   │  State    │    │  (pick   │    │  Step    │ │
│   │          │    │  next)   │    │          │ │
│   └──────────┘    └──────────┘    └────┬─────┘ │
│        ▲                               │       │
│        │          ┌──────────┐         │       │
│        └──────────│  Update  │◀────────┘       │
│                   │  State   │                 │
│                   └──────────┘                 │
└─────────────────────────────────────────────────┘
```

**Each iteration:**
1. Read `config.json`, `STATE.md`, `CONTEXT.md`
2. Use the routing table (below) to pick the next step
3. Run pre-hooks → step workflow → post-hooks
4. Update state based on what the step did
5. Loop back to step 1

---

## State: config.json

The brain reads two key fields from config.json to decide where you are:

```json
{
  "stage": "discussion | research | planning | execution | complete",
  "phases": {
    "current": 1,
    "current_status": "pending | executing | executed | completed",
    "total": 3,
    "completed": 0,
    "phase_start_commit": null
  }
}
```

| Field | What it means |
|-------|---------------|
| `stage` | Which part of the lifecycle you're in |
| `phases.current` | Which phase number is active (1-indexed) |
| `phases.current_status` | Where that phase is in its sub-lifecycle |
| `phases.total` | How many phases were planned |
| `phases.completed` | How many phases are fully done |

The brain also checks `CONTEXT.md` for gray area count (unchecked items in "Gray Areas Remaining").

---

## Routing Table

This is the complete decision table. The brain evaluates top-to-bottom and takes the first match:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTING TABLE                             │
├────────────────────────────┬──────────────┬────────────────────┤
│ State                      │ Next Step    │ Pipeline           │
├────────────────────────────┼──────────────┼────────────────────┤
│ stage=discussion           │              │                    │
│   gray areas > 0           │ discuss      │ main               │
│   gray areas = 0           │ research     │ main               │
├────────────────────────────┼──────────────┼────────────────────┤
│ stage=research             │              │                    │
│   no RESEARCH.md           │ research     │ main               │
│   RESEARCH.md exists       │ plan         │ main               │
├────────────────────────────┼──────────────┼────────────────────┤
│ stage=planning             │              │                    │
│   no ROADMAP.md            │ plan         │ main               │
│   ROADMAP.md exists        │ plan         │ phase-execution    │
├────────────────────────────┼──────────────┼────────────────────┤
│ stage=execution            │              │                    │
│   current_status=pending   │              │                    │
│     no PLAN.md             │ plan         │ phase-execution    │
│     PLAN.md exists         │ execute      │ phase-execution    │
│   current_status=executing │ execute      │ phase-execution    │
│   current_status=executed  │ review       │ phase-execution    │
│   current_status=completed │ next phase   │ phase-execution    │
│                            │ or COMPLETE  │                    │
└────────────────────────────┴──────────────┴────────────────────┘
```

---

## Full Lifecycle Diagram

```
                    ┌─────────┐
                    │  START  │
                    └────┬────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     DISCUSSION      │
              │                     │  gray areas > 0
              │  ┌───────────────┐  │◀─────────────────┐
              │  │   discuss     │──┼──────────────────┘
              │  └───────────────┘  │
              │                     │  gray areas = 0
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     RESEARCH        │
              │                     │
              │  ┌───────────────┐  │
              │  │   research    │  │
              │  └───────────────┘  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     PLANNING        │
              │                     │
              │  ┌───────────────┐  │
              │  │     plan      │  │
              │  └───────────────┘  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌──────────────────────────────────────────┐
              │          EXECUTION (per phase)             │
              │                                            │
              │  ┌──────┐  ┌─────────┐  ┌────────┐  ┌───────┐│
              │  │ plan │─▶│ execute │─▶│ review │─▶│revise ││
              │  └──────┘  └─────────┘  └────────┘  └───┬───┘│
              │                  ▲                       │    │
              │                  └───────────────────────┘    │
              │                         (fix loop)            │
              │                                               │
              │  Phase done? ──▶ Next phase ─┐                │
              │       ▲                      │                │
              │       └──────────────────────┘                │
              └──────────────────┬─────────────────────────────┘
                                 │ all phases done
                                 ▼
                          ┌────────────┐
                          │  COMPLETE  │
                          └────────────┘
```

---

## Hook Execution Order

Around every step, hooks execute in this order:

```
  ┌─────────────────────────────────┐
  │ 1. Global pre-step hook         │  pipeline.json → hooks.pre-step
  ├─────────────────────────────────┤
  │ 2. Step pre-hook                │  step config or .specd/hooks/pre-{step}.md
  ├─────────────────────────────────┤
  │ 3. ▶▶▶ STEP WORKFLOW ◀◀◀       │  the actual step (discuss, execute, etc.)
  ├─────────────────────────────────┤
  │ 4. Step post-hook               │  step config or .specd/hooks/post-{step}.md
  ├─────────────────────────────────┤
  │ 5. Global post-step hook        │  pipeline.json → hooks.post-step
  └─────────────────────────────────┘
```

---

## Writing Custom Step Workflows

If you replace a step's workflow (e.g., `"workflow": ".specd/my-execute.md"`), your workflow **must update state** so the brain knows what happened. The brain reads config.json after your step returns.

### What Each Step Must Do

**Custom `discuss` replacement:**
- Update `CONTEXT.md` — check off resolved gray areas
- The brain re-reads gray area count to decide whether to stay in discussion or advance

**Custom `research` replacement:**
- Create `RESEARCH.md` in the task directory
- The brain checks for this file to know research is done

**Custom `plan` replacement (task-level, main pipeline):**
- Create `ROADMAP.md` with phase goals (no PLAN.md files, no phase directories)
- Set in config.json:
  ```json
  {
    "stage": "execution",
    "phases": {
      "current": 1,
      "current_status": "pending",
      "total": <number of phases>
    }
  }
  ```

**Custom `plan` replacement (phase-level, phase-execution pipeline — `phase-plan.md`):**
- Create `phases/phase-NN/` directory and `PLAN.md` for the current phase
- Read phase goal from ROADMAP.md
- Do NOT change config.json (brain checks PLAN.md existence to route)

**Custom `execute` replacement:**
- Do whatever execution work is needed for the current phase
- Set in config.json:
  ```json
  { "phases": { "current_status": "executed" } }
  ```
- The brain will then route to `review`

**Custom `review` replacement:**
- Review the executed phase
- Set in config.json based on outcome:
  - **Approved:** `{ "phases": { "current_status": "completed" } }` — brain advances to next phase
  - **Needs revision:** set up for revise step (keep `current_status` as `"executed"`)

**Custom `revise` replacement:**
- Create fix plan in a decimal phase directory (e.g., `phase-01.1/`)
- Set in config.json:
  ```json
  { "phases": { "current_status": "pending" } }
  ```
- The brain loops back to execute for the fix phase

### State Update Summary

| Your step | Must set | Brain then routes to |
|-----------|----------|---------------------|
| discuss | Update gray areas in CONTEXT.md | discuss (if gray areas remain) or research |
| research | Create RESEARCH.md | plan |
| plan (task-level) | Create ROADMAP.md, set stage=execution | plan (phase-level) |
| plan (phase-level) | Create phases/phase-NN/PLAN.md | execute |
| execute | Set current_status=executed | review |
| review (approved) | Set current_status=completed | next phase or complete |
| review (revisions) | Keep current_status=executed | revise |
| revise | Set current_status=pending | execute (fix phase) |

---

## Phase Sub-Lifecycle

Each phase goes through its own mini-lifecycle within execution:

```
         pending
            │
       ┌────┴─────┐
       │ PLAN.md? │
       └────┬─────┘
            │
     No ────┤──── Yes
     │            │
     ▼            │
  ┌──────┐        │
  │ plan │        │
  └──┬───┘        │
     │            │
     └────┬───────┘
          │
          ▼
      executing ◀──────┐
          │             │
          ▼             │
       executed         │
          │             │
          ▼             │
      ┌────────┐        │
      │ review │        │
      └───┬────┘        │
          │             │
     ┌────┴─────┐       │
     ▼          ▼       │
 completed   revise ────┘
     │       (creates
     │        fix phase,
     ▼        resets to
 next phase   pending)
 or DONE
```

The plan step uses `phase-plan.md` — a dedicated workflow that reads the phase goal from ROADMAP.md and creates a detailed PLAN.md for that phase only. This allows later phases to adapt based on earlier phase outcomes.

**Decimal fix phases:** When revise creates `phase-01.1/`, the brain executes it before advancing to `phase-02/`. Multiple revisions create `phase-01.1`, `phase-01.2`, etc.

---

## Pipeline Configuration Reference

Full `pipeline.json` with all options:

```json
{
  "schema_version": "1.0",
  "pipelines": {
    "main": [
      {
        "name": "discuss",
        "workflow": "discuss.md",
        "hooks": { "pre": null, "post": null }
      },
      {
        "name": "research",
        "workflow": "research.md",
        "hooks": { "pre": null, "post": null }
      },
      {
        "name": "plan",
        "workflow": "plan.md",
        "hooks": { "pre": null, "post": null }
      },
      {
        "name": "phase-execution",
        "pipeline": "phase-execution"
      }
    ],
    "phase-execution": [
      {
        "name": "plan",
        "workflow": "phase-plan.md",
        "hooks": { "pre": null, "post": null }
      },
      {
        "name": "execute",
        "workflow": "execute.md",
        "pause": true,
        "hooks": { "pre": null, "post": null }
      },
      {
        "name": "review",
        "workflow": "review.md",
        "pause": true,
        "hooks": { "pre": null, "post": null }
      },
      {
        "name": "revise",
        "workflow": "revise.md",
        "pause": true,
        "hooks": { "pre": null, "post": null }
      }
    ]
  },
  "hooks": {
    "pre-step": null,
    "post-step": null
  }
}
```

**Step fields:**

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `name` | yes | — | Step identifier, used for routing and hook discovery |
| `workflow` | yes* | — | Markdown file to execute (* not needed if `pipeline` is set) |
| `pipeline` | — | — | Reference a sub-pipeline instead of a workflow |
| `pause` | no | `false` | Whether default mode pauses here (ignored in `--auto`, always prompts in `--interactive`) |
| `hooks.pre` | no | `null` | Pre-hook config or `null` for convention fallback |
| `hooks.post` | no | `null` | Post-hook config or `null` for convention fallback |

**Hook config fields:**

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `workflow` | yes | — | Path to hook markdown file |
| `mode` | no | `"inline"` | `"inline"` (runs in brain context) or `"subagent"` (isolated) |
| `optional` | no | `false` | If `true`, failures are logged but don't stop the pipeline |
