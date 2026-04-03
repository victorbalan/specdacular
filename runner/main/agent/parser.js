import { EventEmitter } from 'events';

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
        const parsed = JSON.parse(content);
        this.emit(this.inBlock, parsed);
      } catch {
        // Incomplete or malformed JSON in block — ignore
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
