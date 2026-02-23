# Feature Flow System Design

## Purpose

A technical system for defining, planning, and executing features. The output is specific enough that an agent can implement the entire plan without asking clarifying questions.

## Core Principle

**Everything serves execution.** Every document, every decision, every piece of context exists to help an executing agent write the correct code.

---

## Directory Structure

```
.specd/features/{feature-name}/
├── FEATURE.md      # What this feature is, core technical requirements
├── DECISIONS.md    # Memory: decisions with dates and rationale
├── CONTEXT.md      # Resolved gray areas from discussion
├── RESEARCH.md     # Technical research (patterns, libraries, pitfalls)
├── ROADMAP.md      # Phases with tasks mapped
├── STATE.md        # Current position, progress
├── config.json     # Feature configuration
└── plans/          # Executable task plans
    ├── phase-01/
    │   ├── 01-PLAN.md
    │   └── 02-PLAN.md
    └── phase-02/
        └── 01-PLAN.md
```

---

## DECISIONS.md - The Memory File

Tracks every decision with context for why it was made. This is the institutional memory that prevents re-litigating past choices.

```markdown
# Decisions

## Active Decisions

### DEC-001: Use Zustand for state management
**Date:** 2024-02-02
**Status:** Active
**Context:** Need client-side state for feature X. Considered Redux, Jotai, Zustand.
**Decision:** Use Zustand
**Rationale:**
- Existing codebase uses Zustand (see src/store/)
- Simpler API than Redux
- Better TypeScript inference than Jotai
**Implications:**
- Store goes in src/store/{feature}.ts
- Follow pattern from src/store/user.ts
**References:**
- @src/store/user.ts (existing pattern)
- @.specd/codebase/CONVENTIONS.md#state-management

---

### DEC-002: API-first, then UI
**Date:** 2024-02-02
**Status:** Active
**Context:** Need to decide build order for feature.
**Decision:** Build API endpoints before UI components
**Rationale:**
- Can test API independently
- UI can use real data from start
- Matches existing codebase pattern
**Implications:**
- Phase 1: API routes
- Phase 2: UI components consuming API

---

## Superseded Decisions

### DEC-000: Initially considered React Query
**Date:** 2024-02-01
**Status:** Superseded by DEC-001
**Why Changed:** Discovered codebase already uses Zustand, consistency matters more.

---

## Decision Template

### DEC-XXX: [Title]
**Date:** YYYY-MM-DD
**Status:** Active | Superseded | Revoked
**Context:** [What situation required a decision]
**Decision:** [What was decided]
**Rationale:** [Why - the reasoning]
**Implications:** [What this means for implementation]
**References:** [Links to code, docs, or external resources]
```

---

## FEATURE.md - Technical Definition

Not a product spec. A technical definition of what needs to exist.

```markdown
# Feature: {name}

## What This Is

[1-2 sentences: what capability this adds]

## Technical Requirements

### Must Create
- [ ] `src/api/routes/{feature}/route.ts` - REST endpoint for X
- [ ] `src/components/{Feature}/index.tsx` - Main component
- [ ] `src/hooks/use{Feature}.ts` - Data fetching hook
- [ ] `src/types/{feature}.ts` - Type definitions

### Must Integrate With
- `src/store/user.ts` - needs user context
- `src/lib/db.ts` - database access
- `src/components/Layout.tsx` - mount point

### Constraints
- Must work with existing auth (see src/lib/auth.ts)
- Must follow existing API pattern (see src/api/routes/users/)
- No new dependencies without justification in DECISIONS.md

## Success Criteria

Specific, testable conditions:
- [ ] `GET /api/{feature}` returns 200 with `{Feature}[]`
- [ ] `POST /api/{feature}` creates record, returns 201
- [ ] Component renders list from API data
- [ ] Loading and error states handled
- [ ] Types exported and used consistently

## Out of Scope

- [X] Real-time updates (future feature)
- [X] Admin management UI (separate feature)
```

---

## CONTEXT.md - Resolved Gray Areas

Output of `/specd.discuss-feature`. Records what was unclear and how it was resolved.

```markdown
# Context: {feature-name}

**Discussed:** 2024-02-02
**Status:** Complete

## Resolved Questions

### How should errors be displayed?

**Question:** Toast notifications vs inline errors vs error page?

**Resolution:** Inline errors for form validation, toast for API errors.

**Details:**
- Form fields show error message below input
- API failures show toast via existing `useToast` hook
- Never redirect to error page for recoverable errors

**Code Pattern:**
```typescript
// Form validation - inline
<Input error={errors.field?.message} />

// API error - toast
catch (e) {
  toast.error(e.message)
}
```

---

### What data should the list show?

**Question:** Which fields in the list view?

**Resolution:** Name, status, created date. Actions: edit, delete.

**Details:**
- Columns: name (link to detail), status (badge), createdAt (relative)
- Row actions: Edit (pencil icon), Delete (trash, with confirm)
- Mobile: stack layout, swipe actions

---

## Deferred Questions

### Pagination vs infinite scroll
**Reason:** Not enough data yet to matter. Revisit when >100 items likely.
**Default for now:** Simple list, no pagination.
```

---

## PLAN files - Executable Task Plans

Each plan is a prompt for an executing agent. Contains everything needed to implement without asking questions.

