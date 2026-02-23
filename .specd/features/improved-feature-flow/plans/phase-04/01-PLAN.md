---
feature: improved-feature-flow
phase: 4
plan: 01
depends_on: []
creates: []
modifies:
  - commands/specd.help.md
deletes:
  - commands/specd.feature/discuss.md
  - commands/specd.feature/research.md
  - commands/specd.feature/plan.md
  - commands/specd.feature/next.md
  - commands/specd.phase/ (entire directory)
  - specdacular/workflows/next-feature.md
---

# Plan 01: Delete Old Commands + Update Help

## Objective

Remove all old command files that are replaced by `continue` and `toolbox`, delete the old `next-feature.md` workflow, and rewrite help.md for the new command surface.

## Context

**Relevant Decisions:**
- DEC-001: Toolbox replaces standalone discuss/research/plan
- DEC-002: Remove all standalone phase commands
- DEC-004: next renamed to continue
- DEC-005: Simplified autocomplete surface

---

## Tasks

### Task 1: Delete old feature command files

**Action:**
Delete these files from `commands/specd.feature/`:
- `discuss.md` — replaced by toolbox "Discuss"
- `research.md` — replaced by toolbox "Research"
- `plan.md` — replaced by toolbox "Plan"
- `next.md` — replaced by continue.md

```bash
rm commands/specd.feature/discuss.md
rm commands/specd.feature/research.md
rm commands/specd.feature/plan.md
rm commands/specd.feature/next.md
```

**Verify:**
```bash
ls commands/specd.feature/
# Should show exactly: continue.md, new.md, toolbox.md
```

**Done when:**
- [ ] Only 3 files remain in `commands/specd.feature/`: new.md, continue.md, toolbox.md

---

### Task 2: Delete all phase command files

**Action:**
Delete the entire `commands/specd.phase/` directory:

```bash
rm -rf commands/specd.phase/
```

These are all replaced by the `continue` flow and `toolbox`:
- `execute.md` — driven by continue
- `insert.md` — toolbox "Insert phase"
- `plan.md` — toolbox "Plan" → specific phase
- `prepare.md` — driven by continue
- `renumber.md` — eliminated (DEC-006 decimal numbering)
- `research.md` — toolbox "Research" → specific phase
- `review.md` — driven by continue → review-feature.md

**Verify:**
```bash
[ ! -d "commands/specd.phase" ] && echo "✓ phase dir removed" || echo "✗ still exists"
```

**Done when:**
- [ ] `commands/specd.phase/` directory no longer exists

---

### Task 3: Delete old next-feature workflow

**Action:**
Delete the old workflow that was replaced by continue-feature.md:

```bash
rm specdacular/workflows/next-feature.md
```

**Verify:**
```bash
[ ! -f "specdacular/workflows/next-feature.md" ] && echo "✓ removed" || echo "✗ still exists"
[ -f "specdacular/workflows/continue-feature.md" ] && echo "✓ replacement exists" || echo "✗ MISSING"
```

**Done when:**
- [ ] `next-feature.md` removed
- [ ] `continue-feature.md` still exists

---

### Task 4: Update help.md

**Files:** `commands/specd.help.md`

**Action:**
Rewrite the help output to document the new simplified command surface:

```markdown
# Specdacular

**AI-optimized codebase documentation and feature planning for Claude.**

## Commands

### Core Flow

| Command | Description |
|---------|-------------|
| `/specd.feature:new [name]` | Initialize a feature, start first discussion |
| `/specd.feature:continue [name]` | Continue feature lifecycle — picks up where you left off |
| `/specd.feature:toolbox [name]` | Advanced operations: discuss, research, plan, review, insert |

### Utilities

| Command | Description |
|---------|-------------|
| `/specd.codebase.map` | Analyze codebase with parallel agents → AI-optimized docs |
| `/specd.status [--all]` | Show feature status dashboard |
| `/specd.help` | Show this help |
| `/specd.update` | Update Specdacular to the latest version |

---

## Feature Flow

```
/specd.feature:new → /specd.feature:continue → continue → continue → done
```

**You only need three commands:**

1. **`/specd.feature:new [name]`** — Start here. Creates feature folder, asks initial questions.
2. **`/specd.feature:continue [name]`** — Picks up where you left off. Drives the entire lifecycle:
   - Discussion → Research → Planning → Phase Execution → Review
   - After each step, offers the next step or "stop for now"
   - Works across context windows — reads state fresh each time
3. **`/specd.feature:toolbox [name]`** — Advanced operations menu:
   - **Discuss** — Explore open questions (feature or phase level)
   - **Research** — Spawn parallel agents for patterns/pitfalls
   - **Plan** — Create implementation plans
   - **Review** — Review executed work, report issues
   - **Insert phase** — Add a phase mid-development (decimal numbering)

### Quick Start

```
/specd.feature:new user-dashboard
/specd.feature:continue user-dashboard
```

After initialization, just keep running `continue`. It figures out what's next.

---

## Codebase Documentation

```
/specd.codebase.map
```

Spawns 4 parallel agents to analyze your codebase and creates `.specd/codebase/`:

| Document | What it contains |
|----------|------------------|
| **MAP.md** | Navigation: modules, functions, entry points |
| **PATTERNS.md** | Code examples: services, errors, testing |
| **STRUCTURE.md** | Organization: where to put new code |
| **CONCERNS.md** | Warnings: gotchas, anti-patterns, debt |

---

## Updating

When an update is available, you'll see `update available` in your statusline. Run:
```
/specd.update
```
Or manually: `npx specdacular@latest`

---

GitHub: https://github.com/vlad-ds/specdacular
```

**Verify:**
```bash
grep -q "feature:continue" commands/specd.help.md && echo "✓ continue documented"
grep -q "feature:toolbox" commands/specd.help.md && echo "✓ toolbox documented"
! grep -q "phase:execute" commands/specd.help.md && echo "✓ no old phase commands"
```

**Done when:**
- [ ] Help documents new 3-command feature flow
- [ ] No references to old phase commands
- [ ] Toolbox menu options listed
- [ ] Quick start uses new commands

---

## Verification

After all tasks:

```bash
# Command directory structure
echo "=== commands/specd. ==="
ls commands/specd.
echo "=== commands/specd.feature/ ==="
ls commands/specd.feature/

# No phase directory
[ ! -d "commands/specd.phase" ] && echo "✓ phase dir gone"

# No old workflow
[ ! -f "specdacular/workflows/next-feature.md" ] && echo "✓ next-feature gone"

# Help is updated
grep -q "feature:continue" commands/specd.help.md && echo "✓ help updated"
```

---

## Output

When this plan is complete, commit:
```bash
git add -A commands/specd. specdacular/workflows/next-feature.md
git commit -m "feat(improved-feature-flow): remove old commands, update help

Plan 4.01 complete:
- Deleted 4 old feature command files (discuss, research, plan, next)
- Deleted entire commands/specd.phase/ directory (7 files)
- Deleted old next-feature.md workflow
- Rewrote help.md for new 3-command surface"
```

Phase 4 and feature complete after this plan.
