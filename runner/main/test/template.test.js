// runner/main/test/template.test.js
import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { resolveTemplate } from '../agent/template.js';

describe('resolveTemplate', () => {
  it('resolves simple variables', () => {
    const result = resolveTemplate('Hello {{name}}', { name: 'World' });
    a.equal(result, 'Hello World');
  });

  it('resolves nested variables', () => {
    const result = resolveTemplate('Task: {{task.name}}', { task: { name: 'Build thing' } });
    a.equal(result, 'Task: Build thing');
  });

  it('resolves stage output from snowball', () => {
    const vars = {
      stages: { gather: { output: 'Found 5 patterns' } },
    };
    const result = resolveTemplate('Previous: {{stages.gather.output}}', vars);
    a.equal(result, 'Previous: Found 5 patterns');
  });

  it('resolves all_previous_output', () => {
    const vars = { all_previous_output: 'stage1 output\n\nstage2 output' };
    const result = resolveTemplate('Context:\n{{all_previous_output}}', vars);
    a.equal(result, 'Context:\nstage1 output\n\nstage2 output');
  });

  it('preserves unresolved variables', () => {
    const result = resolveTemplate('{{known}} and {{unknown}}', { known: 'yes' });
    a.equal(result, 'yes and {{unknown}}');
  });

  it('handles undefined nested paths gracefully', () => {
    const result = resolveTemplate('{{stages.missing.output}}', { stages: {} });
    a.equal(result, '{{stages.missing.output}}');
  });
});