```markdown
---
feature: {feature-name}
phase: 1
plan: 01
depends_on: []
creates:
  - src/types/{feature}.ts
  - src/api/routes/{feature}/route.ts
modifies: []
---

# Plan 01: Create API Types and Endpoint

## Objective

Create the type definitions and REST API endpoint for {feature}.

## Context

@.specd/codebase/CONVENTIONS.md
@.specd/codebase/ARCHITECTURE.md
@src/api/routes/users/route.ts (pattern to follow)
@src/types/user.ts (type pattern to follow)

**Relevant Decisions:**
- DEC-002: API-first approach

## Tasks

### Task 1: Create type definitions

**Files:** `src/types/{feature}.ts`

**Action:**
Create types following pattern from `src/types/user.ts`:

```typescript
export interface {Feature} {
  id: string
  name: string
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface Create{Feature}Input {
  name: string
}

export interface Update{Feature}Input {
  name?: string
  status?: 'active' | 'inactive'
}
```

**Verify:** `npx tsc --noEmit` passes

**Done:** Types exported, no TypeScript errors

---

### Task 2: Create API route

**Files:** `src/api/routes/{feature}/route.ts`

**Action:**
Create REST endpoint following pattern from `src/api/routes/users/route.ts`:

- GET: Return all {feature}s for authenticated user
- POST: Create new {feature}, return 201

Must include:
- Auth check using `getServerSession`
- Input validation using zod
- Error handling returning proper status codes

**Pattern Reference:**
```typescript
// From src/api/routes/users/route.ts - follow this structure
import { getServerSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET() {
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await db.{feature}.findMany({
    where: { userId: session.user.id }
  })

  return Response.json(items)
}
```

**Verify:**
- `curl http://localhost:3000/api/{feature}` returns 401 without auth
- With auth cookie, returns 200 with `[]`

**Done:**
- GET returns {feature}[] for authenticated user
- POST creates {feature}, returns 201 with created object
- Unauthenticated requests return 401

---

## Verification

After all tasks complete:

```bash
# Type check
npx tsc --noEmit

# Test endpoints
curl -X GET http://localhost:3000/api/{feature}  # expect 401
curl -X POST http://localhost:3000/api/{feature} -d '{"name":"test"}' # expect 401

# With auth (manual or test script)
# GET should return []
# POST should return created object with id
```

## Output

When complete, update:
- `.specd/features/{feature}/STATE.md` - mark plan 01 complete
```

---

## Workflow Commands

### `/specd.new-feature [name]`

Initialize feature with technical questioning.

**Phases:**
1. **Validate** - Check name, check if exists
2. **Codebase Context** - Load relevant `.specd/codebase/` docs
3. **Technical Questions** - What does this create? What does it integrate with?
4. **Write FEATURE.md** - Technical requirements
5. **Initialize DECISIONS.md** - Empty, ready for decisions
6. **Initialize STATE.md** - Feature created, ready for discussion

**Output:** Feature folder with FEATURE.md, empty DECISIONS.md, STATE.md

---

### `/specd.discuss-feature [name]`

Clarify gray areas before planning. Like a technical design review.

**Phases:**
1. **Load Context** - Read FEATURE.md, codebase docs
2. **Identify Gray Areas** - What's ambiguous? What needs clarification?
3. **Probe Each Area** - Technical questions until clear
4. **Record Decisions** - Add to DECISIONS.md with rationale
5. **Write CONTEXT.md** - Resolved questions

**Output:** CONTEXT.md, updated DECISIONS.md

---

### `/specd.research-feature [name]`

Research before planning. Optional but recommended for unfamiliar domains.

**Phases:**
1. **Identify Research Needs** - New libraries? Patterns? Integration approaches?
2. **Research** - Check docs, existing code patterns, best practices
3. **Document Findings** - Standard approach, pitfalls, code examples
4. **Record Decisions** - Any tech choices go in DECISIONS.md

**Output:** RESEARCH.md, updated DECISIONS.md

---

### `/specd.plan-feature [name]`

Create executable task plans.

**Phases:**
1. **Load All Context** - FEATURE.md, CONTEXT.md, RESEARCH.md, DECISIONS.md, codebase docs
2. **Derive Phases** - Based on dependencies (API before UI, types before implementation)
3. **Break Into Tasks** - Each task: specific files, specific actions, specific verification
4. **Write PLAN files** - Executable prompts for implementing agent
5. **Update ROADMAP.md** - Phase overview

**Output:** plans/ folder with PLAN.md files, ROADMAP.md

---

### `/specd.execute-feature [name]` (future)

Execute the plans. Could spawn agents or guide interactive execution.

---

## Integration with Codebase Docs

The feature flow assumes `.specd/codebase/` exists with:

- **ARCHITECTURE.md** - System structure, where things go
- **CONVENTIONS.md** - Code patterns, naming, style
- **STRUCTURE.md** - Directory layout, file organization
- **STACK.md** - Technologies, versions, why chosen

Plans reference these directly:
```markdown
@.specd/codebase/CONVENTIONS.md#api-patterns
@.specd/codebase/STRUCTURE.md#components
```

If codebase docs don't exist, suggest `/specd.codebase.map` first.

---

## Design Principles

1. **Specificity over abstraction** - "Create src/hooks/useFeature.ts" not "add a hook"

2. **Patterns over descriptions** - Include actual code patterns from codebase

3. **Decisions are permanent** - Once in DECISIONS.md, don't re-litigate

4. **Context is code references** - Use `@path/to/file` not prose descriptions

5. **Verification is executable** - Commands to run, not "check that it works"

6. **Plans are prompts** - PLAN.md is literally what you'd send to an agent to implement
