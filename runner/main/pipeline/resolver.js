// runner/main/pipeline/resolver.js
export function resolvePipeline(pipelineName, pipelines, stageOverrides, defaults) {
  const pipeline = pipelines[pipelineName];
  if (!pipeline) throw new Error(`Pipeline not found: ${pipelineName}`);

  const stages = pipeline.stages.map((stage, index) => {
    const override = stageOverrides?.[stage.stage] || {};
    return {
      ...stage,
      ...override,
      timeout: stage.timeout || defaults?.timeout || 3600,
      on_fail: stage.on_fail || defaults?.failure_policy || 'skip',
      max_retries: stage.max_retries || 0,
      index: index + 1,
      total: pipeline.stages.length,
    };
  });

  return { name: pipelineName, stages };
}
