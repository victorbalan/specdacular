# Roadmap: 180-turn

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 3 |
| Current Phase | 1 |
| Status | Not Started |

---

## Phases

- [ ] **Phase 1: Docs Generation Command** — Create `/specd.docs` command and workflow (spawn agents, merge, generate topic docs, write CLAUDE.md routing table)
- [ ] **Phase 2: Docs Review Command** — Create `/specd.docs.review` command and workflow (audit, staleness, research-backed suggestions, date tracking)
- [ ] **Phase 3: Cleanup & Migration** — Remove old codebase commands, strip `.specd/codebase/` references from all workflows, update help and installer

---

## Phase Details

### Phase 1: Docs Generation Command

**Goal:** A working `/specd.docs` command that spawns the 4 mapper agents, merges their raw outputs into dynamically-detected topic docs in `docs/`, generates `docs/rules.md`, and writes/updates CLAUDE.md as a pure routing table.

**Creates:**
- `commands/specd.docs.md` — Command definition with frontmatter
- `specdacular/workflows/docs.md` — Full workflow: discover docs location, spawn 4 agents to temp dir, merge outputs into topic clusters, propose doc list to user, generate docs with frontmatter, write/update CLAUDE.md routing table

**Success Criteria:**
1. `/specd.docs` on a project with no CLAUDE.md generates `docs/*.md` files with frontmatter and a new CLAUDE.md routing table
2. `/specd.docs` on a project with existing CLAUDE.md merges routing table without destroying user content
3. `docs/rules.md` is always generated with always-true project rules
4. Topics are dynamically determined from agent analysis (no hardcoded list)
5. User sees proposed doc list and approves before generation

**Dependencies:** None (first phase)

---

### Phase 2: Docs Review Command

**Goal:** A working `/specd.docs.review` command that audits existing docs for accuracy and staleness, suggests improvements using research agents, proposes new topic files for gaps, and can suggest CLAUDE.md cleanup.

**Creates:**
- `commands/specd.docs.review.md` — Command definition with frontmatter
- `specdacular/workflows/docs-review.md` — Full workflow: read docs with frontmatter, check against current code, spawn research agents for best practices, propose updates/new docs/removals, update review dates

**Success Criteria:**
1. `/specd.docs.review` flags docs with outdated `last_reviewed` dates
2. Review detects docs that no longer match current code patterns
3. Research agents suggest best-practice improvements per detected stack
4. Can propose new topic docs for gaps found in coverage
5. Can propose CLAUDE.md cleanup if there's bloat
6. Updates frontmatter `last_reviewed` after user approves review

**Dependencies:** Phase 1 complete (needs docs and CLAUDE.md to exist)

---

### Phase 3: Cleanup & Migration

**Goal:** Remove all traces of the old `.specd/codebase/` system. Old commands deleted, all workflow references updated, installer and help updated.

**Removes:**
- `commands/specd.codebase.map.md` — Old mapping command
- `commands/specd.codebase.review.md` — Old review command (if exists)
- `specdacular/workflows/map-codebase.md` — Old mapping workflow

**Modifies:**
- `specdacular/workflows/new.md` — Remove `.specd/codebase/` checks, reference CLAUDE.md instead
- `specdacular/workflows/execute.md` — Remove `.specd/codebase/` references
- `specdacular/workflows/plan.md` — Remove `.specd/codebase/` references
- `specdacular/workflows/discuss.md` — Remove `.specd/codebase/` references
- `specdacular/workflows/research.md` — Remove `.specd/codebase/` references
- `commands/specd.help.md` — Replace old commands with new ones
- `bin/install.js` — Update installation to include new commands, remove old ones

**Success Criteria:**
1. No references to `.specd/codebase/` remain in any workflow file
2. Old commands no longer exist in `commands/`
3. Old workflow no longer exists in `specdacular/workflows/`
4. `/specd.help` shows new commands instead of old
5. `bin/install.js` installs new commands and skips old ones
6. Existing task flows (new, discuss, plan, execute, research) still work without `.specd/codebase/`

**Dependencies:** Phase 1 and Phase 2 complete (need new commands in place before removing old)

---

## Execution Order

```
Phase 1: Docs Generation Command
└── PLAN.md
    ↓
Phase 2: Docs Review Command
└── PLAN.md
    ↓
Phase 3: Cleanup & Migration
└── PLAN.md
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Reuse 4 mapper agents | Phase 1 — agents stay unchanged, workflow does the merging |
| DEC-002: Docs location discovery | Phase 1 — workflow must parse CLAUDE.md for existing docs path |
| DEC-004: Non-destructive CLAUDE.md | Phase 1 — merge logic needed, not overwrite |
| DEC-005: Dynamic topics | Phase 1 — merge step detects topics from agent outputs |
| DEC-006: CLAUDE.md is pure router | Phase 1 — rules.md always generated, CLAUDE.md has no inline rules |
| DEC-007: Frontmatter tracking | Phase 1 & 2 — generation writes frontmatter, review reads it |
| DEC-008: Research during review only | Phase 2 — review command spawns research agents, generation doesn't |
| DEC-003: Separate review command | Phase 2 — review is its own command, not part of generation |
