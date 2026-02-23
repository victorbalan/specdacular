# Research: context-tools

**Researched:** 2026-02-17

## Summary

The context-tools task fits cleanly into Specdacular's existing architecture: three workflow files dispatched from the toolbox menu, using established patterns for validation, committing, and agent spawning. The main technical challenges are section-level markdown parsing (handled by giving Claude explicit boundary rules, not regex), targeted re-mapping (requires a new scoped agent or inline prompt to avoid overwriting other sections), and diff presentation (semantic summaries beat raw line diffs for LLM-regenerated content).

Key risks center on section boundary ambiguity (must explicitly define whether parent sections include children), style drift in re-mapped content (LLM regeneration changes phrasing even when facts are the same), and review fatigue (offer "confirm all remaining" escape hatch). The USER_MODIFIED HTML comment approach is sound but needs precise placement rules and code-fence awareness.

**Key recommendation:** Create three separate workflow files (not one monolithic workflow), use a targeted section-remapper agent (not the full codebase mapper) for re-mapping, and present diffs as semantic summaries rather than line-level diffs.

---

## Codebase Integration

### Import Dependencies

**Core references (all three workflows use these):**
- `specdacular/references/commit-docs.md` — Auto-commits changes respecting `auto_commit_docs` setting
- `.specd/codebase/*.md` — The 4 context files being managed

**Note:** Unlike other toolbox operations, context workflows do NOT require a task — they operate on project-level codebase docs. Task validation (`validate-task.md`) should be skipped or made optional.

### Patterns to Follow

- **Workflow structure:** `<purpose>`, `<philosophy>`, `<process>` with named `<step>` elements, `<success_criteria>` — matches all existing workflows
- **Toolbox dispatch:** Add menu options to `commands/specd.toolbox.md` AskUserQuestion, each pointing to a workflow via `@~/.claude/specdacular/workflows/context-*.md`
- **Commit pattern:** Use `commit-docs.md` reference with `$FILES`, `$MESSAGE`, `$LABEL` variables
- **Agent spawning:** Use Task tool with `run_in_background: true` for targeted re-mapping (same pattern as map-codebase.md)

### File Locations

| File | Purpose |
|------|---------|
| `specdacular/workflows/context-review.md` | Review workflow |
| `specdacular/workflows/context-add.md` | Add workflow |
| `specdacular/workflows/context-status.md` | Status dashboard workflow |
| `commands/specd.toolbox.md` | Updated with 3 new menu options |

### Integration Points

1. **Toolbox menu** — Add "Context Review", "Context Add", "Context Status" options
2. **Codebase files** — Read/parse/edit `.specd/codebase/*.md` (MAP.md, PATTERNS.md, STRUCTURE.md, CONCERNS.md)
3. **Mapper agent** — Spawn for targeted single-section re-mapping with scoped prompt
4. **Git** — Commit changes via commit-docs.md, create pre-review checkpoint before destructive operations

---

## Implementation Patterns

### Section Parsing Strategy

Since Specdacular has no runtime (the LLM reads and interprets files), "section parsing" means giving Claude explicit boundary rules:

