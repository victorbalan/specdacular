<purpose>
Research how to implement a feature by spawning parallel agents for different research dimensions.

Uses three parallel research tracks:
1. **Codebase Integration** - Claude Code Explore agent investigates existing code
2. **External Patterns** - General-purpose agent researches libraries, patterns, approaches
3. **Pitfalls** - General-purpose agent researches what goes wrong

Output: Single synthesized RESEARCH.md that the planner consumes.
</purpose>

<philosophy>

## Research Serves Planning

Every finding must be actionable. "Use Zustand" is useless. "Use Zustand 4.5+, create store in src/store/{feature}.ts following pattern from src/store/user.ts" is actionable.

## Codebase First

The most valuable research is understanding how this fits with existing code. External patterns matter, but integration patterns matter more.

## Verification Required

Don't trust Claude's training data for library versions or APIs. Verify with Context7 or official docs. Mark unverified findings as LOW confidence.

## Decisions Get Recorded

Any choice made during research (library selection, pattern choice, architecture decision) goes into DECISIONS.md with rationale.

</philosophy>

<research_dimensions>

## Dimension 1: Codebase Integration

**Agent:** Claude Code Explore (subagent_type="Explore")
**Purpose:** Understand how feature integrates with existing code

**Investigates:**
- What modules/files to import from
- What patterns similar features follow
- Where new files should be created
- What types/interfaces to reuse
- What utilities/hooks already exist

**Output format:**
```markdown
## Codebase Integration Findings

### Import Dependencies
- `src/lib/auth.ts` — provides `getSession()`, needed for user context
- `src/types/user.ts` — provides `User` type, needed for type safety

### Patterns to Follow
- **API routes:** Follow pattern in `src/app/api/users/route.ts`
  - Use `getServerSession` for auth
  - Return `Response.json()` with proper status codes
  - Validate input with zod

### File Locations
New files:
- `src/app/api/{feature}/route.ts` — API endpoint
- `src/components/{Feature}/index.tsx` — Main component
- `src/hooks/use{Feature}.ts` — Data hook
- `src/types/{feature}.ts` — Type definitions

Modify:
- `src/app/layout.tsx` — Add provider if needed

### Reusable Code
Types:
- @src/types/common.ts — `ApiResponse<T>`, `PaginatedResponse<T>`

Utilities:
- @src/lib/fetcher.ts — `fetcher()` for SWR
- @src/lib/validation.ts — zod schemas

Components:
- @src/components/ui/Button — existing button component
- @src/components/ui/Input — existing input component

### Integration Points
- Auth: Use `getServerSession` from `@/lib/auth`
- Database: Use `db` from `@/lib/db`
- State: Create store in `src/store/` following existing pattern
```

## Dimension 2: External Patterns

**Agent:** general-purpose with feature-researcher instructions
**Purpose:** Research standard approaches, libraries, patterns

**Investigates:**
- Standard libraries for this feature type
- Architecture patterns that work well
- Code patterns and examples
- What NOT to hand-roll

**Tool strategy:**
1. Context7 first for any library
2. Official docs via WebFetch
3. WebSearch with current year
4. Verify everything

**Output format:**
```markdown
## External Patterns Findings

### Standard Stack
| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| zod | 3.22+ | Input validation | HIGH (Context7) |
| swr | 2.2+ | Data fetching | HIGH (Context7) |

### Architecture Pattern
**Pattern:** Feature-based modules
**Why:** Keeps related code together, easier to maintain
**Structure:**
```
src/features/{name}/
├── api.ts        # API calls
├── hooks.ts      # React hooks
├── types.ts      # TypeScript types
├── components/   # UI components
└── index.ts      # Public exports
```

### Code Patterns

**Data fetching with SWR:**
```typescript
// Source: Context7 - swr
export function use{Feature}() {
  const { data, error, isLoading, mutate } = useSWR<{Feature}[]>(
    '/api/{feature}',
    fetcher
  )
  return { items: data, error, isLoading, refresh: mutate }
}
```

### Don't Hand-Roll
| Problem | Use Instead | Why |
|---------|-------------|-----|
| Form validation | zod + react-hook-form | Edge cases, error messages |
| Data fetching | SWR or React Query | Caching, revalidation, race conditions |
| Date formatting | date-fns | Timezone handling, localization |
```

## Dimension 3: Pitfalls

**Agent:** general-purpose with feature-researcher instructions
**Purpose:** Research what commonly goes wrong

**Investigates:**
- Common implementation mistakes
- Performance pitfalls
- Security issues
- Integration gotchas

**Output format:**
```markdown
## Pitfalls Findings

### Critical (causes failures/rewrites)

**Race conditions in data fetching**
- Why it happens: Multiple rapid requests, stale closures
- Prevention: Use SWR/React Query, they handle this
- Detection: Data flickers, wrong data after navigation

**Missing auth checks on API routes**
- Why it happens: Forget to add auth middleware
- Prevention: Auth check first line of every handler
- Detection: Unauthenticated access succeeds

### Moderate (causes bugs/debt)

**Type mismatches between API and client**
- Why it happens: Types defined separately, drift over time
- Prevention: Single source of truth for types, use zod inference
- Detection: Runtime errors, TypeScript errors after API changes

### Minor (causes friction)

**Inconsistent error handling**
- Why it happens: Different patterns in different places
- Prevention: Create `handleApiError` utility, use everywhere
- Detection: Error messages vary in format/location
```

</research_dimensions>

<synthesis>

## Combining Research

After all agents complete, synthesize into RESEARCH.md:

1. **Summary** - Key findings across all dimensions
2. **Codebase Integration** - Full findings from Explore agent
3. **Implementation Approach** - External patterns, adapted for this codebase
4. **Pitfalls** - All pitfalls with task-specific warnings
5. **Confidence Assessment** - Honest evaluation of each area
6. **Open Questions** - What couldn't be resolved

## Recording Decisions

During synthesis, identify any decisions that were made:

- Library choice → DEC-XXX with rationale
- Pattern choice → DEC-XXX with rationale
- Architecture choice → DEC-XXX with rationale

Add all to DECISIONS.md with:
- Date
- Context (from research)
- Decision
- Rationale (from findings)
- Implications (for implementation)
- References (sources used)

</synthesis>

<quality_gates>

## Before Spawning Agents

- [ ] Feature exists with FEATURE.md
- [ ] Codebase docs available (.specd/codebase/)
- [ ] Research dimensions identified

## After Each Agent

- [ ] Findings are specific (file paths, versions, code examples)
- [ ] Confidence levels assigned
- [ ] Sources cited

## Before Writing RESEARCH.md

- [ ] All agents completed
- [ ] Findings synthesized (not just concatenated)
- [ ] Conflicts resolved
- [ ] Decisions extracted

## Before Committing

- [ ] RESEARCH.md follows template
- [ ] DECISIONS.md updated with new decisions
- [ ] No LOW confidence items presented as recommendations

</quality_gates>
