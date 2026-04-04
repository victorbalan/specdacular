# Superpowers Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3-stage default pipeline (plan/implement/review) with a 2-stage Superpowers-driven pipeline: full Superpowers flow with sub-agent execution + Victor deep review with auto-fix.

**Architecture:** Add two new agent templates (`claude-superpowers` and `claude-victor-reviewer`) to the DEFAULT_AGENTS in bootstrap.js, and update DEFAULT_PIPELINE to reference them in a 2-stage configuration. No infrastructure changes needed — the pipeline sequencer, resolver, and template engine already support this.

**Tech Stack:** Node.js (ES6 modules), Claude Code CLI with Superpowers plugin, template variables (`{{task.id}}`, etc.)

---

### Task 1: Add `claude-superpowers` Agent Template

**Files:**
- Modify: `runner/main/bootstrap.js:17-67` (add new agent after existing `claude-superpower-planner`)

This agent runs the complete Superpowers skill chain: brainstorming → writing-plans → subagent-driven-development, all in one session. It replaces both the planner and implementer agents for the default pipeline.

- [ ] **Step 1: Add the `claude-superpowers` agent template to DEFAULT_AGENTS**

In `runner/main/bootstrap.js`, add the following entry to `DEFAULT_AGENTS` after the existing `'claude-superpower-planner'` entry (after line 67, before `'claude-implementer'`):

```javascript
  'claude-superpowers': {
    cmd: 'claude -p --dangerously-skip-permissions --verbose --output-format stream-json',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: `You are implementing: {{task.name}} ({{task.id}})
Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})

You have FULL access to all Claude Code tools: Read, Write, Edit, Bash, Grep, Glob, Agent, Skill.

## IMPORTANT: You have superpowers skills available

You MUST use the Skill tool to invoke skills. The superpowers plugin is loaded automatically.

## Your Process

1. Use the Skill tool with skill: "superpowers:brainstorming" to explore the idea
   - Answer your own clarifying questions using codebase research (this is non-interactive — no human to ask)
   - The skill handles writing the spec and plan to the right locations
   - Follow the skill's process completely — it will invoke writing-plans when ready
2. When the plan is written and a skill asks you to choose an execution approach, ALWAYS choose
   "Subagent-Driven Development" (option 1). This gives per-task sub-agents with spec + code quality reviews.
3. The subagent-driven-development skill will execute each task with isolated sub-agents
4. When subagent-driven-development finishes and invokes finishing-a-development-branch,
   choose option 3 "Keep the branch as-is" — the runner manages branch lifecycle and PR creation.

## CRITICAL RULES
- You MUST invoke superpowers:brainstorming — do not skip it
- This is NON-INTERACTIVE: answer all clarifying questions yourself by researching the codebase
- When asked to choose between options, ALWAYS choose automatically — never wait for input
- Choose "Subagent-Driven Development" (option 1) for execution
- Choose "Keep the branch as-is" (option 3) when finishing-a-development-branch runs
- Research BEFORE answering questions — read actual code, don't assume
- Commit your work throughout

## Real-Time Progress
Emit progress after each major step:

\`\`\`specd-status
{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"researching codebase","percent":10}
\`\`\`

\`\`\`specd-status
{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"brainstorming design","percent":25}
\`\`\`

\`\`\`specd-status
{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"writing plan","percent":40}
\`\`\`

\`\`\`specd-status
{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"executing task N/M","percent":60}
\`\`\`

## When Done
\`\`\`specd-result
{"status":"success","summary":"what was implemented","files_changed":["list","of","files"],"issues":[],"next_suggestions":[]}
\`\`\``,
  },
```

- [ ] **Step 2: Verify the template compiles**

Run:
```bash
node -e "import('./runner/main/bootstrap.js').then(m => { console.log(Object.keys(JSON.parse(JSON.stringify(m)))); console.log('OK'); }).catch(e => console.error(e.message))"
```

This may not work due to module structure. Instead, verify syntax:

```bash
node --check runner/main/bootstrap.js
```

Expected: No output (clean syntax check)

- [ ] **Step 3: Commit**

```bash
git add runner/main/bootstrap.js
git commit -m "feat: add claude-superpowers agent template

