---
feature: multi-project-specd
phase: 1
plan: 01
depends_on: []
creates:
  - specdacular/templates/orchestrator/PROJECTS.md
  - specdacular/templates/orchestrator/TOPOLOGY.md
  - specdacular/templates/orchestrator/CONTRACTS.md
  - specdacular/templates/orchestrator/CONCERNS.md
modifies: []
---

# Plan 01: Create Orchestrator Codebase Templates

## Objective

Create the four orchestrator-level codebase document templates (PROJECTS.md, TOPOLOGY.md, CONTRACTS.md, CONCERNS.md) that the map-codebase orchestrator mapper will populate in Phase 2.

## Context

**Reference these files:**
- `@specdacular/templates/features/CONTEXT.md` — Existing template placeholder conventions (`{placeholder-name}`)
- `@specdacular/templates/features/FEATURE.md` — Another example of template structure
- `@.specd/features/multi-project-specd/plans/phase-01/CONTEXT.md` — Phase discussion resolutions

**Relevant Decisions:**
- DEC-003: Orchestrator is coordination-only — system docs, not code docs
- DEC-008: Loose contracts in CONTRACTS.md, specific contracts per-feature

**From Research:**
- CONTRACTS.md uses Pact-inspired consumer/provider relationships, kept loose per DEC-008
- PROJECTS.md is the project registry — name, path, tech stack, purpose
- TOPOLOGY.md describes inter-project communication patterns and data flow
- CONCERNS.md captures cross-cutting system-level gotchas

**From Phase Discussion:**
- PROJECTS.md: code-only, no runtime/deployment info. Registry table + per-project detail sections
- TOPOLOGY.md: per-relationship structure (one section per project pair)
- CONCERNS.md: system-level cross-cutting issues with Scope/Issue/Impact/Mitigation
- All templates follow existing `{placeholder}` conventions

---

## Tasks

### Task 1: Create PROJECTS.md Template

**Files:** `specdacular/templates/orchestrator/PROJECTS.md`

**Action:**
Create the project registry template. This is populated by the orchestrator mapper (Phase 2) after sub-project mappers complete.

Follow placeholder convention from `specdacular/templates/features/CONTEXT.md`:
```markdown
# Context: {feature-name}

**Last Updated:** {YYYY-MM-DD}
**Sessions:** {N}
```

Create:
```markdown
# Projects

**Last Updated:** {YYYY-MM-DD}
**Project Count:** {N}

---

## Project Registry

| Project | Path | Tech Stack | Purpose |
|---------|------|------------|---------|
| {project-name} | {./relative/path} | {e.g., Node.js, TypeScript, Next.js} | {One-liner purpose} |

---

## {project-name}

**Path:** `{./relative/path}`
**Tech Stack:** {stack}
**Purpose:** {What this project does in the system}

### Responsibilities

- {What this project owns and manages}

### Key Entry Points

- `{path/to/main/file}` — {What it does, why other projects care}

### Codebase Docs

- `{project-path}/.specd/codebase/MAP.md` — System overview
- `{project-path}/.specd/codebase/PATTERNS.md` — Code patterns
- `{project-path}/.specd/codebase/STRUCTURE.md` — File structure
- `{project-path}/.specd/codebase/CONCERNS.md` — Project-level concerns

---

{Repeat for each project}
```

**Verify:**
```bash
[ -f "specdacular/templates/orchestrator/PROJECTS.md" ] && echo "PROJECTS.md exists" || echo "MISSING"
```

**Done when:**
- [ ] `specdacular/templates/orchestrator/PROJECTS.md` exists
- [ ] Contains registry table with placeholder columns
- [ ] Contains per-project detail section template with responsibilities, key entry points, codebase doc links
- [ ] Uses `{placeholder}` convention consistently

---

### Task 2: Create TOPOLOGY.md Template

**Files:** `specdacular/templates/orchestrator/TOPOLOGY.md`

**Action:**
Create the inter-project communication patterns template. Per-relationship structure (one section per project pair), as resolved in phase discussion.

Create:
```markdown
# Topology

**Last Updated:** {YYYY-MM-DD}

## Overview

{Brief description of how projects in this system communicate. 2-3 sentences.}

---

## Project Relationships

### {project-a} ↔ {project-b}

**Communication:** {REST, gRPC, pub/sub, shared database, file system, etc.}
**Pattern:** {Who initiates, who responds. e.g., "UI is the sole consumer of the API"}
**Shared Domains:** {What data/concepts they share. e.g., "Authentication, Users, Projects"}
**Source of Truth:** {Which project defines the contract. e.g., "API defines the contract, UI adapts"}

**Data Flow:**
- {project-a} → {project-b}: {What data/events flow in this direction}
- {project-b} → {project-a}: {What data/events flow in this direction}

---

{Repeat for each project relationship}

## Shared Resources

{Resources shared across projects — databases, caches, queues, file storage.}

| Resource | Type | Used By | Owner |
|----------|------|---------|-------|
| {resource-name} | {database, cache, queue, etc.} | {project-a, project-b} | {which project manages it} |

---

## Communication Diagram

```mermaid
graph LR
    {project-a}[{project-a}] -->|{protocol}| {project-b}[{project-b}]
