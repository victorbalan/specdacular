# Dependencies: {feature-name}

**Last Updated:** {YYYY-MM-DD}

## Overview

{Brief description of how this feature spans multiple projects and what each project contributes.}

---

## Project Involvement

| Project | Role | Path |
|---------|------|------|
| {project-name} | {What this project does for this feature} | {./relative/path} |

---

## Phase Dependencies

| Phase | Depends On | Status |
|-------|------------|--------|
| {project}/phase-{N} | — | pending |
| {project}/phase-{N} | {project}/phase-{N} | blocked |

**Status values:** `pending` | `blocked` | `in-progress` | `complete`

---

## Dependency Graph

```mermaid
graph TD
    A1[{project-a}/phase-1] --> A2[{project-a}/phase-2]
    B1[{project-b}/phase-1] --> B2[{project-b}/phase-2]
    A2 --> B2
```

---

## Scheduling Notes

{Notes about execution order, parallelism opportunities, and constraints.}

- Phases with no dependencies can start immediately
- Phases with all dependencies `complete` are unblocked
- The `next` command reads this table to determine what work is available
