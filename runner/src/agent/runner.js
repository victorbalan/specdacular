const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { StreamParser } = require('./parser');

class AgentRunner extends EventEmitter {
  constructor(agentConfig, options = {}) {
    super();
    this.agentConfig = agentConfig;
    this.timeout = options.timeout || 3600000; // 1h default
    this.stuckTimeout = options.stuckTimeout || 1800000; // 30min default
    this.process = null;
    this.lastOutputTime = null;
    this.stuckTimer = null;
  }

  run(prompt) {
    return new Promise((resolve) => {
      const { cmd, prompt_flag } = this.agentConfig;
      const parts = cmd.split(/\s+/);
      const command = parts[0];
      const args = [...parts.slice(1)];

      if (prompt_flag) {
        args.push(prompt_flag, prompt);
      } else {
        args.push(prompt);
      }

      this.process = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });

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

      const parser = new StreamParser(this.process.stdout);

      parser.on('status', (status) => {
        this.lastOutputTime = Date.now();
        this.emit('status', status);
      });

      parser.on('result', (r) => {
        this.lastOutputTime = Date.now();
        result = r;
        this.emit('result', r);
      });

      parser.on('output', (line) => {
        this.lastOutputTime = Date.now();
        this.emit('output', line);
      });

      parser.on('error', (err) => {
        this.emit('error', err);
      });

      // Timeout timer
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

      // Stuck detection timer
      this.stuckTimer = setInterval(() => {
        const elapsed = Date.now() - this.lastOutputTime;
        if (elapsed >= this.stuckTimeout) {
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
              ? 'Process exited successfully (no specd-result block)'
              : `Process exited with code ${code}`,
            files_changed: [],
            issues: code !== 0 ? [`Exit code: ${code}`] : [],
            next_suggestions: [],
          });
        }
      });

      parser.start();
    });
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
