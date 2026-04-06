import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { ExecutionContext } from '../engine/context.js';

describe('ExecutionContext', () => {
  it('initializes with task and pipeline info', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test', description: 'A test task' },
      pipeline: { name: 'default', total_stages: 3 },
    });
    a.equal(ctx.task.id, 'idea-abc');
    a.equal(ctx.pipeline.name, 'default');
    a.deepEqual(ctx.stages, {});
  });

  it('records stage start', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test' },
      pipeline: { name: 'default', total_stages: 2 },
    });
    ctx.startStage('plan', 'claude-planner');
    a.equal(ctx.stages.plan.status, 'running');
    a.equal(ctx.stages.plan.agent, 'claude-planner');
    a.ok(ctx.stages.plan.started_at);
  });

  it('records stage completion with output and decisions', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test' },
      pipeline: { name: 'default', total_stages: 2 },
    });
    ctx.startStage('plan', 'claude-planner');
    ctx.completeStage('plan', {
      status: 'success',
      output: 'The plan is ready',
      decisions: [{ decision: 'Use OAuth2', reason: 'Security' }],
      artifacts: ['plan.md'],
    });
    a.equal(ctx.stages.plan.status, 'success');
    a.equal(ctx.stages.plan.output, 'The plan is ready');
    a.equal(ctx.stages.plan.decisions.length, 1);
    a.equal(ctx.stages.plan.artifacts[0], 'plan.md');
    a.ok(ctx.stages.plan.duration >= 0);
  });

  it('provides all_previous_output as concatenation', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test' },
      pipeline: { name: 'default', total_stages: 3 },
    });
    ctx.startStage('gather', 'claude-researcher');
    ctx.completeStage('gather', { status: 'success', output: 'Found data' });
    ctx.startStage('analyze', 'claude-analyst');
    ctx.completeStage('analyze', { status: 'success', output: 'Analyzed data' });

    a.equal(ctx.allPreviousOutput(), 'Found data\n\nAnalyzed data');
  });

  it('serializes to JSON and restores', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test' },
      pipeline: { name: 'default', total_stages: 1 },
    });
    ctx.startStage('plan', 'claude-planner');
    ctx.completeStage('plan', { status: 'success', output: 'Done' });

    const json = ctx.toJSON();
    const restored = ExecutionContext.fromJSON(json);
    a.equal(restored.stages.plan.output, 'Done');
    a.equal(restored.task.id, 'idea-abc');
  });

  it('provides template variables for resolution', () => {
    const ctx = new ExecutionContext({
      task: { id: 'idea-abc', name: 'Test', description: 'A test' },
      pipeline: { name: 'default', total_stages: 2 },
    });
    ctx.startStage('gather', 'claude-researcher');
    ctx.completeStage('gather', { status: 'success', output: 'Research done' });

    const vars = ctx.templateVars({ name: 'analyze', index: 2, total: 2 });
    a.equal(vars.task.name, 'Test');
    a.equal(vars.stages.gather.output, 'Research done');
    a.equal(vars.stage.name, 'analyze');
    a.equal(vars.all_previous_output, 'Research done');
  });
});
