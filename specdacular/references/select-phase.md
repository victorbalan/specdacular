<shared name="select_phase">

## Phase Selection

Determine which phase to work on. Requires a task name to be already selected.

**Read available phases:**
Read `.specd/tasks/{task-name}/ROADMAP.md` and extract the phase list with status.

```bash
[ -f ".specd/tasks/{task-name}/ROADMAP.md" ] || { echo "No roadmap found. Run /specd:continue to create one."; exit 1; }
```

Parse the ROADMAP.md "Phases" section to get:
- Phase number
- Phase name
- Phase status (from STATE.md execution progress: not started, executing, executed, completed)

**If only one phase available (not completed):**
Auto-select it and confirm: "Working on Phase {N}: {name}."

**If multiple phases available:**
Use AskUserQuestion:
- header: "Phase"
- question: "Which phase would you like to work on?"
- options: List each phase with status (e.g., "Phase 1: Foundation — completed", "Phase 2: API — executing", "Phase 3: UI — not started")

Use the selected phase number.

</shared>
