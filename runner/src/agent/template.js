function resolveTemplate(template, variables) {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const parts = path.split('.');
    let value = variables;
    for (const part of parts) {
      if (value == null || typeof value !== 'object') return match;
      value = value[part];
    }
    return value != null ? String(value) : match;
  });
}

function buildTemplateContext(task, stage, pipeline, paths) {
  return {
    task: {
      id: task.id,
      name: task.name,
      spec: task.spec || task.description || '',
    },
    stage: {
      name: stage.name,
      index: stage.index,
      total: stage.total,
    },
    pipeline: {
      name: pipeline.name,
    },
    status_file: paths.statusFile,
    log_dir: paths.logDir,
  };
}

module.exports = { resolveTemplate, buildTemplateContext };
