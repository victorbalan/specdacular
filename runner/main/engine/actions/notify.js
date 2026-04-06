import { createLogger } from '../../logger.js';

const log = createLogger('notify', '\x1b[33m');

export const notifyAction = {
  name: 'notify',

  async execute(context, config) {
    if (!config?.type) {
      log.warn('notify action: no type configured');
      return;
    }

    if (config.type === 'webhook' && config.url) {
      try {
        await fetch(config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: context.task,
            pipeline: context.pipeline,
            status: context._runtime?.finalStatus || 'unknown',
          }),
        });
        log.info(`webhook sent to ${config.url}`);
      } catch (err) {
        log.error(`webhook failed: ${err.message}`);
      }
    }
  },
};