**Rules for the workflow to follow:**
1. A `##` heading starts a top-level section. Its content runs until the next `##` or end of file
2. A `###` heading starts a subsection. Its content runs until the next `###`, `##`, or end of file
3. Ignore `#` (document title) — not part of the section list
4. Code fences (```) do NOT start new sections even if they contain `#` characters
5. Process each section in document order, top to bottom

**Two-level traversal for context:review:**
- Present `##` sections as group headers (show name, context)
- Present `###` sections as individually reviewable units
- If a `##` has no `###` children, treat the `##` itself as the reviewable unit

### Diff Display Pattern

Raw unified diffs (`--- / +++`) are misleading for LLM-regenerated content because phrasing changes make everything look different even when facts are the same (style drift).

**Recommended approach:** Show both versions in readable fenced blocks with a semantic "Changes" summary:

```
**Current content:**
[exact current text]

**Re-mapped content:**
[exact new text from mapper]

**Key differences:**
- Added: [new information]
- Removed: [missing information]
- Changed: [factual differences]
```

For short sections (<15 lines): show both in full. For long sections: show only changed regions with 3 lines of context.

### Inline Metadata Pattern

**Document-level timestamps** — plain text lines after the `# Title`, extending the existing `Generated:` pattern:

```markdown
# Codebase Map
Generated: 2026-02-04
Last Reviewed: 2026-02-17
Last Modified: 2026-02-17
```

**Section-level USER_MODIFIED tags** — HTML comment on the line immediately after the heading:

```markdown
## Architecture Overview
<!-- USER_MODIFIED: 2026-02-17 -->

Content here...
```

**Parsing rules:**
- After each heading, check if the next non-blank line matches `<!-- USER_MODIFIED: YYYY-MM-DD -->`
- Only look for tags outside of fenced code blocks
- Never add more than one annotation comment per section
- If section already has a tag, replace it (don't duplicate)

### Targeted Re-mapping Pattern

**Do NOT reuse the full codebase mapper** — it writes entire documents and would overwrite all other sections' USER_MODIFIED content.

**Recommended:** Spawn a general-purpose Task agent with a scoped prompt that:
1. Receives the section heading, current content, and USER_MODIFIED context
2. Re-explores only the relevant codebase areas
3. Returns replacement content as a string (does NOT write files)
4. The orchestrating workflow handles the surgical replacement

**Scope constraints in the prompt:**
- Specify exact section heading to re-map
- List other section headings to NOT cover (prevent overlap)
- Provide USER_MODIFIED content so mapper can consider user's additions
- Instruct agent to verify all file paths still exist

---

## Pitfalls

### Critical

**Section boundary ambiguity with children**
- When removing a `##` section, must explicitly warn: "Removing `## Core Modules` will also remove 3 subsections. Confirm?"
- Prevention: Always count and display child sections before destructive operations

**USER_MODIFIED tag placement precision**
- Tag must be on its own line immediately after the heading, no blank line between
- Must NOT be on the same line as the heading (breaks some renderers)
- Provide literal example in workflow `<critical_rules>`

**Tags inside fenced code blocks**
- Code blocks in PATTERNS.md contain `<!-- -->` syntax in examples
- Prevention: Specify "look for USER_MODIFIED only outside fenced code blocks"

**Style drift in re-mapped content**
- LLM regeneration changes phrasing even when facts are identical
- Prevention: Frame diffs as "semantic differences" — summarize what's actually new/removed/changed in meaning
- Pre-warn user: "AI regeneration uses different phrasing. Focus on factual differences."

**Partial context hallucination**
- Single-section re-mapper has less context than the original full mapper
- May hallucinate file paths or miss new relevant files
- Prevention: Post-re-map step to verify all file paths mentioned still exist

### Moderate

**Timestamp staleness cascade**
- User confirms section without reading → timestamp marks stale content as fresh
- Prevention: Distinguish `Last Reviewed` (user approved) from `Last Modified` (content changed). USER_MODIFIED tag only on explicit edit, not on confirm

**Wrong section targeting in context:add**
- Ambiguous section titles may cause placement in wrong section
- Prevention: Always show chosen target and ask confirmation before writing. Offer alternative sections.

**No recovery path for section removal**
- Prevention: Create git checkpoint before any destructive action in a review session

**Review loses position on long files**
- Files with many sections accumulate conversation context
- Prevention: Write review progress to state (which sections done) rather than relying on conversation memory

**Inconsistent timestamp formats**
- Different workflows might write dates differently
- Prevention: Define canonical format `YYYY-MM-DD` in workflow `<critical_rules>`. Never write times or month names.

### Warnings

| When Implementing | Watch Out For | Prevention |
|-------------------|---------------|------------|
| Review flow | Fatigue from too many prompts | Offer "confirm all remaining" after each section |
| context:add | Duplicate content across files | Grep for key terms before adding; show existing matches |
| USER_MODIFIED tags | Invisible in rendered markdown | Note in context:status that tags are HTML comments |
| Re-mapper scope | Agent over-explores beyond section scope | Provide explicit scope constraints listing other section headings to NOT cover |
| Heading edits | User changes heading level during edit | Check heading hierarchy after edit |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Codebase integration | HIGH | Existing patterns are clear and well-documented; direct inspection of all relevant files |
| Implementation patterns | HIGH | Section parsing, metadata, and diff patterns are well-established; verified against codebase structure |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls confirmed by codebase evidence and CommonMark spec; some LLM-specific behaviors inferred |

## Open Questions

- Should the toolbox present context operations only when `.specd/codebase/` exists, or always show them with a "run map-codebase first" message?
- For targeted re-mapping, is a new named agent (`specd-section-remapper`) worth creating, or is an inline Task prompt sufficient?

## Sources

### Codebase
- `commands/specd.toolbox.md` — Toolbox menu pattern
- `specdacular/workflows/discuss.md`, `research.md`, `execute.md`, `review.md` — Workflow structure patterns
- `specdacular/references/commit-docs.md`, `validate-task.md`, `load-context.md` — Shared references
- `agents/specd-codebase-mapper.md` — Mapper agent for re-mapping pattern
- `.specd/codebase/*.md` — Current file structure and section layout

### External
- [CommonMark Spec §4.6 HTML Blocks](https://spec.commonmark.org/0.29/)
- [Comment facility in CommonMark](https://talk.commonmark.org/t/comment-facility-in-commonmark/1271)
- [Why Your Code Gen AI Doesn't Understand Diffs](https://baz.co/resources/why-your-code-gen-ai-doesnt-understand-diffs)
- [Multi-Agent AI Coordination Failure — Galileo](https://galileo.ai/blog/multi-agent-coordination-failure-mitigation)
- [AI Context Failures — Chris Lema](https://chrislema.com/ai-context-failures-nine-ways-your-ai-agent-breaks/)
- [Progressive Disclosure — IxDF](https://www.interaction-design.org/literature/topics/progressive-disclosure)
- [UX Patterns for CLI Tools — Lucas F. Costa](https://lucasfcosta.com/2022/06/01/ux-patterns-cli-tools.html)
