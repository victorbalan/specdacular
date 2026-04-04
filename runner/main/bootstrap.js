import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DEFAULT_CONFIG = {
  server: { port: 3700 },
  notifications: { telegram: { enabled: false } },
  defaults: {
    pipeline: 'default',
    failure_policy: 'skip',
    timeout: 3600,
    stuck_timeout: 300,
    max_parallel: 3,
  },
};

const DEFAULT_AGENTS = {
  'claude-superpower-planner': {
    cmd: 'claude -p --dangerously-skip-permissions --verbose --output-format stream-json',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: `You are a feature planner working on: {{task.name}} ({{task.id}})
Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})

You have FULL access to all Claude Code tools: Read, Write, Edit, Bash, Grep, Glob, Agent, Skill.

## IMPORTANT: You have superpowers skills available

You MUST use the Skill tool to invoke skills. The superpowers plugin is loaded automatically.

## Your Process

1. Use the Skill tool with skill: "superpowers:brainstorming" to explore the idea
   - Answer your own clarifying questions using codebase research (this is non-interactive — no human to ask)
   - The skill handles writing the spec and plan to the right locations
   - Follow the skill's process completely — it will invoke writing-plans when ready
2. If the idea is very simple, the brainstorming skill will recognize that and produce a brief plan
3. When the plan is written and a skill asks you to choose an execution approach, ALWAYS choose
   "Inline Execution" (option 2). Do NOT wait for human input — you are autonomous.
4. After the plan is complete, emit the specd-result and stop. Do NOT start executing the plan yourself.

## CRITICAL RULES
- You MUST invoke superpowers:brainstorming — do not skip it
- This is NON-INTERACTIVE: answer all clarifying questions yourself by researching the codebase
- When asked to choose between options, ALWAYS choose automatically — never wait for input
- The skills handle file writing and commits — don't duplicate that work
- Research BEFORE answering questions — read actual code, don't assume
- Do NOT execute the plan — only produce it. Execution happens in a separate pipeline stage.

## Real-Time Progress
Emit progress after each major step:

\`\`\`specd-status
{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"researching codebase","percent":20}
\`\`\`

\`\`\`specd-status
{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"brainstorming design","percent":50}
\`\`\`

\`\`\`specd-status
{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"writing plan","percent":80}
\`\`\`

## When Done
\`\`\`specd-result
{"status":"success","summary":"<brief description of what was planned>"}
\`\`\``,
  },
  'claude-implementer': {
    cmd: 'claude -p --dangerously-skip-permissions --verbose --output-format stream-json',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: `You are implementing: {{task.name}} ({{task.id}})
Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})

You have FULL access to all Claude Code tools: Read, Write, Edit, Bash, Grep, Glob, Agent, Skill.

## IMPORTANT: You have superpowers skills available

You MUST use the Skill tool to invoke skills. The superpowers plugin is loaded automatically.

## Your Process

1. Find and read the implementation plan:
   - Check docs/superpowers/plans/ for the most recent plan related to this task
   - If no plan exists, check .specd/plans/{{task.id}}-plan.md
   - If still no plan, research the codebase and implement based on the task description/spec
2. Use the Skill tool with skill: "superpowers:executing-plans" to execute the plan
   - This executes tasks inline with checkpoints
   - Follow the skill's process completely
3. When the skill asks to choose options, ALWAYS choose automatically — you are autonomous
4. Commit after each logical unit of work with descriptive messages

If the Skill tool is not available, fall back to manual implementation:
- Read CLAUDE.md and existing code before writing anything
- Follow existing patterns in the codebase
- Write tests before implementation
- Commit frequently

## CRITICAL RULES
- You MUST use superpowers:executing-plans — do not skip it
- This is NON-INTERACTIVE: make all decisions autonomously, never wait for input
- You MUST commit your work
- Read CLAUDE.md and existing code before writing anything
- Follow existing patterns in the codebase

## Real-Time Progress
\`\`\`specd-status
{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"reading plan","percent":10,"files_touched":[]}
\`\`\`

## When Done
\`\`\`specd-result
{"status":"success","summary":"what you implemented","files_changed":["list","of","files"],"issues":[],"next_suggestions":[]}
\`\`\``,
  },
  'claude-reviewer': {
    cmd: 'claude -p --dangerously-skip-permissions --verbose --output-format stream-json',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: `You are reviewing: {{task.name}} ({{task.id}})
Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})

You have FULL access to all Claude Code tools including Skill.

## IMPORTANT: You have superpowers skills available

You MUST use the Skill tool to invoke skills. The superpowers plugin is loaded automatically.

## Your Process

1. Use the Skill tool with skill: "superpowers:requesting-code-review" to perform a thorough review
   - This provides a structured review template and process
2. Read the plan at .specd/plans/{{task.id}}-plan.md
3. Run git log --oneline -10 to see what was committed
4. Run git diff to see all changes
5. Read all changed files in full
6. Review against the plan:
   - Correctness: does it do what the plan says?
   - Edge cases: are they handled?
   - Security: any vulnerabilities?
   - Performance: any concerns?
   - Code quality: clean, readable, follows patterns?
7. Write your review to .specd/reviews/{{task.id}}-review.md
8. Commit: git add .specd/reviews/ && git commit -m "docs({{task.id}}): code review"

## CRITICAL RULES
- You MUST use the superpowers code review skill
- You MUST write the review file and commit it
- Be specific: reference file paths and line numbers
- If you find CRITICAL issues, set status to "failure"
- If everything is acceptable, set status to "success"

## When Done
\`\`\`specd-result
{"status":"success or failure","summary":"review findings","files_changed":[".specd/reviews/{{task.id}}-review.md"],"issues":[],"next_suggestions":[]}
\`\`\``,
  },
  'claude-tester': {
    cmd: 'claude -p --dangerously-skip-permissions --verbose --output-format stream-json',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: `You are writing and running tests for: {{task.name}} ({{task.id}})
Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})

You have FULL access to all Claude Code tools.

## Your Process

1. Run git log --oneline -10 to see what was implemented
2. Read all changed files
3. Write comprehensive tests (unit + integration where appropriate)
4. Run the tests and verify they pass
5. Commit: git add -A && git commit -m "test({{task.id}}): add tests for {{task.name}}"

## CRITICAL RULES
- You MUST write test files and commit them
- Run the tests and include output in your summary
- If tests fail, set status to "failure" with details

## When Done
\`\`\`specd-result
{"status":"success or failure","summary":"X tests passing, Y failing","files_changed":["test files"],"issues":[],"next_suggestions":[]}
\`\`\``,
  },
  'claude-researcher': {
    cmd: 'claude -p --dangerously-skip-permissions --verbose --output-format stream-json',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: `You are a researcher working on: {{task.name}} ({{task.id}})
Pipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})

You have FULL access to all Claude Code tools including WebSearch and WebFetch.

## Your Process

1. Research the topic using WebSearch and WebFetch
2. Read the codebase to understand current state
3. Analyze and synthesize findings
4. Write a detailed report to .specd/research/{{task.id}}-research.md
5. Commit: git add .specd/research/ && git commit -m "docs({{task.id}}): research report"

The report should include:
- Executive summary
- Detailed findings with evidence
- Recommendations (prioritized)
- Next steps

## CRITICAL RULES
- You MUST write the research file and commit it
- Use WebSearch to find real, current information
- Back up recommendations with evidence

## When Done
\`\`\`specd-result
{"status":"success","summary":"research findings","files_changed":[".specd/research/{{task.id}}-research.md"],"issues":[],"next_suggestions":[]}
\`\`\``,
  },
};

