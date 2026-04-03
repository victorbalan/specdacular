const { EventEmitter } = require('events');
const readline = require('readline');

class StreamParser extends EventEmitter {
  constructor(stream) {
    super();
    this.stream = stream;
    this.buffer = [];
    this.insideBlock = null; // 'specd-status' | 'specd-result' | null
  }

  start() {
    return new Promise((resolve) => {
      const rl = readline.createInterface({ input: this.stream });

      rl.on('line', (line) => {
        const trimmed = line.trim();

        // Detect block start
        if (!this.insideBlock) {
          const match = trimmed.match(/^```(specd-status|specd-result)\s*$/);
          if (match) {
            this.insideBlock = match[1];
            this.buffer = [];
            return;
          }
          this.emit('output', line);
          return;
        }

        // Detect block end
        if (trimmed === '```') {
          const json = this.buffer.join('\n');
          try {
            const parsed = JSON.parse(json);
            if (this.insideBlock === 'specd-status') {
              this.emit('status', parsed);
            } else {
              this.emit('result', parsed);
            }
          } catch (e) {
            this.emit('error', new Error(`Failed to parse ${this.insideBlock} block: ${e.message}`));
          }
          this.insideBlock = null;
          this.buffer = [];
          return;
        }

        // Inside a block — accumulate
        this.buffer.push(line);
      });

      rl.on('close', () => {
        this.emit('end');
        resolve();
      });
    });
  }
}

module.exports = { StreamParser };
