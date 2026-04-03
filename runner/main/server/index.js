// runner/main/server/index.js
import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createApiRouter } from './api.js';
import { WsBroadcaster } from './websocket.js';

export function createServer(getContext) {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter(getContext));

  const httpServer = createHttpServer(app);
  const broadcaster = new WsBroadcaster(httpServer);

  return {
    start(port) {
      return new Promise((resolve) => {
        httpServer.listen(port, '127.0.0.1', () => {
          console.log(`Specd API server on http://127.0.0.1:${port}`);
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
