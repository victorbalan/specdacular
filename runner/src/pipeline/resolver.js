function resolvePipeline(pipelineName, pipelines, stageOverrides = {}, defaults = {}) {
  const pipeline = pipelines[pipelineName];
  if (!pipeline) throw new Error(`Pipeline "${pipelineName}" not found`);

  const stages = pipeline.stages.map((stage) => {
    const resolved = { ...stage };

    if (defaults.timeout && !resolved.timeout) {
      resolved.timeout = defaults.timeout;
    }
    if (defaults.failure_policy && !resolved.on_fail && !resolved.critical) {
      resolved.on_fail = defaults.failure_policy;
    }

    const override = stageOverrides[stage.stage];
    if (override) {
      Object.assign(resolved, override);
    }

    return resolved;
  });

  return { name: pipelineName, stages };
}

module.exports = { resolvePipeline };
