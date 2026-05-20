import { EventEmitter } from 'node:events';

export class StreamParser extends EventEmitter {
  constructor() {
    super();
    this.inBlock = null;
    this.blockLines = [];
  }

  feed(line) {
    if (line.startsWith('```specd-status')) {
      this.inBlock = 'status';
      this.blockLines = [];
      return;
    }
    if (line.startsWith('```specd-result')) {
      this.inBlock = 'result';
      this.blockLines = [];
      return;
    }
    if (line === '```' && this.inBlock) {
      const content = this.blockLines.join('\n');
      try {
        this.emit(this.inBlock, JSON.parse(content));
      } catch {
        // malformed JSON — ignore
      }
      this.inBlock = null;
      this.blockLines = [];
      return;
    }
    if (this.inBlock) {
      this.blockLines.push(line);
    } else {
      this.emit('output', line);
    }
  }
}
