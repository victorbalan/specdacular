# Roadmap: {feature-name}

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | {N} |
| Total Plans | {N} |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: {Name}** — {One-liner description}
- [ ] **Phase 2: {Name}** — {One-liner description}
- [ ] **Phase 3: {Name}** — {One-liner description}

---

## Phase Details

### Phase 1: {Name}

**Goal:** {What this phase achieves — the outcome, not the tasks}

**Creates:**
- `{path/to/file}` — {Purpose}
- `{path/to/file}` — {Purpose}

**Modifies:**
- `{path/to/file}` — {What change}

**Plans:**
1. `plans/phase-01/01-PLAN.md` — {Plan summary}
2. `plans/phase-01/02-PLAN.md` — {Plan summary}

**Success Criteria:**
1. {Observable behavior that proves the phase is complete}
2. {Observable behavior}
3. {Observable behavior}

**Dependencies:** None (first phase)

---

### Phase 2: {Name}

**Goal:** {What this phase achieves}

**Creates:**
- `{path/to/file}` — {Purpose}

**Modifies:**
- `{path/to/file}` — {What change}

**Plans:**
1. `plans/phase-02/01-PLAN.md` — {Plan summary}

**Success Criteria:**
1. {Observable behavior}
2. {Observable behavior}

**Dependencies:** Phase 1 complete

---

### Phase 3: {Name}

**Goal:** {What this phase achieves}

**Creates:**
- `{path/to/file}` — {Purpose}

**Plans:**
1. `plans/phase-03/01-PLAN.md` — {Plan summary}

**Success Criteria:**
1. {Observable behavior}
2. {Observable behavior}

**Dependencies:** Phase 2 complete

---

## Execution Order

The recommended execution order respects dependencies:

```
Phase 1: {Name}
├── 01-PLAN.md: {summary}
└── 02-PLAN.md: {summary}
    ↓
Phase 2: {Name}
└── 01-PLAN.md: {summary}
    ↓
Phase 3: {Name}
└── 01-PLAN.md: {summary}
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-XXX: {title} | {How it affects phase ordering or content} |

---

## Notes

{Space for notes about the roadmap — why phases are ordered this way, alternatives considered, etc.}
