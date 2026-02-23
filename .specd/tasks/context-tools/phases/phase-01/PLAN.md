---
task: context-tools
phase: 1
depends_on: []
creates:
  - specdacular/workflows/context-status.md
modifies: []
---

# Phase 1: Context Status Dashboard

## Objective

Create the `context:status` workflow that reads all 4 codebase context files, extracts timestamps and USER_MODIFIED tags, and presents a readable staleness dashboard.

## Context

**Reference these files:**
- `@.specd/codebase/PATTERNS.md` — Workflow structure pattern to follow
- `@.specd/codebase/STRUCTURE.md` — Where workflow files go
- `@specdacular/workflows/map-codebase.md` — Example workflow with validation and file reading

**Relevant Decisions:**
- DEC-001: Inline timestamps in context files (Generated:, Last Reviewed:, Last Modified:)
- DEC-006: Simple date display for staleness, no thresholds — show "X days ago"
- DEC-010: Context workflows skip task validation — validate `.specd/codebase/` exists instead

**From Research:**
- Inconsistent timestamp formats already exist (`Generated:` vs `**Analysis Date:**`) — workflow must handle both
- Date format must be `YYYY-MM-DD` for all new timestamps
- USER_MODIFIED tags are `<!-- USER_MODIFIED: YYYY-MM-DD -->` after section headers

---

## Tasks

### Task 1: Create context-status.md workflow

**Files:** `specdacular/workflows/context-status.md`

**Action:**
Create the workflow file following the standard `<purpose>`, `<philosophy>`, `<process>`, `<success_criteria>` structure.

**Steps in the workflow:**

1. **validate** — Check `.specd/codebase/` exists. If not, suggest `/specd.codebase.map`.

2. **read_files** — Read all 4 files (MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md). For each file:
   - Extract document-level timestamps: `Generated:`, `Last Reviewed:`, `Last Modified:` (or `**Analysis Date:**` for backwards compat)
   - Count total sections (## and ### headings)
   - Count sections with `<!-- USER_MODIFIED: ... -->` tags
   - Calculate days since each timestamp relative to today

3. **display_dashboard** — Present a formatted dashboard:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CODEBASE CONTEXT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| File | Generated | Last Reviewed | Last Modified | Sections | User Modified |
|------|-----------|---------------|---------------|----------|---------------|
| MAP.md | 2026-02-04 (13d ago) | — | — | 12 | 0 |
| PATTERNS.md | 2026-02-04 (13d ago) | — | — | 8 | 0 |
| STRUCTURE.md | 2026-02-04 (13d ago) | — | — | 15 | 0 |
| CONCERNS.md | 2026-02-04 (13d ago) | — | — | 6 | 0 |

Note: USER_MODIFIED tags are HTML comments — invisible in rendered markdown.
```

The workflow ends after displaying — no file writes, no commits.

**Verify:**
```bash
[ -f "specdacular/workflows/context-status.md" ] && echo "exists"
```

**Done when:**
- [ ] `context-status.md` workflow file exists with `<purpose>`, `<process>`, `<success_criteria>` sections
- [ ] Workflow validates `.specd/codebase/` existence
- [ ] Workflow reads all 4 context files and extracts timestamps
- [ ] Dashboard shows Generated, Last Reviewed, Last Modified, section counts, USER_MODIFIED counts
- [ ] Days-ago calculation included for each timestamp

---

## Verification

After all tasks complete:

```bash
[ -f "specdacular/workflows/context-status.md" ] && grep -q "context-status" specdacular/workflows/context-status.md && echo "phase 1 complete"
```

**Phase is complete when:**
- [ ] `context-status.md` workflow exists with full process
- [ ] Follows existing workflow structure patterns

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/context-tools/CHANGELOG.md`.