```
```

**Verify:**
```bash
[ -f "specdacular/templates/orchestrator/TOPOLOGY.md" ] && echo "TOPOLOGY.md exists" || echo "MISSING"
```

**Done when:**
- [ ] `specdacular/templates/orchestrator/TOPOLOGY.md` exists
- [ ] Contains per-relationship sections with Communication, Pattern, Shared Domains, Source of Truth
- [ ] Contains data flow direction per relationship
- [ ] Contains shared resources table
- [ ] Contains Mermaid diagram placeholder

---

### Task 3: Create CONTRACTS.md and CONCERNS.md Templates

**Files:** `specdacular/templates/orchestrator/CONTRACTS.md`, `specdacular/templates/orchestrator/CONCERNS.md`

**Action:**
Create both templates. CONTRACTS.md follows DEC-008 (loose relationship descriptions that age well). CONCERNS.md focuses on system-level cross-cutting issues.

Create CONTRACTS.md:
```markdown
# Contracts

**Last Updated:** {YYYY-MM-DD}

## Overview

{Brief description of how contracts work in this system. These are stable relationship descriptions — specific contracts for individual features are defined in each feature's FEATURE.md.}

---

## {project-a} ↔ {project-b}

**Communication:** {REST, gRPC, pub/sub, etc.}
**Pattern:** {Consumer/provider relationship}
**Shared Domains:** {What concepts/data they share}
**Source of Truth:** {Which project defines the contract}

### Contract Nature

{Prose description of what flows between these projects and the general expectations. This is NOT a detailed API spec — it describes the relationship so that feature planning can identify which projects are affected.}

---

{Repeat for each project relationship with contracts}

## Notes

- These contracts describe relationship patterns, not specific endpoints
- Feature-level contracts (specific endpoints, schemas) are defined in each feature's orchestrator FEATURE.md
- Deviation detection runs against feature-level contracts, not this document
- This document helps with feature routing: identifying which projects a feature involves
```

Create CONCERNS.md:
```markdown
# System Concerns

**Last Updated:** {YYYY-MM-DD}

## Overview

{Brief description of cross-cutting system-level concerns that affect multiple projects. These are distinct from per-project concerns in each project's `.specd/codebase/CONCERNS.md`.}

---

## {Concern Title}

**Scope:** {Which projects are affected}
**Issue:** {What the concern is — the cross-cutting problem}
**Impact:** {What goes wrong if this is ignored during planning/execution}
**Mitigation:** {How to handle this during feature planning and phase execution}

---

{Repeat for each system-level concern}

## Concern Categories

| Category | Concerns | Projects Affected |
|----------|----------|-------------------|
| {e.g., Data Consistency} | {concern titles} | {project list} |
| {e.g., Deployment Order} | {concern titles} | {project list} |
```

**Verify:**
```bash
[ -f "specdacular/templates/orchestrator/CONTRACTS.md" ] && echo "CONTRACTS.md exists" || echo "MISSING"
[ -f "specdacular/templates/orchestrator/CONCERNS.md" ] && echo "CONCERNS.md exists" || echo "MISSING"
```

**Done when:**
- [ ] `specdacular/templates/orchestrator/CONTRACTS.md` exists with loose relationship sections per DEC-008
- [ ] CONTRACTS.md includes note about feature-level contracts vs system-level
- [ ] `specdacular/templates/orchestrator/CONCERNS.md` exists with Scope/Issue/Impact/Mitigation per concern
- [ ] CONCERNS.md differentiates itself from per-project concerns
- [ ] Both use `{placeholder}` convention

---

## Verification

After all tasks complete:

```bash
# Check all 4 orchestrator templates exist
for f in PROJECTS.md TOPOLOGY.md CONTRACTS.md CONCERNS.md; do
  [ -f "specdacular/templates/orchestrator/$f" ] && echo "✓ $f" || echo "✗ $f MISSING"
done
```

**Plan is complete when:**
- [ ] All 4 template files exist in `specdacular/templates/orchestrator/`
- [ ] All templates use `{placeholder}` conventions consistently
- [ ] CONTRACTS.md follows DEC-008 (loose descriptions)
- [ ] CONCERNS.md focuses on system-level cross-cutting issues

---

## Output

When this plan is complete:

1. Update `.specd/features/multi-project-specd/STATE.md`:
   - Mark this plan as complete
   - Note any discoveries or decisions made

2. Commit changes:
   ```bash
   git add specdacular/templates/orchestrator/PROJECTS.md specdacular/templates/orchestrator/TOPOLOGY.md specdacular/templates/orchestrator/CONTRACTS.md specdacular/templates/orchestrator/CONCERNS.md
   git commit -m "feat(multi-project-specd): create orchestrator codebase templates

   Plan phase-01/01 complete:
   - PROJECTS.md: project registry template
   - TOPOLOGY.md: inter-project communication patterns
   - CONTRACTS.md: loose relationship descriptions (DEC-008)
   - CONCERNS.md: system-level cross-cutting issues"
   ```

3. Next plan: `phase-01/02-PLAN.md`

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/features/multi-project-specd/CHANGELOG.md`.

---

## Notes

{Space for the implementing agent to record discoveries during implementation.}