Unified agent that runs full Superpowers chain: brainstorming →
writing-plans → subagent-driven-development in one session."
```

---

### Task 2: Add `claude-victor-reviewer` Agent Template

**Files:**
- Modify: `runner/main/bootstrap.js` (add new agent to DEFAULT_AGENTS after `claude-superpowers`)

This agent runs Victor's deep parallel review (5 specialized agents) and auto-fixes critical issues.

- [ ] **Step 1: Add the `claude-victor-reviewer` agent template to DEFAULT_AGENTS**

Add the following entry to `DEFAULT_AGENTS` after the `'claude-superpowers'` entry added in Task 1:

```javascript
  'claude-victor-reviewer': {
    cmd: 'claude -p --dangerously-skip-permissions --verbose --output-format stream-json',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: `You are reviewing: {{task.name}} ({{task.id}})
Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})

You have FULL access to all Claude Code tools including Skill.

## IMPORTANT: You have the victor:review skill available

You MUST use the Skill tool to invoke skills.

## Your Process

1. Understand what was implemented:
   - Read the previous stage summary: {{previous_stage_output}}
   - Run: git log --oneline main..HEAD to see all commits on this branch
   - Run: git diff --stat main..HEAD to see changed files
2. Invoke the Skill tool with skill: "victor:review" to perform a deep parallel review
   - This spawns 5 specialized review agents (Security, Logic Bugs, Database, API, Frontend)
   - They analyze all changes and produce a structured review with priority tiers
3. Analyze the review findings by tier:
   - CRITICAL (security vulnerabilities, data loss, auth bypasses) — MUST fix
   - BUGS (logic errors, race conditions, runtime crashes) — MUST fix
   - MEDIUM (validation gaps, convention violations) — fix only if the fix is obvious and safe
   - MINOR (code quality, consistency) — do NOT fix
4. For each issue you fix:
   - Make the fix
   - Commit: git commit -m "fix({{task.id}}): <what was fixed>"
5. Write the full review report to .specd/reviews/{{task.id}}-review.md
   - Include all findings (fixed and unfixed)
   - Mark which ones were auto-fixed
6. Commit the review: git add .specd/reviews/ && git commit -m "docs({{task.id}}): code review"

## CRITICAL RULES
- You MUST invoke the victor:review skill — do not skip it
- ALWAYS fix Critical and Bugs tier issues
- Do NOT fix Minor issues — they are not worth the risk of introducing regressions
- Be specific in your review report: reference file paths and line numbers
- If Critical issues remain unfixed (too complex, unclear fix), set status to "failure"

## Real-Time Progress
\`\`\`specd-status
{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"reviewing changes","percent":30}
\`\`\`

\`\`\`specd-status
{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"fixing issues","percent":70}
\`\`\`

## When Done
\`\`\`specd-result
{"status":"success or failure","summary":"review findings and fixes","files_changed":[".specd/reviews/{{task.id}}-review.md"],"issues":[],"next_suggestions":[]}
\`\`\``,
  },
```

- [ ] **Step 2: Verify syntax**

```bash
node --check runner/main/bootstrap.js
```

Expected: No output (clean syntax check)

- [ ] **Step 3: Commit**

```bash
git add runner/main/bootstrap.js
git commit -m "feat: add claude-victor-reviewer agent template

Deep parallel review with 5 specialized agents (Security, Logic Bugs,
Database, API, Frontend) plus auto-fix of Critical and Bugs tier issues."
```

---

### Task 3: Update DEFAULT_PIPELINE to Use New Agents

**Files:**
- Modify: `runner/main/bootstrap.js:221-228` (replace DEFAULT_PIPELINE definition)

- [ ] **Step 1: Replace the DEFAULT_PIPELINE constant**

Change the existing `DEFAULT_PIPELINE` from:

```javascript
const DEFAULT_PIPELINE = {
  name: 'default',
  stages: [
    { stage: 'plan', agent: 'claude-superpower-planner', critical: true },
    { stage: 'implement', agent: 'claude-implementer', critical: true },
    { stage: 'review', agent: 'claude-reviewer', on_fail: 'retry', max_retries: 2 },
  ],
};
```

To:

```javascript
const DEFAULT_PIPELINE = {
  name: 'default',
  stages: [
    { stage: 'superpowers', agent: 'claude-superpowers', critical: true, timeout: 7200 },
    { stage: 'review', agent: 'claude-victor-reviewer', on_fail: 'retry', max_retries: 1, timeout: 3600 },
  ],
};
```

- [ ] **Step 2: Verify syntax**

```bash
node --check runner/main/bootstrap.js
```

Expected: No output (clean syntax check)

- [ ] **Step 3: Verify the bootstrap writes correct files**

```bash
node -e "
import { bootstrap } from './runner/main/bootstrap.js';
import { mkdtempSync } from 'fs';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const tmp = mkdtempSync(join(tmpdir(), 'specd-test-'));
const paths = {
  agentTemplatesDir: join(tmp, 'agents'),
  pipelineTemplatesDir: join(tmp, 'pipelines'),
  projectsDir: join(tmp, 'projects'),
  db: join(tmp, 'db.json'),
  config: join(tmp, 'config.json'),
};

