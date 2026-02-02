<purpose>
Initialize a new feature folder with structured planning documents through a conversational workflow.

Uses adaptive questioning depth based on feature complexity to gather requirements, then creates:
- FEATURE.md - What this feature does, core value, constraints
- REQUIREMENTS.md - Scoped requirements with REQ-IDs (v1/v2/out-of-scope)
- ROADMAP.md - Phases with success criteria and requirement mapping
- STATE.md - Project memory, current position, decisions
- config.json - Mode, depth, tracking metadata

Output: `.specd/features/{feature-name}/` folder with all planning documents.
</purpose>

<philosophy>
**Conversational, not interrogative:**
Build understanding through natural dialogue. Ask follow-up questions that build on previous answers.

**User-driven scoping:**
The user decides what's v1 vs v2 vs out-of-scope. Present options, don't prescribe.

**Complexity-adaptive:**
Light features need 2-3 questions. Complicated features need thorough probing until all gray areas are resolved.

**Traceable requirements:**
Every requirement gets an ID. Phases map to requirements. Progress is trackable.
</philosophy>

<process>

<step name="setup">
Get feature name and validate.

**If $ARGUMENTS provided:**
Use as feature name. Normalize to kebab-case (lowercase, hyphens).

**If no arguments:**
Ask: "What's the name of this feature? (e.g., user-dashboard, auth-flow, payment-integration)"

**Validate:**
- Feature name should be kebab-case
- Check if `.specd/features/{name}/` already exists

**If feature exists:**
```
Feature '{name}' already exists at .specd/features/{name}/

Options:
1. Resume - Continue working with existing feature
2. Reset - Delete and start fresh
3. Different name - Use a different feature name
```

Wait for user response.

**If new feature:**
Create feature abbreviation for REQ-IDs (e.g., "user-dashboard" → "DASH", "auth-flow" → "AUTH")

Continue to codebase_context.
</step>

<step name="codebase_context">
Look for codebase documentation to inform feature planning.

**Check for existing config:**
```bash
cat .specd/config.json 2>/dev/null
```

**If config exists with codebase_docs path:**
Use that path for codebase docs.

**If no config, check default location:**
```bash
ls .specd/codebase/*.md 2>/dev/null
```

**If codebase docs found:**
Note available context:
```
Found codebase documentation:
- ARCHITECTURE.md - System design and patterns
- CONVENTIONS.md - Code style and patterns
- STRUCTURE.md - Directory layout
[etc.]

I'll reference these when defining requirements and integration points.
```

Continue to complexity_assessment.

**If no codebase docs found:**
Ask user:
```
I didn't find codebase documentation at .specd/codebase/

Do you have codebase specs elsewhere?
1. Yes, at a custom location
2. No, proceed without (I can run /specd:map-codebase later)
```

**If custom location:**
Ask for path, then save to `.specd/config.json`:
```json
{
  "codebase_docs": "{user-specified-path}",
  "created": "{date}"
}
```

Continue to complexity_assessment.
</step>

<step name="complexity_assessment">
Ask user to assess feature complexity.

```
How complex is this feature?

1. Light - Simple addition, straightforward scope
   (I'll ask 2-3 follow-up questions)

2. Moderate - Multi-part feature, some decisions to make
   (I'll ask 4-6 follow-up questions)

3. Complicated - Major feature, many moving parts
   (I'll probe thoroughly until all gray areas are resolved)
```

Wait for user response. Store complexity level (1, 2, or 3).

Continue to deep_questioning.
</step>

<step name="deep_questioning">
Gather feature understanding through adaptive conversation.

**Opening question (all complexity levels):**
"Tell me about this feature. What problem does it solve and who benefits from it?"

**Light complexity (level 1):**
After initial response, ask 2-3 targeted questions:
- "What's the ONE thing that must work for this to be useful?"
- "Are there any constraints I should know about? (tech, timeline, dependencies)"

**Moderate complexity (level 2):**
After initial response, ask 4-6 questions covering:
- Core value and success criteria
- User interactions and flows
- Integration with existing code
- Edge cases and error handling
- Any constraints or non-negotiables

**Complicated complexity (level 3):**
Thorough probing until clarity achieved:
- All moderate questions plus:
- Data models and state management
- Performance considerations
- Security implications
- Rollback/migration concerns
- Dependencies and sequencing
- Continue asking until no ambiguity remains

**Question style:**
- Build on previous answers
- Ask "what about..." to explore edges
- Confirm understanding before moving on
- Use "So if I understand correctly..." to validate

**When done:**
"I think I have a good understanding. Let me capture this in FEATURE.md."

Continue to write_feature.
</step>

<step name="write_feature">
Create FEATURE.md from conversation.

**Create feature directory:**
```bash
mkdir -p .specd/features/{feature-name}
```

**Write FEATURE.md:**
Use template at `~/.claude/specdacular/templates/features/FEATURE.md` as structure.

Fill in based on conversation:
- Feature name and description
- Core value (the ONE thing)
- Context from codebase docs (if available)
- Constraints mentioned
- Key decisions from discussion

**Commit:**
```bash
git add .specd/features/{feature-name}/FEATURE.md
git commit -m "docs(feature): initialize {feature-name}"
```

