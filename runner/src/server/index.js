const express = require('express');
const http = require('http');
const path = require('path');
const { createApiRouter } = require('./api');
const { WsBroadcaster } = require('./websocket');

function createServer(daemon, port) {
  const app = express();
  app.use(express.json());

  app.use('/api', createApiRouter(daemon));

  const dashboardPath = path.join(__dirname, '..', '..', 'dashboard', 'dist');
  app.use(express.static(dashboardPath));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(dashboardPath, 'index.html'));
  });

  const server = http.createServer(app);
  const broadcaster = new WsBroadcaster(server);

  // Wire all orchestrators' state changes to WebSocket
  for (const [name, orch] of daemon.getAllOrchestrators()) {
    orch.stateManager.on('change', (event) => {
      broadcaster.broadcast({ ...event, project: name });
    });
  }

  return {
    start: () => new Promise((resolve) => {
      server.listen(port, () => {
        console.log(`Dashboard: http://localhost:${port}`);
        resolve(server);
      });
    }),
    stop: () => new Promise((resolve) => {
      broadcaster.close();
      server.close(resolve);
    }),
    app,
    server,
    broadcaster,
    wireProject: (name, orch) => {
      orch.stateManager.on('change', (event) => {
        broadcaster.broadcast({ ...event, project: name });
      });
    },
  };
}

module.exports = { createServer };
