import { spawn } from 'node:child_process';
import { StreamParser } from './parser.js';

export function renderPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : '',
  );
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
    const proc = spawn(agent.cmd, { cwd, shell: true, stdio: ['pipe', 'pipe', 'pipe'] });

    const parser = new StreamParser();
    let result = null;
    const outputLines = [];
    parser.on('result', (r) => { result = r; });
    parser.on('status', (s) => onStatus && onStatus(s));
    parser.on('output', (l) => outputLines.push(l));

    const timer = setTimeout(() => proc.kill('SIGKILL'), timeout);

    // The child may exit before reading stdin (bad command, missing CLI),
    // which makes writing the prompt fail with EPIPE. Swallow stream errors
    // here — `error`/`close` below resolve the promise gracefully.
    proc.stdin.on('error', () => {});
    proc.stdout.on('error', () => {});
    proc.stderr.on('error', () => {});

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
