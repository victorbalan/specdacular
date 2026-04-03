const REQUIRED_AGENT_FIELDS = ['cmd', 'output_format'];
const VALID_OUTPUT_FORMATS = ['json_block', 'exit_code'];
const VALID_TASK_STATUSES = ['draft', 'ready', 'in_progress', 'done', 'failed'];
const VALID_FAILURE_POLICIES = ['skip', 'retry', 'block'];

function validateConfig(config) {
  const errors = [];
  if (!config.defaults) errors.push('Missing "defaults" section');
  if (config.defaults && !config.defaults.pipeline) errors.push('Missing "defaults.pipeline"');
  return errors;
}

function validateAgent(name, agent) {
  const errors = [];
  for (const field of REQUIRED_AGENT_FIELDS) {
    if (!agent[field]) errors.push(`Agent "${name}": missing "${field}"`);
  }
  if (agent.output_format && !VALID_OUTPUT_FORMATS.includes(agent.output_format)) {
    errors.push(`Agent "${name}": invalid output_format "${agent.output_format}"`);
  }
  return errors;
}

function validatePipeline(name, pipeline) {
  const errors = [];
  if (!pipeline.stages || !Array.isArray(pipeline.stages)) {
    errors.push(`Pipeline "${name}": missing or invalid "stages"`);
    return errors;
  }
  for (const stage of pipeline.stages) {
    if (!stage.stage) errors.push(`Pipeline "${name}": stage missing "stage" name`);
    if (!stage.agent && !stage.cmd) errors.push(`Pipeline "${name}": stage "${stage.stage}" needs "agent" or "cmd"`);
  }
  return errors;
}

function validateTask(id, task) {
  const errors = [];
  if (!task.name) errors.push(`Task "${id}": missing "name"`);
  if (!task.status) errors.push(`Task "${id}": missing "status"`);
  if (task.status && !VALID_TASK_STATUSES.includes(task.status)) {
    errors.push(`Task "${id}": invalid status "${task.status}"`);
  }
  return errors;
}

module.exports = { validateConfig, validateAgent, validatePipeline, validateTask,
  VALID_TASK_STATUSES, VALID_OUTPUT_FORMATS, VALID_FAILURE_POLICIES };
