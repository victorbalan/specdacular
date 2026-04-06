import { createLogger } from '../../logger.js';
import { gitWorktreeAction } from './git-worktree.js';
import { gitCommitAction } from './git-commit.js';
import { gitPrAction } from './git-pr.js';
import { notifyAction } from './notify.js';

const log = createLogger('actions', '\x1b[33m');

export class ActionRegistry {
  constructor() {
    this.actions = new Map();
  }

  register(name, action) {
    this.actions.set(name, action);
  }

  get(name) {
    return this.actions.get(name) || null;
  }

  async run(name, context, config) {
    const action = this.get(name);
    if (!action) {
      log.warn(`action not found: ${name}`);
      return;
    }
    log.info(`running action: ${name}`);
    await action.execute(context, config);
  }

  async runAll(names, context, actionConfigs) {
    for (const name of names) {
      const config = actionConfigs?.[name] || {};
      await this.run(name, context, config);
    }
  }

  static withBuiltins() {
    const registry = new ActionRegistry();
    registry.register('git-worktree', gitWorktreeAction);
    registry.register('git-commit', gitCommitAction);
    registry.register('git-pr', gitPrAction);
    registry.register('notify', notifyAction);
    return registry;
  }
}
