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

      // For Claude CLI agents, use stream-json for structured output
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

      if (useStreamJson) {
        // Parse structured JSON events from Claude CLI
        this._parseStreamJson(result, doResolve);
      } else {
        // Legacy: parse specd-status/specd-result blocks from text output
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

  _parseStreamJson(result, doResolve) {
    const rl = readline.createInterface({ input: this.process.stdout });

    rl.on('line', (line) => {
      this.lastOutputTime = Date.now();

      let event;
      try {
        event = JSON.parse(line);
      } catch (e) {
        // Not JSON — emit as raw output
        this.emit('output', line);
        return;
      }

      // Route events by type
      switch (event.type) {
        case 'assistant':
          // Assistant text message
          if (event.message?.content) {
            const text = typeof event.message.content === 'string'
              ? event.message.content
              : event.message.content.map(b => b.text || '').join('');
            if (text) {
              this.emit('output', text);
              // Check for specd-status/specd-result in the text
              this._checkForSpecdBlocks(text);
            }
          }
          break;

        case 'result':
          // Final result from Claude CLI
          if (event.result) {
            this.emit('output', `\n[result] ${event.result.substring(0, 200)}`);
          }
          // Build our result from the Claude result
          result = {
            status: event.subtype === 'success' ? 'success' : 'failure',
            summary: event.result ? event.result.substring(0, 500) : 'Completed',
            files_changed: [],
            issues: event.subtype !== 'success' ? [event.result || 'Unknown error'] : [],
            next_suggestions: [],
            cost_usd: event.total_cost_usd,
            num_turns: event.num_turns,
          };
          break;

        case 'system':
          // System events (hooks, tool usage, etc.)
          if (event.subtype === 'tool_use') {
            this.emit('output', `[tool] ${event.tool_name || 'unknown'}`);
            this.emit('status', {
              task_id: '',
              stage: '',
              progress: `Using tool: ${event.tool_name || 'unknown'}`,
              percent: -1,
              files_touched: [],
            });
          }
          break;

        default:
          // Emit other events as output for logging
          if (event.type !== 'system' || event.subtype === 'tool_use') {
            // Skip noisy system events
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
    // Check if text contains specd-status or specd-result blocks
    const statusMatch = text.match(/```specd-status\n([\s\S]*?)```/);
    if (statusMatch) {
      try {
        const status = JSON.parse(statusMatch[1]);
        this.emit('status', status);
      } catch (e) { /* ignore */ }
    }

    const resultMatch = text.match(/```specd-result\n([\s\S]*?)```/);
    if (resultMatch) {
      try {
        const result = JSON.parse(resultMatch[1]);
        this.emit('result', result);
      } catch (e) { /* ignore */ }
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
