import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { createWriteStream } from 'fs';
import { StreamParser } from './parser.js';

export class AgentRunner extends EventEmitter {
  constructor({ cmd, input_mode, output_format, system_prompt, timeout, stuck_timeout }) {
    super();
    this.cmd = cmd;
    this.inputMode = input_mode || 'stdin';
    this.outputFormat = output_format || 'stream_json';
    this.systemPrompt = system_prompt || '';
    this.timeout = (timeout || 3600) * 1000;
    this.stuckTimeout = (stuck_timeout || 1800) * 1000;
  }

  async run(prompt, { cwd, logPath } = {}) {
    return new Promise((resolve, reject) => {
      const fullPrompt = this.systemPrompt ? `${this.systemPrompt}\n\n${prompt}` : prompt;
      const args = this.cmd.split(' ').slice(1);
      const bin = this.cmd.split(' ')[0];

      const proc = spawn(bin, args, {
        cwd,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      const logStream = logPath ? createWriteStream(logPath, { flags: 'a' }) : null;
      let lastOutputAt = Date.now();
      let result = null;

      const parser = new StreamParser();
      parser.on('status', (s) => {
        lastOutputAt = Date.now();
        this.emit('status', s);
      });
      parser.on('result', (r) => {
        lastOutputAt = Date.now();
        result = r;
        this.emit('result', r);
      });
      parser.on('output', (line) => {
        lastOutputAt = Date.now();
        this.emit('output', line);
      });

      const handleLine = (line) => {
        if (logStream) logStream.write(line + '\n');

        if (this.outputFormat === 'stream_json') {
          try {
            const event = JSON.parse(line);
            if (event.type === 'assistant' && event.message?.content) {
              for (const block of event.message.content) {
                if (block.type === 'text') {
                  for (const textLine of block.text.split('\n')) {
                    parser.feed(textLine);
                  }
                }
              }
            } else if (event.type === 'result' && event.result) {
              for (const block of event.result) {
                if (block.type === 'text') {
                  for (const textLine of block.text.split('\n')) {
                    parser.feed(textLine);
                  }
                }
              }
            }
          } catch {
            parser.feed(line);
          }
        } else {
          parser.feed(line);
        }
      };

      let stdout = '';
      proc.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
        const lines = stdout.split('\n');
        stdout = lines.pop();
        for (const line of lines) {
          if (line.trim()) handleLine(line.trim());
        }
      });

      proc.stderr.on('data', (chunk) => {
        if (logStream) logStream.write(`[stderr] ${chunk}`);
      });

      if (this.inputMode === 'stdin') {
        proc.stdin.write(fullPrompt);
        proc.stdin.end();
      }

      // Global timeout
      const globalTimer = setTimeout(() => {
        proc.kill('SIGTERM');
        setTimeout(() => proc.kill('SIGKILL'), 5000);
      }, this.timeout);

      // Stuck detection
      const stuckCheck = setInterval(() => {
        if (Date.now() - lastOutputAt > this.stuckTimeout) {
          this.emit('error', new Error('Agent stuck — no output'));
          proc.kill('SIGTERM');
          setTimeout(() => proc.kill('SIGKILL'), 5000);
        }
      }, 30000);

      proc.on('close', (code) => {
        clearTimeout(globalTimer);
        clearInterval(stuckCheck);
        if (logStream) logStream.end();
        if (stdout.trim()) handleLine(stdout.trim());

        if (result) {
          resolve(result);
        } else if (code === 0) {
          resolve({ status: 'success', summary: 'Agent completed without explicit result' });
        } else {
          resolve({ status: 'failure', summary: `Agent exited with code ${code}` });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(globalTimer);
        clearInterval(stuckCheck);
        if (logStream) logStream.end();
        reject(err);
      });
    });
  }
}