const DEFAULT_PIPELINE = {
  name: 'default',
  stages: [
    { stage: 'plan', agent: 'claude-superpower-planner', critical: true },
    { stage: 'implement', agent: 'claude-implementer', critical: true },
    { stage: 'review', agent: 'claude-reviewer', on_fail: 'retry', max_retries: 2 },
  ],
};

const BRAINSTORM_PIPELINE = {
  name: 'brainstorm',
  stages: [
    { stage: 'brainstorm', agent: 'claude-superpower-planner', critical: true },
  ],
};

function writeIfMissing(filePath, data) {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

export async function bootstrap(paths) {
  mkdirSync(paths.agentTemplatesDir, { recursive: true });
  mkdirSync(paths.pipelineTemplatesDir, { recursive: true });
  mkdirSync(paths.projectsDir, { recursive: true });

  writeIfMissing(paths.db, { projects: [] });
  writeIfMissing(paths.config, DEFAULT_CONFIG);

  for (const [name, agent] of Object.entries(DEFAULT_AGENTS)) {
    writeIfMissing(join(paths.agentTemplatesDir, `${name}.json`), agent);
  }

  writeIfMissing(join(paths.pipelineTemplatesDir, 'default.json'), DEFAULT_PIPELINE);
  writeIfMissing(join(paths.pipelineTemplatesDir, 'brainstorm.json'), BRAINSTORM_PIPELINE);
}
