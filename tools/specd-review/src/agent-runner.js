import { spawn } from 'node:child_process';
import { StreamParser } from './parser.js';

export function renderPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : '',
  );
}

function spawnOnce(agent, prompt, { cwd, onStatus, onOutput, timeout = 1800_000 }) {
  return new Promise((resolve) => {
    const proc = spawn(agent.cmd, { cwd, shell: true, stdio: ['pipe', 'pipe', 'pipe'] });

    const parser = new StreamParser();
    let result = null;
    const outputLines = [];
    parser.on('result', (r) => { result = r; });
    parser.on('status', (s) => onStatus && onStatus(s));
    parser.on('output', (l) => {
      outputLines.push(l);
      if (onOutput) onOutput(l);
    });

    const timer = setTimeout(() => proc.kill('SIGKILL'), timeout);

    // The child may exit before reading stdin (bad command, missing CLI),
    // which makes writing the prompt fail with EPIPE. Swallow stream errors
    // here — `error`/`close` below resolve the promise gracefully.
    proc.stdin.on('error', () => {});
    proc.stdout.on('error', () => {});
    proc.stderr.on('error', () => {});

    const isJson = agent.transport === 'stream_json';
    let usingDeltas = false; // true once token deltas are seen (claude partials)
    let rawBuf = '';  // raw stdout buffered into newline-delimited event lines
    let textBuf = ''; // extracted agent text buffered into display lines

    // Feeds extracted agent text to the parser, split on real newlines so the
    // fenced ```specd-result``` block is detected even across delta chunks.
    function feedText(text) {
      textBuf += text;
      const lines = textBuf.split('\n');
      textBuf = lines.pop();
      for (const l of lines) parser.feed(l);
    }

    // Pulls human-readable text out of one Claude stream-json event line and
    // surfaces tool use as a status. Returns a text chunk ('' if none).
    function jsonEventText(line) {
      let ev;
      try {
        ev = JSON.parse(line);
      } catch {
        return `${line}\n`; // not a JSON event — treat as a plain text line
      }
      // Streaming token deltas (claude --include-partial-messages).
      if (ev.type === 'stream_event') {
        // End each content block with a newline so the next block (e.g. the
        // fenced result) starts on its own line rather than fusing onto text.
        if (ev.event?.type === 'content_block_stop') return '\n';
        const delta = ev.event?.delta;
        if (delta?.type === 'text_delta' || delta?.type === 'thinking_delta') {
          usingDeltas = true;
          return delta.text || delta.thinking || '';
        }
        return '';
      }
      // Aggregate assistant message: surface tool use as a status, and show
      // its text + reasoning (skipped when deltas already stream them).
      if (ev.type === 'assistant' && Array.isArray(ev.message?.content)) {
        let text = '';
        for (const block of ev.message.content) {
          if (block.type === 'tool_use' && onStatus) {
            onStatus({ progress: `${block.name}…` });
          }
          if (usingDeltas) continue;
          if (block.type === 'text' && typeof block.text === 'string') text += block.text;
          if (block.type === 'thinking' && typeof block.thinking === 'string') {
            text += block.thinking;
          }
        }
        return text;
      }
      return ''; // system / result / rate_limit — nothing to show
    }

    proc.stdout.on('data', (chunk) => {
      rawBuf += chunk.toString();
      const lines = rawBuf.split('\n');
      rawBuf = lines.pop();
      for (const line of lines) {
        if (isJson) feedText(jsonEventText(line));
        else parser.feed(line);
      }
    });

    proc.stdin.end(prompt);
    proc.on('close', () => {
      clearTimeout(timer);
      if (isJson) {
        if (rawBuf) feedText(jsonEventText(rawBuf));
        if (textBuf) parser.feed(textBuf);
      } else if (rawBuf) {
        parser.feed(rawBuf);
      }
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
