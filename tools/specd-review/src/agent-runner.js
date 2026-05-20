import { spawn } from 'node:child_process';
import { StreamParser } from './parser.js';

export function renderPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : '',
  );
}

function spawnOnce(agent, prompt, { cwd, onStatus, onOutput, timeout = 1800_000 }) {
  return new Promise((resolve) => {
    const emit = (line) => { if (onOutput) onOutput(line); };
    const status = (progress) => { if (onStatus) onStatus({ progress }); };

    emit(`▶ launching: ${agent.cmd}`);
    status('launching…');

    const proc = spawn(agent.cmd, { cwd, shell: true, stdio: ['pipe', 'pipe', 'pipe'] });

    const parser = new StreamParser();
    let result = null;
    const outputLines = [];
    parser.on('result', (r) => { result = r; });
    parser.on('status', (s) => onStatus && onStatus(s));
    parser.on('output', (l) => { outputLines.push(l); emit(l); });

    const timer = setTimeout(() => proc.kill('SIGKILL'), timeout);

    // The child may exit before reading stdin (bad command, missing CLI),
    // which makes writing the prompt fail with EPIPE. Swallow stream errors
    // here — `error`/`close` below resolve the promise gracefully.
    proc.stdin.on('error', () => {});
    proc.stdout.on('error', () => {});
    proc.stderr.on('error', () => {});

    const isJson = agent.transport === 'stream_json';
    let usingDeltas = false; // true once token deltas are seen (claude partials)
    let sawOutput = false;
    let rawBuf = '';  // raw stdout buffered into newline-delimited event lines
    let textBuf = ''; // extracted agent text buffered into display lines
    let errBuf = '';  // stderr buffered into lines

    function markActive() {
      if (!sawOutput) {
        sawOutput = true;
        status('reviewing…');
      }
    }

    // Feeds extracted agent text to the parser, split on real newlines so the
    // fenced ```specd-result``` block is detected even across delta chunks.
    function feedText(text) {
      textBuf += text;
      const lines = textBuf.split('\n');
      textBuf = lines.pop();
      for (const l of lines) parser.feed(l);
    }

    // Handles one Claude stream-json event line: surfaces lifecycle info via
    // onOutput/onStatus, and returns any human-readable text for the parser.
    function handleEvent(line) {
      let ev;
      try {
        ev = JSON.parse(line);
      } catch {
        return `${line}\n`; // not a JSON event — treat as a plain text line
      }
      if (ev.type === 'system' && ev.subtype === 'init') {
        emit(`● session started (model ${ev.model || '?'})`);
        return '';
      }
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
      if (ev.type === 'assistant' && Array.isArray(ev.message?.content)) {
        let text = '';
        for (const block of ev.message.content) {
          if (block.type === 'tool_use') {
            status(`${block.name}…`);
            emit(`▸ ${block.name}`);
          }
          if (usingDeltas) continue;
          if (block.type === 'text' && typeof block.text === 'string') text += block.text;
          if (block.type === 'thinking' && typeof block.thinking === 'string') {
            text += block.thinking;
          }
        }
        return text;
      }
      if (ev.type === 'result') {
        emit(`● completed (${ev.duration_ms != null ? `${ev.duration_ms}ms` : 'done'})`);
        return '';
      }
      if (ev.type === 'rate_limit_event') {
        const st = ev.rate_limit_info?.status;
        if (st && st !== 'allowed') emit(`⚠ rate limit: ${st}`);
        return '';
      }
      return '';
    }

    proc.stdout.on('data', (chunk) => {
      markActive();
      rawBuf += chunk.toString();
      const lines = rawBuf.split('\n');
      rawBuf = lines.pop();
      for (const line of lines) {
        if (isJson) feedText(handleEvent(line));
        else parser.feed(line);
      }
    });

    proc.stderr.on('data', (chunk) => {
      markActive();
      errBuf += chunk.toString();
      const lines = errBuf.split('\n');
      errBuf = lines.pop();
      for (const l of lines) {
        // Some agents (codex) write their whole transcript — including the
        // result block — to stderr. For the plain transport, parse it; for
        // stream-json (claude) stderr is genuine diagnostics.
        if (isJson) {
          if (l.trim()) emit(`[stderr] ${l}`);
        } else {
          parser.feed(l);
        }
      }
    });

    proc.stdin.end(prompt);
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (isJson) {
        if (rawBuf) feedText(handleEvent(rawBuf));
        if (textBuf) parser.feed(textBuf);
        if (errBuf.trim()) emit(`[stderr] ${errBuf.trim()}`);
      } else {
        if (rawBuf) parser.feed(rawBuf);
        if (errBuf) parser.feed(errBuf);
      }
      emit(`■ process exited (code ${code})`);
      resolve({ result, output: outputLines });
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      emit(`✖ failed to launch: ${err.message}`);
      resolve({ result: null, output: outputLines });
    });
  });
}

export async function runAgent(agent, vars, opts = {}) {
  const prompt = renderPrompt(agent.systemPrompt, vars);
  let res = await spawnOnce(agent, prompt, opts);
  if (!res.result) {
    if (opts.onOutput) opts.onOutput('↻ no specd-result parsed — retrying once…');
    res = await spawnOnce(agent, prompt, opts);
  }
  return res;
}
