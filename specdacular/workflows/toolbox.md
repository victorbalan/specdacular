<purpose>
Menu of advanced feature operations. Presents a picker and dispatches to the appropriate workflow.

**Operations:**
- Discuss — Explore open questions (feature or phase level)
- Research — Spawn parallel research agents (feature or phase level)
- Plan — Create implementation plans (feature or phase level)
- Review — Review executed work, report issues, generate fix plans
- Insert phase — Add a new phase with decimal numbering

For discuss, research, and plan: asks scope (whole feature or specific phase) before dispatching.
</purpose>

<philosophy>

## Thin Dispatcher

This workflow is a menu + dispatcher. It selects a feature, presents operations, asks scope when needed, then hands off to the real workflow. No logic duplication.

## Scope Selection (DEC-007)

Discuss, research, and plan can operate at feature level OR phase level. The toolbox asks which, then routes accordingly.

</philosophy>

<process>

<step name="select_feature">
@~/.claude/specdacular/references/select-feature.md

Continue to show_menu.
</step>

<step name="show_menu">
Present the 5 operations.

Use AskUserQuestion:
- header: "Toolbox"
- question: "What would you like to do with {feature-name}?"
- options:
  - label: "Discuss"
    description: "Explore open questions and gray areas about the feature"
  - label: "Research"
    description: "Spawn agents to research implementation patterns, libraries, and pitfalls"
  - label: "Plan"
    description: "Create phased implementation plans from feature context"
  - label: "Review"
    description: "Review executed work — report issues, generate fix plans"
  - label: "Insert phase"
    description: "Add a new phase to the roadmap (decimal numbering)"

Route based on selection:
- Discuss → select_scope (with operation=discuss)
- Research → select_scope (with operation=research)
- Plan → select_scope (with operation=plan)
- Review → dispatch_review
- Insert phase → dispatch_insert
</step>

<step name="select_scope">
Ask scope for discuss/research/plan operations (DEC-007).

Use AskUserQuestion:
- header: "Scope"
- question: "Work on the whole feature or a specific phase?"
- options:
  - label: "Whole feature"
    description: "Feature-level {operation}"
  - label: "Specific phase"
    description: "Focus on one phase"

**If Whole feature:**
Route to feature-level workflow:
- discuss → @~/.claude/specdacular/workflows/discuss-feature.md
- research → @~/.claude/specdacular/workflows/research-feature.md
- plan → @~/.claude/specdacular/workflows/plan-feature.md

Pass feature name as argument.

**If Specific phase:**
@~/.claude/specdacular/references/select-phase.md

Then route to phase-level workflow:
- discuss → @~/.claude/specdacular/workflows/prepare-phase.md (discussion part)
- research → @~/.claude/specdacular/workflows/prepare-phase.md (research part)
- plan → @~/.claude/specdacular/workflows/plan-phase.md

Pass feature name and phase number as arguments.
</step>

<step name="dispatch_review">
Execute the review workflow.

@~/.claude/specdacular/workflows/review-feature.md

Pass feature name as argument.
</step>

<step name="dispatch_insert">
Execute the insert-phase workflow.

@~/.claude/specdacular/workflows/insert-phase.md

Pass feature name as argument.
</step>

</process>

<success_criteria>
- [ ] Feature selected (from argument or picker)
- [ ] Menu presented with all 5 operations
- [ ] Scope selection works for discuss/research/plan (DEC-007)
- [ ] Routes to correct workflow for each operation
- [ ] Uses shared references for feature and phase selection (DEC-010)
</success_criteria>
