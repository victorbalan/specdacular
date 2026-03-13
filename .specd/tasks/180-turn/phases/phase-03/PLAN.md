---
task: 180-turn
phase: 3
depends_on: [1, 2]
creates: []
modifies:
  - commands/specd.new.md
  - specdacular/workflows/new.md
  - specdacular/workflows/context-add.md
  - specdacular/workflows/context-manual-review.md
  - specdacular/references/load-context.md
  - specdacular/workflows/orchestrator/new.md
  - specdacular/workflows/orchestrator/plan.md
  - specdacular/HELP.md
  - specdacular/templates/tasks/PLAN.md
  - bin/install.js
  - AGENTS.md
  - README.md
removes:
  - commands/specd.codebase.map.md
  - commands/specd.codebase.review.md
  - specdacular/workflows/map-codebase.md
---

# Phase 3: Cleanup & Migration

## Objective

Remove all traces of the old `.specd/codebase/` system. Delete old commands and workflow, update all references across the project, and add new commands to help and installer.

## Context

**Deviation from ROADMAP:** The ROADMAP listed discuss.md, plan.md, execute.md, research.md as needing modification. Actual grep shows these files have NO `.specd/codebase/` references. The real files needing updates are: context-add.md, context-manual-review.md, load-context.md, orchestrator/new.md, orchestrator/plan.md, HELP.md, templates/tasks/PLAN.md, AGENTS.md, README.md.

**Relevant Decisions:**
- DEC-006: CLAUDE.md is purely a router — references should point to docs/ not .specd/codebase/
- Phase 1 & 2: No auto-commit — user manages commits

**Files confirmed by grep to contain `.specd/codebase` references:**

**DELETE entirely:**
- `commands/specd.codebase.map.md` — Old mapping command
- `commands/specd.codebase.review.md` — Old review command
- `specdacular/workflows/map-codebase.md` — Old mapping workflow