Continue to configuration.
</step>

<step name="configuration">
Ask user preferences for workflow mode and depth.

```
How do you want to work on this feature?

**Mode:**
1. Interactive (recommended) - I'll check in at each phase
2. YOLO - I'll execute phases autonomously, checking in only when blocked

**Depth:**
1. Quick - Minimal docs, fast execution
2. Standard (recommended) - Balanced documentation and execution
3. Comprehensive - Thorough docs, detailed planning
```

Wait for user response. Store mode and depth.

Continue to define_requirements.
</step>

<step name="define_requirements">
Present requirements and let user scope them.

**Generate requirements from conversation:**
Derive requirements from the feature discussion. Group by category:
- UI - User interface requirements
- API - Backend/API requirements
- DATA - Data model requirements
- INT - Integration requirements
- SEC - Security requirements
- PERF - Performance requirements

**REQ-ID format:** `{FEAT}-{CAT}-{NUM}`
Example: `DASH-UI-01`, `DASH-API-02`

**Present to user:**
```
Based on our discussion, here are the requirements I identified:

**UI Requirements:**
- DASH-UI-01: [Requirement description]
- DASH-UI-02: [Requirement description]

**API Requirements:**
- DASH-API-01: [Requirement description]

[etc.]

For each requirement, please indicate:
- v1 (must have for initial release)
- v2 (deferred to later)
- out (out of scope entirely)

You can respond like: "UI-01 v1, UI-02 v2, API-01 out" or we can go through them one by one.
```

**Iterate until scoped:**
Continue discussion until all requirements are categorized.

**Write REQUIREMENTS.md:**
Use template at `~/.claude/specdacular/templates/features/REQUIREMENTS.md`

**Commit:**
```bash
git add .specd/features/{feature-name}/REQUIREMENTS.md
git commit -m "docs(feature): define requirements for {feature-name}"
```

Continue to create_roadmap.
</step>

<step name="create_roadmap">
Derive phases from scoped requirements.

**Phase creation rules:**
- Each phase should be independently shippable
- Phase 1 contains core v1 requirements (the minimum viable feature)
- Subsequent phases add v1 requirements in logical order
- Final phases contain v2 requirements
- Each phase has clear success criteria

**Present roadmap:**
```
Based on the v1 requirements, here's the proposed roadmap:

**Phase 1: {Name}** - {Description}
Requirements: {REQ-IDs}
Success criteria:
  1. [Observable behavior]
  2. [Observable behavior]

**Phase 2: {Name}** - {Description}
Requirements: {REQ-IDs}
Success criteria:
  1. [Observable behavior]

[etc.]

Does this phasing make sense? Any adjustments needed?
```

**Iterate until approved.**

**Write ROADMAP.md:**
Use template at `~/.claude/specdacular/templates/features/ROADMAP.md`

Continue to initialize_state.
</step>

<step name="initialize_state">
Create STATE.md and config.json for tracking.

**Write STATE.md:**
Use template at `~/.claude/specdacular/templates/features/STATE.md`

Initialize with:
- Current position: Phase 1 (not started)
- Progress summary: empty
- Accumulated decisions: from conversation
- Session history: creation date

**Write config.json:**
```json
{
  "feature_name": "{name}",
  "feature_abbrev": "{ABBREV}",
  "created": "{date}",
  "mode": "{interactive|yolo}",
  "depth": "{quick|standard|comprehensive}",
  "phases": {
    "total": {N},
    "completed": 0,
    "current": 1
  },
  "requirements": {
    "v1_count": {N},
    "v2_count": {N},
    "completed": 0
  }
}
```

**Commit:**
```bash
git add .specd/features/{feature-name}/ROADMAP.md .specd/features/{feature-name}/STATE.md .specd/features/{feature-name}/config.json
git commit -m "docs(feature): create roadmap for {feature-name}"
```

Continue to completion.
</step>

<step name="completion">
Summarize what was created and suggest next steps.

**Output:**
```
Feature '{feature-name}' initialized.

Created .specd/features/{feature-name}/:
- FEATURE.md - Feature definition and context
- REQUIREMENTS.md - {v1_count} v1 requirements, {v2_count} v2 requirements
- ROADMAP.md - {phase_count} phases planned
- STATE.md - Progress tracking initialized
- config.json - Configuration saved

Mode: {interactive|yolo}
Depth: {quick|standard|comprehensive}

---

## What's Next

Ready to start Phase 1: {phase_1_name}

When you're ready, ask me to plan or execute Phase 1:
- "Plan phase 1" - I'll create a detailed implementation plan
- "Execute phase 1" - I'll implement the phase (in {mode} mode)

Or review the artifacts:
- `cat .specd/features/{feature-name}/REQUIREMENTS.md`
- `cat .specd/features/{feature-name}/ROADMAP.md`
```

End workflow.
</step>

</process>

<success_criteria>
- Feature folder created at `.specd/features/{name}/`
- All 5 files created with appropriate content
- Requirements have unique REQ-IDs
- Phases map to requirements via REQ-IDs
- Commits made at: FEATURE.md, REQUIREMENTS.md, ROADMAP.md+STATE.md
- User approved requirements scoping
- User approved roadmap phasing
</success_criteria>
