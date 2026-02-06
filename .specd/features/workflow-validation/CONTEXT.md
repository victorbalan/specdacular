# Context: workflow-validation

**Last Updated:** 2026-02-06
**Sessions:** 1

## Discussion Summary

Identified that Specdacular commands lack prerequisite validation and ordering enforcement. `phase:execute` can run without plans, dependencies in ROADMAP.md are unchecked, and error messages are generic. Designed a three-part solution: pre-flight validation in every workflow, a standalone `specd:validate` command, and structured deviation categories during execution.

---

## Resolved Questions

### Validation scope

**Question:** Should validation be strict (enforce everything) or lenient (warn on non-critical)?

**Resolution:** Two tiers — error on blocking issues, warn on non-critical.

**Details:**
- Error (stop execution): Missing required files, wrong stage, unmet dependencies
- Warn (continue with message): Missing optional files, inconsistent metadata, stale codebase docs
- Never silent: Every check produces a visible result

---

### Deviation categories during execution

**Question:** How should deviations from plans be categorized?

**Resolution:** Three-tier system replacing the current vague "auto-fix vs ask".

**Details:**
- **Auto-fix**: Missing import, wrong file path in plan, type mismatch fixable from context
- **Ask user**: New file not in plan, different architecture than planned, failed verification after 2 retries
- **Stop & diagnose**: Dependency not installed, API not available, fundamental plan assumption wrong
- Each category has clear criteria so Claude can classify deviations consistently

---

## Deferred Questions

### Validation command output format

**Reason:** Need to see real validation failures to design good output
**Default for now:** Simple pass/fail list with recovery commands
**Revisit when:** During research/planning phase

### How strict to be about markdown structure

**Reason:** Too strict = brittle, too lenient = useless
**Default for now:** Check for key fields (Decision ID, Date, Status) but not exact formatting
**Revisit when:** After testing against real features

---

## Discussion History

| Date | Topics Covered | Key Outcomes |
|------|----------------|--------------|
| 2026-02-06 | Validation gaps, deviation handling, error recovery | Feature initialized, validation tiers designed, deviation categories defined |

---

## Gray Areas Remaining

- [ ] How deep should `specd:validate` go — file existence only, or parse content for structure?
- [ ] Whether to validate cross-references (e.g., DEC-XXX referenced in plans actually exists)
- [ ] How to handle features in early stages (discussion) that don't have research/plans yet
- [ ] Integration with the Agent Skills migration — how validation works in new structure

---

## Quick Reference

- **Feature:** `.specd/features/workflow-validation/FEATURE.md`
- **Decisions:** `.specd/features/workflow-validation/DECISIONS.md`
- **Research:** `.specd/features/workflow-validation/RESEARCH.md` (not yet created)