await bootstrap(paths);

// Verify new agents exist
const agents = readdirSync(paths.agentTemplatesDir);
console.log('Agents:', agents);
console.assert(agents.includes('claude-superpowers.json'), 'claude-superpowers agent missing');
console.assert(agents.includes('claude-victor-reviewer.json'), 'claude-victor-reviewer agent missing');

// Verify pipeline
const pipeline = JSON.parse(readFileSync(join(paths.pipelineTemplatesDir, 'default.json'), 'utf-8'));
console.log('Pipeline stages:', pipeline.stages.map(s => s.stage));
console.assert(pipeline.stages[0].stage === 'superpowers', 'First stage should be superpowers');
console.assert(pipeline.stages[1].stage === 'review', 'Second stage should be review');
console.assert(pipeline.stages[0].timeout === 7200, 'Superpowers timeout should be 7200');

console.log('All checks passed');
"
```

Expected: `All checks passed`

Note: This test creates files in a temp directory. If bootstrap's `writeIfMissing` finds existing files (from a previous run), it won't overwrite them. The temp directory ensures fresh files.

- [ ] **Step 4: Commit**

```bash
git add runner/main/bootstrap.js
git commit -m "feat: update default pipeline to superpowers + victor review

Default pipeline now uses 2 stages:
1. superpowers — full brainstorm/plan/execute with sub-agents
2. review — victor deep review with auto-fix"
```

---

### Task 4: Verify End-to-End Integration

**Files:**
- Read only: `runner/main/orchestrator.js`, `runner/main/pipeline/sequencer.js`, `runner/main/pipeline/resolver.js`, `runner/main/agent/template.js`

This task verifies that the existing pipeline infrastructure correctly handles the new agents and pipeline without code changes.

- [ ] **Step 1: Verify template variables resolve for the new agents**

```bash
node -e "
import { resolveTemplate, buildTemplateContext } from './runner/main/agent/template.js';

const task = { id: 'idea-test123', name: 'Test Feature', spec: 'some spec', feedback: '' };
const stage = { stage: 'superpowers', index: 1, total: 2 };
const pipeline = { name: 'default' };
const paths = { statusJson: '/tmp/status.json', logsDir: '/tmp/logs' };

const ctx = buildTemplateContext(task, stage, pipeline, paths, '');

// Test a template snippet from claude-superpowers
const template = 'You are implementing: {{task.name}} ({{task.id}}) | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})';
const resolved = resolveTemplate(template, ctx);
console.log(resolved);
console.assert(resolved.includes('Test Feature'), 'task.name not resolved');
console.assert(resolved.includes('idea-test123'), 'task.id not resolved');
console.assert(resolved.includes('1/2'), 'stage index not resolved');
console.assert(!resolved.includes('{{'), 'unresolved template variables remain');

console.log('Template resolution OK');
"
```

Expected: `Template resolution OK`

- [ ] **Step 2: Verify pipeline resolver handles the new pipeline structure**

```bash
node -e "
import { resolvePipeline } from './runner/main/pipeline/resolver.js';

const pipelines = {
  default: {
    name: 'default',
    stages: [
      { stage: 'superpowers', agent: 'claude-superpowers', critical: true, timeout: 7200 },
      { stage: 'review', agent: 'claude-victor-reviewer', on_fail: 'retry', max_retries: 1, timeout: 3600 },
    ],
  },
};

const resolved = resolvePipeline('default', pipelines, null, { timeout: 3600, failure_policy: 'skip' });
console.log('Stages:', resolved.stages.map(s => ({ stage: s.stage, timeout: s.timeout, on_fail: s.on_fail })));
console.assert(resolved.stages[0].timeout === 7200, 'superpowers timeout should be 7200 (stage override)');
console.assert(resolved.stages[1].timeout === 3600, 'review timeout should be 3600');
console.assert(resolved.stages[1].on_fail === 'retry', 'review on_fail should be retry');
console.assert(resolved.stages[1].max_retries === 1, 'review max_retries should be 1');

console.log('Pipeline resolution OK');
"
```

Expected: `Pipeline resolution OK`

- [ ] **Step 3: Commit (no changes expected — this is verification only)**

If any issues were found and fixed, commit them:

```bash
git diff --quiet || (git add -A && git commit -m "fix: address integration issues found during verification")
```
