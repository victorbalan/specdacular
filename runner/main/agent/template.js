export function resolveTemplate(template, variables) {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = path.trim().split('.').reduce((obj, key) => obj?.[key], variables);
    return value !== undefined ? String(value) : match;
  });
}

export function buildTemplateContext(task, stage, pipeline, paths, previousOutput) {
  return {
    task: { id: task.id, name: task.name, spec: task.spec || '' },
    stage: { name: stage.stage, index: stage.index, total: stage.total },
    pipeline: { name: pipeline.name },
    status_file: paths?.statusJson || '',
    log_dir: paths?.logsDir || '',
    previous_stage_output: previousOutput || '',
  };
}
