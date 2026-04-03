// runner/main/server/index.js
import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createApiRouter } from './api.js';
import { WsBroadcaster } from './websocket.js';
import { createLogger } from '../logger.js';

const log = createLogger('api', '\x1b[32m');

export function createServer(getContext) {
  const app = express();
  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      log.info(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
    });
    next();
  });

  app.use('/api', createApiRouter(getContext));

  const httpServer = createHttpServer(app);
  const broadcaster = new WsBroadcaster(httpServer);

  return {
    start(port) {
      return new Promise((resolve) => {
        httpServer.listen(port, '127.0.0.1', () => {
          log.info(`server listening on http://127.0.0.1:${port}`);
          resolve();
        });
      });
    },
    stop() {
      broadcaster.close();
      httpServer.close();
    },
    broadcaster,
    wireOrchestrator(orch) {
      orch.on('change', (event) => broadcaster.broadcast(event));
    },
  };
}
