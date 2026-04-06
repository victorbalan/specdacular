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

export class JsonlParser extends EventEmitter {
  feed(line) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'status') {
        this.emit('status', obj);
      } else if (obj.type === 'result') {
        this.emit('result', obj);
      } else {
        this.emit('output', line);
      }
    } catch {
      this.emit('output', line);
    }
  }
}

export class PlainParser extends EventEmitter {
  feed(line) {
    this.emit('output', line);
  }
}
