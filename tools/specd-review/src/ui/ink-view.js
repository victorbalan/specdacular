// src/ui/ink-view.js
//
// Full-screen terminal UI for interactive reviews. Implemented as a direct
// renderer (no ink): every frame positions each line absolutely with cursor
// moves and never emits a newline, so the terminal cannot scroll — only the
// output pane's contents page with PgUp/PgDn. Runs in the alternate screen
// buffer; the shell scrollback is untouched and restored on exit.
//
// Exposes the same `ui` interface as plain-view.js.

import { stdin, stdout } from 'node:process';
import { formatFindings, parseGateInput, editFindingsInEditor } from './plain-view.js';

const MAX_OUTPUT_LINES = 5000;
const SCROLL_STEP = 5;
const FRAME_MS = 100;
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const ESC = '\x1b';
const ALT_ON = `${ESC}[?1049h${ESC}[2J${ESC}[?25l`;
const ALT_OFF = `${ESC}[?25h${ESC}[?1049l`;
const dim = (s) => `${ESC}[2m${s}${ESC}[0m`;
const bold = (s) => `${ESC}[1m${s}${ESC}[0m`;
const inverse = (s) => `${ESC}[7m${s}${ESC}[0m`;

// Pure: derives the display icon + text for one agent row. Pinned by tests.
export function agentLineState({ name, status, done, findingCount = 0, skipped = false }) {
  if (skipped) return { name, icon: 'cross', text: 'skipped (no valid output)' };
  if (done) return { name, icon: 'check', text: `done — ${findingCount} finding(s)` };
  return { name, icon: 'spinner', text: status?.progress || 'starting…' };
}

function fmtElapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// Strips control sequences and forces a string to exactly `w` columns.
function fit(str, w) {
  let s = String(str ?? '')
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\t/g, ' ')
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '');
  if (s.length > w) return s.slice(0, w);
  return s + ' '.repeat(w - s.length);
}

function iconChar(kind, frame) {
  if (kind === 'spinner') return SPINNER[frame % SPINNER.length];
  if (kind === 'check') return '✔';
  return '✖';
}

function windowLines(lines, height, scroll) {
  const end = Math.max(0, lines.length - scroll);
  const start = Math.max(0, end - height);
  const win = lines.slice(start, end);
  while (win.length < height) win.push('');
  return win;
}

