const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('TemplateEngine', () => {
  let resolveTemplate;

  it('imports', () => {
    ({ resolveTemplate } = require('../../src/agent/template'));
  });

  it('replaces simple variables', () => {
    const result = resolveTemplate('Hello {{task.name}}!', { task: { name: 'Auth' } });
    assert.strictEqual(result, 'Hello Auth!');
  });

  it('replaces multiple variables', () => {
    const tpl = '{{task.id}} - {{stage.name}} ({{stage.index}}/{{stage.total}})';
    const vars = {
      task: { id: '001-auth' },
      stage: { name: 'implement', index: 2, total: 5 },
    };
    assert.strictEqual(resolveTemplate(tpl, vars), '001-auth - implement (2/5)');
  });

  it('leaves unknown variables as-is', () => {
    const result = resolveTemplate('{{unknown.var}}', {});
    assert.strictEqual(result, '{{unknown.var}}');
  });

  it('handles nested objects', () => {
    const result = resolveTemplate('{{task.name}}', { task: { name: 'Test' } });
    assert.strictEqual(result, 'Test');
  });

  it('builds context from task, stage, pipeline, and paths', () => {
    const { buildTemplateContext } = require('../../src/agent/template');
    const ctx = buildTemplateContext(
      { id: '001-auth', name: 'Add auth', spec: 'spec content' },
      { name: 'implement', index: 2, total: 5 },
      { name: 'default' },
      { statusFile: '/path/status.json', logDir: '/path/logs' }
    );
    assert.strictEqual(ctx.task.id, '001-auth');
    assert.strictEqual(ctx.stage.name, 'implement');
    assert.strictEqual(ctx.pipeline.name, 'default');
    assert.strictEqual(ctx.status_file, '/path/status.json');
  });
});
