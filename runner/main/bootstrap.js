import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DEFAULT_CONFIG = {
  server: { port: 3700 },
  notifications: { telegram: { enabled: false } },
  defaults: {
    pipeline: 'default',
    failure_policy: 'skip',
    timeout: 3600,
    stuck_timeout: 1800,
    max_parallel: 1,
  },
};

const DEFAULT_AGENTS = {
  'claude-planner': {
    cmd: 'claude -p --dangerously-skip-permissions',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: 'You are a feature planner working on: {{task.name}} ({{task.id}})\nPipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})\n\nResearch the codebase thoroughly, then create a detailed implementation plan.\n\nEmit progress:\n```specd-status\n{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"...","percent":0}\n```\n\nWhen done:\n```specd-result\n{"status":"success","summary":"...","files_changed":[],"issues":[]}\n```',
  },
  'claude-implementer': {
    cmd: 'claude -p --dangerously-skip-permissions',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: 'You are an implementer working on: {{task.name}} ({{task.id}})\nPipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})\n\nImplement the plan from the previous stage. Write clean, tested code.\n\nEmit progress:\n```specd-status\n{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"...","percent":0}\n```\n\nWhen done:\n```specd-result\n{"status":"success","summary":"...","files_changed":[],"issues":[]}\n```',
  },
  'claude-reviewer': {
    cmd: 'claude -p --dangerously-skip-permissions',
    input_mode: 'stdin',
    output_format: 'stream_json',
    system_prompt: 'You are a code reviewer for: {{task.name}} ({{task.id}})\nPipeline: {{pipeline.name}} | Stage: {{stage.name}} ({{stage.index}}/{{stage.total}})\n\nReview the implementation from the previous stage. Check for bugs, style, tests.\n\nEmit progress:\n```specd-status\n{"task_id":"{{task.id}}","stage":"{{stage.name}}","progress":"...","percent":0}\n```\n\nWhen done:\n```specd-result\n{"status":"success","summary":"...","files_changed":[],"issues":[]}\n```',
  },
};

const DEFAULT_PIPELINE = {
  name: 'default',
  stages: [
    { stage: 'plan', agent: 'claude-planner', critical: true },
    { stage: 'implement', agent: 'claude-implementer', critical: true },
    { stage: 'review', agent: 'claude-reviewer', on_fail: 'retry', max_retries: 2 },
  ],
};

function writeIfMissing(filePath, data) {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

export async function bootstrap(paths) {
  // Create directories
  mkdirSync(paths.agentTemplatesDir, { recursive: true });
  mkdirSync(paths.pipelineTemplatesDir, { recursive: true });
  mkdirSync(paths.projectsDir, { recursive: true });

  // Write default files
  writeIfMissing(paths.db, { projects: [] });
  writeIfMissing(paths.config, DEFAULT_CONFIG);

  // Write default agent templates
  for (const [name, agent] of Object.entries(DEFAULT_AGENTS)) {
    writeIfMissing(join(paths.agentTemplatesDir, `${name}.json`), agent);
  }

  // Write default pipeline template
  writeIfMissing(join(paths.pipelineTemplatesDir, 'default.json'), DEFAULT_PIPELINE);
}
