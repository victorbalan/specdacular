const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { StreamParser } = require('./parser');
const readline = require('readline');

class AgentRunner extends EventEmitter {
  constructor(agentConfig, options = {}) {
    super();
    this.agentConfig = agentConfig;
    this.timeout = options.timeout || 3600000;
    this.stuckTimeout = options.stuckTimeout || 1800000;
    this.cwd = options.cwd || undefined;
    this.process = null;
    this.lastOutputTime = null;
    this.stuckTimer = null;
  }

  run(prompt) {
    return new Promise((resolve) => {
      const { cmd, prompt_flag, input_mode, output_format } = this.agentConfig;
      const parts = cmd.split(/\s+/);
      const command = parts[0];
      const args = [...parts.slice(1)];

      const useStdin = input_mode === 'stdin';
      const useStreamJson = output_format === 'stream_json' || cmd.includes('claude');

      if (useStreamJson && !args.includes('--output-format')) {
        args.push('--output-format', 'stream-json', '--verbose');
      }

      if (!useStdin) {
        if (prompt_flag) {
          args.push(prompt_flag, prompt);
        } else {
          args.push(prompt);
        }
      }

      this.process = spawn(command, args, {
        stdio: [useStdin ? 'pipe' : 'ignore', 'pipe', 'pipe'],
        shell: true,
        cwd: this.cwd,
      });

      if (useStdin && this.process.stdin) {
        this.process.stdin.write(prompt);
        this.process.stdin.end();
      }

      this.lastOutputTime = Date.now();
      let result = null;
      let resolved = false;

      const doResolve = (r) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutTimer);
        this._clearStuckTimer();
        resolve(r);
      };

      // Capture result from either parser
      this.on('result', (r) => {
        result = r;
      });

      if (useStreamJson) {
        this._parseStreamJson();
      } else {
        this._parseTextOutput();
      }

      // Capture stderr
      if (this.process.stderr) {
        const stderrRl = readline.createInterface({ input: this.process.stderr });
        stderrRl.on('line', (line) => {
          this.lastOutputTime = Date.now();
          this.emit('output', `[stderr] ${line}`);
        });
      }

      // Timeout
      const timeoutTimer = setTimeout(() => {
        this.kill();
        doResolve({
          status: 'failure',
          summary: 'Timeout: stage exceeded time limit',
          files_changed: [],
          issues: ['Stage timed out'],
          next_suggestions: [],
        });
      }, this.timeout);

      // Stuck detection
      this.stuckTimer = setInterval(() => {
        if (Date.now() - this.lastOutputTime >= this.stuckTimeout) {
          this._clearStuckTimer();
          this.kill();
          doResolve({
            status: 'failure',
            summary: `Stuck: no output for ${Math.round(this.stuckTimeout / 1000)}s`,
            files_changed: [],
            issues: ['Agent appears stuck'],
            next_suggestions: [],
          });
        }
      }, 5000);

      this.process.on('close', (code) => {
        if (result) {
          doResolve(result);
        } else {
          doResolve({
            status: code === 0 ? 'success' : 'failure',
            summary: code === 0
              ? 'Process completed successfully'
              : `Process exited with code ${code}`,
            files_changed: [],
            issues: code !== 0 ? [`Exit code: ${code}`] : [],
            next_suggestions: [],
          });
        }
      });
    });
  }

  _parseStreamJson() {
    const rl = readline.createInterface({ input: this.process.stdout });

    rl.on('line', (line) => {
      this.lastOutputTime = Date.now();

      let event;
      try {
        event = JSON.parse(line);
      } catch (e) {
        this.emit('output', line);
        return;
      }

      // Log ALL events for full visibility
      switch (event.type) {
        case 'assistant':
          if (event.message?.content) {
            const blocks = Array.isArray(event.message.content) ? event.message.content : [{ text: event.message.content }];
            for (const block of blocks) {
              if (block.type === 'tool_use') {
                this.emit('output', `[tool_call] ${block.name}(${JSON.stringify(block.input || {}).substring(0, 200)})`);
                this.emit('status', {
                  task_id: '', stage: '',
                  progress: `Calling: ${block.name}`,
                  percent: -1, files_touched: [],
                });
              } else if (block.type === 'text' && block.text) {
                this.emit('output', block.text);
                this._checkForSpecdBlocks(block.text);
              } else if (typeof block === 'string') {
                this.emit('output', block);
              }
            }
          }
          break;

        case 'result':
          this.emit('output', `\n[completed] turns=${event.num_turns || '?'} cost=$${event.total_cost_usd?.toFixed(4) || '?'}`);
          if (event.result) {
            this.emit('output', event.result);
          }
          this.emit('result', {
            status: event.subtype === 'success' ? 'success' : 'failure',
            summary: event.result ? event.result.substring(0, 500) : 'Completed',
            files_changed: [],
            issues: event.subtype !== 'success' ? [event.result || 'Unknown error'] : [],
            next_suggestions: [],
            cost_usd: event.total_cost_usd,
            num_turns: event.num_turns,
          });
          break;

        case 'system':
          if (event.subtype === 'tool_use' || event.subtype === 'tool_result') {
            const name = event.tool_name || event.name || '';
            if (event.subtype === 'tool_use') {
              this.emit('output', `[tool] ${name}`);
              this.emit('status', {
                task_id: '', stage: '',
                progress: `Using: ${name}`,
                percent: -1, files_touched: [],
              });
            }
          } else if (event.subtype === 'hook_response' && event.hook_event === 'SessionStart') {
            this.emit('output', `[hook] SessionStart loaded`);
          }
          break;

        default:
          // Log unknown event types
          if (event.type) {
            this.emit('output', `[${event.type}:${event.subtype || ''}] ${JSON.stringify(event).substring(0, 150)}`);
          }
          break;
      }
    });
  }

  _parseTextOutput() {
    const parser = new StreamParser(this.process.stdout);

    parser.on('status', (status) => {
      this.lastOutputTime = Date.now();
      this.emit('status', status);
    });

    parser.on('result', (r) => {
      this.lastOutputTime = Date.now();
      this.emit('result', r);
    });

    parser.on('output', (line) => {
      this.lastOutputTime = Date.now();
      this.emit('output', line);
    });

    parser.on('error', (err) => {
      this.emit('error', err);
    });

    parser.start();
  }

  _checkForSpecdBlocks(text) {
    const statusMatch = text.match(/```specd-status\n([\s\S]*?)```/);
    if (statusMatch) {
      try { this.emit('status', JSON.parse(statusMatch[1])); } catch (e) { /* ignore */ }
    }

    const resultMatch = text.match(/```specd-result\n([\s\S]*?)```/);
    if (resultMatch) {
      try { this.emit('result', JSON.parse(resultMatch[1])); } catch (e) { /* ignore */ }
    }
  }

  _clearStuckTimer() {
    if (this.stuckTimer) {
      clearInterval(this.stuckTimer);
      this.stuckTimer = null;
    }
  }

  kill() {
    if (this.process && !this.process.killed) {
      this.process.kill('SIGTERM');
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

module.exports = { AgentRunner };
