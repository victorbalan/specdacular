<shared name="spawn_research_agents">

## Spawn Research Agents

Spawn three parallel research agents. Use `run_in_background: true` for all.

**Before using this reference, you must have ready:**
- `$TASK_NAME` — the task name
- `$TASK_CONTEXT` — summary of what's being built (from FEATURE.md)
- `$CONSTRAINTS` — active decisions and constraints (from DECISIONS.md)
- `$TECH_STACK` — technology stack (from codebase docs if available)
- `$FILES_TO_CREATE` — list of files to create (from FEATURE.md or PLAN.md)
- `$FILES_TO_MODIFY` — list of files to modify (from FEATURE.md or PLAN.md)

### Agent 1: Codebase Integration

Uses the Explore agent to analyze how the task integrates with existing code.

```
Task(
  subagent_type: "Explore"
  description: "Codebase integration research"
  run_in_background: true
  prompt: "Research how {task-name} should integrate with the existing codebase.

<task_context>
$TASK_CONTEXT
</task_context>

<constraints>
$CONSTRAINTS
</constraints>

<files_to_create>
$FILES_TO_CREATE
</files_to_create>

<files_to_modify>
$FILES_TO_MODIFY
</files_to_modify>

<research_questions>
1. What existing files/modules will new files need to import from?
2. What patterns do similar files in this codebase follow?
3. Where exactly should new files be created?
4. What types/interfaces already exist that should be reused?
5. What utility functions or hooks can be leveraged?
</research_questions>

<output_format>
## Codebase Integration

### Import Dependencies
- `path/to/file` — what it provides, why needed

### Patterns to Follow
- Pattern name: description, example file reference

### File Locations
- Where each new file should go

### Reusable Code
- Types: list with paths
- Utilities: list with paths

### Integration Points
- Where new code connects to existing code
</output_format>"
)
```

### Agent 2: Implementation Patterns

Uses a general-purpose agent with the feature-researcher role.

```
Task(
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "Implementation patterns research"
  run_in_background: true
  prompt: "First, read ~/.claude/specdacular/agents/feature-researcher.md for your role.

<research_type>
Implementation patterns for {task-name}.
</research_type>

<task_context>
$TASK_CONTEXT
</task_context>

<tech_stack>
$TECH_STACK
</tech_stack>

<research_questions>
1. What's the standard approach for this type of work in this stack?
2. What libraries are commonly used?
3. What code patterns work well?
4. What should NOT be hand-rolled?
</research_questions>

<tool_strategy>
1. Context7 first for any library questions
2. Official docs via WebFetch for gaps
3. WebSearch for patterns (include current year)
4. Verify all findings
</tool_strategy>

<output_format>
## Implementation Patterns

### Standard Approach
{Recommended approach with rationale}

### Libraries
| Library | Version | Purpose | Confidence |

### Code Patterns
{Code examples with sources}

### Don't Hand-Roll
| Problem | Use Instead | Why |
</output_format>"
)
```

### Agent 3: Pitfalls

Uses a general-purpose agent with the feature-researcher role.

```
Task(
  subagent_type: "general-purpose"
  model: "sonnet"
  description: "Pitfalls research"
  run_in_background: true
  prompt: "First, read ~/.claude/specdacular/agents/feature-researcher.md for your role.

<research_type>
Pitfalls research for {task-name}.
</research_type>

<task_context>
$TASK_CONTEXT
</task_context>

<research_questions>
1. What do developers commonly get wrong with this type of work?
2. What are the performance pitfalls?
3. What security issues should be avoided?
4. What integration mistakes happen?
</research_questions>

<tool_strategy>
1. WebSearch for common mistakes (include current year)
2. Look for post-mortems, issue discussions
3. Check official docs for warnings/caveats
</tool_strategy>

<output_format>
## Pitfalls

### Critical (causes failures/rewrites)
- Pitfall: description, prevention, detection

### Moderate (causes bugs/debt)
- Pitfall: description, prevention

### Minor (causes friction)
- Pitfall: description, prevention
</output_format>"
)
```

### After Spawning

Wait for all three agents to complete. Read their output files. Continue to synthesis using `@synthesize-research.md`.

</shared>
