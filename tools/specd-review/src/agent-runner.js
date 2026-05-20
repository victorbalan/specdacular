import { spawn } from 'node:child_process';
import { StreamParser } from './parser.js';

export function renderPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : '',
  );
}

// Parse a shell command string into [bin, ...args] without invoking a shell.
// Handles double-quoted tokens (stripping outer quotes, preserving inner
// single-quoted sub-strings) and bare tokens.
function parseCmd(cmd) {
  const tokens = [];
  let i = 0;

  while (i < cmd.length) {
    // skip whitespace
    while (i < cmd.length && (cmd[i] === ' ' || cmd[i] === '\t')) i++;
    if (i >= cmd.length) break;

    let token = '';

    while (i < cmd.length) {
      const ch = cmd[i];
      if (ch === ' ' || ch === '\t') {
        break;
      } else if (ch === "'") {
        // single-quoted: content is literal (preserve quotes for code strings)
        token += "'";
        i++;
        while (i < cmd.length && cmd[i] !== "'") token += cmd[i++];
        if (i < cmd.length) { token += "'"; i++; }
      } else if (ch === '"') {
        // double-quoted: strip outer quotes; preserve inner single-quoted sections
        i++;
        while (i < cmd.length && cmd[i] !== '"') {
          if (cmd[i] === "'") {
            token += "'";
            i++;
            while (i < cmd.length && cmd[i] !== "'") token += cmd[i++];
            if (i < cmd.length) { token += "'"; i++; }
          } else if (cmd[i] === '\\') {
            i++;
            if (i < cmd.length) token += cmd[i++];
          } else {
            token += cmd[i++];
          }
        }
        if (i < cmd.length) i++; // skip closing "
      } else if (ch === '\\') {
        i++;
        if (i < cmd.length) token += cmd[i++];
      } else {
        token += cmd[i++];
      }
    }

    tokens.push(token);
  }

  return tokens;
}

// Unwrap a Claude `--output-format stream_json` line into its text lines.
function streamJsonLines(line) {
  try {
    const event = JSON.parse(line);
    const content = event?.message?.content || event?.result;
    if (Array.isArray(content)) {
      return content
        .filter((b) => b.type === 'text')
        .flatMap((b) => b.text.split('\n'));
    }
  } catch {
    // not JSON — fall through
  }
  return [line];
}

function spawnOnce(agent, prompt, { cwd, onStatus, timeout = 1800_000 }) {
  return new Promise((resolve) => {
    const [bin, ...args] = parseCmd(agent.cmd);
    const proc = spawn(bin, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });

    const parser = new StreamParser();
    let result = null;
    const outputLines = [];
    parser.on('result', (r) => { result = r; });
    parser.on('status', (s) => onStatus && onStatus(s));
    parser.on('output', (l) => outputLines.push(l));

    const timer = setTimeout(() => proc.kill('SIGKILL'), timeout);

    let buf = '';
    proc.stdout.on('data', (chunk) => {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        const fed = agent.transport === 'stream_json' ? streamJsonLines(line) : [line];
        for (const f of fed) parser.feed(f);
      }
    });

    proc.stdin.end(prompt);
    proc.on('close', () => {
      clearTimeout(timer);
      if (buf) parser.feed(buf);
      resolve({ result, output: outputLines });
    });
    proc.on('error', () => {
      clearTimeout(timer);
      resolve({ result: null, output: outputLines });
    });
  });
}

export async function runAgent(agent, vars, opts = {}) {
  const prompt = renderPrompt(agent.systemPrompt, vars);
  let res = await spawnOnce(agent, prompt, opts);
  if (!res.result) {
    res = await spawnOnce(agent, prompt, opts); // one retry
  }
  return res;
}
