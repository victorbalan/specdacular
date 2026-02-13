# Roadmap: tool-agnostic

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 4 |
| Current Phase | 1 |
| Status | Phase 1 Planned |

---

## Phases

- [ ] **Phase 1: Build Script Foundation** — Core build script with tool translation and frontmatter conversion *(Planned: 1 plan, 2 tasks)*
- [ ] **Phase 2: Easy Workflow Conversion** — Convert 6 simple workflows to Codex skills
- [ ] **Phase 3: Complex Workflow Conversion** — Convert remaining workflows including parallel agent fallback
- [ ] **Phase 4: Installation & Integration** — Add `--codex` flag, AGENTS.md, config.toml, pre-commit hook

---

## Phase Details

### Phase 1: Build Script Foundation

**Goal:** A working `bin/build-codex.js` that can transform a single command+workflow pair into a Codex skill directory with correct frontmatter and tool reference translation.

**Creates:**
- `bin/build-codex.js` — Core build script with transformation pipeline
- `codex/` — Output directory (initially with one test skill)

**Modifies:**
- `package.json` — Add `build:codex` script

**Success Criteria:**
1. `node bin/build-codex.js` runs without errors
2. Generates a valid Codex skill directory from `commands/specd/help.md` + `specdacular/workflows/help.md` (simplest case)
3. Generated SKILL.md has correct Codex frontmatter (name + description only)
4. Tool references in workflow.md are translated (Read → cat, Grep → rg, etc.)
5. `@~/.claude/` path references are replaced
6. Auto-generated header comment present in all files

**Dependencies:** None (first phase)

---

### Phase 2: Easy Workflow Conversion

**Goal:** All 6 easy-to-convert workflows generate valid Codex skills. Templates are copied/adapted.

**Creates:**
- `codex/skills/specd-status/` — Status dashboard skill
- `codex/skills/specd-help/` — Help skill
- `codex/skills/specd-config/` — Config skill
- `codex/skills/specd-discuss-feature/` — Discussion skill
- `codex/skills/specd-review-feature/` — Review skill
- `codex/skills/specd-toolbox/` — Toolbox skill
- `codex/templates/` — Feature templates (copied from source, PLAN.md adapted)
- `codex/references/` — Shared references (commit-docs.md, commit-code.md)

**Success Criteria:**
1. `node bin/build-codex.js` generates all 6 skill directories
2. Each skill has valid SKILL.md frontmatter (YAML validates)
3. No Claude Code tool references remain in generated files (Read, Write, Glob, Grep, Task)
4. No `@~/.claude/` paths remain
5. Templates are copied with `@path` references adapted
6. AskUserQuestion → ask_user_question translation verified

**Dependencies:** Phase 1 complete

---

### Phase 3: Complex Workflow Conversion

**Goal:** All remaining workflows converted, including parallel agent workflows (sequential fallback) and the full feature lifecycle.

**Creates:**
- `codex/skills/specd-new-feature/` — Feature initialization skill
- `codex/skills/specd-continue-feature/` — Lifecycle state machine skill
- `codex/skills/specd-map-codebase/` — Codebase mapping (sequential, no parallel agents)
- `codex/skills/specd-research-feature/` — Research (sequential agents)
- `codex/skills/specd-plan-feature/` — Roadmap creation skill
- `codex/skills/specd-plan-phase/` — Phase planning skill
- `codex/skills/specd-prepare-phase/` — Phase preparation skill
- `codex/skills/specd-research-phase/` — Phase research (sequential)
- `codex/skills/specd-execute-plan/` — Plan execution skill
- `codex/skills/specd-review-phase/` — Phase review skill
- `codex/skills/specd-insert-phase/` — Phase insertion skill
- `codex/skills/specd-blueprint/` — Blueprint generation skill (+ variants)

**Success Criteria:**
1. All 20 workflows have corresponding Codex skills
2. Parallel agent workflows converted to sequential with explicit warnings
3. No Task tool references in generated files
4. Edit tool references converted to apply_patch / sed instructions
5. Full build produces no errors

**Dependencies:** Phase 2 complete

---

### Phase 4: Installation & Integration

**Goal:** `npx specdacular --codex` works. Pre-commit hook prevents staleness. AGENTS.md and config.toml generated.

**Creates:**
- `codex/AGENTS.md` — Project-level Codex instructions
- `codex/config.toml` — Codex configuration template

**Modifies:**
- `bin/install.js` — Add `--codex` flag, install from `codex/` directory
- `package.json` — Update help text
- `.husky/pre-commit` or equivalent — Staleness check hook

**Success Criteria:**
1. `npx specdacular --codex` installs skills to `.codex/skills/specd-*/`
2. Generated AGENTS.md is under 32 KiB and references .specd/ docs
3. config.toml has sensible defaults for Specdacular usage
4. Pre-commit hook catches stale generated files
5. `npm run build:codex && git diff --exit-code codex/` passes when up to date
6. README updated with Codex installation instructions

**Dependencies:** Phase 3 complete

---

## Execution Order

```
Phase 1: Build Script Foundation
└── Core transformation pipeline, single skill test
    ↓
Phase 2: Easy Workflow Conversion
└── 6 simple skills + templates + shared references
    ↓
Phase 3: Complex Workflow Conversion
└── 14 remaining skills including parallel→sequential
    ↓
Phase 4: Installation & Integration
└── --codex flag, AGENTS.md, config.toml, pre-commit hook
```

---

## Key Decisions Affecting Roadmap

| Decision | Impact on Phases |
|----------|------------------|
| DEC-001: Generator approach | Entire roadmap is about building the generator |
| DEC-004: Skill directory pattern | Phase 1 creates SKILL.md + references/ structure |
| DEC-005: Progressive rollout | Phases 2 and 3 split easy vs complex workflows |
| DEC-006: Pre-commit hook | Phase 4 includes staleness prevention |

---

## Notes

The progressive rollout (DEC-005) drives the phase split between Phase 2 and 3. Starting with easy workflows validates the translation approach before tackling parallel agent conversion. Phase 4 is last because installation requires all skills to be generated first.
