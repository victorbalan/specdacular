// runner/main/notifications/telegram.js
import { request } from 'https';

export class TelegramNotifier {
  constructor({ bot_token, chat_id, notify_on }) {
    this.botToken = bot_token;
    this.chatId = chat_id;
    this.notifyOn = new Set(notify_on || ['task_complete', 'task_failed']);
  }

  async onTaskComplete(taskId, taskName, summary) {
    if (!this.notifyOn.has('task_complete')) return;
    await this._send(`✅ *Task Complete*\n*${taskName}* (${taskId})\n${summary}`);
  }

  async onTaskFailed(taskId, taskName, stage, error) {
    if (!this.notifyOn.has('task_failed')) return;
    await this._send(`❌ *Task Failed*\n*${taskName}* (${taskId})\nStage: ${stage}\nError: ${error}`);
  }

  async onStuck(taskId, taskName, stage) {
    if (!this.notifyOn.has('task_stuck')) return;
    await this._send(`⚠️ *Agent Stuck*\n*${taskName}* (${taskId})\nStage: ${stage}`);
  }

  async onNeedsInput(taskId, taskName, stage, question) {
    if (!this.notifyOn.has('needs_input')) return;
    await this._send(`❓ *Input Needed*\n*${taskName}* (${taskId})\nStage: ${stage}\n${question}`);
  }

  _send(text) {
    return new Promise((resolve) => {
      const data = JSON.stringify({ chat_id: this.chatId, text, parse_mode: 'Markdown' });
      const req = request({
        hostname: 'api.telegram.org',
        path: `/bot${this.botToken}/sendMessage`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      }, resolve);
      req.on('error', (err) => { console.error('Telegram error:', err.message); resolve(); });
      req.write(data);
      req.end();
    });
  }
}
