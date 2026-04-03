const { WebSocketServer } = require('ws');

class WsBroadcaster {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
    });
  }

  broadcast(event) {
    const data = JSON.stringify(event);
    for (const client of this.wss.clients) {
      if (client.readyState === 1) {
        client.send(data);
      }
    }
  }

  close() {
    this.wss.close();
  }
}

module.exports = { WsBroadcaster };
