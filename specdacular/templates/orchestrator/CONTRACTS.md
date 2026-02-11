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
