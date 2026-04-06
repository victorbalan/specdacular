import { describe, it } from 'node:test';
import { strict as a } from 'node:assert';
import { ActionRegistry } from '../engine/actions/registry.js';

describe('ActionRegistry', () => {
  it('registers and retrieves a built-in action', () => {
    const registry = new ActionRegistry();
    const mockAction = { name: 'test', execute: async () => {} };
    registry.register('test', mockAction);
    a.equal(registry.get('test'), mockAction);
  });

  it('returns null for unknown action', () => {
    const registry = new ActionRegistry();
    a.equal(registry.get('nonexistent'), null);
  });

  it('runs an action with context', async () => {
    const registry = new ActionRegistry();
    let received = null;
    registry.register('test', {
      name: 'test',
      execute: async (ctx) => { received = ctx; },
    });
    await registry.run('test', { task: { id: 'abc' } });
    a.equal(received.task.id, 'abc');
  });

  it('runs a list of actions in order', async () => {
    const registry = new ActionRegistry();
    const order = [];
    registry.register('first', {
      name: 'first',
      execute: async () => { order.push('first'); },
    });
    registry.register('second', {
      name: 'second',
      execute: async () => { order.push('second'); },
    });
    await registry.runAll(['first', 'second'], {});
    a.deepEqual(order, ['first', 'second']);
  });

  it('skips unknown actions in runAll without throwing', async () => {
    const registry = new ActionRegistry();
    const order = [];
    registry.register('known', {
      name: 'known',
      execute: async () => { order.push('known'); },
    });
    await registry.runAll(['unknown', 'known'], {});
    a.deepEqual(order, ['known']);
  });

  it('loads built-in actions on construction', () => {
    const registry = ActionRegistry.withBuiltins();
    a.ok(registry.get('git-worktree'));
    a.ok(registry.get('git-commit'));
    a.ok(registry.get('git-pr'));
    a.ok(registry.get('notify'));
  });
});
