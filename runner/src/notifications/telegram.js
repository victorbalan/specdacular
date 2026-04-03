const https = require('https');

class TelegramNotifier {
  constructor(config) {
    this.enabled = config?.enabled || false;
    this.botToken = config?.bot_token || '';
    this.chatId = config?.chat_id || '';
    this.notifyOn = new Set(config?.notify_on || []);
  }

  shouldNotify(eventType) {
    if (!this.enabled) return false;
    if (!this.botToken || !this.chatId) return false;
    return this.notifyOn.has(eventType);
  }

  async notify(eventType, message) {
    if (!this.shouldNotify(eventType)) return;
    const text = `*Specdacular Runner*\n\n${message}`;
    return this._sendMessage(text);
  }

  async onTaskComplete(taskId, taskName, summary) {
    await this.notify('task_complete', `Task Complete: ${taskName}\n\n${summary}`);
  }

  async onTaskFailed(taskId, taskName, stage, error) {
    await this.notify('task_failed', `Task Failed: ${taskName}\nStage: ${stage}\n\n${error}`);
  }

  async onStuck(taskId, taskName, stage) {
    await this.notify('task_failed', `Task Stuck: ${taskName}\nStage: ${stage}\nNo output for 30 minutes.`);
  }

  async onNeedsInput(taskId, taskName, stage, question) {
    await this.notify('needs_input', `Input Needed: ${taskName}\nStage: ${stage}\n\n${question}`);
  }

  _sendMessage(text) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: 'Markdown',
      });

      const options = {
        hostname: 'api.telegram.org',
        path: `/bot${this.botToken}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => { body += d; });
        res.on('end', () => resolve(JSON.parse(body)));
      });

      req.on('error', (e) => {
        console.error(`Telegram notification failed: ${e.message}`);
        resolve(null);
      });

      req.write(data);
      req.end();
    });
  }
}

module.exports = { TelegramNotifier };
