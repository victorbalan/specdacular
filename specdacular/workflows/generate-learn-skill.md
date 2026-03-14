<purpose>
Generate a project-specific /{namespace}:learn skill that captures coding lessons into the project's docs/ files. Reads existing docs to customize the skill's target table, section headings, and formatting.

**Output:** `.claude/commands/{namespace}/learn.md`
</purpose>

<philosophy>

## Read, Don't Guess

The skill must reference actual doc files with accurate descriptions. Read every doc before generating the skill.

## Match The Format

Each project's docs have their own style. The learn skill should write entries that match — scan existing entries for format patterns (bullet style, heading levels, code block conventions).

</philosophy>

<process>

<step name="check_prerequisites">
Verify that docs exist.

```bash
ls docs/*.md 2>/dev/null
```

**If no docs found:**
```
No docs/ folder found. The learn skill needs docs to write to.

Run /specd.docs first to generate topic-based documentation.
```
End workflow.

Continue to derive_namespace.
</step>

<step name="derive_namespace">
Determine the skill namespace.

**If user provided `$ARGUMENTS`:** Use first non-flag token as namespace.

**If no argument:** Infer from project:
```bash
basename $(pwd) | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g'
```

Use AskUserQuestion:
- header: "Namespace"
- question: "What namespace for your skill? (invoked as `/{ns}:learn`)"
- options:
  - "{inferred name} (Recommended)" — Use the detected project name
  - "Custom" — Enter a different namespace

Set `$NAMESPACE`.

Continue to analyze_docs.
</step>

<step name="analyze_docs">
Read all doc files and build the target mapping.

**For each file in docs/:**

1. Read the file
2. Extract:
   - Filename (e.g., `css-and-styles.md`)
   - Top-level `##` section headings
   - Brief description of what it covers (from first paragraph or heading pattern)
   - Entry format — how existing entries are written (bullet style, one-liners vs paragraphs)

3. Check if `docs/rules.md` exists — if yes, extract its section headings too (these become the rule categories)

**Build `$DOC_TABLE`** — a markdown table with one row per doc:
```
| Doc | Content |
|-----|---------|
| `docs/rules.md` | Project-wide rules (Styling, Components, ...) |
| `docs/css-and-styles.md` | Fonts, colors, spacing, SCSS |
| `docs/react-query-and-apis.md` | Hooks, mutations, API calls |
| ... | ... |
```

**Build `$RULES_SECTIONS`** — list of section headings in rules.md (if it exists).

Continue to generate_skill.
</step>

<step name="generate_skill">
Generate the learn skill file.

```bash
mkdir -p .claude/commands/$NAMESPACE
```

Write `.claude/commands/$NAMESPACE/learn.md` with the following content (replacing all template variables):

```markdown
# /{NAMESPACE}:learn — Capture a lesson into project docs

Capture a coding lesson, mistake, or pattern from the current conversation and add it to the appropriate documentation files so future sessions don't repeat the same mistake.

## Input

The user may provide an explicit lesson as an argument: `$ARGUMENTS`

If no argument is provided, infer the lesson from the recent conversation — look for corrections, mistakes, or new patterns that were discussed.

## Steps

### 1. Identify the lessons

Extract one or more lessons from the conversation or argument. Each lesson should be a clear, actionable statement. Examples:
- "Never use X — use Y instead"
- "Always wrap Z in an error boundary"
- "Use the existing useX hook instead of writing custom fetch logic"

### 2. Classify each lesson

For each lesson, determine:

**Type:**
- **Rule** — A hard constraint ("never X", "always Y"). Goes into `docs/rules.md` AND a topic doc.
- **Pattern** — A technique or code example ("here's how to do X"). Goes into a topic doc only.

**Target doc — pick from:**

{$DOC_TABLE}

**Section — read the target doc to find the right section heading to append under.**

### 3. Present to the user for confirmation

Show each lesson with your suggested classification. Use AskUserQuestion to let the user confirm or adjust the destination for each lesson.

For each lesson, present:
- The lesson text (editable — the user can tweak the wording)
- Whether it's a Rule (→ rules.md + topic doc) or Pattern (→ topic doc only)
- Which topic doc it goes to

### 4. Check for duplicates

Before writing, read the target files and scan for similar existing rules or patterns. If something similar exists, ask the user: "This looks similar to an existing entry: '...'. Update it, add as new, or skip?"

### 5. Write the lessons

**For rules (→ rules.md):**
- Read `docs/rules.md`
- Find the right section heading
- Append the rule as a bullet point matching existing format
- Use the pattern: `- Never/Always [action] — [what to use instead]`

**For topic docs:**
- Read the target doc
- Find the most relevant section heading
- Append the lesson under that section
- If it's a pattern with a code example, include the code block
- If no existing section fits, append a new section at the end

### 6. Confirm what was written

After writing, summarize what was added and where.

## Important

- Do NOT commit automatically — let the user batch commits
- Keep rule entries short (one line) — details go in the topic doc
- Match the existing writing style and formatting of each doc
- If the user says `/{NAMESPACE}:learn` with no context and no argument, ask: "What's the lesson?"
```

**Replace in the template:**
- All `{NAMESPACE}` → `$NAMESPACE`
- `{$DOC_TABLE}` → the actual doc table built in analyze_docs
- If `docs/rules.md` doesn't exist, remove the rules.md references and simplify — all lessons go to topic docs only

Continue to completion.
</step>

<step name="completion">
Present what was generated.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SKILL GENERATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Created: .claude/commands/{namespace}/learn.md

Usage:
  /{namespace}:learn                    — Infer lesson from conversation
  /{namespace}:learn "never use X"      — Explicit lesson

Targets these docs:
{list of doc files}

To refine with evals and benchmarks:
  /skill-creator — Anthropic plugin for skill testing and improvement
```

End workflow.
</step>

</process>

<success_criteria>
- docs/ read and analyzed for structure
- Namespace derived from project or user input
- .claude/commands/{namespace}/learn.md created
- Doc target table matches real docs with accurate descriptions
- Skill format matches existing doc entry styles
- No auto-commit
</success_criteria>
