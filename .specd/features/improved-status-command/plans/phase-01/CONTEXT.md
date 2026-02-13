# Phase 1 Context: Add orchestrator support to status workflow

**Feature:** improved-status-command
**Phase Type:** Integration
**Discussed:** 2026-02-11

## Phase Overview

Extend the status workflow to detect orchestrator mode and display features in a grouped hierarchy — orchestrator features with sub-project features indented underneath, plus standalone sub-project features in a separate section.

## Resolved Questions

### Feature matching approach

**Question:** How do orchestrator features map to sub-project features?
**Resolution:** Use feature name matching by convention — the orchestrator feature and sub-project features share the same name. Read the orchestrator feature's `config.json` `projects` array to get project paths, then check if `{project-path}/.specd/features/{feature-name}/` exists for each.

### Sub-project data extraction

**Question:** What data to show for sub-project feature rows?
**Resolution:** Same fields as root features — stage, plans, next action — extracted from sub-project STATE.md using the same logic. Format with `└ project-name` prefix for indentation.

### Detection flow

**Question:** Where does orchestrator detection happen in the workflow?
**Resolution:** After step 1 (parse arguments), check `.specd/config.json` for `type: "orchestrator"`. If detected, branch to orchestrator-specific gathering logic. If not, use existing single-project logic unchanged.

### --all flag in orchestrator mode

**Question:** Should completed orchestrator features hide their sub-project rows?
**Resolution:** Yes — completed/abandoned orchestrator features and their sub-project rows are hidden together unless `--all` is used.

## Gray Areas Remaining

None.

## Implications for Plans

- The workflow needs a new step between argument parsing and feature gathering to detect orchestrator mode
- Orchestrator mode branches to separate gathering logic that reads both root and sub-project features
- Output formatting needs tree-style indentation for sub-project rows
- A second pass identifies standalone sub-project features (present in sub-projects but not tied to any orchestrator feature)
