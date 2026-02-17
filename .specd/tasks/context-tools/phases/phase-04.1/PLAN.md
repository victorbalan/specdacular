---
task: context-tools
phase: 4.1
depends_on: [4]
creates:
  - specdacular/templates/context/section-display.md
modifies:
  - specdacular/templates/context-review-diff.md → specdacular/templates/context/review-diff.md
  - specdacular/workflows/context-review.md
---

# Phase 4.1: Fix — Context templates organization

## Objective

Address review feedback: add a standalone section display template and move all context templates into `specdacular/templates/context/`.

---

## Tasks

### Task 1: Move existing template and create section-display template

**Files:**
- `specdacular/templates/context/review-diff.md` (moved from `specdacular/templates/context-review-diff.md`)
- `specdacular/templates/context/section-display.md` (new)

**Action:**
1. Create `specdacular/templates/context/` directory
2. Move `specdacular/templates/context-review-diff.md` → `specdacular/templates/context/review-diff.md`
3. Delete the old file
4. Create `specdacular/templates/context/section-display.md` — template for displaying a single context section to the user during review

### Task 2: Update workflow references

**Files:** `specdacular/workflows/context-review.md`

**Action:**
Update all references from `specdacular/templates/context-review-diff.md` to `specdacular/templates/context/review-diff.md`. Add reference to `specdacular/templates/context/section-display.md`.
