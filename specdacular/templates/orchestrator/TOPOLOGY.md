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
    A[{project-a}] -->|{protocol}| B[{project-b}]
```
