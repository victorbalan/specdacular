# Decisions: workflow-validation

**Feature:** workflow-validation
**Created:** 2026-02-06
**Last Updated:** 2026-02-06

---

## Active Decisions

### DEC-001: Three-tier deviation categories for execution

**Date:** 2026-02-06
**Status:** Active
**Phase:** 0
**Context:** Current execution workflow has only vague "auto-fix" vs "ask first" guidance. Claude can't consistently classify deviations.
**Decision:** Replace with explicit three-tier system: auto-fix, ask user, stop & diagnose.
**Rationale:**
- Clear criteria for each tier enables consistent Claude behavior
- "Stop & diagnose" fills a critical gap — currently there's no "this is fundamentally wrong" signal
- Reduces "stuck" states where Claude continues on a broken foundation
**Implications:**
- `execute-plan.md` workflow must define each tier with examples
- Claude must classify each deviation before acting
- "Stop & diagnose" must include diagnostic output (files modified, test output, likely cause)

---

### DEC-002: Pre-flight validation in every workflow

**Date:** 2026-02-06
**Status:** Active
**Phase:** 0
**Context:** Commands proceed without checking prerequisites, leading to confusing failures mid-workflow.
**Decision:** Add a "Prerequisites Check" section at the top of every workflow with specific checks and recovery commands.
**Rationale:**
- Fail fast is always better than fail mid-execution
- Recovery commands in error messages eliminate guesswork
- Consistent pattern across all workflows
**Implications:**
- Every workflow file gets a new section
- Checks vary by workflow (execute needs plans, discuss needs feature dir, etc.)
- Errors must include the exact recovery command to run

---

## Superseded Decisions

(none)

---

## Decision Log

| ID | Date | Title | Status |
|----|------|-------|--------|
| DEC-001 | 2026-02-06 | Three-tier deviation categories for execution | Active |
| DEC-002 | 2026-02-06 | Pre-flight validation in every workflow | Active |