**UPDATE references:**
- `commands/specd.new.md` — References .specd/codebase/ in flow
- `specdacular/workflows/new.md` — References .specd/codebase/
- `specdacular/workflows/context-add.md` — References .specd/codebase/*.md
- `specdacular/workflows/context-manual-review.md` — References .specd/codebase/*.md
- `specdacular/references/load-context.md` — References .specd/codebase/
- `specdacular/workflows/orchestrator/new.md` — References .specd/codebase/ docs
- `specdacular/workflows/orchestrator/plan.md` — References .specd/codebase/ docs
- `specdacular/HELP.md` — Lists old commands
- `specdacular/templates/tasks/PLAN.md` — Template references .specd/codebase/
- `bin/install.js` — Lists old command in help text
- `AGENTS.md` — References .specd/codebase/
- `README.md` — References .specd/codebase/

---

## Tasks

### Task 1: Delete old commands and workflow

**Files:** `commands/specd.codebase.map.md`, `commands/specd.codebase.review.md`, `specdacular/workflows/map-codebase.md`

**Action:**
Delete these 3 files. They are fully replaced by the new `/specd.docs` and `/specd.docs.review` commands.

```bash
rm commands/specd.codebase.map.md
rm commands/specd.codebase.review.md
rm specdacular/workflows/map-codebase.md
```

**Verify:**
```bash
[ ! -f "commands/specd.codebase.map.md" ] && [ ! -f "commands/specd.codebase.review.md" ] && [ ! -f "specdacular/workflows/map-codebase.md" ] && echo "PASS" || echo "FAIL"
```

**Done when:**
- [ ] All 3 files deleted

---

### Task 2: Update workflow files that reference .specd/codebase/

**Files:** `commands/specd.new.md`, `specdacular/workflows/new.md`, `specdacular/workflows/context-add.md`, `specdacular/workflows/context-manual-review.md`, `specdacular/references/load-context.md`, `specdacular/workflows/orchestrator/new.md`, `specdacular/workflows/orchestrator/plan.md`, `specdacular/templates/tasks/PLAN.md`

**Action:**
For each file, read it and replace `.specd/codebase/` references with the new docs system:

- `.specd/codebase/*.md` → `docs/*.md` (or reference CLAUDE.md routing table)
- `.specd/codebase/PATTERNS.md` → `docs/` topic docs (via CLAUDE.md routing)
- `.specd/codebase/STRUCTURE.md` → `docs/` topic docs
- `.specd/codebase/MAP.md` → `docs/` topic docs
- `.specd/codebase/CONCERNS.md` → `docs/` topic docs
- References to `/specd.codebase.map` → `/specd.docs`
- References to `/specd.codebase.review` → `/specd.docs.review`
- Checks for `.specd/codebase/` directory existence → check for `docs/` + CLAUDE.md existence
- Offering to run `/specd.codebase.map` → offer `/specd.docs`

**Key changes per file:**

**commands/specd.new.md:** Replace the flow that checks for .specd/codebase/ and offers /specd.codebase.map with checking for docs/ + CLAUDE.md and offering /specd.docs.

**specdacular/workflows/new.md:** Same as above — update codebase doc detection.

**specdacular/workflows/context-add.md:** Replace references to reading .specd/codebase/*.md with reading docs from CLAUDE.md routing table.

**specdacular/workflows/context-manual-review.md:** Replace references to .specd/codebase/*.md with docs/ system.

**specdacular/references/load-context.md:** Update context loading to look at docs/ via CLAUDE.md instead of .specd/codebase/.

**specdacular/workflows/orchestrator/new.md:** Update orchestrator docs references (PROJECTS.md, TOPOLOGY.md, etc. stay in .specd/codebase/ for orchestrator mode OR migrate — check what makes sense).

**specdacular/workflows/orchestrator/plan.md:** Same as orchestrator/new.md.

**specdacular/templates/tasks/PLAN.md:** Replace `@.specd/codebase/PATTERNS.md` and `@.specd/codebase/STRUCTURE.md` references with docs/ references.

**Verify:**
```bash
# No .specd/codebase references in modified files
for f in commands/specd.new.md specdacular/workflows/new.md specdacular/workflows/context-add.md specdacular/workflows/context-manual-review.md specdacular/references/load-context.md specdacular/workflows/orchestrator/new.md specdacular/workflows/orchestrator/plan.md specdacular/templates/tasks/PLAN.md; do
  grep -q ".specd/codebase" "$f" 2>/dev/null && echo "STILL HAS REF: $f" || echo "Clean: $f"
done
```

**Done when:**
- [ ] No `.specd/codebase/` references in any modified file
- [ ] New commands referenced where appropriate

---

### Task 3: Update help, installer, docs

**Files:** `specdacular/HELP.md`, `bin/install.js`, `AGENTS.md`, `README.md`

**Action:**

**specdacular/HELP.md:**
- Replace `/specd.codebase.map` entry with `/specd.docs` — Generate topic-based docs and CLAUDE.md routing table
- Replace `/specd.codebase.review` entry with `/specd.docs.review` — Review and audit docs for accuracy and staleness
- Update any descriptions referencing the old .specd/codebase/ system

**bin/install.js:**
- Replace `/specd.codebase.map` in help text with `/specd.docs`
- Add `/specd.docs.review` to help text if not listed
- Ensure new command files are included in installation (commands/ directory is installed wholesale, so just verify)

**AGENTS.md:**
- Update any references to .specd/codebase/ output location to docs/ system
- Keep mapper agent documentation (agents are reused)

**README.md:**
- Update any references to .specd/codebase/ with the new docs/ system
- Update command list if commands are mentioned

**Verify:**
```bash
# No old command references in help/installer
grep -q "codebase\.map\|codebase\.review" specdacular/HELP.md && echo "HELP STILL HAS OLD" || echo "HELP clean"
grep -q "codebase\.map\|codebase\.review" bin/install.js && echo "INSTALL STILL HAS OLD" || echo "INSTALL clean"
# New commands present
grep -q "specd.docs" specdacular/HELP.md && echo "HELP has new" || echo "HELP missing new"
```

**Done when:**
- [ ] HELP.md shows new commands, not old
- [ ] bin/install.js references new commands
- [ ] AGENTS.md and README.md updated
- [ ] No references to old commands remain

---

## Verification

After all tasks complete:

```bash
# No old files exist
[ ! -f "commands/specd.codebase.map.md" ] && [ ! -f "commands/specd.codebase.review.md" ] && [ ! -f "specdacular/workflows/map-codebase.md" ] && echo "Old files removed: OK" || echo "Old files still exist"

# No .specd/codebase references in workflow/command files (excluding task docs and actual codebase dir)
grep -rl ".specd/codebase" --include="*.md" commands/ specdacular/ 2>/dev/null | grep -v ".specd/tasks" && echo "STILL HAS REFS" || echo "All refs cleaned: OK"

# New commands in help
grep -q "specd.docs" specdacular/HELP.md && echo "Help updated: OK" || echo "Help not updated"
```

**Phase is complete when:**
- [ ] All tasks marked done
- [ ] All verification commands pass
- [ ] No `.specd/codebase/` references in any workflow/command file

---

## Implementation Log

During implementation, capture decisions and deviations to `.specd/tasks/180-turn/CHANGELOG.md`.
