# Specdacular Development Guide

## Multi-Tool Support

Specdacular supports both **Claude Code** and **OpenAI Codex**. When implementing new features or modifying existing workflows:

1. **Claude Code is the source of truth.** All commands, workflows, references, and templates live in `commands/`, `specdacular/`, and `agents/`.

2. **Codex output is generated.** The `codex/` directory is produced by `bin/build-codex.js`. Never edit files in `codex/` directly.

3. **After changing any workflow or command**, run `npm run build:codex` to regenerate Codex skills. Verify with:
   ```bash
   npm run build:codex
   grep -r "~/.claude/" codex/ # should find nothing
   grep -r "Read tool\|Write tool\|Grep tool\|Glob tool" codex/ # should find nothing
   ```

4. **Tool-agnostic writing.** When writing workflow prose, prefer tool-agnostic phrasing where possible. The build script translates tool-specific references, but cleaner source = cleaner output.
   - OK: "Read the file at `path`" (gets translated)
   - Better: "Check the contents of `path`" (works in both tools)

5. **No `@path` in skill-facing content.** Codex doesn't support `@path` file inclusion. Use `references/` folder pattern instead. The build script handles this translation.

6. **Parallel agents → sequential fallback.** Codex has no parallel agent spawning. Workflows using `Task tool` with parallel agents get converted to sequential execution in Codex output.