export function createInkView() {
  let running = false;
  let loop = null;
  let onResize = null;
  let frame = 0;

  const state = {
    round: 0,
    maxRounds: 0,
    baseLabel: '',
    startedAt: Date.now(),
    agents: [],
    selected: 0,
    scroll: 0,
    mode: 'running', // 'running' | 'gate'
    findingsLines: [],
    gateFindings: [],
    gateValue: '',
    onGateSubmit: null,
  };

  function findAgent(name) {
    return state.agents.find((a) => a.name === name);
  }

  function animating() {
    return state.mode === 'gate' || state.agents.some((a) => !a.done);
  }

  // ---- rendering -----------------------------------------------------------

  function buildFrame() {
    const rows = stdout.rows || 24;
    const cols = stdout.columns || 80;
    const lines = [];

    const runningCount = state.agents.filter((a) => !a.done).length;
    const roundLabel = state.maxRounds ? `${state.round}/${state.maxRounds}` : `${state.round}`;
    lines.push(inverse(fit(
      ` specd-review · round ${roundLabel} · ${state.baseLabel}`
      + ` · ${fmtElapsed(Date.now() - state.startedAt)} · ${runningCount} running`,
      cols,
    )));
    lines.push(dim('─'.repeat(cols)));

    const room = Math.max(1, rows - 4 - 3); // keep >= 3 lines for the pane
    const shown = state.agents.slice(0, room);
    shown.forEach((agent, i) => {
      const ls = agentLineState(agent);
      const selected = i === state.selected;
      const row = `${selected ? '▸' : ' '} ${iconChar(ls.icon, frame)} `
        + `${agent.name.padEnd(22).slice(0, 22)} ${ls.text}`;
      lines.push(selected ? bold(fit(row, cols)) : fit(row, cols));
    });

    const selectedAgent = state.agents[state.selected];
    const paneLabel = state.mode === 'gate'
      ? '─ findings — /edit · /continue · /accept · /quit · or type feedback '
      : `─ ${selectedAgent ? selectedAgent.name : '—'} · output `;
    lines.push(dim(fit(paneLabel.padEnd(cols, '─'), cols)));

    const source = state.mode === 'gate'
      ? state.findingsLines
      : (selectedAgent ? selectedAgent.output : []);
    const paneHeight = Math.max(1, rows - lines.length - 1);
    for (const line of windowLines(source, paneHeight, state.scroll)) {
      lines.push(fit(line, cols));
    }

    const footer = state.mode === 'gate'
      ? `> ${state.gateValue}█`
      : ' ↑↓ select agent · PgUp/PgDn scroll · q quit ';
    lines.push(state.mode === 'gate' ? fit(footer, cols) : dim(fit(footer, cols)));

    return lines.slice(0, rows);
  }

  function paint() {
    const rows = stdout.rows || 24;
    const lines = buildFrame();
    let out = '';
    for (let i = 0; i < rows; i++) {
      out += `${ESC}[${i + 1};1H${ESC}[2K${lines[i] || ''}`;
    }
    stdout.write(out);
  }

  function tick() {
    if (animating()) frame += 1;
    paint();
  }

  // ---- lifecycle -----------------------------------------------------------

  function start() {
    if (running) return;
    running = true;
    stdout.write(ALT_ON);
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', onData);
    onResize = () => paint();
    stdout.on('resize', onResize);
    loop = setInterval(tick, FRAME_MS);
    paint();
  }

  function stop() {
    if (!running) return;
    running = false;
    if (loop) { clearInterval(loop); loop = null; }
    if (onResize) { stdout.removeListener('resize', onResize); onResize = null; }
    stdin.removeListener('data', onData);
    if (stdin.isTTY) stdin.setRawMode(false);
    stdin.pause();
    stdout.write(ALT_OFF);
  }

  // ---- input ---------------------------------------------------------------

  function scrollBy(delta) {
    state.scroll = Math.max(0, state.scroll + delta);
  }

  function selectBy(delta) {
    state.selected = Math.min(
      Math.max(0, state.agents.length - 1),
      Math.max(0, state.selected + delta),
    );
    state.scroll = 0;
  }

  function submitGate() {
    const parsed = parseGateInput(state.gateValue);
    if (parsed.action === 'edit') {
      stop(); // give $EDITOR a clean terminal
      let edited = state.gateFindings;
      try {
        edited = editFindingsInEditor(state.gateFindings);
      } catch {
        // editor aborted/failed — keep findings unchanged
      }
      state.gateFindings = edited;
      state.findingsLines = formatFindings(edited).split('\n');
      state.gateValue = '';
      state.scroll = 0;
      start();
      return;
    }
    const submit = state.onGateSubmit;
    state.onGateSubmit = null;
    state.mode = 'running';
    state.gateValue = '';
    if (parsed.action === 'feedback') {
      submit({ action: 'continue', findings: state.gateFindings, feedback: parsed.feedback });
    } else {
      submit({ action: parsed.action, findings: state.gateFindings, feedback: '' });
    }
  }

  function handleKey(key) {
    if (key.ctrlC) { stop(); process.exit(130); }

    if (state.mode === 'running') {
      if (key.up) selectBy(-1);
      else if (key.down) selectBy(1);
      else if (key.pageUp) scrollBy(SCROLL_STEP);
      else if (key.pageDown) scrollBy(-SCROLL_STEP);
      else if (key.char === 'q') { stop(); process.exit(130); }
      paint();
      return;
    }

    // gate mode
    if (key.up) scrollBy(1);
    else if (key.down) scrollBy(-1);
    else if (key.pageUp) scrollBy(SCROLL_STEP);
    else if (key.pageDown) scrollBy(-SCROLL_STEP);
    else if (key.enter) { submitGate(); return; }
    else if (key.backspace) state.gateValue = state.gateValue.slice(0, -1);
    else if (key.char) state.gateValue += key.char;
    paint();
  }

  function onData(data) {
    let i = 0;
    while (i < data.length) {
      const rest = data.slice(i);
      const ch = data[i];
      if (ch === '\x03') { handleKey({ ctrlC: true }); i += 1; }
      else if (ch === '\r' || ch === '\n') { handleKey({ enter: true }); i += 1; }
      else if (ch === '\x7f' || ch === '\x08') { handleKey({ backspace: true }); i += 1; }
      else if (ch === '\x1b') {
        if (rest.startsWith(`${ESC}[A`)) { handleKey({ up: true }); i += 3; }
        else if (rest.startsWith(`${ESC}[B`)) { handleKey({ down: true }); i += 3; }
        else if (rest.startsWith(`${ESC}[5~`)) { handleKey({ pageUp: true }); i += 4; }
        else if (rest.startsWith(`${ESC}[6~`)) { handleKey({ pageDown: true }); i += 4; }
        else if (rest.startsWith(`${ESC}[`)) { i += 3; } // other CSI — skip
        else i += 1;
      } else if (ch >= ' ') { handleKey({ char: ch }); i += 1; }
      else i += 1; // other control char — ignore
    }
  }

  // ---- ui interface --------------------------------------------------------

  return {
    setHeader({ baseLabel, maxRounds } = {}) {
      if (baseLabel) state.baseLabel = baseLabel;
      if (maxRounds) state.maxRounds = maxRounds;
    },

    async showRound({ round, reviewers, base }) {
      state.round = round;
      if (!state.baseLabel) state.baseLabel = (base || '').slice(0, 7);
      state.agents = reviewers.map((r) => ({
        name: r.name,
        role: 'reviewer',
        status: null,
        done: false,
        findingCount: 0,
        skipped: false,
        output: [],
      }));
      state.selected = 0;
      state.scroll = 0;
      state.mode = 'running';
      start();
      paint();
    },

    // Updates an agent row, adding it if unknown (e.g. the fixer mid-round).
    updateAgent(name, patch = {}) {
      let agent = findAgent(name);
      if (!agent) {
        agent = {
          name,
          role: patch.role || 'reviewer',
          status: null,
          done: false,
          findingCount: 0,
          skipped: false,
          output: [],
        };
        state.agents.push(agent);
      }
      Object.assign(agent, patch);
    },

    appendOutput(name, line) {
      let agent = findAgent(name);
      if (!agent) {
        this.updateAgent(name, {});
        agent = findAgent(name);
      }
      agent.output.push(line);
      if (agent.output.length > MAX_OUTPUT_LINES) agent.output.shift();
    },

    async findingsGate({ findings }) {
      return new Promise((resolve) => {
        state.mode = 'gate';
        state.gateFindings = findings;
        state.findingsLines = formatFindings(findings).split('\n');
        state.gateValue = '';
        state.scroll = 0;
        state.onGateSubmit = resolve;
        start();
        paint();
      });
    },

    async showResult({ outcome, reportPath }) {
      stop();
      stdout.write(`\nspecd-review: ${outcome}\nreport: ${reportPath}\n`);
    },
  };
}
